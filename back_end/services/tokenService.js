const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshToken");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const env = require("../config/env");

const NOM_COOKIE_ACCES = "accessToken";
const NOM_COOKIE_REFRESH = "refreshToken";
const NOM_COOKIE_CSRF = "csrfToken";

// Le refresh token n'est envoyé que sur les routes qui en ont besoin :
// il n'accompagne donc pas chaque appel API et sa surface de vol est réduite.
const CHEMIN_COOKIE_REFRESH = "/users/refresh";

const DUREE_REFRESH_MS = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000;


function signerJetonAcces(utilisateur) {
  return jwt.sign(
    { sub: utilisateur._id.toString(), role: utilisateur.role, typ: "acces" },
    env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: env.ACCESS_TOKEN_TTL,
      issuer: "location-api",
      audience: "location-web",
    }
  );
}

function verifierJetonAcces(jeton) {
  const charge = jwt.verify(jeton, env.ACCESS_TOKEN_SECRET, {
    issuer: "location-api",
    audience: "location-web",
  });
  // Empêche qu'un jeton d'un autre type soit accepté comme jeton d'accès.
  if (charge.typ !== "acces") {
    throw new jwt.JsonWebTokenError("Type de jeton inattendu");
  }
  return charge;
}


function genererRefreshToken() {
  return crypto.randomBytes(32).toString("base64url");
}


function hacherRefreshToken(jeton) {
  return crypto
    .createHmac("sha256", env.REFRESH_TOKEN_PEPPER)
    .update(jeton)
    .digest("hex");
}

async function emettreRefreshToken(utilisateur, { familleId, req }) {
  const jeton = genererRefreshToken();

  await RefreshToken.create({
    tokenHache: hacherRefreshToken(jeton),
    utilisateur: utilisateur._id,
    familleId: familleId || crypto.randomUUID(),
    expireLe: new Date(Date.now() + DUREE_REFRESH_MS),
    adresseIp: req?.ip,
    agentUtilisateur: req?.get?.("user-agent")?.slice(0, 400),
  });

  return jeton;
}


async function rotationnerRefreshToken(jetonPresente, req) {
  const hache = hacherRefreshToken(jetonPresente);
  const enregistrement = await RefreshToken.findOne({ tokenHache: hache });

  if (!enregistrement) {
    throw ApiError.nonAuthentifie("Session invalide, reconnectez-vous");
  }

  if (enregistrement.revoqueLe) {
    await revoquerFamille(enregistrement.familleId, "rejeu_detecte");
    logger.avertir("Rejeu de refresh token détecté — famille révoquée", {
      utilisateur: enregistrement.utilisateur.toString(),
      familleId: enregistrement.familleId,
      ip: req?.ip,
    });
    throw ApiError.nonAuthentifie("Session invalide, reconnectez-vous");
  }

  if (enregistrement.expireLe <= new Date()) {
    throw ApiError.nonAuthentifie("Session expirée, reconnectez-vous");
  }

  // L'utilisateur est rechargé pour refléter un rôle modifié ou un compte
  // supprimé depuis l'émission du jeton.
  const User = require("../models/User");
  const utilisateur = await User.findById(enregistrement.utilisateur);
  if (!utilisateur) {
    await revoquerFamille(enregistrement.familleId, "revocation_admin");
    throw ApiError.nonAuthentifie("Session invalide, reconnectez-vous");
  }

  enregistrement.revoqueLe = new Date();
  enregistrement.motifRevocation = "rotation";
  await enregistrement.save();

  const nouveauJeton = await emettreRefreshToken(utilisateur, {
    familleId: enregistrement.familleId,
    req,
  });

  return { utilisateur, refreshToken: nouveauJeton };
}

async function revoquerFamille(familleId, motif) {
  await RefreshToken.updateMany(
    { familleId, revoqueLe: null },
    { $set: { revoqueLe: new Date(), motifRevocation: motif } }
  );
}

async function revoquerJeton(jetonPresente, motif = "deconnexion") {
  if (!jetonPresente) return;
  const hache = hacherRefreshToken(jetonPresente);
  await RefreshToken.updateOne(
    { tokenHache: hache, revoqueLe: null },
    { $set: { revoqueLe: new Date(), motifRevocation: motif } }
  );
}

/** Déconnecte l'utilisateur de tous ses appareils. */
async function revoquerToutesLesSessions(utilisateurId, motif = "revocation_admin") {
  await RefreshToken.updateMany(
    { utilisateur: utilisateurId, revoqueLe: null },
    { $set: { revoqueLe: new Date(), motifRevocation: motif } }
  );
}


function optionsCookie(extra = {}) {
  return {
    httpOnly: true,
    secure: env.estProduction,
    sameSite: env.estProduction ? "none" : "lax",
    path: "/",
    ...extra,
  };
}

function poserCookiesAuth(res, { accessToken, refreshToken }) {
  res.cookie(NOM_COOKIE_ACCES, accessToken, optionsCookie({ maxAge: 15 * 60 * 1000 }));
  res.cookie(
    NOM_COOKIE_REFRESH,
    refreshToken,
    optionsCookie({ maxAge: DUREE_REFRESH_MS, path: CHEMIN_COOKIE_REFRESH })
  );
}

function effacerCookiesAuth(res) {
  res.clearCookie(NOM_COOKIE_ACCES, optionsCookie());
  res.clearCookie(NOM_COOKIE_REFRESH, optionsCookie({ path: CHEMIN_COOKIE_REFRESH }));
  // Le cookie CSRF est lisible par le JS du front : httpOnly désactivé.
  res.clearCookie(NOM_COOKIE_CSRF, { ...optionsCookie(), httpOnly: false });
}

module.exports = {
  NOM_COOKIE_ACCES,
  NOM_COOKIE_REFRESH,
  NOM_COOKIE_CSRF,
  CHEMIN_COOKIE_REFRESH,
  signerJetonAcces,
  verifierJetonAcces,
  emettreRefreshToken,
  rotationnerRefreshToken,
  revoquerJeton,
  revoquerFamille,
  revoquerToutesLesSessions,
  optionsCookie,
  poserCookiesAuth,
  effacerCookiesAuth,
};
