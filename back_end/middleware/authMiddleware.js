const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.token;

   
    if (!token) {
      
      return res.status(401).json({ message: "Non autorisé, token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log(" Token décodé:", decoded);

    
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      console.log(" Utilisateur non trouvé pour ID:", decoded.id);
      return res.status(404).json({ message: "Utilisateur non trouvé" });
    }

    
    req.user = user;



    next(); 
  } catch (error) {
    console.error(" Erreur authMiddleware:", error.message);

    
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expiré" });
    } else if (error.name === "JsonWebTokenError") {
      return res.status(403).json({ message: "Token invalide" });
    } else {
      return res.status(500).json({ message: "Erreur interne d’authentification" });
    }
  }
};

module.exports = authMiddleware;

