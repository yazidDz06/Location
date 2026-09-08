const ApiError = require("../utils/ApiError");
const logger = require("../utils/logger");

/**
 * Exige le rôle admin. À placer *après* authMiddleware, qui renseigne req.user
 * à partir de la base (et non du contenu du JWT) — un rôle retiré prend donc
 * effet immédiatement.
 */
function adminMiddleware(req, _res, next) {
  if (!req.user) {
    return next(ApiError.nonAuthentifie("Authentification requise"));
  }

  if (req.user.role !== "admin") {
    // Tentative d'accès privilégié : trace utile en cas d'incident.
    logger.avertir("Accès admin refusé", {
      utilisateur: req.user._id.toString(),
      route: `${req.method} ${req.originalUrl}`,
      ip: req.ip,
    });
    // Message volontairement identique à celui d'une ressource absente :
    // on ne confirme pas l'existence d'une zone d'administration.
    return next(ApiError.interdit("Accès refusé"));
  }

  next();
}

module.exports = adminMiddleware;
