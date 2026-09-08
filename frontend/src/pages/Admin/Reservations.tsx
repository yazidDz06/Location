import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { CalendarDays, MapPin, Phone, Trash2 } from "lucide-react";

import LayoutAdmin from "./LayoutAdmin";
import {
  Bouton,
  Carte,
  Chargement,
  EtatVide,
  Etiquette,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useRequete, formaterPrix, formaterDate } from "@/lib/hooks";
import type {
  Reservation,
  StatutReservation,
  Utilisateur,
  Voiture,
} from "@/lib/types";
import { cn } from "@/lib/utils";

const STATUTS: Array<{
  valeur: StatutReservation;
  libelle: string;
  ton: "or" | "succes" | "neutre" | "danger";
}> = [
  { valeur: "en_attente", libelle: "En attente", ton: "or" },
  { valeur: "confirmée", libelle: "Confirmée", ton: "succes" },
  { valeur: "terminée", libelle: "Terminée", ton: "neutre" },
  { valeur: "annulée", libelle: "Annulée", ton: "danger" },
];

export default function ReservationAdmin() {
  const { donnees, chargement, erreur, recharger } =
    useRequete<Reservation[]>("/appointments");

  const [filtre, setFiltre] = useState<StatutReservation | "tous">("tous");
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const filtrees = useMemo(() => {
    if (!donnees) return [];
    return filtre === "tous"
      ? donnees
      : donnees.filter((r) => r.statut === filtre);
  }, [donnees, filtre]);

  const changerStatut = async (
    reservation: Reservation,
    statut: StatutReservation
  ) => {
    setActionEnCours(reservation._id);
    try {
      await api.patch(`/appointments/${reservation._id}`, { statut });
      toast.success(`Réservation ${statut}`);
      recharger();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.messageComplet : "Mise à jour impossible"
      );
    } finally {
      setActionEnCours(null);
    }
  };

  const supprimer = async (reservation: Reservation) => {
    if (!confirm("Supprimer définitivement cette réservation ?")) return;

    setActionEnCours(reservation._id);
    try {
      await api.delete(`/appointments/${reservation._id}`);
      toast.success("Réservation supprimée");
      recharger();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.messageComplet : "Suppression impossible"
      );
    } finally {
      setActionEnCours(null);
    }
  };

  const compter = (statut: StatutReservation) =>
    donnees?.filter((r) => r.statut === statut).length ?? 0;

  return (
    <LayoutAdmin
      titre="Réservations"
      description={`${donnees?.length ?? 0} réservation(s) enregistrée(s)`}
    >
      {/* ── Filtres par statut ── */}
      <div
        role="group"
        aria-label="Filtrer par statut"
        className="mb-8 flex flex-wrap gap-2"
      >
        <BoutonFiltre
          actif={filtre === "tous"}
          onClick={() => setFiltre("tous")}
          libelle={`Toutes (${donnees?.length ?? 0})`}
        />
        {STATUTS.map((s) => (
          <BoutonFiltre
            key={s.valeur}
            actif={filtre === s.valeur}
            onClick={() => setFiltre(s.valeur)}
            libelle={`${s.libelle} (${compter(s.valeur)})`}
          />
        ))}
      </div>

      {chargement && <Chargement />}

      {erreur && (
        <EtatVide
          titre="Chargement impossible"
          description={erreur}
          action={<Bouton onClick={recharger}>Réessayer</Bouton>}
        />
      )}

      {!chargement && !erreur && filtrees.length === 0 && (
        <EtatVide
          titre="Aucune réservation"
          description={
            filtre === "tous"
              ? "Les réservations de vos clients apparaîtront ici."
              : "Aucune réservation dans cette catégorie."
          }
        />
      )}

      <div className="space-y-5">
        {filtrees.map((reservation, index) => {
          const client =
            typeof reservation.client === "string"
              ? null
              : (reservation.client as Utilisateur);
          const voiture =
            typeof reservation.voiture === "string"
              ? null
              : (reservation.voiture as Voiture);
          const statut = STATUTS.find((s) => s.valeur === reservation.statut);
          const occupe = actionEnCours === reservation._id;

          return (
            <motion.div
              key={reservation._id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: Math.min(index * 0.05, 0.3) }}
            >
              <Carte className="overflow-hidden">
                <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto]">
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-lg">
                          {voiture
                            ? `${voiture.marque} ${voiture.modele}`
                            : "Véhicule supprimé"}
                        </h2>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Créée le {formaterDate(reservation.createdAt)}
                          {voiture?.immatriculation &&
                            ` · ${voiture.immatriculation}`}
                        </p>
                      </div>
                      {statut && (
                        <Etiquette ton={statut.ton}>{statut.libelle}</Etiquette>
                      )}
                    </div>

                    <dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <CalendarDays className="size-4 shrink-0 text-[var(--or)]/60" />
                        {formaterDate(reservation.dateDebut)} →{" "}
                        {formaterDate(reservation.dateFin)}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 shrink-0 text-[var(--or)]/60" />
                        {reservation.adresse.rue}, {reservation.adresse.commune},{" "}
                        {reservation.adresse.ville}
                      </div>
                      {client && (
                        <>
                          <div className="text-foreground">
                            {client.prenom} {client.nom}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="size-4 shrink-0 text-[var(--or)]/60" />
                            <a
                              href={`tel:${client.numero}`}
                              className="hover:text-foreground"
                            >
                              {client.numero}
                            </a>
                          </div>
                        </>
                      )}
                    </dl>

                    <p className="font-display text-xl text-[var(--or)]">
                      {formaterPrix(reservation.prixTotal)} DA
                    </p>
                  </div>

                  {/* ── Actions ── */}
                  <div className="flex flex-col gap-2 lg:w-48">
                    <label
                      htmlFor={`statut-${reservation._id}`}
                      className="text-xs uppercase tracking-wider text-muted-foreground"
                    >
                      Changer le statut
                    </label>
                    <select
                      id={`statut-${reservation._id}`}
                      value={reservation.statut}
                      disabled={occupe}
                      onChange={(e) =>
                        changerStatut(
                          reservation,
                          e.target.value as StatutReservation
                        )
                      }
                      className="h-11 rounded-xl border border-border bg-[var(--surface)] px-3 text-sm outline-none transition-douce focus:border-[var(--or)]/60 focus:ring-4 focus:ring-[var(--or)]/12 disabled:opacity-50"
                    >
                      {STATUTS.map((s) => (
                        <option key={s.valeur} value={s.valeur}>
                          {s.libelle}
                        </option>
                      ))}
                    </select>

                    <Bouton
                      variante="danger"
                      taille="sm"
                      chargement={occupe}
                      onClick={() => supprimer(reservation)}
                    >
                      <Trash2 className="size-3.5" />
                      Supprimer
                    </Bouton>
                  </div>
                </div>
              </Carte>
            </motion.div>
          );
        })}
      </div>
    </LayoutAdmin>
  );
}

function BoutonFiltre({
  actif,
  onClick,
  libelle,
}: {
  actif: boolean;
  onClick: () => void;
  libelle: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={actif}
      className={cn(
        "rounded-lg px-4 py-2 text-xs font-medium transition-douce",
        actif
          ? "bg-[var(--or)] text-[oklch(0.17_0.014_60)]"
          : "border border-border text-muted-foreground hover:border-[var(--or)]/40 hover:text-foreground"
      )}
    >
      {libelle}
    </button>
  );
}
