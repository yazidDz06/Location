/**
 * Journalisation minimale et structurée, sans dépendance externe.
 * Les champs sensibles sont systématiquement masqués : un mot de passe ou
 * un jeton ne doit jamais atterrir en clair dans les logs.
 */
const env = require("../config/env");

const CHAMPS_SENSIBLES = new Set([
  "password",
  "motdepasse",
  "token",
  "accessToken",
  "refreshToken",
  "authorization",
  "cookie",
  "csrfToken",
]);

function masquer(donnees) {
  if (!donnees || typeof donnees !== "object") return donnees;
  if (Array.isArray(donnees)) return donnees.map(masquer);

  const sortie = {};
  for (const [cle, valeur] of Object.entries(donnees)) {
    sortie[cle] = CHAMPS_SENSIBLES.has(cle.toLowerCase())
      ? "[masqué]"
      : masquer(valeur);
  }
  return sortie;
}

function ecrire(niveau, message, contexte) {
  const ligne = {
    ts: new Date().toISOString(),
    niveau,
    message,
    ...(contexte ? { contexte: masquer(contexte) } : {}),
  };
  const flux = niveau === "erreur" ? console.error : console.log;
  flux(env.estProduction ? JSON.stringify(ligne) : ligne);
}

module.exports = {
  info: (msg, ctx) => ecrire("info", msg, ctx),
  avertir: (msg, ctx) => ecrire("avertissement", msg, ctx),
  erreur: (msg, ctx) => ecrire("erreur", msg, ctx),
};
