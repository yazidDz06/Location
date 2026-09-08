const { ZodError } = require("zod");
const ApiError = require("../utils/ApiError");

/**
 * Valide body / params / query contre des schémas Zod.
 *
 * Point clé : on *remplace* req.body par la valeur parsée. Les schémas étant
 * stricts (clés inconnues rejetées) et typés, les handlers ne voient plus que
 * des données de forme garantie — ce qui coupe à la racine l'affectation en
 * masse (« mass assignment ») : un client ne peut pas glisser role:"admin"
 * ou disponible:true dans un corps de requête.
 */
function validate(schemas) {
  return (req, _res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body ?? {});
      if (schemas.params) req.params = schemas.params.parse(req.params ?? {});
      if (schemas.query) {
        // req.query est en lecture seule sous Express 5 : on expose le résultat
        // validé sous req.donneesQuery.
        req.donneesQuery = schemas.query.parse(req.query ?? {});
      }
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return next(
          ApiError.requeteInvalide(
            "Données invalides",
            err.issues.map((i) => ({
              champ: i.path.join(".") || "(racine)",
              message: i.message,
            }))
          )
        );
      }
      next(err);
    }
  };
}

module.exports = validate;
