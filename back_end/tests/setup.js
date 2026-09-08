/**
 * Environnement de test : une instance MongoDB en mémoire, isolée, jetée à la
 * fin. Les secrets sont fixés ici pour que config/env valide sans dépendre
 * d'un .env local.
 */
process.env.NODE_ENV = "test";
process.env.ACCESS_TOKEN_SECRET = "secret-de-test-uniquement-32-caracteres-minimum-aaa";
process.env.REFRESH_TOKEN_PEPPER = "pepper-de-test-uniquement-32-caracteres-minimum-bbb";
process.env.CSRF_SECRET = "csrf-de-test-uniquement-32-caracteres-minimum-ccc";
process.env.DB_URL = "mongodb://127.0.0.1:27017/test";
process.env.MAX_LOGIN_ATTEMPTS = "5";
process.env.LOCK_DURATION_MINUTES = "15";

const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let serveurMongo;

async function demarrerBase() {
  serveurMongo = await MongoMemoryServer.create();
  await mongoose.connect(serveurMongo.getUri());
}

async function arreterBase() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await serveurMongo.stop();
}

async function viderBase() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

/* ─────────────────────────── Aides de requête ───────────────────────────── */

const MOT_DE_PASSE_VALIDE = "MotDePasse!2026";

/** Extrait les cookies d'une réponse supertest sous forme d'objet. */
function lireCookies(reponse) {
  const brut = reponse.headers["set-cookie"] || [];
  const cookies = {};
  for (const ligne of brut) {
    const [paire] = ligne.split(";");
    const index = paire.indexOf("=");
    cookies[paire.slice(0, index)] = paire.slice(index + 1);
  }
  return cookies;
}

/**
 * Client minimal qui conserve les cookies entre les appels et renvoie
 * automatiquement l'en-tête CSRF — comme le ferait le vrai navigateur.
 */
function creerClient(request, app) {
  let cookies = {};

  const enteteCookie = () =>
    Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");

  const memoriser = (reponse) => {
    Object.assign(cookies, lireCookies(reponse));
    return reponse;
  };

  const envoyer = async (methode, chemin, corps) => {
    let req = request(app)[methode](chemin).set("Cookie", enteteCookie());
    if (cookies.csrfToken) req = req.set("X-CSRF-Token", cookies.csrfToken);
    if (corps !== undefined) req = req.send(corps);
    return memoriser(await req);
  };

  return {
    get cookies() {
      return cookies;
    },
    set cookies(valeur) {
      cookies = valeur;
    },
    async amorcerCsrf() {
      return memoriser(await request(app).get("/csrf-token"));
    },
    get: (chemin) => envoyer("get", chemin),
    post: (chemin, corps) => envoyer("post", chemin, corps),
    put: (chemin, corps) => envoyer("put", chemin, corps),
    patch: (chemin, corps) => envoyer("patch", chemin, corps),
    delete: (chemin, corps) => envoyer("delete", chemin, corps),
  };
}

module.exports = {
  demarrerBase,
  arreterBase,
  viderBase,
  lireCookies,
  creerClient,
  MOT_DE_PASSE_VALIDE,
};
