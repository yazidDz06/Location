/**
 * Jeu de données de démonstration.
 *
 *   node scripts/seed.js
 *
 * Le mot de passe administrateur n'est pas codé en dur : il est lu depuis
 * SEED_ADMIN_PASSWORD, ou généré aléatoirement et affiché une seule fois.
 * Un identifiant par défaut du type « admin/admin » présent dans un dépôt
 * public est l'une des portes d'entrée les plus exploitées.
 */
const crypto = require("crypto");
const mongoose = require("mongoose");

const env = require("./../config/env");
const User = require("../models/User");
const Voiture = require("../models/Voiture");
const Reservation = require("../models/Reservation");
const RefreshToken = require("../models/RefreshToken");

const VOITURES = [
  {
    marque: "Volkswagen",
    modele: "Golf 8 GTI",
    annee: 2023,
    type: "essence",
    immatriculation: "1234-ABC-16",
    prixParJour: 6500,
    kilometrage: 18000,
    imageUrl:
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?w=1200&q=80",
  },
  {
    marque: "Mercedes-Benz",
    modele: "Classe C 220d",
    annee: 2022,
    type: "diesel",
    immatriculation: "5678-DEF-16",
    prixParJour: 12000,
    kilometrage: 42000,
    imageUrl:
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=1200&q=80",
  },
  {
    marque: "Audi",
    modele: "A4 Avant",
    annee: 2021,
    type: "diesel",
    immatriculation: "9012-GHI-16",
    prixParJour: 10500,
    kilometrage: 61000,
    imageUrl:
      "https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?w=1200&q=80",
  },
  {
    marque: "Toyota",
    modele: "Corolla Hybride",
    annee: 2023,
    type: "hybride",
    immatriculation: "3456-JKL-16",
    prixParJour: 7000,
    kilometrage: 12500,
    imageUrl:
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?w=1200&q=80",
  },
  {
    marque: "Renault",
    modele: "Clio V",
    annee: 2022,
    type: "essence",
    immatriculation: "7890-MNO-16",
    prixParJour: 3800,
    kilometrage: 34000,
    imageUrl:
      "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?w=1200&q=80",
  },
  {
    marque: "BMW",
    modele: "Série 3 330e",
    annee: 2023,
    type: "hybride",
    immatriculation: "2468-PQR-16",
    prixParJour: 14000,
    kilometrage: 9800,
    imageUrl:
      "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=1200&q=80",
  },
];

/** Mot de passe aléatoire respectant la politique de validation. */
function motDePasseAleatoire() {
  const base = crypto.randomBytes(12).toString("base64url");
  return `Aa1!${base}`;
}

async function seed() {
  await mongoose.connect(env.DB_URL);
  console.log("→ Connecté à MongoDB");

  await Promise.all([
    User.deleteMany({}),
    Voiture.deleteMany({}),
    Reservation.deleteMany({}),
    RefreshToken.deleteMany({}),
  ]);
  console.log("→ Collections vidées");

  const motDePasseAdmin =
    process.env.SEED_ADMIN_PASSWORD || motDePasseAleatoire();
  const motDePasseClient =
    process.env.SEED_USER_PASSWORD || motDePasseAleatoire();

  const admin = await User.create({
    nom: "Khoualdi",
    prenom: "Yazid",
    numero: "0700000000",
    dateNaissance: new Date("1998-05-12"),
    password: motDePasseAdmin, // haché par le hook pre('save')
    role: "admin",
  });

  const client = await User.create({
    nom: "Benali",
    prenom: "Amina",
    numero: "0611223344",
    dateNaissance: new Date("1995-09-24"),
    password: motDePasseClient,
    role: "user",
  });

  const voitures = await Voiture.insertMany(VOITURES);

  // Une réservation d'exemple, à venir, pour peupler le tableau de bord.
  const dans3Jours = new Date(Date.now() + 3 * 86400000);
  const dans7Jours = new Date(Date.now() + 7 * 86400000);

  await Reservation.create({
    client: client._id,
    voiture: voitures[0]._id,
    dateDebut: dans3Jours,
    dateFin: dans7Jours,
    prixTotal: voitures[0].prixParJour * 4,
    statut: "confirmée",
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare, 12" },
  });

  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  Données de démonstration créées                             ║
╠══════════════════════════════════════════════════════════════╣
║  ${voitures.length} véhicules · 2 comptes · 1 réservation                    ║
╠══════════════════════════════════════════════════════════════╣
║  ADMIN    numéro : ${admin.numero}                            ║
║           mot de passe : ${motDePasseAdmin}
║                                                              ║
║  CLIENT   numéro : ${client.numero}                            ║
║           mot de passe : ${motDePasseClient}
╠══════════════════════════════════════════════════════════════╣
║  Notez ces mots de passe : ils ne seront plus affichés.      ║
╚══════════════════════════════════════════════════════════════╝
`);

  await mongoose.disconnect();
}

seed().catch(async (erreur) => {
  console.error("Échec du peuplement :", erreur.message);
  await mongoose.disconnect();
  process.exit(1);
});
