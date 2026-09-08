const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { verifierJetonAcces, NOM_COOKIE_ACCES } = require("../services/tokenService");

/**
 * Authentifie la requête à partir du cookie httpOnly contenant le jeton
 * d'accès.
 *
 * L'utilisateur est rechargé depuis la base à chaque requête : un compte
 * supprimé ou rétrogradé perd immédiatement ses droits, sans attendre
 * l'expiration du jeton. Le coût d'une lecture indexée par _id est négligeable
 * face au risque d'un rôle périmé porté par un JWT.
 */
const authMiddleware = asyncHandler(async (req, _res, next) => {
  const jeton = req.cookies?.[NOM_COOKIE_ACCES];

  if (!jeton) {
    throw ApiError.nonAuthentifie("Authentification requise");
  }

  let charge;
  try {
    charge = verifierJetonAcces(jeton);
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      // Code distinct : le front sait qu'il doit tenter un /users/refresh
      // plutôt que de rediriger l'utilisateur vers la page de connexion.
      throw new ApiError(401, "Jeton expiré", { code: "JETON_EXPIRE" });
    }
    throw ApiError.nonAuthentifie("Session invalide");
  }

  const utilisateur = await User.findById(charge.sub).select(
    "+motDePasseModifieLe"
  );

  if (!utilisateur) {
    throw ApiError.nonAuthentifie("Session invalide");
  }

  // Un mot de passe changé après l'émission du jeton invalide ce jeton :
  // c'est ce qui rend « se déconnecter partout » réellement effectif.
  if (utilisateur.motDePasseModifieLe) {
    const emisLe = charge.iat * 1000;
    if (emisLe < utilisateur.motDePasseModifieLe.getTime()) {
      throw ApiError.nonAuthentifie("Session expirée, reconnectez-vous");
    }
  }

  req.user = utilisateur;
  next();
});

module.exports = authMiddleware;
