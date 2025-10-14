const User = require("../models/User");
const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
dotenv.config();
const mongoose = require("mongoose");
const  authMiddleware  = require("../middleware/authMiddleware");
const  adminMiddleware  = require("../middleware/adminMiddleware");

// register a new user (par défaut c'est un client)
router.post("/register", async (req, res) => {
  const { nom, prenom, numero, dateNaissance, password } = req.body;

  try {
    if (!nom || !prenom || !numero || !dateNaissance || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    if (!/^\d{10}$/.test(numero)) {
      return res.status(400).json({ message: "Numéro invalide (10 chiffres requis)." });
    }

    const existingUser = await User.findOne({ numero });
    if (existingUser) {
      return res.status(400).json({ message: "Utilisateur déjà existant." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      nom,
      prenom,
      numero,
      dateNaissance,
      password: hashedPassword,
      
    });

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

   
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
      path: "/",
    });

    res.status(201).json({
      message: "Utilisateur enregistré avec succès.",
      user: {
        id: newUser._id,
        nom: newUser.nom,
        prenom: newUser.prenom,
        numero: newUser.numero,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription :", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//login
router.post("/login", async (req, res) => {
  try {
    const { numero, password } = req.body;

    const user = await User.findOne({ numero });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur introuvable." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    const token = jwt.sign(
      { id: user._id, numero: user.numero, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    
    res.cookie("token", token, {
      httpOnly: true,
      secure: false,         // true en prod avec HTTPS
      sameSite: "lax",       
      maxAge: 24 * 60 * 60 * 1000, // 24 heures
      path: "/",             // important !
    });

    res.json({
      message: "Connexion réussie",
      user: { id: user._id, numero: user.numero, role: user.role },
    });

  } catch (err) {
    console.error("Erreur login:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

//logout 
router.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
     path: "/",
  });

  res.status(200).json({ message: "Déconnexion réussie" });
});


router.get("/profile", authMiddleware, (req, res) => {
  const { nom, prenom } = req.user;
  res.json({ nom, prenom });
});

//get all users (admin only)
router.get("/", authMiddleware,adminMiddleware,async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//delete user (admin only)
router.delete("/:id",authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "Utilisateur non trouvé." });
    }
    res.json({ message: "Utilisateur supprimé avec succès." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//update profile(numero)

router.put("/update", authMiddleware, async (req, res) => {
  try {

    const { numero } = req.body;

    if (!numero || typeof numero !== "string" || numero.trim() === "") {
      return res.status(400).json({ message: "Numéro invalide." });
    }

    // Vérifier si ce numero existe déjà chez un autre utilisateur
    const existingUser = await User.findOne({ numero });
    if (existingUser && existingUser._id.toString() !== req.user.id) {
      return res.status(400).json({ message: "Ce numéro est déjà utilisé par un autre compte." });
    }

    // Mettre à jour le numero
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { numero: numero.trim() } },
      { new: true, runValidators: true }
    ).select("-password"); // on ne renvoie jamais le password

    res.json({ message: "Profil mis à jour avec succès", user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});



module.exports = router;