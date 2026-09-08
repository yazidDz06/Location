import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Gauge,
  Fuel,
  ShieldCheck,
  Truck,
  Headphones,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import {
  Bouton,
  Carte,
  Chargement,
  EtatVide,
  Etiquette,
} from "@/components/ui/primitives";
import { useRequete, formaterPrix, formaterDate } from "@/lib/hooks";
import { useAuth } from "@/store/auth";
import type { Voiture, Periode } from "@/lib/types";

const GARANTIES = [
  { icone: ShieldCheck, texte: "Assurance tous risques incluse" },
  { icone: Truck, texte: "Livraison à votre adresse sous 24 h" },
  { icone: Headphones, texte: "Assistance routière 24/7" },
];

export default function VoitureDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { utilisateur } = useAuth();

  const { donnees: voiture, chargement, erreur } = useRequete<Voiture>(
    id ? `/voitures/${id}` : null
  );
  const { donnees: indisponibilites } = useRequete<Periode[]>(
    id ? `/voitures/${id}/indisponibilites` : null
  );

  const reserver = () => {
    // Un visiteur non connecté est envoyé vers la connexion, avec mémorisation
    // de la page voulue pour y revenir juste après.
    if (!utilisateur) {
      navigate("/login", { state: { depuis: `/reservation/${id}` } });
      return;
    }
    navigate(`/reservation/${id}`);
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Chargement message="Chargement du véhicule…" />
      </div>
    );
  }

  if (erreur || !voiture) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <EtatVide
          titre="Véhicule introuvable"
          description={erreur ?? "Ce véhicule n'existe plus ou a été retiré."}
          action={<Bouton onClick={() => navigate("/voitures")}>Voir la flotte</Bouton>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <Link
          to="/voitures"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[var(--or)]"
        >
          <ArrowLeft className="size-4" />
          Retour à la flotte
        </Link>

        <div className="mt-8 grid gap-10 lg:grid-cols-[1.35fr_1fr]">
          {/* ── Visuel ── */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border bg-muted ombre-portee">
              {voiture.imageUrl ? (
                <img
                  src={voiture.imageUrl}
                  alt={`${voiture.marque} ${voiture.modele}`}
                  className="aspect-16/10 w-full object-cover"
                />
              ) : (
                <div className="grid aspect-16/10 w-full place-items-center text-muted-foreground">
                  Photo à venir
                </div>
              )}

              <div className="absolute left-5 top-5">
                <Etiquette ton={voiture.disponible ? "succes" : "danger"}>
                  {voiture.disponible ? "Disponible maintenant" : "Actuellement louée"}
                </Etiquette>
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { icone: Calendar, libelle: "Année", valeur: String(voiture.annee) },
                {
                  icone: Gauge,
                  libelle: "Kilométrage",
                  valeur: `${formaterPrix(voiture.kilometrage)} km`,
                },
                { icone: Fuel, libelle: "Motorisation", valeur: voiture.type },
              ].map((carac) => (
                <Carte key={carac.libelle} className="p-5">
                  <carac.icone className="mb-3 size-5 text-[var(--or)]" />
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">
                    {carac.libelle}
                  </p>
                  <p className="mt-1 capitalize">{carac.valeur}</p>
                </Carte>
              ))}
            </div>

            {/* Périodes déjà prises */}
            {indisponibilites && indisponibilites.length > 0 && (
              <Carte className="p-6">
                <h2 className="mb-4 text-lg">Périodes déjà réservées</h2>
                <ul className="flex flex-wrap gap-2">
                  {indisponibilites.map((periode, i) => (
                    <li key={i}>
                      <Etiquette ton="attention">
                        {formaterDate(periode.dateDebut)} →{" "}
                        {formaterDate(periode.dateFin)}
                      </Etiquette>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-xs text-muted-foreground">
                  Choisissez des dates en dehors de ces périodes.
                </p>
              </Carte>
            )}
          </motion.div>

          {/* ── Panneau de réservation ── */}
          <motion.aside
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <Carte className="filet-or overflow-hidden">
              <div className="space-y-6 p-7">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--or)]">
                    {voiture.marque}
                  </p>
                  <h1 className="mt-2 text-3xl interligne-titre">
                    {voiture.modele}
                  </h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Immatriculation {voiture.immatriculation}
                  </p>
                </div>

                <div className="flex items-baseline gap-2 border-y border-border-subtile py-5">
                  <span className="font-display text-4xl text-[var(--or)]">
                    {formaterPrix(voiture.prixParJour)}
                  </span>
                  <span className="text-sm text-muted-foreground">DA / jour</span>
                </div>

                <ul className="space-y-3">
                  {GARANTIES.map((g) => (
                    <li
                      key={g.texte}
                      className="flex items-center gap-3 text-sm text-muted-foreground"
                    >
                      <g.icone className="size-4 shrink-0 text-[var(--or)]" />
                      {g.texte}
                    </li>
                  ))}
                </ul>

                <Bouton
                  taille="lg"
                  className="w-full"
                  onClick={reserver}
                  disabled={!voiture.disponible}
                  variante={voiture.disponible ? "or" : "contour"}
                >
                  {voiture.disponible
                    ? "Réserver ce véhicule"
                    : "Indisponible actuellement"}
                </Bouton>

                {!utilisateur && voiture.disponible && (
                  <p className="text-center text-xs text-muted-foreground">
                    Un compte est nécessaire pour réserver.
                  </p>
                )}
              </div>
            </Carte>
          </motion.aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}
