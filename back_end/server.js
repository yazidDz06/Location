const mongoose = require("mongoose");

// Charge et valide la configuration en premier : si un secret manque, le
// processus s'arrête ici plutôt que de servir une application non sécurisée.
const env = require("./config/env");
const connectDB = require("./db");
const logger = require("./utils/logger");
const creerApp = require("./app");

let serveur;

(async function demarrer() {
  await connectDB();

  const app = creerApp();
  serveur = app.listen(env.PORT, () => {
    logger.info(`Serveur démarré sur le port ${env.PORT}`, {
      environnement: env.NODE_ENV,
    });
  });
})();

/**
 * Arrêt propre : on laisse les requêtes en cours se terminer et on ferme la
 * connexion MongoDB, plutôt que de couper au milieu d'une écriture.
 */
async function arreterProprement(signal) {
  logger.info(`Signal ${signal} reçu, arrêt en cours...`);

  serveur?.close(async () => {
    await mongoose.connection.close(false);
    logger.info("Arrêt terminé");
    process.exit(0);
  });

  // Filet de sécurité si une connexion refuse de se fermer.
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGTERM", () => arreterProprement("SIGTERM"));
process.on("SIGINT", () => arreterProprement("SIGINT"));

// Un rejet non géré laisse le processus dans un état indéterminé : on le
// journalise et on redémarre proprement plutôt que de continuer à l'aveugle.
process.on("unhandledRejection", (raison) => {
  logger.erreur("Rejet de promesse non géré", { raison: String(raison) });
  arreterProprement("unhandledRejection");
});
