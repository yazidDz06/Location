import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { Car, Users, CalendarCheck, TrendingUp, Trash2 } from "lucide-react";

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
import { useAuth } from "@/store/auth";
import type { Utilisateur, Voiture, Reservation } from "@/lib/types";

export default function Dashboard() {
  const navigate = useNavigate();
  const { utilisateur: moi } = useAuth();

  const voitures = useRequete<Voiture[]>("/voitures");
  const utilisateurs = useRequete<Utilisateur[]>("/users/All");
  const reservations = useRequete<Reservation[]>("/appointments");

  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);

  const chargement =
    voitures.chargement || utilisateurs.chargement || reservations.chargement;

  const revenus =
    reservations.donnees
      ?.filter((r) => r.statut !== "annulée")
      .reduce((total, r) => total + r.prixTotal, 0) ?? 0;

  const enAttente =
    reservations.donnees?.filter((r) => r.statut === "en_attente").length ?? 0;

  const supprimerUtilisateur = async (cible: Utilisateur) => {
    if (
      !confirm(
        `Supprimer définitivement le compte de ${cible.prenom} ${cible.nom} ?`
      )
    )
      return;

    setSuppressionEnCours(cible.id);
    try {
      await api.delete(`/users/${cible.id}`);
      toast.success("Utilisateur supprimé");
      utilisateurs.recharger();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.messageComplet : "Suppression impossible"
      );
    } finally {
      setSuppressionEnCours(null);
    }
  };

  const statistiques = [
    {
      libelle: "Véhicules",
      valeur: voitures.donnees?.length ?? 0,
      icone: Car,
      href: "/admin/voitures",
    },
    {
      libelle: "Clients inscrits",
      valeur: utilisateurs.donnees?.length ?? 0,
      icone: Users,
    },
    {
      libelle: "Réservations",
      valeur: reservations.donnees?.length ?? 0,
      icone: CalendarCheck,
      href: "/admin/reservations",
      badge: enAttente > 0 ? `${enAttente} en attente` : undefined,
    },
    {
      libelle: "Chiffre d'affaires",
      valeur: `${formaterPrix(revenus)} DA`,
      icone: TrendingUp,
    },
  ];

  return (
    <LayoutAdmin
      titre="Vue d'ensemble"
      description="L'activité de votre agence en un coup d'œil."
    >
      {chargement ? (
        <Chargement />
      ) : (
        <div className="space-y-10">
          {/* ── Statistiques ── */}
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {statistiques.map((stat, index) => (
              <motion.div
                key={stat.libelle}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
              >
                <Carte
                  onClick={stat.href ? () => navigate(stat.href) : undefined}
                  className={cnStat(Boolean(stat.href))}
                >
                  <div className="flex items-start justify-between">
                    <span className="grid size-11 place-items-center rounded-xl bg-[var(--or)]/10 text-[var(--or)]">
                      <stat.icone className="size-5" />
                    </span>
                    {stat.badge && <Etiquette ton="or">{stat.badge}</Etiquette>}
                  </div>
                  <p className="mt-5 font-display text-3xl">{stat.valeur}</p>
                  <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
                    {stat.libelle}
                  </p>
                </Carte>
              </motion.div>
            ))}
          </div>

          {/* ── Utilisateurs ── */}
          <Carte className="overflow-hidden">
            <div className="border-b border-border px-6 py-5">
              <h2 className="text-xl">Clients inscrits</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {utilisateurs.donnees?.length ?? 0} compte(s) enregistré(s)
              </p>
            </div>

            {utilisateurs.erreur ? (
              <EtatVide titre="Chargement impossible" description={utilisateurs.erreur} />
            ) : utilisateurs.donnees?.length === 0 ? (
              <EtatVide titre="Aucun client inscrit" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[42rem] text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
                      <th className="px-6 py-4 font-medium">Nom</th>
                      <th className="px-6 py-4 font-medium">Téléphone</th>
                      <th className="px-6 py-4 font-medium">Naissance</th>
                      <th className="px-6 py-4 font-medium">Rôle</th>
                      <th className="px-6 py-4 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {utilisateurs.donnees?.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border-subtile last:border-0 transition-colors hover:bg-accent/40"
                      >
                        <td className="px-6 py-4">
                          {u.prenom} {u.nom}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {u.numero}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {u.dateNaissance ? formaterDate(u.dateNaissance) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <Etiquette ton={u.role === "admin" ? "or" : "neutre"}>
                            {u.role}
                          </Etiquette>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {/* L'API refuse aussi qu'un admin se supprime :
                              on masque simplement le bouton pour l'annoncer. */}
                          {u.id === moi?.id ? (
                            <span className="text-xs text-muted-foreground">
                              Vous
                            </span>
                          ) : (
                            <Bouton
                              variante="danger"
                              taille="sm"
                              chargement={suppressionEnCours === u.id}
                              onClick={() => supprimerUtilisateur(u)}
                            >
                              <Trash2 className="size-3.5" />
                              Supprimer
                            </Bouton>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </div>
      )}
    </LayoutAdmin>
  );
}

/** Classe d'une tuile de statistique, cliquable ou non. */
function cnStat(cliquable: boolean) {
  return [
    "p-6 h-full",
    cliquable &&
      "cursor-pointer transition-douce hover:-translate-y-1 hover:border-[var(--or)]/35 hover:ombre-portee",
  ]
    .filter(Boolean)
    .join(" ");
}
