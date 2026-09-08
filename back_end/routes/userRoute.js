const crypto = require("crypto");
const bcrypt = require("bcrypt");
const router = require("express").Router();

const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");
const env = require("../config/env");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const { poserCookieCsrf } = require("../middleware/csrf");
const {
  limiteurAuth,
  limiteurRefresh,
  limiteurEcriture,
} = require("../middleware/rateLimit");
const schemas = require("../validation/schemas");
const {
  signerJetonAcces,
  emettreRefreshToken,
  rotationnerRefreshToken,
  revoquerJeton,
  revoquerToutesLesSessions,
  poserCookiesAuth,
  effacerCookiesAuth,
  NOM_COOKIE_REFRESH,
} = require("../services/tokenService");

/**
 * Hash bcrypt d'une valeur factice, utilisé quand le numéro n'existe pas.
 * Sans cela, une réponse instantanée (« pas d'utilisateur ») se distingue
 * d'une réponse lente (« bcrypt a comparé ») : l'écart de temps révèle quels
 * numéros sont enregistrés. On compare donc toujours, même dans le vide.
 */
const HASH_FACTICE = bcrypt.hashSync("mot-de-passe-inexistant-pour-timing", 12);

/** Message unique pour tout échec de connexion : pas d'énumération de comptes. */
const ECHEC_CONNEXION = "Numéro ou mot de passe incorrect";

/** Émet le couple de jetons et pose les cookies correspondants. */
async function ouvrirSession(res, req, utilisateur, familleId) {
  const accessToken = signerJetonAcces(utilisateur);
  const refreshToken = await emettreRefreshToken(utilisateur, {
    familleId: familleId || crypto.randomUUID(),
    req,
  });
  poserCookiesAuth(res, { accessToken, refreshToken });
  poserCookieCsrf(res);
}

/* ─────────────────────────────── Inscription ────────────────────────────── */

router.post(
  "/register",
  limiteurAuth,
  validate({ body: schemas.inscription }),
  asyncHandler(async (req, res) => {
    const { nom, prenom, numero, dateNaissance, password } = req.body;

    const existe = await User.exists({ numero });
    if (existe) {
      // Le numéro étant l'identifiant de connexion, on ne peut pas éviter de
      // révéler qu'il est pris. On limite donc fortement le débit sur cette
      // route (limiteurAuth) pour empêcher l'énumération en masse.
      throw ApiError.conflit("Un compte existe déjà avec ce numéro");
    }

    // Le rôle n'est jamais lu depuis le corps de la requête : il est imposé
    // ici. Le schéma `.strict()` rejette d'ailleurs déjà tout champ en trop.
    const utilisateur = await User.create({
      nom,
      prenom,
      numero,
      dateNaissance,
      password, // haché par le hook pre('save')
      role: "user",
    });

    await ouvrirSession(res, req, utilisateur);

    logger.info("Nouvel utilisateur inscrit", {
      utilisateur: utilisateur._id.toString(),
    });

    res.status(201).json({
      message: "Compte créé avec succès",
      user: utilisateur.versJSONPublic(),
    });
  })
);

/* ──────────────────────────────── Connexion ─────────────────────────────── */

router.post(
  "/login",
  limiteurAuth,
  validate({ body: schemas.connexion }),
  asyncHandler(async (req, res) => {
    const { numero, password } = req.body;

    const utilisateur = await User.findOne({ numero }).select(
      "+password +tentativesEchouees +verrouilleJusqua"
    );

    // Compte inexistant : on effectue quand même une comparaison bcrypt pour
    // que le temps de réponse soit indistinguable d'un mot de passe erroné.
    if (!utilisateur) {
      await bcrypt.compare(password, HASH_FACTICE);
      throw ApiError.nonAuthentifie(ECHEC_CONNEXION);
    }

    if (utilisateur.estVerrouille) {
      const minutes = Math.ceil(
        (utilisateur.verrouilleJusqua - Date.now()) / 60000
      );
      throw new ApiError(
        423,
        `Compte temporairement verrouillé après trop de tentatives. Réessayez dans ${minutes} minute(s).`
      );
    }

    const motDePasseValide = await utilisateur.verifierMotDePasse(password);

    if (!motDePasseValide) {
      await utilisateur.enregistrerEchec();
      logger.avertir("Échec de connexion", {
        utilisateur: utilisateur._id.toString(),
        ip: req.ip,
      });
      throw ApiError.nonAuthentifie(ECHEC_CONNEXION);
    }

    await utilisateur.reinitialiserEchecs();
    await ouvrirSession(res, req, utilisateur);

    logger.info("Connexion réussie", { utilisateur: utilisateur._id.toString() });

    res.json({
      message: "Connexion réussie",
      user: utilisateur.versJSONPublic(),
    });
  })
);

/* ───────────────────────── Rafraîchissement de session ──────────────────── */

/**
 * Échange le refresh token contre un nouveau couple de jetons (rotation).
 *
 * Cette route n'exige pas de jeton d'accès valide — c'est justement son rôle
 * quand celui-ci a expiré. Elle est protégée par : le cookie httpOnly, la
 * rotation avec détection de rejeu, le CSRF, et un limiteur dédié.
 */
router.post(
  "/refresh",
  limiteurRefresh,
  asyncHandler(async (req, res) => {
    const jetonPresente = req.cookies?.[NOM_COOKIE_REFRESH];

    if (!jetonPresente) {
      throw ApiError.nonAuthentifie("Session absente, reconnectez-vous");
    }

    let resultat;
    try {
      resultat = await rotationnerRefreshToken(jetonPresente, req);
    } catch (err) {
      // Session morte : on nettoie les cookies pour éviter que le front ne
      // boucle indéfiniment sur des tentatives de rafraîchissement.
      effacerCookiesAuth(res);
      throw err;
    }

    const { utilisateur, refreshToken } = resultat;
    poserCookiesAuth(res, {
      accessToken: signerJetonAcces(utilisateur),
      refreshToken,
    });
    poserCookieCsrf(res);

    res.json({
      message: "Session rafraîchie",
      user: utilisateur.versJSONPublic(),
    });
  })
);

/* ─────────────────────────────── Déconnexion ────────────────────────────── */

router.post(
  "/logout",
  asyncHandler(async (req, res) => {
    // Le jeton est réellement révoqué en base : effacer le cookie ne suffit
    // pas, une copie volée resterait sinon utilisable jusqu'à expiration.
    await revoquerJeton(req.cookies?.[NOM_COOKIE_REFRESH], "deconnexion");
    effacerCookiesAuth(res);
    res.json({ message: "Déconnexion réussie" });
  })
);

/** Déconnexion de tous les appareils. */
router.post(
  "/logout-all",
  authMiddleware,
  asyncHandler(async (req, res) => {
    await revoquerToutesLesSessions(req.user._id, "deconnexion");
    effacerCookiesAuth(res);
    res.json({ message: "Déconnecté de tous les appareils" });
  })
);

/* ──────────────────────────────── Profil ────────────────────────────────── */

router.get(
  "/profile",
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json(req.user.versJSONPublic());
  })
);

/** Sessions actives — permet à l'utilisateur de repérer une connexion suspecte. */
router.get(
  "/sessions",
  authMiddleware,
  asyncHandler(async (req, res) => {
    const sessions = await RefreshToken.find({
      utilisateur: req.user._id,
      revoqueLe: null,
      expireLe: { $gt: new Date() },
    })
      .select("createdAt expireLe adresseIp agentUtilisateur")
      .sort({ createdAt: -1 })
      .lean();

    res.json(sessions);
  })
);

router.patch(
  "/profile",
  authMiddleware,
  limiteurEcriture,
  validate({ body: schemas.majProfil }),
  asyncHandler(async (req, res) => {
    const { numero } = req.body;

    if (numero && numero !== req.user.numero) {
      const pris = await User.exists({ numero, _id: { $ne: req.user._id } });
      if (pris) {
        throw ApiError.conflit("Ce numéro est déjà utilisé");
      }
    }

    // On n'affecte que les champs du schéma validé : aucun risque qu'un
    // `role` ou un `password` se glisse dans la mise à jour.
    Object.assign(req.user, req.body);
    await req.user.save();

    res.json({
      message: "Profil mis à jour",
      user: req.user.versJSONPublic(),
    });
  })
);

/** Changement de mot de passe : révoque toutes les autres sessions. */
router.patch(
  "/password",
  authMiddleware,
  limiteurAuth,
  validate({ body: schemas.changementMotDePasse }),
  asyncHandler(async (req, res) => {
    const { ancienMotDePasse, nouveauMotDePasse } = req.body;

    const utilisateur = await User.findById(req.user._id).select("+password");
    const valide = await utilisateur.verifierMotDePasse(ancienMotDePasse);
    if (!valide) {
      throw ApiError.nonAuthentifie("Mot de passe actuel incorrect");
    }

    utilisateur.password = nouveauMotDePasse; // haché par le hook pre('save')
    await utilisateur.save();

    // Un changement de mot de passe fait souvent suite à une compromission :
    // toutes les sessions existantes doivent tomber.
    await revoquerToutesLesSessions(utilisateur._id, "deconnexion");
    await ouvrirSession(res, req, utilisateur);

    logger.info("Mot de passe modifié", {
      utilisateur: utilisateur._id.toString(),
    });

    res.json({ message: "Mot de passe modifié. Vos autres sessions ont été fermées." });
  })
);

/* ──────────────────────────── Administration ────────────────────────────── */

router.get(
  "/All",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const utilisateurs = await User.find().sort({ createdAt: -1 });
    res.json(utilisateurs.map((u) => u.versJSONPublic()));
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  limiteurEcriture,
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    // Un admin qui se supprime lui-même peut laisser l'application sans
    // administrateur : on refuse explicitement.
    if (req.params.id === req.user._id.toString()) {
      throw ApiError.requeteInvalide(
        "Vous ne pouvez pas supprimer votre propre compte administrateur"
      );
    }

    const utilisateur = await User.findByIdAndDelete(req.params.id);
    if (!utilisateur) {
      throw ApiError.introuvable("Utilisateur non trouvé");
    }

    // Les sessions du compte supprimé doivent mourir avec lui.
    await revoquerToutesLesSessions(utilisateur._id, "revocation_admin");

    logger.info("Utilisateur supprimé par un admin", {
      cible: utilisateur._id.toString(),
      admin: req.user._id.toString(),
    });

    res.json({ message: "Utilisateur supprimé avec succès" });
  })
);

module.exports = router;
