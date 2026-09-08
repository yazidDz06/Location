import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Fuel, Gauge, Calendar, Search, SlidersHorizontal } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import {
  EtatVide,
  Etiquette,
  Bouton,
  TitreSection,
  Squelette,
} from "@/components/ui/primitives";
import { useRequete, formaterPrix } from "@/lib/hooks";
import type { Voiture, Motorisation } from "@/lib/types";
import { cn } from "@/lib/utils";

const MOTORISATIONS: Array<{ valeur: Motorisation | "tous"; libelle: string }> = [
  { valeur: "tous", libelle: "Toutes" },
  { valeur: "essence", libelle: "Essence" },
  { valeur: "diesel", libelle: "Diesel" },
  { valeur: "hybride", libelle: "Hybride" },
  { valeur: "electrique", libelle: "Électrique" },
];

export default function CarsList() {
  const navigate = useNavigate();
  const { donnees: voitures, chargement, erreur } = useRequete<Voiture[]>("/voitures");

  const [recherche, setRecherche] = useState("");
  const [motorisation, setMotorisation] = useState<Motorisation | "tous">("tous");
  const [seulementDisponibles, setSeulementDisponibles] = useState(false);

  // Le filtrage est local : le catalogue est déjà chargé, inutile de
  // solliciter le serveur à chaque frappe.
  const filtrees = useMemo(() => {
    if (!voitures) return [];
    const terme = recherche.trim().toLowerCase();

    return voitures.filter((v) => {
      const correspond =
        !terme ||
        `${v.marque} ${v.modele}`.toLowerCase().includes(terme);
      const bonneMotorisation =
        motorisation === "tous" || v.type === motorisation;
      const bonneDisponibilite = !seulementDisponibles || v.disponible;
      return correspond && bonneMotorisation && bonneDisponibilite;
    });
  }, [voitures, recherche, motorisation, seulementDisponibles]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
        <TitreSection
          surtitre="Notre flotte"
          titre={
            <>
              Choisissez votre
              <span className="texte-or italic"> compagnon de route</span>
            </>
          }
          description="Des citadines agiles aux berlines de prestige, chaque véhicule est préparé et livré chez vous."
        />

        {/* ── Filtres ── */}
        <div className="mt-12 flex flex-col gap-4 rounded-2xl border border-border bg-[var(--surface)] p-5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une marque ou un modèle…"
              aria-label="Rechercher un véhicule"
              className="h-12 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition-douce placeholder:text-muted-foreground/60 focus:border-[var(--or)]/60 focus:ring-4 focus:ring-[var(--or)]/12"
            />
          </div>

          <div
            role="group"
            aria-label="Filtrer par motorisation"
            className="flex flex-wrap items-center gap-2"
          >
            <SlidersHorizontal className="mr-1 size-4 text-muted-foreground" />
            {MOTORISATIONS.map((m) => (
              <button
                key={m.valeur}
                onClick={() => setMotorisation(m.valeur)}
                aria-pressed={motorisation === m.valeur}
                className={cn(
                  "rounded-lg px-3.5 py-2 text-xs font-medium transition-douce",
                  motorisation === m.valeur
                    ? "bg-[var(--or)] text-[oklch(0.17_0.014_60)]"
                    : "border border-border text-muted-foreground hover:border-[var(--or)]/40 hover:text-foreground"
                )}
              >
                {m.libelle}
              </button>
            ))}
          </div>

          <label className="flex cursor-pointer items-center gap-2.5 text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={seulementDisponibles}
              onChange={(e) => setSeulementDisponibles(e.target.checked)}
              className="size-4 accent-[var(--or)]"
            />
            Disponibles uniquement
          </label>
        </div>

        {/* ── Résultats ── */}
        {chargement && (
          <div className="mt-10 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-3">
                <Squelette className="aspect-16/10 w-full" />
                <Squelette className="h-5 w-2/3" />
                <Squelette className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        )}

        {erreur && (
          <EtatVide
            titre="Impossible de charger le catalogue"
            description={erreur}
            action={
              <Bouton onClick={() => window.location.reload()}>Réessayer</Bouton>
            }
          />
        )}

        {!chargement && !erreur && filtrees.length === 0 && (
          <EtatVide
            titre="Aucun véhicule ne correspond"
            description="Essayez d'élargir vos critères de recherche."
            action={
              <Bouton
                variante="contour"
                onClick={() => {
                  setRecherche("");
                  setMotorisation("tous");
                  setSeulementDisponibles(false);
                }}
              >
                Réinitialiser les filtres
              </Bouton>
            }
          />
        )}

        {!chargement && filtrees.length > 0 && (
          <>
            <p className="mt-10 text-sm text-muted-foreground">
              {filtrees.length} véhicule{filtrees.length > 1 ? "s" : ""} disponible
              {filtrees.length > 1 ? "s" : ""}
            </p>

            <div className="mt-6 grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {filtrees.map((voiture, index) => (
                <CarteVoiture
                  key={voiture._id}
                  voiture={voiture}
                  index={index}
                  onOuvrir={() => navigate(`/voitures/${voiture._id}`)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}

/* ════════════════════════════ Carte véhicule ════════════════════════════ */

function CarteVoiture({
  voiture,
  index,
  onOuvrir,
}: {
  voiture: Voiture;
  index: number;
  onOuvrir: () => void;
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        duration: 0.55,
        // Décalage plafonné : au-delà, les dernières cartes traînent.
        delay: Math.min(index * 0.06, 0.4),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group overflow-hidden rounded-2xl border border-border bg-[var(--card)] transition-douce hover:-translate-y-2 hover:border-[var(--or)]/35 hover:ombre-portee"
    >
      <div className="relative aspect-16/10 overflow-hidden bg-muted">
        {voiture.imageUrl ? (
          <img
            src={voiture.imageUrl}
            alt={`${voiture.marque} ${voiture.modele}`}
            loading="lazy"
            className="size-full object-cover transition-transform duration-[900ms] group-hover:scale-110"
          />
        ) : (
          <div className="grid size-full place-items-center text-sm text-muted-foreground">
            Photo à venir
          </div>
        )}

        <div className="absolute left-4 top-4">
          <Etiquette ton={voiture.disponible ? "succes" : "danger"}>
            <span
              className={cn(
                "size-1.5 rounded-full",
                voiture.disponible
                  ? "bg-[var(--succes)] pulsation"
                  : "bg-[var(--destructive)]"
              )}
            />
            {voiture.disponible ? "Disponible" : "Réservée"}
          </Etiquette>
        </div>
      </div>

      <div className="space-y-4 p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-lg">
              {voiture.marque} {voiture.modele}
            </h3>
            <p className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">
              {voiture.type}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="font-display text-xl text-[var(--or)]">
              {formaterPrix(voiture.prixParJour)}
            </p>
            <p className="text-[0.7rem] text-muted-foreground">DA / jour</p>
          </div>
        </div>

        <dl className="flex flex-wrap gap-x-5 gap-y-2 border-t border-border-subtile pt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="size-3.5 text-[var(--or)]/60" />
            {voiture.annee}
          </div>
          <div className="flex items-center gap-1.5">
            <Gauge className="size-3.5 text-[var(--or)]/60" />
            {formaterPrix(voiture.kilometrage)} km
          </div>
          <div className="flex items-center gap-1.5 capitalize">
            <Fuel className="size-3.5 text-[var(--or)]/60" />
            {voiture.type}
          </div>
        </dl>

        <Bouton
          onClick={onOuvrir}
          variante={voiture.disponible ? "or" : "contour"}
          className="w-full"
        >
          {voiture.disponible ? "Réserver" : "Voir le détail"}
        </Bouton>
      </div>
    </motion.article>
  );
}
