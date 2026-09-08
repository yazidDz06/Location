import { create } from "zustand";
import { api, ApiError } from "@/lib/api";
import type { Utilisateur } from "@/lib/types";

/**
 * État d'authentification.
 *
 * Aucun jeton n'est stocké ici, ni dans localStorage : ils vivent uniquement
 * dans des cookies httpOnly. Ce store ne conserve que le *profil* affiché —
 * une donnée non sensible. La véritable autorisation est toujours vérifiée
 * côté serveur : ce qui est ici ne sert qu'à l'affichage.
 */
interface EtatAuth {
  utilisateur: Utilisateur | null;
  /** `true` tant que la session initiale n'a pas été vérifiée. */
  chargement: boolean;
  estAdmin: () => boolean;
  /** Vérifie la session auprès du serveur (au démarrage de l'application). */
  initialiser: () => Promise<void>;
  connexion: (numero: string, password: string) => Promise<Utilisateur>;
  inscription: (donnees: DonneesInscription) => Promise<Utilisateur>;
  deconnexion: () => Promise<void>;
  definirUtilisateur: (utilisateur: Utilisateur | null) => void;
}

export interface DonneesInscription {
  nom: string;
  prenom: string;
  numero: string;
  dateNaissance: string;
  password: string;
}

export const useAuth = create<EtatAuth>((set, get) => ({
  utilisateur: null,
  chargement: true,

  estAdmin: () => get().utilisateur?.role === "admin",

  definirUtilisateur: (utilisateur) => set({ utilisateur }),

  async initialiser() {
    try {
      const utilisateur = await api.get<Utilisateur>("/users/profile");
      set({ utilisateur, chargement: false });
    } catch (erreur) {
      // 401 au démarrage = simple visiteur non connecté, pas une anomalie.
      if (!(erreur instanceof ApiError) || erreur.statut !== 401) {
        console.error("Vérification de session impossible", erreur);
      }
      set({ utilisateur: null, chargement: false });
    }
  },

  async connexion(numero, password) {
    const { user } = await api.post<{ user: Utilisateur }>("/users/login", {
      numero,
      password,
    });
    set({ utilisateur: user, chargement: false });
    return user;
  },

  async inscription(donnees) {
    const { user } = await api.post<{ user: Utilisateur }>(
      "/users/register",
      donnees
    );
    set({ utilisateur: user, chargement: false });
    return user;
  },

  async deconnexion() {
    try {
      await api.post("/users/logout");
    } finally {
      // L'état local est vidé même si l'appel échoue : l'utilisateur ne doit
      // jamais rester affiché comme connecté après avoir cliqué « Déconnexion ».
      set({ utilisateur: null });
    }
  },
}));
