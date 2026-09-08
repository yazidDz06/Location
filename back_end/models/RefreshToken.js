const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * Jeton de rafraîchissement — stocké *haché*, jamais en clair.
 *
 * Si la base fuite, les hachages ne permettent pas de forger un jeton
 * valide (même logique que pour les mots de passe).
 *
 * Rotation : chaque utilisation d'un refresh token le révoque et en émet un
 * nouveau. Tous les jetons issus d'une même connexion partagent une
 * « famille » (familleId), ce qui permet la détection de rejeu : si un jeton
 * déjà rotationné est réutilisé, c'est qu'il a été volé — on révoque alors
 * toute la famille et l'attaquant comme la victime sont déconnectés.
 */
const refreshTokenSchema = new Schema(
  {
    // SHA-256(token + pepper) — voir services/tokenService.js
    tokenHache: { type: String, required: true, unique: true, index: true },

    utilisateur: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Identifiant de la lignée de jetons issue d'une même connexion.
    familleId: { type: String, required: true, index: true },

    expireLe: { type: Date, required: true },

    revoqueLe: { type: Date, default: null },
    motifRevocation: {
      type: String,
      enum: ["rotation", "deconnexion", "rejeu_detecte", "revocation_admin", null],
      default: null,
    },

    // Métadonnées utiles à l'audit d'une session suspecte.
    adresseIp: { type: String },
    agentUtilisateur: { type: String, maxlength: 400 },
  },
  { timestamps: true }
);

// MongoDB purge automatiquement les documents expirés : la table ne gonfle pas
// indéfiniment et les jetons morts ne traînent pas en base.
refreshTokenSchema.index({ expireLe: 1 }, { expireAfterSeconds: 0 });

refreshTokenSchema.methods.estActif = function estActif() {
  return !this.revoqueLe && this.expireLe > new Date();
};

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
