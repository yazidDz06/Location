const { ZodError } = require("zod");
const mongoose = require("mongoose");
const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");
const env = require("../config/env");

/** Route inconnue : 404 explicite plutôt qu'une requête qui pend. */
function notFound(req, _res, next) {
  next(ApiError.introuvable(`Route introuvable : ${req.method} ${req.originalUrl}`));
}

/**
 * Gestionnaire d'erreurs central.
 * Règle d'or : on ne renvoie au client que des messages volontairement
 * exposables. Les traces, requêtes Mongo et messages de driver restent côté
 * serveur — ce sont des informations utiles à un attaquant.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statut = 500;
  let message = "Erreur interne du serveur";
  let details;

  if (err instanceof ApiError) {
    statut = err.statut;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statut = 400;
    message = "Données invalides";
    details = err.issues.map((i) => ({
      champ: i.path.join(".") || "(racine)",
      message: i.message,
    }));
  } else if (err instanceof mongoose.Error.ValidationError) {
    statut = 400;
    message = "Données invalides";
    details = Object.values(err.errors).map((e) => ({
      champ: e.path,
      message: e.message,
    }));
  } else if (err instanceof mongoose.Error.CastError) {
    statut = 400;
    message = "Identifiant invalide";
  } else if (err?.code === 11000) {
    statut = 409;
    // On ne révèle pas la valeur en conflit (fuite de données existantes).
    message = "Cette valeur est déjà utilisée";
  } else if (err?.type === "entity.too.large") {
    statut = 413;
    message = "Charge utile trop volumineuse";
  } else if (err?.type === "entity.parse.failed") {
    statut = 400;
    message = "Corps de requête JSON invalide";
  }

  // Les 5xx sont des bugs : on les journalise intégralement côté serveur.
  if (statut >= 500) {
    logger.erreur("Erreur non gérée", {
      message: err?.message,
      stack: err?.stack,
      methode: req.method,
      url: req.originalUrl,
      ip: req.ip,
    });
  }

  const corps = { message };
  if (details) corps.details = details;
  // La trace n'est exposée qu'en développement, jamais en production.
  if (!env.estProduction && statut >= 500) corps.stack = err?.stack;

  res.status(statut).json(corps);
}

module.exports = { notFound, errorHandler };
