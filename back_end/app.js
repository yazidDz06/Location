const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const env = require("./config/env");
const logger = require("./utils/logger");
const sanitize = require("./middleware/sanitize");
const { verifierCsrf, poserCookieCsrf } = require("./middleware/csrf");
const { limiteurGlobal } = require("./middleware/rateLimit");
const { notFound, errorHandler } = require("./middleware/errorHandler");

/**
 * Construction de l'application Express, séparée du démarrage du serveur
 * (server.js) pour que les tests puissent la monter sans ouvrir de port.
 */
function creerApp() {
  const app = express();

  // Derrière un reverse proxy (Nginx, Render, Fly…), req.ip vaut sinon l'IP du
  // proxy : la limitation de débit s'appliquerait alors à tous les clients
  // confondus. On ne fait confiance qu'au premier saut.
  app.set("trust proxy", 1);

  // Ne pas annoncer la stack technique : « X-Powered-By: Express » indique à
  // un attaquant quelles failles connues tenter.
  app.disable("x-powered-by");

  /* ───────────────────────── En-têtes de sécurité ───────────────────────── */

  app.use(
    helmet({
      // L'API renvoie du JSON, jamais du HTML : une CSP verrouillée coûte peu
      // et neutralise l'exploitation d'une réponse HTML injectée.
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'none'"],
          frameAncestors: ["'none'"],
          baseUri: ["'none'"],
          formAction: ["'none'"],
        },
      },
      crossOriginResourcePolicy: { policy: "same-site" },
      referrerPolicy: { policy: "no-referrer" },
      // HSTS n'a de sens qu'en HTTPS, donc uniquement en production.
      hsts: env.estProduction
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
    })
  );

  /* ──────────────────────────────── CORS ────────────────────────────────── */

  app.use(
    cors({
      origin(origine, callback) {
        // Requêtes sans origine (curl, mobile, health checks) : la politique
        // du navigateur ne s'applique pas.
        if (!origine) return callback(null, true);
        if (env.CORS_ORIGINS.includes(origine)) return callback(null, true);

        logger.avertir("Origine CORS refusée", { origine });
        return callback(new Error("Origine non autorisée par la politique CORS"));
      },
      credentials: true, // l'authentification passe par cookies
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "X-CSRF-Token"],
      maxAge: 600,
    })
  );

  /* ─────────────────────── Analyse du corps de requête ──────────────────── */

  // Sans limite de taille, un corps de plusieurs centaines de Mo suffit à
  // saturer la mémoire du processus.
  app.use(express.json({ limit: "100kb" }));
  app.use(express.urlencoded({ extended: false, limit: "100kb" }));
  app.use(cookieParser());

  // Neutralise les opérateurs Mongo (« $ne », « $gt »…) dans les entrées.
  app.use(sanitize);

  app.use(limiteurGlobal);

  /* ──────────────────────────── Routes ouvertes ─────────────────────────── */

  // Le front appelle cette route au démarrage pour obtenir un jeton CSRF
  // avant toute écriture (connexion comprise).
  app.get("/csrf-token", (req, res) => {
    res.json({ csrfToken: poserCookieCsrf(res) });
  });

  app.get("/health", (_req, res) => {
    const etatDb = mongoose.connection.readyState === 1 ? "ok" : "indisponible";
    res.json({ statut: "ok", db: etatDb, horodatage: new Date().toISOString() });
  });

  /* ─────────────────────────── Routes métier ────────────────────────────── */

  // Toute méthode modifiant l'état doit présenter un jeton CSRF valide.
  app.use(verifierCsrf);

  app.use("/voitures", require("./routes/voitureRoute"));
  app.use("/users", require("./routes/userRoute"));
  app.use("/appointments", require("./routes/reservationRoute"));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = creerApp;
