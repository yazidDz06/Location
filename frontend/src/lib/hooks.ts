import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";

interface EtatRequete<T> {
  donnees: T | null;
  chargement: boolean;
  erreur: string | null;
}

/**
 * Récupération de données avec état de chargement et rechargement manuel.
 *
 * L'annulation via AbortController évite le classique « setState sur un
 * composant démonté » quand l'utilisateur navigue pendant une requête.
 */
export function useRequete<T>(chemin: string | null) {
  const [etat, setEtat] = useState<EtatRequete<T>>({
    donnees: null,
    chargement: Boolean(chemin),
    erreur: null,
  });

  const [compteur, setCompteur] = useState(0);
  const recharger = useCallback(() => setCompteur((c) => c + 1), []);

  useEffect(() => {
    if (!chemin) {
      setEtat({ donnees: null, chargement: false, erreur: null });
      return;
    }

    let annule = false;
    setEtat((prec) => ({ ...prec, chargement: true, erreur: null }));

    api
      .get<T>(chemin)
      .then((donnees) => {
        if (!annule) setEtat({ donnees, chargement: false, erreur: null });
      })
      .catch((err: unknown) => {
        if (annule) return;
        const message =
          err instanceof ApiError ? err.messageComplet : "Erreur de connexion";
        setEtat({ donnees: null, chargement: false, erreur: message });
      });

    return () => {
      annule = true;
    };
  }, [chemin, compteur]);

  return { ...etat, recharger };
}

/** Formatage monétaire local, factorisé pour rester cohérent partout. */
export function formaterPrix(montant: number): string {
  return new Intl.NumberFormat("fr-DZ", {
    maximumFractionDigits: 0,
  }).format(montant);
}

export function formaterDate(valeur: string | Date): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(valeur));
}
