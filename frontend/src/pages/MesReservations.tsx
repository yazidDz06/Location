import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { CalendarDays, MapPin, Car } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import {
  Bouton,
  Carte,
  Chargement,
  EtatVide,
  Etiquette,
  TitreSection,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useRequete, formaterPrix, formaterDate } from "@/lib/hooks";
import type { Reservation, StatutReservation, Voiture } from "@/lib/types";

const TONS: Record<
  StatutReservation,
  { ton: "or" | "succes" | "danger" | "neutre"; libelle: string }
> = {
  en_attente: { ton: "or", libelle: "En attente" },
  confirmée: { ton: "succes", libelle: "Confirmée" },
  terminée: { ton: "neutre", libelle: "Terminée" },
  annulée: { ton: "danger", libelle: "Annulée" },
};

export default function MesReservations() {
  const navigate = useNavigate();
  const { donnees, chargement, erreur, recharger } =
    useRequete<Reservation[]>("/appointments/mes-reservations");
  const [annulationEnCours, setAnnulationEnCours] = useState<string | null>(null);

  const annuler = async (reservation: Reservation) => {
    if (!confirm("Confirmer l'annulation de cette réservation ?")) return;

    setAnnulationEnCours(reservation._id);
    try {
      await api.patch(`/appointments/${reservation._id}/annuler`);
      toast.success("Réservation annulée");
      recharger();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.messageComplet : "Annulation impossible"
      );
    } finally {
      setAnnulationEnCours(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-14 sm:px-8">
        <TitreSection
          surtitre="Votre espace"
          titre={
            <>
              Mes <span className="texte-or italic">réservations</span>
            </>
          }
          description="Retrouvez l'historique et le suivi de toutes vos locations."
        />

        <div className="mt-12 space-y-5">
          {chargement && <Chargement />}

          {erreur && (
            <EtatVide
              titre="Chargement impossible"
              description={erreur}
              action={<Bouton onClick={recharger}>Réessayer</Bouton>}
            />
          )}

          {!chargement && !erreur && donnees?.length === 0 && (
            <EtatVide
              titre="Aucune réservation pour le moment"
              description="Parcourez notre flotte et réservez votre premier véhicule."
              action={
                <Bouton onClick={() => navigate("/voitures")}>
                  Découvrir la flotte
                </Bouton>
              }
            />
          )}

          {donnees?.map((reservation, index) => {
            // `voiture` est peuplée par le serveur, mais reste typée comme
            // pouvant être un simple identifiant.
            const voiture =
              typeof reservation.voiture === "string"
                ? null
                : (reservation.voiture as Voiture);
            const statut = TONS[reservation.statut];
            const annulable = ["en_attente", "confirmée"].includes(
              reservation.statut
            );

            return (
              <motion.div
                key={reservation._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: Math.min(index * 0.07, 0.35) }}
              >
                <Carte className="overflow-hidden transition-douce hover:border-[var(--or)]/30">
                  <div className="flex flex-col gap-6 p-6 sm:flex-row">
                    <div className="size-28 shrink-0 overflow-hidden rounded-xl bg-muted">
                      {voiture?.imageUrl ? (
                        <img
                          src={voiture.imageUrl}
                          alt={`${voiture.marque} ${voiture.modele}`}
                          className="size-full object-cover"
                        />
                      ) : (
                        <div className="grid size-full place-items-center">
                          <Car className="size-7 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h2 className="text-lg">
                            {voiture
                              ? `${voiture.marque} ${voiture.modele}`
                              : "Véhicule retiré du catalogue"}
                          </h2>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Réservée le {formaterDate(reservation.createdAt)}
                          </p>
                        </div>
                        <Etiquette ton={statut.ton}>{statut.libelle}</Etiquette>
                      </div>

                      <dl className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="size-4 text-[var(--or)]/60" />
                          {formaterDate(reservation.dateDebut)} →{" "}
                          {formaterDate(reservation.dateFin)}
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="size-4 text-[var(--or)]/60" />
                          {reservation.adresse.commune}, {reservation.adresse.ville}
                        </div>
                      </dl>

                      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border-subtile pt-4">
                        <p className="font-display text-xl text-[var(--or)]">
                          {formaterPrix(reservation.prixTotal)} DA
                        </p>

                        {annulable && (
                          <Bouton
                            variante="contour"
                            taille="sm"
                            chargement={annulationEnCours === reservation._id}
                            onClick={() => annuler(reservation)}
                          >
                            Annuler
                          </Bouton>
                        )}
                      </div>
                    </div>
                  </div>
                </Carte>
              </motion.div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
