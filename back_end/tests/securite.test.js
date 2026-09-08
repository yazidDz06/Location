/**
 * Tests de sécurité — chaque cas correspond à une faille identifiée lors de
 * l'audit. Ils échouent sur le code d'origine et passent après correction :
 * c'est ce qui les rend utiles en régression.
 *
 * Exécution : npm test
 */
const test = require("node:test");
const assert = require("node:assert/strict");

const {
  demarrerBase,
  arreterBase,
  viderBase,
  creerClient,
  MOT_DE_PASSE_VALIDE,
} = require("./setup");

const request = require("supertest");
const creerApp = require("../app");
const { reinitialiserLimiteurs } = require("../middleware/rateLimit");
const User = require("../models/User");
const Voiture = require("../models/Voiture");
const Reservation = require("../models/Reservation");
const RefreshToken = require("../models/RefreshToken");

let app;

test.before(async () => {
  await demarrerBase();
  app = creerApp();
});

test.after(async () => {
  await arreterBase();
});

test.beforeEach(async () => {
  await viderBase();
  // Tous les cas s'exécutent depuis la même IP : sans remise à zéro, ils se
  // partageraient le quota et se feraient limiter les uns les autres.
  reinitialiserLimiteurs();
});

/* ────────────────────────────── Utilitaires ─────────────────────────────── */

const utilisateurValide = (extra = {}) => ({
  nom: "Khoualdi",
  prenom: "Yazid",
  numero: "0612345678",
  dateNaissance: "1998-05-12",
  password: MOT_DE_PASSE_VALIDE,
  ...extra,
});

async function inscrire(client, extra = {}) {
  await client.amorcerCsrf();
  return client.post("/users/register", utilisateurValide(extra));
}

async function creerAdmin() {
  const admin = await User.create({
    nom: "Admin",
    prenom: "Principal",
    numero: "0700000000",
    dateNaissance: new Date("1990-01-01"),
    password: MOT_DE_PASSE_VALIDE,
    role: "admin",
  });
  return admin;
}

async function connecter(client, numero, password = MOT_DE_PASSE_VALIDE) {
  await client.amorcerCsrf();
  return client.post("/users/login", { numero, password });
}

const voitureValide = (extra = {}) => ({
  marque: "Volkswagen",
  modele: "Golf 8",
  annee: 2022,
  type: "essence",
  immatriculation: "1234-ABC-16",
  prixParJour: 4500,
  kilometrage: 32000,
  imageUrl: "https://exemple.test/golf.webp",
  ...extra,
});

/* ═══════════════════════ 1. Injection NoSQL ═════════════════════════════ */

test("l'injection NoSQL dans le login est neutralisée", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const attaquant = creerClient(request, app);
  await attaquant.amorcerCsrf();

  // Sur le code d'origine, { $ne: null } faisait correspondre le premier
  // utilisateur venu et contournait la recherche par numéro.
  const reponse = await attaquant.post("/users/login", {
    numero: { $ne: null },
    password: { $ne: null },
  });

  assert.notEqual(reponse.status, 200, "l'injection ne doit jamais authentifier");
  assert.equal(reponse.status, 400, "le schéma doit rejeter un objet");
});

test("les opérateurs Mongo sont retirés des corps de requête", async () => {
  const client = creerClient(request, app);
  await client.amorcerCsrf();

  const reponse = await client.post("/users/register", {
    ...utilisateurValide(),
    $set: { role: "admin" },
  });

  // La clé « $set » est supprimée par le sanitizer, puis le schéma strict
  // valide le reste : l'inscription réussit sans élévation de privilège.
  assert.equal(reponse.status, 201);
  const cree = await User.findOne({ numero: "0612345678" });
  assert.equal(cree.role, "user");
});

/* ═══════════════ 2. Routes de réservation non protégées ═════════════════ */

test("PATCH /appointments/:id exige une authentification admin", async () => {
  const proprietaire = creerClient(request, app);
  await inscrire(proprietaire);

  const voiture = await Voiture.create(voitureValide());
  const reservation = await Reservation.create({
    client: (await User.findOne({ numero: "0612345678" }))._id,
    voiture: voiture._id,
    dateDebut: new Date(Date.now() + 86400000),
    dateFin: new Date(Date.now() + 3 * 86400000),
    prixTotal: 9000,
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  });

  // Anonyme — bloqué. C'était la faille : la route n'avait aucun middleware.
  const anonyme = creerClient(request, app);
  await anonyme.amorcerCsrf();
  const sansAuth = await anonyme.patch(`/appointments/${reservation._id}`, {
    statut: "confirmée",
  });
  assert.equal(sansAuth.status, 401);

  // Utilisateur simple — bloqué également.
  const enTantQueClient = await proprietaire.patch(
    `/appointments/${reservation._id}`,
    { statut: "confirmée" }
  );
  assert.equal(enTantQueClient.status, 403);

  const inchangee = await Reservation.findById(reservation._id);
  assert.equal(inchangee.statut, "en_attente");
});

test("DELETE /appointments/:id exige une authentification admin", async () => {
  const voiture = await Voiture.create(voitureValide());
  const utilisateur = await User.create({
    ...utilisateurValide(),
    dateNaissance: new Date("1998-05-12"),
  });
  const reservation = await Reservation.create({
    client: utilisateur._id,
    voiture: voiture._id,
    dateDebut: new Date(Date.now() + 86400000),
    dateFin: new Date(Date.now() + 3 * 86400000),
    prixTotal: 9000,
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  });

  const anonyme = creerClient(request, app);
  await anonyme.amorcerCsrf();
  const reponse = await anonyme.delete(`/appointments/${reservation._id}`);

  assert.equal(reponse.status, 401);
  assert.ok(await Reservation.findById(reservation._id), "ne doit pas être supprimée");
});

/* ═══════════════════ 3. Élévation de privilèges ═════════════════════════ */

test("un client ne peut pas s'auto-attribuer le rôle admin", async () => {
  const client = creerClient(request, app);
  await client.amorcerCsrf();

  const reponse = await client.post("/users/register", {
    ...utilisateurValide(),
    role: "admin",
  });

  // Le schéma est strict : la clé en trop fait échouer la requête.
  assert.equal(reponse.status, 400);
});

test("un client ne peut pas lister les utilisateurs", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const reponse = await client.get("/users/All");
  assert.equal(reponse.status, 403);
});

test("un client ne peut pas créer de voiture", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const reponse = await client.post("/voitures", voitureValide());
  assert.equal(reponse.status, 403);
  assert.equal(await Voiture.countDocuments(), 0);
});

/* ══════════════════════════ 4. IDOR ═════════════════════════════════════ */

test("un client ne peut pas lire la réservation d'un autre", async () => {
  const victime = await User.create({
    ...utilisateurValide({ numero: "0611111111" }),
    dateNaissance: new Date("1998-05-12"),
  });
  const voiture = await Voiture.create(voitureValide());
  const reservation = await Reservation.create({
    client: victime._id,
    voiture: voiture._id,
    dateDebut: new Date(Date.now() + 86400000),
    dateFin: new Date(Date.now() + 3 * 86400000),
    prixTotal: 9000,
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  });

  const attaquant = creerClient(request, app);
  await inscrire(attaquant, { numero: "0622222222" });

  const reponse = await attaquant.get(`/appointments/${reservation._id}`);
  // 404 et non 403 : on ne confirme pas l'existence de la ressource.
  assert.equal(reponse.status, 404);
});

test("/appointments/mes-reservations ne renvoie que les siennes", async () => {
  const autre = await User.create({
    ...utilisateurValide({ numero: "0611111111" }),
    dateNaissance: new Date("1998-05-12"),
  });
  const voiture = await Voiture.create(voitureValide());
  await Reservation.create({
    client: autre._id,
    voiture: voiture._id,
    dateDebut: new Date(Date.now() + 86400000),
    dateFin: new Date(Date.now() + 3 * 86400000),
    prixTotal: 9000,
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  });

  const client = creerClient(request, app);
  await inscrire(client, { numero: "0622222222" });

  const reponse = await client.get("/appointments/mes-reservations");
  assert.equal(reponse.status, 200);
  assert.equal(reponse.body.length, 0);
});

/* ═════════════════ 5. Refresh tokens et rotation ════════════════════════ */

test("le refresh fait tourner le jeton et invalide l'ancien", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const ancienRefresh = client.cookies.refreshToken;
  assert.ok(ancienRefresh, "un refresh token doit être posé à l'inscription");

  const reponse = await client.post("/users/refresh");
  assert.equal(reponse.status, 200);

  const nouveauRefresh = client.cookies.refreshToken;
  assert.notEqual(nouveauRefresh, ancienRefresh, "le jeton doit être renouvelé");

  // L'ancien jeton est marqué révoqué en base, pas simplement oublié.
  const total = await RefreshToken.countDocuments();
  const revoques = await RefreshToken.countDocuments({ revoqueLe: { $ne: null } });
  assert.equal(total, 2);
  assert.equal(revoques, 1);
});

test("le rejeu d'un refresh token révoque toute la famille", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const jetonVole = client.cookies.refreshToken;

  // Rotation normale : le jeton volé devient obsolète.
  await client.post("/users/refresh");
  const jetonLegitime = client.cookies.refreshToken;

  // L'attaquant rejoue le jeton volé.
  const attaquant = creerClient(request, app);
  await attaquant.amorcerCsrf();
  attaquant.cookies = { ...attaquant.cookies, refreshToken: jetonVole };
  const rejeu = await attaquant.post("/users/refresh");
  assert.equal(rejeu.status, 401, "le rejeu doit être refusé");

  // Et la victime est déconnectée aussi : on ne peut pas distinguer qui est
  // qui, donc on coupe toute la lignée.
  const victime = creerClient(request, app);
  await victime.amorcerCsrf();
  victime.cookies = { ...victime.cookies, refreshToken: jetonLegitime };
  const suite = await victime.post("/users/refresh");
  assert.equal(suite.status, 401, "toute la famille doit être révoquée");

  const actifs = await RefreshToken.countDocuments({ revoqueLe: null });
  assert.equal(actifs, 0);
});

test("la déconnexion révoque réellement le refresh token", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const jeton = client.cookies.refreshToken;
  await client.post("/users/logout");

  // Le cookie est effacé côté navigateur, mais surtout : le jeton ne vaut
  // plus rien côté serveur, même si un attaquant en détient une copie.
  const attaquant = creerClient(request, app);
  await attaquant.amorcerCsrf();
  attaquant.cookies = { ...attaquant.cookies, refreshToken: jeton };
  const reponse = await attaquant.post("/users/refresh");

  assert.equal(reponse.status, 401);
});

test("changer de mot de passe ferme les autres sessions", async () => {
  const appareilA = creerClient(request, app);
  await inscrire(appareilA);

  const appareilB = creerClient(request, app);
  await connecter(appareilB, "0612345678");
  assert.equal((await appareilB.get("/users/profile")).status, 200);

  await appareilA.patch("/users/password", {
    ancienMotDePasse: MOT_DE_PASSE_VALIDE,
    nouveauMotDePasse: "NouveauSecret!2026",
  });

  // Le jeton d'accès de B a été émis avant le changement : il est refusé.
  const profilB = await appareilB.get("/users/profile");
  assert.equal(profilB.status, 401);

  const refreshB = await appareilB.post("/users/refresh");
  assert.equal(refreshB.status, 401);
});

/* ════════════════════════════ 6. CSRF ═══════════════════════════════════ */

test("une écriture sans jeton CSRF est refusée", async () => {
  const reponse = await request(app)
    .post("/users/register")
    .send(utilisateurValide());

  assert.equal(reponse.status, 403);
  assert.match(reponse.body.message, /CSRF/i);
});

test("un jeton CSRF forgé est refusé", async () => {
  const client = creerClient(request, app);
  await client.amorcerCsrf();

  const reponse = await request(app)
    .post("/users/login")
    .set("Cookie", "csrfToken=valeur.forgee")
    .set("X-CSRF-Token", "valeur.forgee")
    .send({ numero: "0612345678", password: MOT_DE_PASSE_VALIDE });

  // La signature HMAC ne correspond pas : écrire un cookie ne suffit pas.
  assert.equal(reponse.status, 403);
});

/* ═══════════════ 7. Mots de passe et énumération ════════════════════════ */

test("un mot de passe faible est rejeté", async () => {
  const client = creerClient(request, app);
  await client.amorcerCsrf();

  for (const faible of ["123", "password", "azertyuiop", "Password1"]) {
    const reponse = await client.post(
      "/users/register",
      utilisateurValide({ password: faible })
    );
    assert.equal(reponse.status, 400, `« ${faible} » doit être refusé`);
  }
});

test("le login ne révèle pas si le compte existe", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const attaquant = creerClient(request, app);
  await attaquant.amorcerCsrf();

  const compteInconnu = await attaquant.post("/users/login", {
    numero: "0699999999",
    password: "MauvaisMotDePasse!1",
  });
  const mauvaisMotDePasse = await attaquant.post("/users/login", {
    numero: "0612345678",
    password: "MauvaisMotDePasse!1",
  });

  assert.equal(compteInconnu.status, mauvaisMotDePasse.status);
  assert.equal(compteInconnu.body.message, mauvaisMotDePasse.body.message);
});

test("le hash du mot de passe ne sort jamais de l'API", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const profil = await client.get("/users/profile");
  assert.equal(profil.status, 200);
  assert.equal(profil.body.password, undefined);

  const admin = await creerAdmin();
  const clientAdmin = creerClient(request, app);
  await connecter(clientAdmin, admin.numero);

  const tous = await clientAdmin.get("/users/All");
  assert.equal(tous.status, 200);
  for (const u of tous.body) {
    assert.equal(u.password, undefined, "aucun hash ne doit être exposé");
  }
});

test("le compte se verrouille après trop d'échecs", async () => {
  const client = creerClient(request, app);
  await inscrire(client);

  const attaquant = creerClient(request, app);
  await attaquant.amorcerCsrf();

  let derniere;
  for (let i = 0; i < 6; i += 1) {
    derniere = await attaquant.post("/users/login", {
      numero: "0612345678",
      password: `Tentative!${i}xyz`,
    });
  }

  assert.equal(derniere.status, 423, "le compte doit être verrouillé");

  // Même le bon mot de passe est refusé pendant le verrouillage.
  const avecBonMotDePasse = await attaquant.post("/users/login", {
    numero: "0612345678",
    password: MOT_DE_PASSE_VALIDE,
  });
  assert.equal(avecBonMotDePasse.status, 423);
});

test("le brute-force est bloqué par la limitation de débit", async () => {
  const attaquant = creerClient(request, app);
  await attaquant.amorcerCsrf();

  // Le limiteur d'authentification autorise 10 tentatives par fenêtre.
  const statuts = [];
  for (let i = 0; i < 14; i += 1) {
    const reponse = await attaquant.post("/users/login", {
      numero: "0655555555",
      password: `Tentative!${i}xyz`,
    });
    statuts.push(reponse.status);
  }

  assert.ok(
    statuts.includes(429),
    "les tentatives répétées doivent finir par être limitées"
  );
  assert.equal(statuts.at(-1), 429, "la limitation doit persister sur la fenêtre");
});

/* ══════════════════ 8. Validation des données ═══════════════════════════ */

test("un mineur ne peut pas s'inscrire", async () => {
  const client = creerClient(request, app);
  await client.amorcerCsrf();

  const dateMineur = new Date();
  dateMineur.setFullYear(dateMineur.getFullYear() - 15);

  const reponse = await client.post(
    "/users/register",
    utilisateurValide({ dateNaissance: dateMineur.toISOString().slice(0, 10) })
  );

  assert.equal(reponse.status, 400);
});

test("les dates de réservation incohérentes sont rejetées", async () => {
  const voiture = await Voiture.create(voitureValide());
  const client = creerClient(request, app);
  await inscrire(client);

  const base = {
    voiture: voiture._id.toString(),
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  };

  const casInvalides = [
    // Date de fin avant la date de début.
    { dateDebut: "2027-06-10", dateFin: "2027-06-01" },
    // Réservation dans le passé.
    { dateDebut: "2020-01-01", dateFin: "2020-01-05" },
    // Durée supérieure au plafond métier.
    { dateDebut: "2027-01-01", dateFin: "2027-12-01" },
  ];

  for (const dates of casInvalides) {
    const reponse = await client.post("/appointments", { ...base, ...dates });
    assert.equal(reponse.status, 400, `dates invalides : ${JSON.stringify(dates)}`);
  }

  assert.equal(await Reservation.countDocuments(), 0);
});

test("le prix total est calculé par le serveur, pas envoyé par le client", async () => {
  const voiture = await Voiture.create(voitureValide({ prixParJour: 5000 }));
  const client = creerClient(request, app);
  await inscrire(client);

  const debut = new Date(Date.now() + 86400000);
  const fin = new Date(Date.now() + 3 * 86400000);

  const reponse = await client.post("/appointments", {
    voiture: voiture._id.toString(),
    dateDebut: debut.toISOString(),
    dateFin: fin.toISOString(),
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
    prixTotal: 1, // tentative de fixer son propre prix
  });

  // Le champ en trop est rejeté par le schéma strict.
  assert.equal(reponse.status, 400);

  const propre = await client.post("/appointments", {
    voiture: voiture._id.toString(),
    dateDebut: debut.toISOString(),
    dateFin: fin.toISOString(),
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  });

  assert.equal(propre.status, 201);
  assert.equal(propre.body.prixTotal, 10000, "2 jours × 5000");
});

test("la facturation se fait au jour calendaire, pas à la milliseconde", async () => {
  const voiture = await Voiture.create(voitureValide({ prixParJour: 5000 }));
  const client = creerClient(request, app);
  await inscrire(client);

  // Les deux dates sont construites à quelques millisecondes d'intervalle :
  // l'écart dépasse très légèrement 4 jours pleins. Sans normalisation,
  // Math.ceil facture un 5ᵉ jour.
  const debut = new Date(Date.now() + 20 * 86400000).toISOString();
  const fin = new Date(Date.now() + 24 * 86400000).toISOString();

  const reponse = await client.post("/appointments", {
    voiture: voiture._id.toString(),
    dateDebut: debut,
    dateFin: fin,
    adresse: { ville: "Alger", commune: "Hydra", rue: "Rue des Frères" },
  });

  assert.equal(reponse.status, 201);
  assert.equal(reponse.body.jours, 4, "4 jours calendaires, pas 5");
  assert.equal(reponse.body.prixTotal, 20000, "4 jours × 5000");
});

test("deux locations le même jour ne peuvent pas se cumuler", async () => {
  const voiture = await Voiture.create(voitureValide());

  const premier = creerClient(request, app);
  await inscrire(premier, { numero: "0611111111" });
  const second = creerClient(request, app);
  await inscrire(second, { numero: "0622222222" });

  const jour = new Date(Date.now() + 15 * 86400000);
  const matin = new Date(jour);
  matin.setUTCHours(9, 0, 0, 0);
  const soir = new Date(jour);
  soir.setUTCHours(18, 0, 0, 0);

  const base = {
    voiture: voiture._id.toString(),
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  };

  const a = await premier.post("/appointments", {
    ...base,
    dateDebut: matin.toISOString(),
    dateFin: soir.toISOString(),
  });
  assert.equal(a.status, 201);
  assert.equal(a.body.jours, 1, "une location du jour compte pour 1 jour");

  // Le même créneau, le même jour : l'intervalle normalisé se chevauche.
  const b = await second.post("/appointments", {
    ...base,
    dateDebut: matin.toISOString(),
    dateFin: soir.toISOString(),
  });
  assert.equal(b.status, 409, "le second doit être refusé");
});

test("une URL d'image javascript: est rejetée", async () => {
  const admin = await creerAdmin();
  const client = creerClient(request, app);
  await connecter(client, admin.numero);

  const reponse = await client.post(
    "/voitures",
    voitureValide({ imageUrl: "javascript:alert(document.cookie)" })
  );

  assert.equal(reponse.status, 400);
});

test("les champs surdimensionnés sont refusés", async () => {
  const client = creerClient(request, app);
  await client.amorcerCsrf();

  const reponse = await client.post(
    "/users/register",
    utilisateurValide({ nom: "A".repeat(5000) })
  );

  assert.equal(reponse.status, 400);
});

/* ══════════════════ 9. Double réservation ═══════════════════════════════ */

test("un véhicule ne peut pas être réservé deux fois sur la même période", async () => {
  const voiture = await Voiture.create(voitureValide());

  const premier = creerClient(request, app);
  await inscrire(premier, { numero: "0611111111" });

  const second = creerClient(request, app);
  await inscrire(second, { numero: "0622222222" });

  const dates = {
    voiture: voiture._id.toString(),
    dateDebut: new Date(Date.now() + 86400000).toISOString(),
    dateFin: new Date(Date.now() + 5 * 86400000).toISOString(),
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  };

  const a = await premier.post("/appointments", dates);
  assert.equal(a.status, 201);

  // Chevauchement partiel : doit être refusé aussi.
  const b = await second.post("/appointments", {
    ...dates,
    dateDebut: new Date(Date.now() + 3 * 86400000).toISOString(),
    dateFin: new Date(Date.now() + 8 * 86400000).toISOString(),
  });
  assert.equal(b.status, 409);

  assert.equal(await Reservation.countDocuments(), 1);
});

test("deux réservations sur des périodes disjointes sont acceptées", async () => {
  const voiture = await Voiture.create(voitureValide());

  const premier = creerClient(request, app);
  await inscrire(premier, { numero: "0611111111" });
  const second = creerClient(request, app);
  await inscrire(second, { numero: "0622222222" });

  const base = {
    voiture: voiture._id.toString(),
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare" },
  };

  const a = await premier.post("/appointments", {
    ...base,
    dateDebut: new Date(Date.now() + 86400000).toISOString(),
    dateFin: new Date(Date.now() + 3 * 86400000).toISOString(),
  });
  const b = await second.post("/appointments", {
    ...base,
    dateDebut: new Date(Date.now() + 10 * 86400000).toISOString(),
    dateFin: new Date(Date.now() + 12 * 86400000).toISOString(),
  });

  assert.equal(a.status, 201);
  assert.equal(b.status, 201, "une réservation à une autre date doit passer");
});

/* ═════════════ 10. En-têtes et fuites d'information ═════════════════════ */

test("les en-têtes de sécurité sont présents", async () => {
  const reponse = await request(app).get("/health");

  assert.equal(reponse.headers["x-powered-by"], undefined);
  assert.ok(reponse.headers["x-content-type-options"]);
  assert.ok(reponse.headers["content-security-policy"]);
  assert.equal(reponse.headers["x-frame-options"], "SAMEORIGIN");
});

test("une erreur serveur ne fuite pas de détails internes", async () => {
  const reponse = await request(app).get("/voitures/identifiant-invalide");

  assert.equal(reponse.status, 400);
  assert.equal(reponse.body.stack, undefined);
  // Aucun message de driver Mongo ne doit transparaître.
  assert.doesNotMatch(JSON.stringify(reponse.body), /ObjectId|mongoose|MongoServer/i);
});

test("une origine CORS non autorisée est refusée", async () => {
  const reponse = await request(app)
    .get("/voitures")
    .set("Origin", "https://site-malveillant.test");

  assert.equal(reponse.headers["access-control-allow-origin"], undefined);
});
