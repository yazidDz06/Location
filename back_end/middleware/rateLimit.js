const rateLimit = require("express-rate-limit");
const ApiError = require("../utils/ApiError");

/**
 * Limitation de débit.
 *
 * Sans elle, un attaquant peut tester des milliers de mots de passe par minute
 * sur /users/login — les numéros étant sur 10 chiffres, l'espace de recherche
 * côté identifiant est déjà réduit.
 *
 * Note pour la production : avec plusieurs instances derrière un load
 * balancer, chaque processus a son propre compteur mémoire. Il faut alors un
 * store partagé (rate-limit-redis) — le projet a déjà Redis en dépendance.
 */

const reponseLimite = (message) => (req, _res, next) => next(ApiError.tropDeRequetes(message));

const commun = {
  standardHeaders: "draft-7",
  legacyHeaders: false,
  // On compte par IP ; ipKeyGenerator gère correctement l'IPv6.
  validate: { trustProxy: false },
};

/** Garde-fou global contre le martèlement de l'API. */
const limiteurGlobal = rateLimit({
  ...commun,
  windowMs: 15 * 60 * 1000,
  limit: 600,
  handler: reponseLimite("Trop de requêtes, réessayez dans quelques minutes."),
});

/** Connexion / inscription : strict, c'est la cible privilégiée du brute-force. */
const limiteurAuth = rateLimit({
  ...commun,
  windowMs: 15 * 60 * 1000,
  limit: 10,
  // Une connexion réussie ne doit pas pénaliser l'utilisateur légitime.
  skipSuccessfulRequests: true,
  handler: reponseLimite(
    "Trop de tentatives de connexion. Réessayez dans 15 minutes."
  ),
});

/** Rafraîchissement : plus permissif, mais borné (un client normal appelle peu). */
const limiteurRefresh = rateLimit({
  ...commun,
  windowMs: 15 * 60 * 1000,
  limit: 60,
  handler: reponseLimite("Trop de rafraîchissements de session."),
});

/** Écritures authentifiées (réservations, création de voitures…). */
const limiteurEcriture = rateLimit({
  ...commun,
  windowMs: 60 * 1000,
  limit: 30,
  handler: reponseLimite("Trop d'opérations d'écriture, ralentissez."),
});

const tousLesLimiteurs = [
  limiteurGlobal,
  limiteurAuth,
  limiteurRefresh,
  limiteurEcriture,
];

/**
 * Remet les compteurs à zéro. Réservé aux tests : les cas s'exécutent tous
 * depuis 127.0.0.1 et se partageraient sinon le même quota.
 */
function reinitialiserLimiteurs() {
  for (const limiteur of tousLesLimiteurs) {
    limiteur.resetKey?.("::ffff:127.0.0.1");
    limiteur.resetKey?.("127.0.0.1");
    limiteur.resetKey?.("::1");
  }
}

module.exports = {
  limiteurGlobal,
  limiteurAuth,
  limiteurRefresh,
  limiteurEcriture,
  reinitialiserLimiteurs,
};
