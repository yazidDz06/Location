/**
 * Démarrage sans MongoDB installé : une instance en mémoire est lancée, puis
 * peuplée avec le jeu de démonstration.
 *
 *   npm run dev:memoire
 *
 * Pratique pour faire tourner le projet immédiatement (démo, portfolio, CI).
 * Les données disparaissent à l'arrêt du processus.
 */
const { MongoMemoryServer } = require("mongodb-memory-server");

async function demarrer() {
  const serveurMongo = await MongoMemoryServer.create();
  const uri = serveurMongo.getUri();

  // Doit être défini avant le chargement de config/env, qui lit process.env.
  process.env.DB_URL = uri;
  console.log(`→ MongoDB en mémoire : ${uri}`);

  const mongoose = require("mongoose");
  const env = require("../config/env");
  const logger = require("../utils/logger");
  const creerApp = require("../app");

  const User = require("../models/User");
  const Voiture = require("../models/Voiture");
  const Reservation = require("../models/Reservation");

  await mongoose.connect(uri);

  // Identifiants fixes ici, et uniquement ici : cette base est éphémère,
  // isolée et jamais exposée. Le seed de production en génère d'aléatoires.
  const MOT_DE_PASSE = "Demo!Motdepasse2026";

  const admin = await User.create({
    nom: "Khoualdi",
    prenom: "Yazid",
    numero: "0700000000",
    dateNaissance: new Date("1998-05-12"),
    password: MOT_DE_PASSE,
    role: "admin",
  });

  const client = await User.create({
    nom: "Benali",
    prenom: "Amina",
    numero: "0611223344",
    dateNaissance: new Date("1995-09-24"),
    password: MOT_DE_PASSE,
    role: "user",
  });

  const voitures = await Voiture.insertMany([
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
  ]);

  await Reservation.create({
    client: client._id,
    voiture: voitures[1]._id,
    dateDebut: new Date(Date.now() + 3 * 86400000),
    dateFin: new Date(Date.now() + 7 * 86400000),
    prixTotal: voitures[1].prixParJour * 4,
    statut: "confirmée",
    adresse: { ville: "Béjaïa", commune: "El-Kseur", rue: "Rue de la Gare, 12" },
  });

  const app = creerApp();
  app.listen(env.PORT, () => {
    logger.info(`Serveur (mémoire) démarré sur le port ${env.PORT}`);
    console.log(`
╔═══════════════════════════════════════════════════════╗
║  Comptes de démonstration                             ║
╠═══════════════════════════════════════════════════════╣
║  ADMIN   ${admin.numero}   ${MOT_DE_PASSE}   ║
║  CLIENT  ${client.numero}   ${MOT_DE_PASSE}   ║
╚═══════════════════════════════════════════════════════╝
`);
  });

  const arreter = async () => {
    await mongoose.disconnect();
    await serveurMongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", arreter);
  process.on("SIGTERM", arreter);
}

demarrer().catch((erreur) => {
  console.error("Démarrage impossible :", erreur);
  process.exit(1);
});
