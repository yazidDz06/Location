const { z } = require("zod");
const mongoose = require("mongoose");

/* ─────────────────────────── Briques réutilisables ──────────────────────── */

const objectId = z
  .string()
  .refine((v) => mongoose.Types.ObjectId.isValid(v), "Identifiant invalide");

/**
 * Chaîne de texte libre : longueur bornée et espaces normalisés.
 * Les bornes ne sont pas cosmétiques — sans elles, un champ « ville » peut
 * recevoir 10 Mo de texte et servir de vecteur de déni de service.
 */
const texte = (min, max, libelle) =>
  z
    .string({ required_error: `${libelle} est obligatoire` })
    .trim()
    .min(min, `${libelle} doit faire au moins ${min} caractère(s)`)
    .max(max, `${libelle} ne peut pas dépasser ${max} caractères`);

/** Nom / prénom : lettres (accents inclus), espaces, apostrophes et tirets. */
const nomPersonne = (libelle) =>
  texte(2, 50, libelle).regex(
    /^[\p{L}][\p{L}\s'’-]*$/u,
    `${libelle} contient des caractères non autorisés`
  );

const numeroTelephone = z
  .string({ required_error: "Le numéro est obligatoire" })
  .trim()
  .regex(/^\d{10}$/, "Le numéro doit contenir exactement 10 chiffres");

/**
 * Politique de mot de passe.
 * 12 caractères minimum : au-delà de la complexité, c'est la longueur qui
 * pèse le plus contre une attaque hors ligne. Le maximum de 128 évite les
 * charges utiles géantes (bcrypt tronque de toute façon à 72 octets).
 */
const motDePasse = z
  .string({ required_error: "Le mot de passe est obligatoire" })
  .min(12, "Le mot de passe doit faire au moins 12 caractères")
  .max(128, "Le mot de passe ne peut pas dépasser 128 caractères")
  .regex(/[a-z]/, "Le mot de passe doit contenir une minuscule")
  .regex(/[A-Z]/, "Le mot de passe doit contenir une majuscule")
  .regex(/\d/, "Le mot de passe doit contenir un chiffre")
  .regex(/[^A-Za-z0-9]/, "Le mot de passe doit contenir un caractère spécial");

/**
 * Date de naissance : l'âge minimum est une règle métier (location de
 * véhicule), pas seulement une validation de forme.
 */
const AGE_MINIMUM = 18;
const AGE_MAXIMUM = 100;

const dateNaissance = z
  .string({ required_error: "La date de naissance est obligatoire" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format attendu : AAAA-MM-JJ")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Date invalide")
  .refine((v) => {
    const age = (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= AGE_MINIMUM;
  }, `Vous devez avoir au moins ${AGE_MINIMUM} ans`)
  .refine((v) => {
    const age = (Date.now() - new Date(v).getTime()) / (365.25 * 24 * 3600 * 1000);
    return age <= AGE_MAXIMUM;
  }, "Date de naissance invalide");

/**
 * URL d'image : seuls http(s) sont acceptés.
 * Sans ce contrôle, un `javascript:` ou un `data:text/html` stocké en base et
 * réinjecté dans un attribut src devient un XSS stocké.
 */
const urlImage = z
  .string()
  .trim()
  .max(2000, "URL trop longue")
  .url("URL invalide")
  .refine(
    (v) => /^https?:\/\//i.test(v),
    "Seules les URL http(s) sont autorisées"
  );

/* ──────────────────────────── Utilisateurs ──────────────────────────────── */

const inscription = z
  .object({
    nom: nomPersonne("Le nom"),
    prenom: nomPersonne("Le prénom"),
    numero: numeroTelephone,
    dateNaissance,
    password: motDePasse,
  })
  .strict(); // toute clé en trop (ex. role) est rejetée

const connexion = z
  .object({
    numero: numeroTelephone,
    password: z.string().min(1, "Le mot de passe est obligatoire").max(128),
  })
  .strict();

const majProfil = z
  .object({
    nom: nomPersonne("Le nom").optional(),
    prenom: nomPersonne("Le prénom").optional(),
    numero: numeroTelephone.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, "Aucune donnée à mettre à jour");

const changementMotDePasse = z
  .object({
    ancienMotDePasse: z.string().min(1, "L'ancien mot de passe est obligatoire").max(128),
    nouveauMotDePasse: motDePasse,
  })
  .strict()
  .refine(
    (d) => d.ancienMotDePasse !== d.nouveauMotDePasse,
    "Le nouveau mot de passe doit être différent de l'ancien"
  );

/* ─────────────────────────────── Voitures ───────────────────────────────── */

const ANNEE_MIN = 1900;
const anneeMax = () => new Date().getFullYear() + 1;

const creationVoiture = z
  .object({
    marque: texte(1, 50, "La marque"),
    modele: texte(1, 50, "Le modèle"),
    annee: z.coerce
      .number()
      .int("L'année doit être un entier")
      .min(ANNEE_MIN, `L'année doit être supérieure à ${ANNEE_MIN}`)
      .max(anneeMax(), "L'année ne peut pas être dans le futur"),
    type: z.enum(["diesel", "essence", "hybride", "electrique"], {
      errorMap: () => ({ message: "Type de motorisation invalide" }),
    }),
    immatriculation: texte(4, 20, "L'immatriculation")
      .regex(/^[A-Za-z0-9-]+$/, "Immatriculation invalide")
      .transform((v) => v.toUpperCase()),
    prixParJour: z.coerce
      .number()
      .positive("Le prix doit être positif")
      .max(1_000_000, "Prix irréaliste"),
    kilometrage: z.coerce
      .number()
      .int()
      .min(0, "Le kilométrage ne peut pas être négatif")
      .max(2_000_000, "Kilométrage irréaliste")
      .default(0),
    imageUrl: urlImage.optional(),
    // `disponible` n'est volontairement pas exposé : c'est l'état métier,
    // géré par le flux de réservation, pas par le client.
  })
  .strict();

const majVoiture = z
  .object({
    marque: texte(1, 50, "La marque").optional(),
    modele: texte(1, 50, "Le modèle").optional(),
    annee: z.coerce.number().int().min(ANNEE_MIN).max(anneeMax()).optional(),
    type: z.enum(["diesel", "essence", "hybride", "electrique"]).optional(),
    prixParJour: z.coerce.number().positive().max(1_000_000).optional(),
    kilometrage: z.coerce.number().int().min(0).max(2_000_000).optional(),
    disponible: z.boolean().optional(), // réservé à l'admin (route protégée)
    imageUrl: urlImage.optional(),
  })
  .strict()
  .refine((d) => Object.keys(d).length > 0, "Aucune donnée à mettre à jour");

const filtreVoitures = z
  .object({
    marque: z.string().trim().max(50).optional(),
    type: z.enum(["diesel", "essence", "hybride", "electrique"]).optional(),
    prixMin: z.coerce.number().min(0).optional(),
    prixMax: z.coerce.number().min(0).optional(),
    disponible: z.enum(["true", "false"]).optional(),
    page: z.coerce.number().int().min(1).default(1),
    limite: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict();

/* ────────────────────────────── Réservations ────────────────────────────── */

const DUREE_MAX_JOURS = 90;
const RESERVATION_MAX_MOIS = 12;

/**
 * Ramène une date au début de sa journée (UTC).
 *
 * La location se facture au jour calendaire, pas à la milliseconde. Sans
 * cette normalisation, un départ à 09:00:00.150 et un retour à 09:00:00.000
 * quatre jours plus tard sont arrondis à 5 jours facturés — et deux
 * réservations bornées au même jour se chevauchent artificiellement.
 */
function debutDeJournee(date) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

const creationReservation = z
  .object({
    voiture: objectId,
    dateDebut: z.coerce.date({ invalid_type_error: "Date de début invalide" }),
    dateFin: z.coerce.date({ invalid_type_error: "Date de fin invalide" }),
    adresse: z
      .object({
        ville: texte(2, 80, "La ville"),
        commune: texte(2, 80, "La commune"),
        rue: texte(2, 160, "La rue"),
      })
      .strict(),
  })
  .strict()
  .superRefine((d, ctx) => {
    // Comparaison en journées : une réservation « aujourd'hui » reste valide
    // même si l'heure est déjà passée.
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    if (d.dateDebut < aujourdhui) {
      ctx.addIssue({
        code: "custom",
        path: ["dateDebut"],
        message: "La date de début ne peut pas être dans le passé",
      });
    }
    if (d.dateFin <= d.dateDebut) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFin"],
        message: "La date de fin doit être postérieure à la date de début",
      });
    }

    const jours = (d.dateFin - d.dateDebut) / (24 * 3600 * 1000);
    if (jours > DUREE_MAX_JOURS) {
      ctx.addIssue({
        code: "custom",
        path: ["dateFin"],
        message: `La durée ne peut pas dépasser ${DUREE_MAX_JOURS} jours`,
      });
    }

    const limite = new Date();
    limite.setMonth(limite.getMonth() + RESERVATION_MAX_MOIS);
    if (d.dateDebut > limite) {
      ctx.addIssue({
        code: "custom",
        path: ["dateDebut"],
        message: `Réservation possible jusqu'à ${RESERVATION_MAX_MOIS} mois à l'avance`,
      });
    }
  })
  // Normalisation en dernier : le handler et la base ne manipulent plus que
  // des journées entières, ce qui rend la facturation et la détection de
  // chevauchement déterministes.
  .transform((d) => {
    const dateDebut = debutDeJournee(d.dateDebut);
    let dateFin = debutDeJournee(d.dateFin);

    // Départ et retour le même jour : la location couvre malgré tout une
    // journée entière. Sans cet ajustement l'intervalle serait de largeur
    // nulle et échapperait à la détection de chevauchement — deux clients
    // pourraient réserver le même véhicule le même jour.
    if (dateFin.getTime() === dateDebut.getTime()) {
      dateFin = new Date(dateDebut.getTime() + 24 * 60 * 60 * 1000);
    }

    return { ...d, dateDebut, dateFin };
  });

const majStatutReservation = z
  .object({
    statut: z.enum(["en_attente", "confirmée", "terminée", "annulée"], {
      errorMap: () => ({ message: "Statut invalide" }),
    }),
  })
  .strict();

/* ─────────────────────────────── Paramètres ─────────────────────────────── */

const paramId = z.object({ id: objectId }).strict();

module.exports = {
  objectId,
  paramId,
  inscription,
  connexion,
  majProfil,
  changementMotDePasse,
  creationVoiture,
  majVoiture,
  filtreVoitures,
  creationReservation,
  majStatutReservation,
  DUREE_MAX_JOURS,
};
