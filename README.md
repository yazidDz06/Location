# Prestige Auto — plateforme de location de véhicules

Application full-stack de location automobile : catalogue public, réservation
client et back-office d'administration.

**Stack** — React 19 · TypeScript · Vite · Tailwind CSS v4 · Zustand ·
Express 5 · MongoDB (Mongoose) · Zod · JWT

---

## Démarrage rapide

### Sans MongoDB installé

```bash
cd back_end
npm install
npm run dev:memoire     # MongoDB en mémoire + jeu de démonstration
```

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur <http://localhost:5173>.

Comptes de démonstration (affichés au démarrage) :

| Rôle   | Numéro       | Mot de passe          |
| ------ | ------------ | --------------------- |
| Admin  | `0700000000` | `Demo!Motdepasse2026` |
| Client | `0611223344` | `Demo!Motdepasse2026` |

### Avec une instance MongoDB

```bash
cd back_end
cp .env.example .env
# Générer chaque secret :
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
npm run seed            # jeu de données + identifiants générés aléatoirement
npm start
```

### Tests

```bash
cd back_end && npm test   # 32 tests de sécurité
```

---

## Sécurité

Le projet a fait l'objet d'un audit puis d'une reprise complète. Chaque
correction ci-dessous est couverte par un test dans
[`back_end/tests/securite.test.js`](back_end/tests/securite.test.js).

### Failles corrigées

| Faille | Gravité | Correction |
| --- | --- | --- |
| `.env` versionné (JWT_SECRET en clair dans l'historique) | **Critique** | Retiré du suivi git, `.gitignore` ajouté, secrets régénérés |
| `PATCH` / `DELETE /appointments/:id` sans authentification | **Critique** | `authMiddleware` + `adminMiddleware` |
| Injection NoSQL sur `findOne({ numero })` | **Critique** | Sanitizer des opérateurs `$`/`.` + schémas Zod stricts |
| Aucune limitation de débit (brute-force) | Élevée | `express-rate-limit` + verrouillage de compte |
| JWT 24 h non révocable, déconnexion sans effet | Élevée | Jeton d'accès 15 min + refresh token rotatif révocable |
| Absence de politique de mot de passe | Élevée | 12 caractères, 4 classes, bcrypt coût 12 |
| Aucune protection CSRF | Élevée | Double soumission signée par HMAC |
| Énumération d'utilisateurs au login | Moyenne | Message unique + comparaison bcrypt à temps constant |
| Fuite d'erreurs internes (`error.message`, traces) | Moyenne | Gestionnaire central, messages génériques en production |
| IDOR sur les réservations | Moyenne | Contrôle de propriété, `404` au lieu de `403` |
| Élévation de privilèges (`role` dans le corps) | Moyenne | Schémas `.strict()`, rôle imposé côté serveur |
| Double réservation (course sur `disponible`) | Moyenne | Détection de chevauchement + « insérer puis vérifier » |
| Absence d'en-têtes de sécurité | Moyenne | `helmet` (CSP, HSTS, nosniff…) |
| Corps de requête non borné | Moyenne | Limite à 100 ko |
| XSS stocké via `imageUrl` | Moyenne | URL restreintes à `http(s)` |
| Aucune validation d'âge | Faible | 18 ans minimum |

### Mécanismes mis en place

**Jetons et sessions**

- Jeton d'accès JWT de 15 minutes, en cookie `httpOnly` (hors de portée d'un XSS).
- Refresh token **opaque** (256 bits), stocké **haché** (HMAC-SHA-256 + pepper).
- **Rotation** à chaque usage : l'ancien jeton est révoqué immédiatement.
- **Détection de rejeu** : un jeton déjà rotationné qui réapparaît révoque
  toute la famille de jetons — attaquant et victime sont déconnectés.
- Le cookie de refresh est limité au chemin `/users/refresh` : il n'accompagne
  pas les appels ordinaires.
- Purge automatique des jetons expirés (index TTL MongoDB).
- Un changement de mot de passe invalide toutes les sessions existantes.

**Validation**

Chaque route valide `body`, `params` et `query` avec Zod. Les schémas sont
`.strict()` : toute clé inattendue fait échouer la requête, ce qui neutralise
l'affectation en masse. Les handlers ne manipulent que des données de forme
garantie.

**Défense en profondeur**

`helmet` · CORS en liste blanche · limitation de débit par route ·
verrouillage de compte · journalisation masquant les champs sensibles ·
arrêt propre du serveur · échec au démarrage si un secret est absent ou faible.

### Points restants pour une mise en production

- Servir l'API en **HTTPS** (`secure`/`sameSite=none` s'activent alors seuls).
- Store de limitation **partagé** (Redis) si plusieurs instances tournent.
- L'ancien `JWT_SECRET` reste dans l'historique git : purger l'historique
  (`git filter-repo`) si le dépôt a été public.
- Ajouter la rotation des journaux et une supervision des `429`/`423`.

---

## Architecture

```
back_end/
  app.js               Construction de l'application Express
  server.js            Démarrage, arrêt propre
  config/env.js        Validation stricte de l'environnement
  middleware/          auth, admin, csrf, rateLimit, sanitize, validate, errors
  models/              User, Voiture, Reservation, RefreshToken, Avis
  routes/              users, voitures, appointments
  services/            tokenService (émission, rotation, révocation)
  validation/          Schémas Zod
  scripts/             seed, dev:memoire
  tests/               32 tests de sécurité

frontend/
  src/lib/api.ts       Client HTTP : CSRF, cookies, refresh silencieux
  src/store/auth.ts    État d'authentification (Zustand)
  src/components/      Navbar, RouteProtegee, primitives d'interface
  src/pages/           Accueil, catalogue, réservation, espace client
  src/pages/Admin/     Tableau de bord, véhicules, réservations
```

### Points d'attention côté front

- Aucun jeton en `localStorage` : tout passe par des cookies `httpOnly`.
- Le client HTTP rafraîchit la session automatiquement sur `401` puis rejoue
  la requête, une seule fois. Les rafraîchissements concurrents partagent une
  même promesse, sinon la détection de rejeu couperait la session.
- Les gardes de navigation (`RouteProtegee`) relèvent de l'ergonomie : la
  seule autorisation qui fait foi est celle du serveur.

---

## API

| Méthode | Route | Accès |
| --- | --- | --- |
| `GET` | `/csrf-token` | Public |
| `GET` | `/health` | Public |
| `POST` | `/users/register` | Public |
| `POST` | `/users/login` | Public |
| `POST` | `/users/refresh` | Cookie de refresh |
| `POST` | `/users/logout` | Public |
| `POST` | `/users/logout-all` | Authentifié |
| `GET` | `/users/profile` | Authentifié |
| `GET` | `/users/sessions` | Authentifié |
| `PATCH` | `/users/profile` | Authentifié |
| `PATCH` | `/users/password` | Authentifié |
| `GET` | `/users/All` | Admin |
| `DELETE` | `/users/:id` | Admin |
| `GET` | `/voitures` | Public |
| `GET` | `/voitures/:id` | Public |
| `GET` | `/voitures/:id/indisponibilites` | Public |
| `POST` | `/voitures` | Admin |
| `PUT` | `/voitures/:id` | Admin |
| `DELETE` | `/voitures/:id` | Admin |
| `POST` | `/appointments` | Authentifié |
| `GET` | `/appointments/mes-reservations` | Authentifié |
| `GET` | `/appointments/:id` | Propriétaire ou admin |
| `PATCH` | `/appointments/:id/annuler` | Propriétaire |
| `GET` | `/appointments` | Admin |
| `PATCH` | `/appointments/:id` | Admin |
| `DELETE` | `/appointments/:id` | Admin |

Toute méthode autre que `GET`/`HEAD`/`OPTIONS` exige l'en-tête `X-CSRF-Token`.

---

## Design

Thème « obsidienne & or » : fond nuit profonde, or chaud en accent, verre
dépoli, typographie éditoriale (Playfair Display + Outfit). Thèmes clair et
sombre pilotés par jetons CSS, animations `framer-motion` respectant
`prefers-reduced-motion`.
