const User = require("../models/User");
 const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Accès refusé : admin requis" });
  }

  next();
};

module.exports = adminMiddleware;
