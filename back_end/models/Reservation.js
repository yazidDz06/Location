const mongoose = require("mongoose");
const { Schema } = mongoose;

const STATUTS = ["en_attente", "confirmée", "terminée", "annulée"];

// Une réservation dans l'un de ces états occupe le véhicule sur sa période.
const STATUTS_BLOQUANTS = ["en_attente", "confirmée"];

const reservationSchema = new Schema(
  {
    client: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    voiture: {
      type: Schema.Types.ObjectId,
      ref: "Voiture",
      required: true,
      index: true,
    },
    adresse: {
      ville: { type: String, required: true, trim: true, maxlength: 80 },
      commune: { type: String, required: true, trim: true, maxlength: 80 },
      rue: { type: String, required: true, trim: true, maxlength: 160 },
    },
    dateDebut: { type: Date, required: true },
    dateFin: { type: Date, required: true },

    // Toujours recalculé côté serveur à partir du prix du véhicule : un prix
    // envoyé par le client ne doit jamais être approuvé tel quel.
    prixTotal: { type: Number, required: true, min: 0 },

    statut: { type: String, enum: STATUTS, default: "en_attente", index: true },

    annuleeLe: { type: Date, default: null },
  },
  { timestamps: true }
);

// Recherche des chevauchements sur un véhicule : c'est la requête chaude du
// flux de réservation.
reservationSchema.index({ voiture: 1, statut: 1, dateDebut: 1, dateFin: 1 });

reservationSchema.statics.STATUTS = STATUTS;
reservationSchema.statics.STATUTS_BLOQUANTS = STATUTS_BLOQUANTS;

/**
 * Construit le filtre des réservations qui entrent en conflit avec une
 * période donnée. Deux intervalles se chevauchent si chacun commence avant
 * que l'autre ne finisse.
 */
reservationSchema.statics.filtreChevauchement = function filtreChevauchement(
  voitureId,
  dateDebut,
  dateFin
) {
  return {
    voiture: voitureId,
    statut: { $in: STATUTS_BLOQUANTS },
    dateDebut: { $lt: dateFin },
    dateFin: { $gt: dateDebut },
  };
};

module.exports = mongoose.model("Reservation", reservationSchema);
