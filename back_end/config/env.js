/**
 * Chargement + validation stricte des variables d'environnement.
 * Le serveur refuse de démarrer si un secret est absent ou trop faible :
 * mieux vaut un crash au boot qu'une application silencieusement non sécurisée.
 */
require("dotenv").config();
const { z } = require("zod");

// Un secret doit faire au moins 32 caractères et ne pas être une valeur d'exemple.
const SECRETS_INTERDITS = new Set([
  "secret",
  "changeme",
  "jwtsecret",
  "yazid&fr2025",
]);

const secret = (nom) =>
  z
    .string({ required_error: `${nom} est obligatoire` })
    .min(32, `${nom} doit faire au moins 32 caractères`)
    .refine((v) => !SECRETS_INTERDITS.has(v.toLowerCase()), {
      message: `${nom} utilise une valeur d'exemple : générez un secret aléatoire`,
    });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(5000),
  DB_URL: z.string().min(1, "DB_URL est obligatoire"),

  CORS_ORIGINS: z
    .string()
    .default("http://localhost:5173")
    .transform((v) => v.split(",").map((o) => o.trim()).filter(Boolean)),

  ACCESS_TOKEN_SECRET: secret("ACCESS_TOKEN_SECRET"),
  REFRESH_TOKEN_PEPPER: secret("REFRESH_TOKEN_PEPPER"),
  CSRF_SECRET: secret("CSRF_SECRET"),

  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().max(90).default(7),

  MAX_LOGIN_ATTEMPTS: z.coerce.number().int().positive().default(5),
  LOCK_DURATION_MINUTES: z.coerce.number().int().positive().default(15),

  REDIS_URL: z.string().optional(),
});

const resultat = schema.safeParse(process.env);

if (!resultat.success) {
  const details = resultat.error.issues
    .map((i) => `  • ${i.path.join(".")} : ${i.message}`)
    .join("\n");
  console.error(
    `\n❌ Configuration invalide — le serveur ne peut pas démarrer :\n${details}\n\n` +
      `   Copiez back_end/.env.example vers back_end/.env et renseignez les valeurs.\n`
  );
  process.exit(1);
}

const env = resultat.data;

// En production certains réglages permissifs deviennent des failles.
if (env.NODE_ENV === "production") {
  const origineNonSure = env.CORS_ORIGINS.some((o) => o.startsWith("http://"));
  if (origineNonSure) {
    console.error("❌ CORS_ORIGINS contient une origine http:// en production.");
    process.exit(1);
  }
}

env.estProduction = env.NODE_ENV === "production";

module.exports = env;
