/**
 * Protection contre l'injection NoSQL.
 *
 * Mongoose accepte des objets comme valeurs de requête : un corps JSON
 *   { "numero": { "$ne": null }, "password": "x" }
 * transforme User.findOne({ numero }) en « trouve n'importe quel utilisateur ».
 *
 * On retire donc toute clé commençant par « $ » ou contenant un « . »
 * (opérateurs Mongo et navigation de chemin) dans body / params / query.
 *
 * Note : on n'utilise pas express-mongo-sanitize car il réassigne req.query,
 * devenu accessible en lecture seule dans Express 5.
 */

const CLE_INTERDITE = /^\$|\./;

function nettoyer(valeur, chemin, trouvailles, profondeur = 0) {
  // Garde-fou contre les charges utiles profondément imbriquées (DoS).
  if (profondeur > 20) return null;

  if (Array.isArray(valeur)) {
    return valeur.map((v) => nettoyer(v, chemin, trouvailles, profondeur + 1));
  }

  if (valeur === null || typeof valeur !== "object") return valeur;

  // Les types natifs (Date, Buffer…) sont laissés intacts.
  if (Object.getPrototypeOf(valeur) !== Object.prototype) return valeur;

  const propre = Object.create(null);
  for (const [cle, val] of Object.entries(valeur)) {
    if (CLE_INTERDITE.test(cle) || cle === "__proto__" || cle === "constructor") {
      trouvailles.push(`${chemin}.${cle}`);
      continue;
    }
    propre[cle] = nettoyer(val, `${chemin}.${cle}`, trouvailles, profondeur + 1);
  }
  return propre;
}

function sanitize(req, _res, next) {
  const trouvailles = [];

  if (req.body && typeof req.body === "object") {
    req.body = nettoyer(req.body, "body", trouvailles);
  }
  if (req.params && typeof req.params === "object") {
    req.params = nettoyer(req.params, "params", trouvailles);
  }

  // req.query est un getter en Express 5 : on nettoie les clés en place.
  if (req.query && typeof req.query === "object") {
    for (const cle of Object.keys(req.query)) {
      if (CLE_INTERDITE.test(cle)) {
        trouvailles.push(`query.${cle}`);
        delete req.query[cle];
      }
    }
  }

  if (trouvailles.length > 0) {
    req.log?.avertir?.("Clés potentiellement malveillantes retirées", {
      cles: trouvailles,
      ip: req.ip,
    });
  }

  next();
}

module.exports = sanitize;
