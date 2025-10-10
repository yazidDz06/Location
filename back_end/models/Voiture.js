const mongoose = require("mongoose");

const {Schema}= mongoose;

const voitureSchema = new Schema({
  marque: { type: String, required: true },
  modele: { type: String, required: true },
  annee: { type: Number, required: true, min: 1900, max: new Date().getFullYear() },
  type: { type: String, enum: ['diesel', 'essence', 'electrique'], required: true },
  immatriculation: { type: String, unique: true, required: true },
  prixParJour: { type: Number, required: true },
  disponible: { type: Boolean, default: true },
  kilometrage: { type: Number, default: 0 },
  imageUrl: { type: String }
}, { timestamps: true });

module.exports = mongoose.model("Voiture", voitureSchema);
