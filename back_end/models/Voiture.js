const mongoose = require("mongoose");
const { Schema } = mongoose;

const voitureSchema = new Schema(
  {
    marque: { type: String, required: true, trim: true, maxlength: 50 },
    modele: { type: String, required: true, trim: true, maxlength: 50 },
    annee: {
      type: Number,
      required: true,
      min: 1900,
      max: new Date().getFullYear() + 1,
    },
    type: {
      type: String,
      enum: ["diesel", "essence", "hybride", "electrique"],
      required: true,
    },
    immatriculation: {
      type: String,
      unique: true,
      required: true,
      trim: true,
      uppercase: true,
      maxlength: 20,
    },
    prixParJour: { type: Number, required: true, min: 0 },
    kilometrage: { type: Number, default: 0, min: 0 },
    imageUrl: { type: String, maxlength: 2000 },

    /**
     * Retrait volontaire du catalogue (entretien, vente…), piloté par l'admin.
     *
     * Remplace l'ancien drapeau `disponible`, qui mélangeait deux notions :
     * « louable » et « libre à cette date ». La disponibilité réelle se
     * déduit désormais des réservations actives sur la période demandée —
     * un drapeau unique rendait impossible toute réservation à l'avance et
     * se désynchronisait dès qu'une réservation changeait de statut.
     */
    horsService: { type: Boolean, default: false },
  },
  { timestamps: true }
);

voitureSchema.index({ marque: 1, modele: 1 });
voitureSchema.index({ prixParJour: 1 });

module.exports = mongoose.model("Voiture", voitureSchema);
