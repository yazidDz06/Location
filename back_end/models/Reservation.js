const mongoose = require("mongoose");
const { Schema } = mongoose;

const reservationSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "User",   
    required: true
  },
  voiture: {
    type: Schema.Types.ObjectId,
    ref: "Voiture", 
    required: true
  },
    adresse: {
    ville: { type: String },
    commune: { type: String },
    rue: { type: String }
  },
  dateDebut: { type: Date, required: true },
  dateFin: { type: Date, required: true },
  prixTotal: { type: Number, required: true },
  statut: { 
    type: String, 
    enum: ["en_attente", "confirmee", "terminee", "annulee"], 
    default: "en_attente"
  }
}, { timestamps: true });

module.exports = mongoose.model("Reservation", reservationSchema);
