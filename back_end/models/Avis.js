const mongoose = require("mongoose");
const { Schema } = mongoose;

const avisSchema = new Schema({
  client: {
    type: Schema.Types.ObjectId,
    ref: "User",  // qui a laissé l'avis
    required: true
  },
  voiture: {
    type: Schema.Types.ObjectId,
    ref: "Voiture", // sur quelle voiture
    required: true
  },
  note: { type: Number, min: 1, max: 5, required: true }, // rating 1-5
  commentaire: { type: String, maxlength: 500 },
}, { timestamps: true });

module.exports = mongoose.model("Avis", avisSchema);
