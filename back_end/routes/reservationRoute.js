const router = require("express").Router();

const Reservation = require("../models/Reservation");
const Voiture = require("../models/Voiture");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const logger = require("../utils/logger");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const validate = require("../middleware/validate");
const { limiteurEcriture } = require("../middleware/rateLimit");
const schemas = require("../validation/schemas");

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Nombre de jours facturés entre deux dates (au moins 1). */
function calculerJours(dateDebut, dateFin) {
  return Math.max(1, Math.ceil((dateFin - dateDebut) / MS_PAR_JOUR));
}

/* ─────────────────────── Création d'une réservation ─────────────────────── */

router.post(
  "/",
  authMiddleware,
  limiteurEcriture,
  validate({ body: schemas.creationReservation }),
  asyncHandler(async (req, res) => {
    const { voiture: voitureId, dateDebut, dateFin, adresse } = req.body;

    const voiture = await Voiture.findById(voitureId);
    if (!voiture) {
      throw ApiError.introuvable("Voiture introuvable");
    }
    if (voiture.horsService) {
      throw ApiError.conflit("Ce véhicule n'est pas proposé à la location");
    }

    const jours = calculerJours(dateDebut, dateFin);
    // Le prix vient exclusivement du catalogue serveur, jamais du client.
    const prixTotal = voiture.prixParJour * jours;

    const filtreConflit = Reservation.filtreChevauchement(
      voitureId,
      dateDebut,
      dateFin
    );

    const dejaReserve = await Reservation.exists(filtreConflit);
    if (dejaReserve) {
      throw ApiError.conflit(
        "Ce véhicule est déjà réservé sur la période demandée"
      );
    }

    const reservation = await Reservation.create({
      client: req.user._id,
      voiture: voitureId,
      dateDebut,
      dateFin,
      prixTotal,
      statut: "en_attente",
      adresse,
    });

    // Le contrôle ci-dessus laisse une fenêtre de concurrence : deux requêtes
    // simultanées peuvent le franchir toutes les deux. On revérifie donc
    // *après* l'insertion — désormais visible par les autres requêtes — et la
    // réservation la plus récente s'efface. Ce motif « insérer puis vérifier »
    // évite d'exiger un replica set MongoDB pour disposer de transactions.
    const conflits = await Reservation.find(filtreConflit)
      .select("_id createdAt")
      .sort({ createdAt: 1, _id: 1 })
      .lean();

    const gagnante = conflits[0];
    if (gagnante && gagnante._id.toString() !== reservation._id.toString()) {
      await reservation.deleteOne();
      throw ApiError.conflit(
        "Ce véhicule vient d'être réservé sur la période demandée"
      );
    }

    logger.info("Réservation créée", {
      reservation: reservation._id.toString(),
      client: req.user._id.toString(),
    });

    res.status(201).json({
      message: "Réservation créée avec succès",
      jours,
      prixTotal,
      reservation,
    });
  })
);

/* ─────────────────── Réservations de l'utilisateur connecté ─────────────── */

router.get(
  "/mes-reservations",
  authMiddleware,
  asyncHandler(async (req, res) => {
    // Le filtre sur req.user._id est la garantie qu'un client ne voit jamais
    // les réservations d'un autre.
    const reservations = await Reservation.find({ client: req.user._id })
      .populate("voiture", "marque modele prixParJour imageUrl")
      .sort({ createdAt: -1 });

    res.json(reservations);
  })
);

/* ─────────────────────────── Liste (admin) ──────────────────────────────── */

router.get(
  "/",
  authMiddleware,
  adminMiddleware,
  asyncHandler(async (req, res) => {
    const reservations = await Reservation.find()
      .populate("client", "nom prenom numero")
      .populate("voiture", "marque modele prixParJour immatriculation")
      .sort({ createdAt: -1 });

    res.json(reservations);
  })
);

/* ──────────────────────── Détail d'une réservation ──────────────────────── */

router.get(
  "/:id",
  authMiddleware,
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id)
      .populate("voiture", "marque modele prixParJour imageUrl")
      .populate("client", "nom prenom numero");

    if (!reservation) {
      throw ApiError.introuvable("Réservation introuvable");
    }

    // Contrôle de propriété : sans lui, changer l'identifiant dans l'URL
    // suffirait à lire la réservation de quelqu'un d'autre (IDOR).
    const estProprietaire =
      reservation.client._id.toString() === req.user._id.toString();
    if (!estProprietaire && req.user.role !== "admin") {
      // 404 plutôt que 403 : on ne confirme pas l'existence de la ressource.
      throw ApiError.introuvable("Réservation introuvable");
    }

    res.json(reservation);
  })
);

/* ──────────────────── Changement de statut (admin) ──────────────────────── */

router.patch(
  "/:id",
  authMiddleware,
  adminMiddleware,
  limiteurEcriture,
  validate({ params: schemas.paramId, body: schemas.majStatutReservation }),
  asyncHandler(async (req, res) => {
    const { statut } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw ApiError.introuvable("Réservation introuvable");
    }

    reservation.statut = statut;
    if (statut === "annulée") reservation.annuleeLe = new Date();
    await reservation.save();

    // La disponibilité découle des réservations actives sur la période :
    // aucun drapeau global à remettre à jour, donc aucune désynchronisation
    // possible entre le drapeau et la réalité des réservations.
    logger.info("Statut de réservation modifié", {
      reservation: reservation._id.toString(),
      statut,
      admin: req.user._id.toString(),
    });

    res.json({ message: `Statut mis à jour : ${statut}`, reservation });
  })
);

/* ──────────────── Annulation par le client propriétaire ─────────────────── */

router.patch(
  "/:id/annuler",
  authMiddleware,
  limiteurEcriture,
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      throw ApiError.introuvable("Réservation introuvable");
    }

    if (reservation.client.toString() !== req.user._id.toString()) {
      throw ApiError.introuvable("Réservation introuvable");
    }

    if (["terminée", "annulée"].includes(reservation.statut)) {
      throw ApiError.conflit("Cette réservation ne peut plus être annulée");
    }

    reservation.statut = "annulée";
    reservation.annuleeLe = new Date();
    await reservation.save();

    res.json({ message: "Réservation annulée", reservation });
  })
);

/* ─────────────────────────── Suppression (admin) ────────────────────────── */

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  limiteurEcriture,
  validate({ params: schemas.paramId }),
  asyncHandler(async (req, res) => {
    const reservation = await Reservation.findByIdAndDelete(req.params.id);
    if (!reservation) {
      throw ApiError.introuvable("Réservation introuvable");
    }

    logger.info("Réservation supprimée", {
      reservation: req.params.id,
      admin: req.user._id.toString(),
    });

    res.json({ message: "Réservation supprimée avec succès" });
  })
);

module.exports = router;
