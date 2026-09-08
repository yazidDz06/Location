import { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, LogOut, LayoutDashboard, CarFront } from "lucide-react";
import { toast } from "react-toastify";

import { useTheme } from "./themeProvider";
import { useAuth } from "@/store/auth";
import { Bouton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const LIENS = [
  { libelle: "Nos véhicules", href: "/voitures" },
  { libelle: "Comment ça marche", href: "/#fonctionnement" },
  { libelle: "Pourquoi nous", href: "/#atouts" },
  { libelle: "Contact", href: "/#contact" },
];

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { utilisateur, deconnexion, chargement } = useAuth();
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [defile, setDefile] = useState(false);
  const navigate = useNavigate();
  const emplacement = useLocation();

  // La barre devient opaque au défilement : lisible sur toute la page sans
  // masquer le visuel d'accueil au repos.
  useEffect(() => {
    const surDefilement = () => setDefile(window.scrollY > 24);
    surDefilement();
    window.addEventListener("scroll", surDefilement, { passive: true });
    return () => window.removeEventListener("scroll", surDefilement);
  }, []);

  // Le menu mobile se referme à chaque navigation.
  useEffect(() => setMenuOuvert(false), [emplacement.pathname]);

  const seDeconnecter = async () => {
    await deconnexion();
    toast.success("À bientôt !");
    navigate("/");
  };

  const estAdmin = utilisateur?.role === "admin";

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-douce",
        defile ? "verre-fonce ombre-douce" : "bg-transparent"
      )}
    >
      <nav
        aria-label="Navigation principale"
        className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8"
      >
        <Link
          to="/"
          className="group flex items-center gap-3"
          aria-label="Prestige Auto — accueil"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--or-clair)] to-[var(--or-sombre)] ombre-or">
            <CarFront className="size-5 text-[oklch(0.17_0.014_60)]" />
          </span>
          <span className="hidden font-display text-lg tracking-tight sm:block">
            Prestige<span className="texte-or"> Auto</span>
          </span>
        </Link>

        {/* ── Liens (bureau) ── */}
        <div className="hidden items-center gap-9 lg:flex">
          {LIENS.map((lien) => (
            <Link
              key={lien.href}
              to={lien.href}
              className="group relative text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              {lien.libelle}
              <span className="absolute -bottom-1.5 left-0 h-px w-0 bg-[var(--or)] transition-all duration-300 group-hover:w-full" />
            </Link>
          ))}
        </div>

        {/* ── Actions ── */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            aria-label={theme === "dark" ? "Passer en thème clair" : "Passer en thème sombre"}
            className="grid size-10 place-items-center rounded-xl border border-border text-foreground/70 transition-douce hover:border-[var(--or)]/40 hover:text-[var(--or)]"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>

          {!chargement && (
            <div className="hidden items-center gap-3 md:flex">
              {utilisateur ? (
                <>
                  {estAdmin && (
                    <Bouton
                      variante="contour"
                      taille="sm"
                      onClick={() => navigate("/admin")}
                    >
                      <LayoutDashboard className="size-4" />
                      Tableau de bord
                    </Bouton>
                  )}
                  <Link
                    to="/mes-reservations"
                    className="text-sm text-foreground/75 transition-colors hover:text-[var(--or)]"
                  >
                    Mes réservations
                  </Link>
                  <span className="hidden text-sm text-muted-foreground lg:block">
                    {utilisateur.prenom}
                  </span>
                  <Bouton variante="fantome" taille="sm" onClick={seDeconnecter}>
                    <LogOut className="size-4" />
                  </Bouton>
                </>
              ) : (
                <>
                  <Bouton
                    variante="fantome"
                    taille="sm"
                    onClick={() => navigate("/login")}
                  >
                    Connexion
                  </Bouton>
                  <Bouton taille="sm" onClick={() => navigate("/register")}>
                    Créer un compte
                  </Bouton>
                </>
              )}
            </div>
          )}

          <button
            className="grid size-10 place-items-center rounded-xl border border-border text-foreground/70 lg:hidden"
            onClick={() => setMenuOuvert((o) => !o)}
            aria-expanded={menuOuvert}
            aria-label={menuOuvert ? "Fermer le menu" : "Ouvrir le menu"}
          >
            {menuOuvert ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* ── Menu mobile ── */}
      <AnimatePresence>
        {menuOuvert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-border verre-fonce lg:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-6">
              {LIENS.map((lien) => (
                <Link
                  key={lien.href}
                  to={lien.href}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 transition-colors hover:bg-accent"
                >
                  {lien.libelle}
                </Link>
              ))}

              <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
                {utilisateur ? (
                  <>
                    <p className="px-4 pb-2 text-sm text-muted-foreground">
                      Connecté en tant que{" "}
                      <span className="text-[var(--or)]">
                        {utilisateur.prenom} {utilisateur.nom}
                      </span>
                    </p>
                    {estAdmin && (
                      <Bouton variante="contour" onClick={() => navigate("/admin")}>
                        <LayoutDashboard className="size-4" />
                        Tableau de bord
                      </Bouton>
                    )}
                    <Bouton
                      variante="fantome"
                      onClick={() => navigate("/mes-reservations")}
                    >
                      Mes réservations
                    </Bouton>
                    <Bouton variante="danger" onClick={seDeconnecter}>
                      <LogOut className="size-4" />
                      Déconnexion
                    </Bouton>
                  </>
                ) : (
                  <>
                    <Bouton variante="contour" onClick={() => navigate("/login")}>
                      Connexion
                    </Bouton>
                    <Bouton onClick={() => navigate("/register")}>
                      Créer un compte
                    </Bouton>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
