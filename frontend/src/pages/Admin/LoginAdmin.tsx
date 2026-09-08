import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ShieldCheck, ArrowLeft } from "lucide-react";

import { useAuth } from "@/store/auth";
import { ApiError } from "@/lib/api";
import { Bouton, Carte, Champ } from "@/components/ui/primitives";

export default function LoginAdmin() {
  const navigate = useNavigate();
  const { connexion, deconnexion } = useAuth();

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

      // Le compte est valide mais n'a pas le rôle attendu : on referme la
      // session ouverte plutôt que de laisser un client connecté ici.
      if (utilisateur.role !== "admin") {
        await deconnexion();
        setErreur("Ce compte ne dispose pas des droits d'administration.");
        return;
      }

      toast.success("Bienvenue dans l'espace administrateur");
      navigate("/admin", { replace: true });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.messageComplet
          : "Connexion impossible. Vérifiez votre réseau.";
      setErreur(message);
    } finally {
      setEnvoi(false);
    }
  };

  return (
    <div className="grain relative grid min-h-screen place-items-center overflow-hidden px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 size-[34rem] -translate-x-1/2 rounded-full bg-[var(--or)]/10 blur-[120px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md space-y-6"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[var(--or)]"
        >
          <ArrowLeft className="size-4" />
          Retour au site
        </Link>

        <Carte className="filet-or overflow-hidden">
          <div className="space-y-7 p-8">
            <div className="space-y-3 text-center">
              <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[var(--or)]/10 text-[var(--or)]">
                <ShieldCheck className="size-6" />
              </span>
              <h1 className="text-3xl">Espace administrateur</h1>
              <p className="text-sm text-muted-foreground">
                Accès réservé à l'équipe de gestion.
              </p>
            </div>

            <form onSubmit={soumettre} className="space-y-5" noValidate>
              <Champ
                libelle="Numéro de téléphone"
                name="numero"
                type="tel"
                inputMode="numeric"
                autoComplete="username"
                placeholder="0700000000"
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
                {envoi ? "Connexion…" : "Accéder au tableau de bord"}
              </Bouton>
            </form>
          </div>
        </Carte>
      </motion.div>
    </div>
  );
}
