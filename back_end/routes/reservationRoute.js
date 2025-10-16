const express = require("express");
const router = express.Router();
const Reservation = require("../models/Reservation");
const User = require("../models/User");
const Voiture = require("../models/Voiture");
const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware")
router.post("/", authMiddleware, async (req, res) => {
  try {
  const { voiture, dateDebut, dateFin, adresse } = req.body;
   const client = req.user.id; 

const clientExist = await User.findById(client);

    //  Vérifier la voiture
    const voitureExist = await Voiture.findById(voiture);
    if (!voitureExist) {
      return res.status(404).json({ message: "Voiture introuvable" });
    }

    //  Vérifier disponibilité
    if (!voitureExist.disponible) {
      return res.status(400).json({ message: "Voiture déjà réservée" });
    }

    //  Calculer la durée (en jours)
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const diffTime = fin - debut; // millisecondes
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) {
      return res.status(400).json({ message: "Les dates sont invalides." });
    }

    //  Calculer le prix total
    const prixTotal = voitureExist.prixParJour * diffDays;

    // Créer la réservation
    const reservation = await Reservation.create({
      client,
      voiture,
      dateDebut: debut,
      dateFin: fin,
      prixTotal,
      statut: "en_attente",
      adresse,
    });

    //  Rendre la voiture indisponible
    voitureExist.disponible = false;
    await voitureExist.save();

    res.status(201).json({
      message: `Réservation créée pour ${clientExist.nom} ${clientExist.prenom}`,
      jours: diffDays,
      prixTotal,
      reservation,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find()
      .populate("client", "nom prenom email") // afficher les infos principales du client
      .populate("voiture", "marque modele prixParJour"); // de la voiture

    res.status(200).json(reservations);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Erreur serveur", error: error.message });
  }
});
//  Mettre à jour le statut d'une réservation
router.patch("/:id", async (req, res) => {
  try {
    const { statut } = req.body;
    if (!statut)
      return res.status(400).json({ message: "Le statut est requis." });

    //  populate la voiture pour accéder à son champ disponible
    const reservation = await Reservation.findById(req.params.id).populate("voiture");
    if (!reservation)
      return res.status(404).json({ message: "Réservation introuvable." });

    
    reservation.statut = statut;
    await reservation.save();

    if (statut === "terminée" && reservation.voiture) {
      reservation.voiture.disponible = true;
      await reservation.voiture.save();
    }

    res.status(200).json({
      message: `Statut mis à jour en '${statut}'.`,
      reservation,
    });
  } catch (error) {
    console.error("Erreur  :", error);
    res.status(500).json({ message: "Erreur serveur.", error });
  }
});


//  Supprimer une réservation (lorsqu’elle est terminée)
router.delete("/:id", async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation)
      return res.status(404).json({ message: "Réservation introuvable." });

    await reservation.deleteOne();

    res.status(200).json({ message: "Réservation supprimée avec succès." });
  } catch (error) {
    console.error("Erreur de suppression", error);
    res.status(500).json({ message: "Erreur serveur.", error });
  }
});


module.exports = router;

