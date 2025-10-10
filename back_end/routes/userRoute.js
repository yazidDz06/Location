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
    // Validation des champs
    if (!nom || !prenom || !numero || !dateNaissance || !password) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    // Vérification de l'existence
    const existingUser = await User.findOne({ numero });
    if (existingUser) {
      return res.status(400).json({ message: "Utilisateur déjà existant." });
    }

    // Vérification du format du numéro
    if (!/^\d{10}$/.test(numero)) {
      return res.status(400).json({ message: "Numéro invalide (10 chiffres requis)." });
    }

    // Création de l'utilisateur
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      nom,
      prenom,
      numero,
      dateNaissance,
      password: hashedPassword,
    });
     //ajouter role dans req.body et create si j veux créer un deuxieme admin
    // Génération du token
    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Envoi du cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true en prod
      sameSite: "lax",
    });

    // Réponse finale
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
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});
//login 
router.post("/login", async (req, res) => {
  try {
    const { numero , password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ numero });
    if (!user) {
      return res.status(400).json({ message: "Utilisateur introuvable." });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Mot de passe incorrect." });
    }

    // Générer un JWT
    const token = jwt.sign(
      { id: user._id, numero: user.numero },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // true en prod avec HTTPS
      sameSite: "none"
    });

    res.json({
      message: "Connexion réussie",
      user: { id: user._id, numero: user.numero }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//logout 
router.post("/logout", (req, res) => {
  res.cookie("token", "", { expires: new Date(0) });
  res.json({ message: "Déconnexion réussie" });
});
//get current user
router.get("/current", authMiddleware, (req, res) => {
  res.json({ user: req.user }); 
});

router.get("/profile", authMiddleware, (req, res) => {
  res.json({ message: `Bienvenue ${req.user.nom} ${req.user.prenom}` });
});
//get all users (admin only)
router.get("/", adminMiddleware,async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});
//delete user (admin only)
router.delete("/:id", adminMiddleware, async (req, res) => {
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