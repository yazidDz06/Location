const mongoose = require("mongoose");
const env = require("./config/env");
const logger = require("./utils/logger");

/**
 * Connexion MongoDB.
 *
 * `strictQuery` empêche Mongoose de laisser passer silencieusement des champs
 * absents du schéma dans un filtre : une faute de frappe deviendrait sinon une
 * requête sans condition, qui retourne tout.
 */
mongoose.set("strictQuery", true);

// Ne jamais journaliser les requêtes en production : elles contiennent des
// données personnelles (numéros de téléphone, adresses).
mongoose.set("debug", false);

const connectDB = async () => {
  try {
    await mongoose.connect(env.DB_URL, {
      serverSelectionTimeoutMS: 10000,
      // Borne le temps qu'une requête peut monopoliser une connexion.
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
    });
    logger.info("MongoDB connecté");
  } catch (error) {
    // L'URL de connexion peut contenir des identifiants : on ne journalise
    // que le message d'erreur, jamais la chaîne complète.
    logger.erreur("Échec de la connexion MongoDB", { message: error.message });
    process.exit(1);
  }

  mongoose.connection.on("error", (error) => {
    logger.erreur("Erreur MongoDB", { message: error.message });
  });

  mongoose.connection.on("disconnected", () => {
    logger.avertir("MongoDB déconnecté");
  });
};

module.exports = connectDB;
