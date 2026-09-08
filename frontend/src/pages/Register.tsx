import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ArrowLeft, CarFront, Check, X } from "lucide-react";

import { useAuth } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { Bouton, Champ } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

/**
 * Règles de mot de passe — copie exacte de celles du serveur
 * (back_end/validation/schemas.js).
 *
 * Ce contrôle est un confort d'utilisation, pas une sécurité : le serveur
 * revalide systématiquement. Il évite simplement un aller-retour réseau pour
 * une erreur évidente.
 */
const REGLES = [
  { libelle: "12 caractères minimum", test: (v: string) => v.length >= 12 },
  { libelle: "Une minuscule", test: (v: string) => /[a-z]/.test(v) },
  { libelle: "Une majuscule", test: (v: string) => /[A-Z]/.test(v) },
  { libelle: "Un chiffre", test: (v: string) => /\d/.test(v) },
  { libelle: "Un caractère spécial", test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

const VIDE = {
  nom: "",
  prenom: "",
  numero: "",
  dateNaissance: "",
  password: "",
};

export default function Register() {
  const navigate = useNavigate();
  const { inscription } = useAuth();

  const [donnees, setDonnees] = useState(VIDE);
  const [confirmation, setConfirmation] = useState("");
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);

  const changer = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDonnees((prec) => ({ ...prec, [name]: value }));
    setErreurs((prec) => ({ ...prec, [name]: "" }));
  };

  const reglesValidees = useMemo(
    () => REGLES.map((regle) => ({ ...regle, ok: regle.test(donnees.password) })),
    [donnees.password]
  );

  /** Âge maximal atteignable aujourd'hui : borne le sélecteur de date. */
  const dateMaximale = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().slice(0, 10);
  }, []);

  const valider = () => {
    const nouvelles: Record<string, string> = {};

    if (donnees.nom.trim().length < 2) nouvelles.nom = "Nom trop court";
    if (donnees.prenom.trim().length < 2) nouvelles.prenom = "Prénom trop court";
    if (!/^\d{10}$/.test(donnees.numero.trim()))
      nouvelles.numero = "Le numéro doit contenir exactement 10 chiffres";
    if (!donnees.dateNaissance)
      nouvelles.dateNaissance = "Date de naissance requise";
    else if (donnees.dateNaissance > dateMaximale)
      nouvelles.dateNaissance = "Vous devez avoir au moins 18 ans";
    if (reglesValidees.some((r) => !r.ok))
      nouvelles.password = "Le mot de passe ne respecte pas toutes les règles";
    if (donnees.password !== confirmation)
      nouvelles.confirmation = "Les mots de passe ne correspondent pas";

    setErreurs(nouvelles);
    return Object.keys(nouvelles).length === 0;
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valider()) return;

    setEnvoi(true);
    try {
      const utilisateur = await inscription({
        ...donnees,
        nom: donnees.nom.trim(),
        prenom: donnees.prenom.trim(),
        numero: donnees.numero.trim(),
      });
      toast.success(`Bienvenue, ${utilisateur.prenom} !`);
      navigate("/voitures", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.messageComplet
          : "Inscription impossible. Vérifiez votre réseau.";
      setErreurs({ global: message });
      toast.error(message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="grain relative hidden overflow-hidden bg-[var(--surface)] lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -right-24 size-[30rem] rounded-full bg-[var(--or)]/12 blur-[110px]"
        />
        <div className="relative z-10 flex h-full flex-col justify-between p-14">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--or-clair)] to-[var(--or-sombre)]">
              <CarFront className="size-5 text-[oklch(0.17_0.014_60)]" />
            </span>
            <span className="font-display text-lg">
              Prestige<span className="texte-or"> Auto</span>
            </span>
          </Link>

          <div className="max-w-md space-y-6">
            <h2 className="interligne-titre text-5xl">
              Rejoignez une
              <span className="texte-or italic"> autre idée</span> de la location
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Un compte suffit pour réserver, suivre vos locations et faire
              livrer votre véhicule où vous le souhaitez.
            </p>
          </div>

          <p className="text-xs tracking-wide text-muted-foreground">
            © {new Date().getFullYear()} Prestige Auto
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-lg space-y-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[var(--or)]"
          >
            <ArrowLeft className="size-4" />
            Retour à l'accueil
          </Link>

          <div className="space-y-2">
            <h1 className="text-4xl">Créer un compte</h1>
            <p className="text-muted-foreground">
              Quelques informations et vous êtes prêt à réserver.
            </p>
          </div>

          <form onSubmit={soumettre} className="space-y-5" noValidate>
            <div className="grid gap-5 sm:grid-cols-2">
              <Champ
                libelle="Nom"
                name="nom"
                autoComplete="family-name"
                placeholder="Khoualdi"
                value={donnees.nom}
                onChange={changer}
                erreur={erreurs.nom}
              />
              <Champ
                libelle="Prénom"
                name="prenom"
                autoComplete="given-name"
                placeholder="Yazid"
                value={donnees.prenom}
                onChange={changer}
                erreur={erreurs.prenom}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <Champ
                libelle="Téléphone"
                name="numero"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="0612345678"
                value={donnees.numero}
                onChange={changer}
                erreur={erreurs.numero}
              />
              <Champ
                libelle="Date de naissance"
                name="dateNaissance"
                type="date"
                max={dateMaximale}
                value={donnees.dateNaissance}
                onChange={changer}
                erreur={erreurs.dateNaissance}
                indice="18 ans minimum"
              />
            </div>

            <Champ
              libelle="Mot de passe"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={donnees.password}
              onChange={changer}
              erreur={erreurs.password}
            />

            {/* Retour visuel en direct : l'utilisateur voit ce qu'il lui reste
                à corriger au lieu de découvrir l'erreur à la soumission. */}
            {donnees.password.length > 0 && (
              <ul className="grid gap-2 rounded-xl border border-border bg-[var(--surface)] p-4 sm:grid-cols-2">
                {reglesValidees.map((regle) => (
                  <li
                    key={regle.libelle}
                    className={cn(
                      "flex items-center gap-2 text-xs transition-colors",
                      regle.ok ? "text-[var(--succes)]" : "text-muted-foreground"
                    )}
                  >
                    {regle.ok ? (
                      <Check className="size-3.5 shrink-0" />
                    ) : (
                      <X className="size-3.5 shrink-0 opacity-45" />
                    )}
                    {regle.libelle}
                  </li>
                ))}
              </ul>
            )}

            <Champ
              libelle="Confirmer le mot de passe"
              name="confirmation"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••••••"
              value={confirmation}
              onChange={(e) => {
                setConfirmation(e.target.value);
                setErreurs((p) => ({ ...p, confirmation: "" }));
              }}
              erreur={erreurs.confirmation}
            />

            {erreurs.global && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-4 py-3 text-sm text-[var(--destructive)]"
              >
                {erreurs.global}
              </div>
            )}

            <Bouton type="submit" taille="lg" chargement={envoi} className="w-full">
              {envoi ? "Création…" : "Créer mon compte"}
            </Bouton>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Déjà inscrit ?{" "}
            <Link to="/login" className="font-medium text-[var(--or)] hover:underline">
              Connectez-vous
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
