import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ArrowLeft, CarFront } from "lucide-react";

import { useAuth } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { Bouton, Champ } from "@/components/ui/primitives";

export default function Login() {
  const navigate = useNavigate();
  const emplacement = useLocation();
  const { connexion } = useAuth();

  const [numero, setNumero] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setEnvoi(true);

    try {
      const utilisateur = await connexion(numero.trim(), password);
      toast.success(`Bienvenue, ${utilisateur.prenom} !`);

      // Retour à la page demandée avant la redirection vers la connexion.
      const destination =
        (emplacement.state as { depuis?: string } | null)?.depuis ??
        (utilisateur.role === "admin" ? "/admin" : "/voitures");
      navigate(destination, { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.messageComplet
          : "Connexion impossible. Vérifiez votre réseau.";
      setErreur(message);
      toast.error(message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* ── Panneau visuel (bureau) ── */}
      <aside className="grain relative hidden overflow-hidden bg-[var(--surface)] lg:block">
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-24 size-[30rem] rounded-full bg-[var(--or)]/12 blur-[110px]"
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
              Reprenez la route
              <span className="texte-or italic"> là où vous l'aviez laissée</span>
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Retrouvez vos réservations, vos véhicules favoris et vos
              préférences de livraison.
            </p>
          </div>

          <p className="text-xs tracking-wide text-muted-foreground">
            © {new Date().getFullYear()} Prestige Auto
          </p>
        </div>
      </aside>

      {/* ── Formulaire ── */}
      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md space-y-8"
        >
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[var(--or)]"
          >
            <ArrowLeft className="size-4" />
            Retour à l'accueil
          </Link>

          <div className="space-y-2">
            <h1 className="text-4xl">Connexion</h1>
            <p className="text-muted-foreground">
              Heureux de vous revoir parmi nous.
            </p>
          </div>

          <form onSubmit={soumettre} className="space-y-5" noValidate>
            <Champ
              libelle="Numéro de téléphone"
              name="numero"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0612345678"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />

            <Champ
              libelle="Mot de passe"
              name="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {erreur && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-4 py-3 text-sm text-[var(--destructive)]"
              >
                {erreur}
              </div>
            )}

            <Bouton type="submit" taille="lg" chargement={envoi} className="w-full">
              {envoi ? "Connexion…" : "Se connecter"}
            </Bouton>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{" "}
            <Link
              to="/register"
              className="font-medium text-[var(--or)] hover:underline"
            >
              Inscrivez-vous
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
