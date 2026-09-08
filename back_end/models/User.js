const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const env = require("../config/env");

const { Schema } = mongoose;

// 12 tours : coût de calcul suffisant pour rendre une attaque hors ligne
// coûteuse, tout en gardant une connexion sous ~250 ms.
const TOURS_BCRYPT = 12;

const userSchema = new Schema(
  {
    nom: { type: String, required: true, trim: true, maxlength: 50 },
    prenom: { type: String, required: true, trim: true, maxlength: 50 },

    numero: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      match: [/^\d{10}$/, "Numéro invalide (10 chiffres attendus)"],
    },

    // `select: false` : le hash n'est jamais renvoyé par une requête ordinaire.
    // Il faut le demander explicitement (.select("+password")), ce qui évite
    // de le fuiter par oubli dans une réponse JSON.
    password: { type: String, required: true, select: false },

    dateNaissance: { type: Date, required: true },

    role: { type: String, enum: ["admin", "user"], default: "user" },

    // ── Verrouillage de compte ──────────────────────────────────────────
    // La limitation par IP ne suffit pas : un attaquant distribué change d'IP.
    // On compte donc aussi les échecs par compte.
    tentativesEchouees: { type: Number, default: 0, select: false },
    verrouilleJusqua: { type: Date, default: null, select: false },

    // Invalide les jetons émis avant un changement de mot de passe.
    motDePasseModifieLe: { type: Date, default: null, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      // Filet de sécurité : même si le hash est chargé, il ne sort jamais
      // dans une sérialisation JSON.
      transform(_doc, ret) {
        delete ret.password;
        delete ret.tentativesEchouees;
        delete ret.verrouilleJusqua;
        delete ret.motDePasseModifieLe;
        delete ret.__v;
        return ret;
      },
    },
  }
);

/** Hachage automatique : impossible d'enregistrer un mot de passe en clair. */
userSchema.pre("save", async function hacherMotDePasse(next) {
  if (!this.isModified("password")) return next();
  try {
    this.password = await bcrypt.hash(this.password, TOURS_BCRYPT);
    if (!this.isNew) this.motDePasseModifieLe = new Date();
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.virtual("estVerrouille").get(function estVerrouille() {
  return Boolean(this.verrouilleJusqua && this.verrouilleJusqua > Date.now());
});

userSchema.methods.verifierMotDePasse = function verifierMotDePasse(candidat) {
  return bcrypt.compare(candidat, this.password);
};

/** Incrémente le compteur d'échecs et verrouille au seuil configuré. */
userSchema.methods.enregistrerEchec = async function enregistrerEchec() {
  // Le verrou a expiré : on repart d'un compteur propre.
  if (this.verrouilleJusqua && this.verrouilleJusqua <= Date.now()) {
    return this.updateOne({
      $set: { tentativesEchouees: 1, verrouilleJusqua: null },
    });
  }

  const maj = { $inc: { tentativesEchouees: 1 } };
  const atteintLeSeuil =
    this.tentativesEchouees + 1 >= env.MAX_LOGIN_ATTEMPTS && !this.estVerrouille;

  if (atteintLeSeuil) {
    maj.$set = {
      verrouilleJusqua: new Date(
        Date.now() + env.LOCK_DURATION_MINUTES * 60 * 1000
      ),
    };
  }
  return this.updateOne(maj);
};

userSchema.methods.reinitialiserEchecs = function reinitialiserEchecs() {
  if (this.tentativesEchouees === 0 && !this.verrouilleJusqua) return null;
  return this.updateOne({
    $set: { tentativesEchouees: 0, verrouilleJusqua: null },
  });
};

/** Vue publique : uniquement les champs destinés au client. */
userSchema.methods.versJSONPublic = function versJSONPublic() {
  return {
    id: this._id,
    nom: this.nom,
    prenom: this.prenom,
    numero: this.numero,
    role: this.role,
    dateNaissance: this.dateNaissance,
  };
};

module.exports = mongoose.model("User", userSchema);
