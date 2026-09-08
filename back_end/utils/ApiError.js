/**
 * Erreur applicative « attendue » : son message est sûr à renvoyer au client.
 * Toute autre erreur qui remonte est considérée comme un bug et masquée
 * derrière un message générique par le gestionnaire central.
 */
class ApiError extends Error {
  constructor(statut, message, details = undefined) {
    super(message);
    this.name = "ApiError";
    this.statut = statut;
    this.details = details;
    this.exposable = true;
    Error.captureStackTrace(this, ApiError);
  }

  static requeteInvalide(message = "Requête invalide", details) {
    return new ApiError(400, message, details);
  }
  static nonAuthentifie(message = "Authentification requise") {
    return new ApiError(401, message);
  }
  static interdit(message = "Accès refusé") {
    return new ApiError(403, message);
  }
  static introuvable(message = "Ressource introuvable") {
    return new ApiError(404, message);
  }
  static conflit(message = "Conflit avec l'état actuel de la ressource") {
    return new ApiError(409, message);
  }
  static tropDeRequetes(message = "Trop de requêtes") {
    return new ApiError(429, message);
  }
}

module.exports = ApiError;
