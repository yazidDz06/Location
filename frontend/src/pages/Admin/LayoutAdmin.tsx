import { Link, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Car, CalendarCheck, LogOut, CarFront } from "lucide-react";
import { toast } from "react-toastify";

import { useAuth } from "@/store/auth";
import { Bouton } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const ENTREES = [
  { libelle: "Vue d'ensemble", href: "/admin", icone: LayoutDashboard },
  { libelle: "Véhicules", href: "/admin/voitures", icone: Car },
  { libelle: "Réservations", href: "/admin/reservations", icone: CalendarCheck },
];

/** Coquille commune aux pages d'administration : barre latérale + en-tête. */
export default function LayoutAdmin({
  titre,
  description,
  actions,
  children,
}: {
  titre: string;
  description?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const emplacement = useLocation();
  const navigate = useNavigate();
  const { utilisateur, deconnexion } = useAuth();

  const seDeconnecter = async () => {
    await deconnexion();
    toast.success("Session administrateur fermée");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      {/* ── Barre latérale ── */}
      <aside className="border-b border-border bg-[var(--surface)] lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col gap-6 p-5">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--or-clair)] to-[var(--or-sombre)]">
              <CarFront className="size-4.5 text-[oklch(0.17_0.014_60)]" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-sm">
                Prestige<span className="texte-or"> Auto</span>
              </p>
              <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                Administration
              </p>
            </div>
          </Link>

          <nav className="flex gap-1 overflow-x-auto lg:flex-1 lg:flex-col lg:overflow-visible">
            {ENTREES.map((entree) => {
              const actif = emplacement.pathname === entree.href;
              return (
                <Link
                  key={entree.href}
                  to={entree.href}
                  aria-current={actif ? "page" : undefined}
                  className={cn(
                    "flex shrink-0 items-center gap-3 rounded-xl px-4 py-3 text-sm transition-douce",
                    actif
                      ? "bg-[var(--or)]/12 font-medium text-[var(--or)]"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <entree.icone className="size-4" />
                  {entree.libelle}
                </Link>
              );
            })}
          </nav>

          <div className="hidden space-y-3 border-t border-border pt-5 lg:block">
            <p className="px-1 text-xs text-muted-foreground">
              Connecté :{" "}
              <span className="text-foreground">
                {utilisateur?.prenom} {utilisateur?.nom}
              </span>
            </p>
            <Bouton
              variante="fantome"
              taille="sm"
              className="w-full justify-start"
              onClick={seDeconnecter}
            >
              <LogOut className="size-4" />
              Déconnexion
            </Bouton>
          </div>
        </div>
      </aside>

      {/* ── Contenu ── */}
      <div className="min-w-0 flex-1">
        <header className="border-b border-border px-6 py-8 sm:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl interligne-titre">{titre}</h1>
              {description && (
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions}
          </div>
        </header>

        <main className="px-6 py-8 sm:px-10">{children}</main>
      </div>
    </div>
  );
}
