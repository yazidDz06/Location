/**
 * Client HTTP unique de l'application.
 *
 * Il centralise trois mécanismes de sécurité que chaque appel devait sinon
 * réimplémenter (et oubliait la plupart du temps) :
 *
 *  1. `credentials: "include"` — les jetons vivent dans des cookies httpOnly,
 *     inaccessibles au JavaScript, donc hors de portée d'un XSS.
 *  2. L'en-tête X-CSRF-Token, exigé par l'API sur toute écriture.
 *  3. Le rafraîchissement silencieux : sur un 401 « jeton expiré », on
 *     rafraîchit la session puis on rejoue la requête, une seule fois.
 */

const API_URL: string = import.meta.env.VITE_API_URL ?? "http://localhost:5000";

export class ApiError extends Error {
  readonly statut: number;
  readonly details?: Array<{ champ: string; message: string }>;

  constructor(
    statut: number,
    message: string,
    details?: Array<{ champ: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
    this.statut = statut;
    this.details = details;
  }

  /** Message prêt à afficher, champs de formulaire compris. */
  get messageComplet(): string {
    if (!this.details?.length) return this.message;
    return this.details.map((d) => d.message).join(" · ");
  }
}

/** Lit le cookie CSRF, que le serveur pose volontairement en clair. */
function lireCookieCsrf(): string | null {
  const trouve = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrfToken="));
  return trouve ? decodeURIComponent(trouve.slice("csrfToken=".length)) : null;
}

let amorcageCsrf: Promise<void> | null = null;

/** Garantit la présence d'un jeton CSRF, sans le demander deux fois en parallèle. */
async function assurerCsrf(): Promise<void> {
  if (lireCookieCsrf()) return;

  amorcageCsrf ??= fetch(`${API_URL}/csrf-token`, {
    credentials: "include",
  })
    .then(() => undefined)
    .finally(() => {
      amorcageCsrf = null;
    });

  await amorcageCsrf;
}

let rafraichissementEnCours: Promise<boolean> | null = null;

/**
 * Rafraîchit la session. Les appels concurrents partagent la même promesse :
 * sans cela, plusieurs requêtes expirant en même temps déclencheraient
 * plusieurs rotations, et la détection de rejeu côté serveur invaliderait
 * toute la session.
 */
async function rafraichirSession(): Promise<boolean> {
  rafraichissementEnCours ??= (async () => {
    try {
      await assurerCsrf();
      const reponse = await fetch(`${API_URL}/users/refresh`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": lireCookieCsrf() ?? "" },
      });
      return reponse.ok;
    } catch {
      return false;
    } finally {
      rafraichissementEnCours = null;
    }
  })();

  return rafraichissementEnCours;
}

type OptionsRequete = {
  methode?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  corps?: unknown;
  /** Usage interne : empêche une boucle de rafraîchissement infinie. */
  _reessaye?: boolean;
};

export async function requete<T>(
  chemin: string,
  { methode = "GET", corps, _reessaye = false }: OptionsRequete = {}
): Promise<T> {
  const modifieLEtat = methode !== "GET";
  if (modifieLEtat) await assurerCsrf();

  const entetes: Record<string, string> = {};
  if (corps !== undefined) entetes["Content-Type"] = "application/json";
  if (modifieLEtat) entetes["X-CSRF-Token"] = lireCookieCsrf() ?? "";

  const reponse = await fetch(`${API_URL}${chemin}`, {
    method: methode,
    credentials: "include", // indispensable : les cookies portent la session
    headers: entetes,
    body: corps === undefined ? undefined : JSON.stringify(corps),
  });

  if (reponse.status === 204) return undefined as T;

  const donnees = await reponse.json().catch(() => ({}));

  if (!reponse.ok) {
    // Jeton d'accès expiré : on tente une rotation puis on rejoue, une fois.
    const jetonExpire =
      reponse.status === 401 && donnees?.details?.code === "JETON_EXPIRE";

    if (jetonExpire && !_reessaye && chemin !== "/users/refresh") {
      const rafraichi = await rafraichirSession();
      if (rafraichi) {
        return requete<T>(chemin, { methode, corps, _reessaye: true });
      }
    }

    throw new ApiError(
      reponse.status,
      donnees?.message ?? "Une erreur est survenue",
      donnees?.details
    );
  }

  return donnees as T;
}

export const api = {
  get: <T>(chemin: string) => requete<T>(chemin),
  post: <T>(chemin: string, corps?: unknown) =>
    requete<T>(chemin, { methode: "POST", corps }),
  put: <T>(chemin: string, corps?: unknown) =>
    requete<T>(chemin, { methode: "PUT", corps }),
  patch: <T>(chemin: string, corps?: unknown) =>
    requete<T>(chemin, { methode: "PATCH", corps }),
  delete: <T>(chemin: string) => requete<T>(chemin, { methode: "DELETE" }),
};

export { API_URL, assurerCsrf };
