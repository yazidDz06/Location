const jwt = require("jsonwebtoken");
const User = require("../models/User");

 const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "Non autorisé, token manquant" });
  }

  try {
    // Vérification du JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Charger l'utilisateur sans le password
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    next(); // passer au prochain middleware ou contrôleur
  } catch (error) {
    console.error("Erreur authMiddleware:", error.message);
    return res.status(403).json({ message: "Token invalide ou expiré" });
  }
};

module.exports = authMiddleware;
