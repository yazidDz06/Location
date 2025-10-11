const Voiture = require("../models/Voiture");
const mongoose = require("mongoose");
const router = require("express").Router();
const adminMiddleware = require("../middleware/adminMiddleware");
const authMiddleware = require("../middleware/authMiddleware");

// Get all cars
router.get("/", authMiddleware ,async (req, res) => {
  try {
    const voitures = await Voiture.find();
    res.status(200).json(voitures);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create a new car
router.post("/",authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { marque, modele, annee, type, immatriculation, prixParJour, kilometrage, imageUrl } = req.body;
    const voiture = await Voiture.create({
      marque,
      modele,
      annee,
      type,
      immatriculation,
      prixParJour,
      kilometrage,
      imageUrl,
    });
    res.status(201).json(voiture);
  } catch (error) {
    res.status(400).json({ message: "Erreur lors de la création de la voiture", error: error.message });
  }
});

// Get a single car
router.get("/:id", authMiddleware,async (req, res) => {
  const { id } = req.params;
  if(!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID invalide" });
  }
  try {
    const voiture = await Voiture.findById(id);
    if (!voiture) {
      return res.status(404).json({ message: "Voiture non trouvée" });
    }
    res.status(200).json(voiture);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

// Update a car
router.put("/:id",adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { prixParJour, disponible, kilometrage } = req.body;

  try {
    // Vérifier que l'ID est valide
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID invalide" });
    }

    // Construire un objet de mise à jour avec uniquement les champs autorisés
    const updateData = {};
    if (typeof prixParJour === "number") updateData.prixParJour = prixParJour;
    if (typeof disponible === "boolean") updateData.disponible = disponible;
    if (typeof kilometrage === "number") updateData.kilometrage = kilometrage;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Aucune donnée valide à mettre à jour" });
    }

    const voiture = await Voiture.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!voiture) {
      return res.status(404).json({ message: "Voiture non trouvée" });
    }

    res.status(200).json(voiture);
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});


// Delete a car
router.delete("/:id",adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const voiture = await Voiture.findByIdAndDelete(id);
    if (!voiture) {
      return res.status(404).json({ message: "Voiture non trouvée" });
    }
    res.status(200).json({ message: "Voiture supprimée" });
  } catch (error) {
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});

module.exports = router; 
