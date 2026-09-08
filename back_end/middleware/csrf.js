const crypto = require("crypto");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");
const { NOM_COOKIE_CSRF, optionsCookie } = require("../services/tokenService");

/**
 * Protection CSRF — motif « double soumission signée ».
 *
 * Pourquoi malgré SameSite ? SameSite=Lax bloque la plupart des attaques,
 * mais il ne protège pas les sous-domaines, tombe à SameSite=None dès qu'on
 * passe en cross-site (front et API sur des domaines différents en prod), et
 * n'est pas appliqué uniformément par tous les navigateurs. C'est une défense
 * en profondeur, pas une redondance.
 *
 * Fonctionnement : un jeton aléatoire est posé dans un cookie *lisible* par le
 * front, qui doit le renvoyer dans l'en-tête X-CSRF-Token. Un site tiers peut
 * déclencher une requête avec les cookies, mais ne peut pas *lire* le cookie
 * pour construire l'en-tête (la politique d'origine identique l'en empêche).
 *
 * Le jeton est signé par HMAC : il ne peut donc pas être forgé par un
 * attaquant capable d'écrire un cookie (sous-domaine compromis).
 */

const METHODES_SURES = new Set(["GET", "HEAD", "OPTIONS"]);

function genererJetonCsrf() {
  const aleatoire = crypto.randomBytes(24).toString("base64url");
  const signature = crypto
    .createHmac("sha256", env.CSRF_SECRET)
    .update(aleatoire)
    .digest("base64url");
  return `${aleatoire}.${signature}`;
}

function jetonCsrfValide(jeton) {
  if (typeof jeton !== "string") return false;
  const [aleatoire, signature] = jeton.split(".");
  if (!aleatoire || !signature) return false;

  const attendue = crypto
    .createHmac("sha256", env.CSRF_SECRET)
    .update(aleatoire)
    .digest("base64url");

  const a = Buffer.from(signature);
  const b = Buffer.from(attendue);
  // Comparaison à temps constant : évite de fuiter la signature octet par octet.
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Pose (ou renouvelle) le cookie CSRF lisible par le front. */
function poserCookieCsrf(res) {
  const jeton = genererJetonCsrf();
  res.cookie(NOM_COOKIE_CSRF, jeton, {
    ...optionsCookie(),
    httpOnly: false, // le front doit pouvoir le lire pour le renvoyer en en-tête
    maxAge: 24 * 60 * 60 * 1000,
  });
  return jeton;
}

/** Vérifie l'en-tête sur toute méthode modifiant l'état. */
function verifierCsrf(req, _res, next) {
  if (METHODES_SURES.has(req.method)) return next();

  const cookie = req.cookies?.[NOM_COOKIE_CSRF];
  const entete = req.get("x-csrf-token");

  if (!cookie || !entete) {
    return next(ApiError.interdit("Jeton CSRF manquant"));
  }

  const memeValeur =
    cookie.length === entete.length &&
    crypto.timingSafeEqual(Buffer.from(cookie), Buffer.from(entete));

  if (!memeValeur || !jetonCsrfValide(cookie)) {
    return next(ApiError.interdit("Jeton CSRF invalide"));
  }

  next();
}

module.exports = { verifierCsrf, poserCookieCsrf, genererJetonCsrf };
