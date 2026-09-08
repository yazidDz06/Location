const router = require("express").Router();

const Voiture = require("../models/Voiture");
const Reservation = require("../models/Reservation");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const { limiteurEcriture } = require("../middleware/rateLimit");
const schemas = require("../validation/schemas");

/**
 * Enrichit des véhicules avec leur disponibilité *à l'instant présent*,
 * déduite des réservations actives plutôt que d'un drapeau stocké.
 * Une seule requête agrégée couvre toute la liste (pas de N+1).
 */
async function avecDisponibilite(voitures) {
  const maintenant = new Date();
  const ids = voitures.map((v) => v._id);

  const occupees = await Reservation.distinct("voiture", {
    voiture: { $in: ids },
    statut: { $in: Reservation.STATUTS_BLOQUANTS },
    dateDebut: { $lte: maintenant },
    dateFin: { $gte: maintenant },
  });

  const ensembleOccupees = new Set(occupees.map((id) => id.toString()));

  return voitures.map((v) => {
    const objet = typeof v.toObject === "function" ? v.toObject() : { ...v };
    objet.disponible =
      !objet.horsService && !ensembleOccupees.has(objet._id.toString());
    return objet;
  });
}

/* ──────────────────────── Catalogue public ──────────────────────────────── */

router.get(
  "/",
  validate({ query: schemas.filtreVoitures }),
  asyncHandler(async (req, res) => {
    const { marque, type, prixMin, prixMax, page = 1, limite = 50 } =
      req.donneesQuery ?? {};

    const filtre = {};
    if (type) filtre.type = type;
    if (marque) {
      // La saisie utilisateur est échappée avant d'entrer dans une RegExp :
      // sans cela, un motif comme « (a+)+$ » provoque un ReDoS.
      const echappee = marque.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filtre.marque = new RegExp(echappee, "i");
    }
    if (prixMin !== undefined || prixMax !== undefined) {
      filtre.prixParJour = {};
      if (prixMin !== undefined) filtre.prixParJour.$gte = prixMin;
      if (prixMax !== undefined) filtre.prixParJour.$lte = prixMax;
    }

    const voitures = await Voiture.find(filtre)
      .sort({ createdAt: -1 })
      // La pagination borne le travail du serveur : sans elle, un catalogue
      // qui grossit finit par transformer chaque appel en coûteux scan complet.
      .skip((page - 1) * limite)
      .limit(limite)
      .lean();

    res.json(await avecDisponibilite(voitures));
  })
);

router.get(
  "/:id",
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    const voiture = await Voiture.findById(req.params.id).lean();
    if (!voiture) {
      throw ApiError.introuvable("Voiture non trouvée");
    }

    const [enrichie] = await avecDisponibilite([voiture]);
    res.json(enrichie);
  })
);

/** Périodes déjà réservées — permet au front de griser les dates prises. */
router.get(
  "/:id/indisponibilites",
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    const periodes = await Reservation.find({
      voiture: req.params.id,
      statut: { $in: Reservation.STATUTS_BLOQUANTS },
      dateFin: { $gte: new Date() },
    })
      // On n'expose que les dates : le client et le montant d'une réservation
      // tierce ne regardent pas les visiteurs.
      .select("dateDebut dateFin -_id")
      .lean();

    res.json(periodes);
  })
);

/* ──────────────────────── Administration ────────────────────────────────── */

router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  limiteurEcriture,
  validate({ body: schemas.creationVoiture }),
  asyncHandler(async (req, res) => {
    const existe = await Voiture.exists({
      immatriculation: req.body.immatriculation,
    });
    if (existe) {
      throw ApiError.conflit("Cette immatriculation est déjà enregistrée");
    }

    const voiture = await Voiture.create(req.body);

    logger.info("Voiture ajoutée", {
      voiture: voiture._id.toString(),
      admin: req.user._id.toString(),
    });

    res.status(201).json({ ...voiture.toObject(), disponible: true });
  })
);

router.put(
  "/:id",
  authMiddleware,
  adminMiddleware,
  limiteurEcriture,
  validate({ params: schemas.paramId, body: schemas.majVoiture }),
  asyncHandler(async (req, res) => {
    // `disponible` n'est pas un champ stocké : l'admin pilote `horsService`.
    const { disponible, ...champs } = req.body;
    if (disponible !== undefined) champs.horsService = !disponible;

    const voiture = await Voiture.findByIdAndUpdate(
      req.params.id,
      { $set: champs },
      { new: true, runValidators: true }
    ).lean();

    if (!voiture) {
      throw ApiError.introuvable("Voiture non trouvée");
    }

    const [enrichie] = await avecDisponibilite([voiture]);
    res.json(enrichie);
  })
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  limiteurEcriture,
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    // Supprimer un véhicule encore réservé laisserait des réservations
    // orphelines, impossibles à honorer comme à afficher.
    const reservationActive = await Reservation.exists({
      voiture: req.params.id,
      statut: { $in: Reservation.STATUTS_BLOQUANTS },
      dateFin: { $gte: new Date() },
    });

    if (reservationActive) {
      throw ApiError.conflit(
        "Ce véhicule a des réservations en cours. Mettez-le hors service au lieu de le supprimer."
      );
    }

    const voiture = await Voiture.findByIdAndDelete(req.params.id);
    if (!voiture) {
      throw ApiError.introuvable("Voiture non trouvée");
    }

    logger.info("Voiture supprimée", {
      voiture: req.params.id,
      admin: req.user._id.toString(),
    });

    res.json({ message: "Voiture supprimée" });
  })
);

module.exports = router;
