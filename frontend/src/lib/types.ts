export type Motorisation = "diesel" | "essence" | "hybride" | "electrique";

export type StatutReservation =
  | "en_attente"
  | "confirmée"
  | "terminée"
  | "annulée";

export interface Utilisateur {
  id: string;
  nom: string;
  prenom: string;
  numero: string;
  role: "admin" | "user";
  dateNaissance?: string;
}

export interface Voiture {
  _id: string;
  marque: string;
  modele: string;
  annee: number;
  type: Motorisation;
  immatriculation: string;
  prixParJour: number;
  kilometrage: number;
  imageUrl?: string;
  horsService?: boolean;
  /** Calculé par le serveur à partir des réservations en cours. */
  disponible: boolean;
}

export interface Adresse {
  ville: string;
  commune: string;
  rue: string;
}

export interface Reservation {
  _id: string;
  client: Utilisateur | string;
  voiture: Voiture | string;
  adresse: Adresse;
  dateDebut: string;
  dateFin: string;
  prixTotal: number;
  statut: StatutReservation;
  createdAt: string;
}

export interface Periode {
  dateDebut: string;
  dateFin: string;
}

export interface Session {
  _id: string;
  createdAt: string;
  expireLe: string;
  adresseIp?: string;
  agentUtilisateur?: string;
}
