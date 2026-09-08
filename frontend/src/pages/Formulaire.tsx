import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import { ArrowLeft, CalendarDays, MapPin, Receipt } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import {
  Bouton,
  Carte,
  Champ,
  Chargement,
  EtatVide,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useRequete, formaterPrix } from "@/lib/hooks";
import type { Voiture, Reservation } from "@/lib/types";

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

/** Date du jour au format AAAA-MM-JJ, en heure locale. */
function aujourdhuiISO(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

export default function ReservationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { donnees: voiture, chargement } = useRequete<Voiture>(
    id ? `/voitures/${id}` : null
  );

  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");
  const [adresse, setAdresse] = useState({ ville: "", commune: "", rue: "" });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);

  const minimum = aujourdhuiISO();

  // Devis calculé en direct — le serveur reste seul juge du prix final.
  const devis = useMemo(() => {
    if (!dateDebut || !dateFin || !voiture) return null;
    const debut = new Date(dateDebut);
    const fin = new Date(dateFin);
    const jours = Math.ceil((fin.getTime() - debut.getTime()) / MS_PAR_JOUR);
    if (jours <= 0) return null;
    return { jours, total: jours * voiture.prixParJour };
  }, [dateDebut, dateFin, voiture]);

  const changerAdresse = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAdresse((prec) => ({ ...prec, [name]: value }));
    setErreurs((prec) => ({ ...prec, [name]: "" }));
  };

  const valider = () => {
    const nouvelles: Record<string, string> = {};

    if (!dateDebut) nouvelles.dateDebut = "Date de départ requise";
    else if (dateDebut < minimum)
      nouvelles.dateDebut = "La date ne peut pas être dans le passé";

    if (!dateFin) nouvelles.dateFin = "Date de retour requise";
    else if (dateFin <= dateDebut)
      nouvelles.dateFin = "Le retour doit suivre le départ";

    if (devis && devis.jours > 90)
      nouvelles.dateFin = "La durée ne peut pas dépasser 90 jours";

    if (adresse.ville.trim().length < 2) nouvelles.ville = "Ville requise";
    if (adresse.commune.trim().length < 2) nouvelles.commune = "Commune requise";
    if (adresse.rue.trim().length < 2) nouvelles.rue = "Adresse requise";

    setErreurs(nouvelles);
    return Object.keys(nouvelles).length === 0;
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valider() || !id) return;

    setEnvoi(true);
    try {
      const reponse = await api.post<{
        message: string;
        jours: number;
        prixTotal: number;
        reservation: Reservation;
      }>("/appointments", {
        voiture: id,
        dateDebut: new Date(dateDebut).toISOString(),
        dateFin: new Date(dateFin).toISOString(),
        adresse: {
          ville: adresse.ville.trim(),
          commune: adresse.commune.trim(),
          rue: adresse.rue.trim(),
        },
      });

      toast.success(
        `Réservation confirmée — ${reponse.jours} jour(s), ${formaterPrix(
          reponse.prixTotal
        )} DA`
      );
      navigate("/mes-reservations");
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.messageComplet
          : "Réservation impossible. Réessayez.";
      setErreurs({ global: message });
      toast.error(message);
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <Chargement message="Préparation de votre réservation…" />
      </div>
    );
  }

  if (!voiture) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <EtatVide
          titre="Véhicule introuvable"
          action={<Bouton onClick={() => navigate("/voitures")}>Voir la flotte</Bouton>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
        <Link
          to={`/voitures/${id}`}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[var(--or)]"
        >
          <ArrowLeft className="size-4" />
          Retour au véhicule
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]"
        >
          {/* ── Formulaire ── */}
          <Carte className="filet-or overflow-hidden">
            <form onSubmit={soumettre} className="space-y-8 p-8" noValidate>
              <div>
                <h1 className="text-3xl interligne-titre">Finaliser la réservation</h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Indiquez vos dates et l'adresse de livraison du véhicule.
                </p>
              </div>

              <fieldset className="space-y-5">
                <legend className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--or)]">
                  <CalendarDays className="size-4" />
                  Vos dates
                </legend>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Champ
                    libelle="Départ"
                    name="dateDebut"
                    type="date"
                    min={minimum}
                    value={dateDebut}
                    onChange={(e) => {
                      setDateDebut(e.target.value);
                      setErreurs((p) => ({ ...p, dateDebut: "" }));
                    }}
                    erreur={erreurs.dateDebut}
                  />
                  <Champ
                    libelle="Retour"
                    name="dateFin"
                    type="date"
                    min={dateDebut || minimum}
                    value={dateFin}
                    onChange={(e) => {
                      setDateFin(e.target.value);
                      setErreurs((p) => ({ ...p, dateFin: "" }));
                    }}
                    erreur={erreurs.dateFin}
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-5">
                <legend className="mb-4 flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--or)]">
                  <MapPin className="size-4" />
                  Adresse de livraison
                </legend>

                <div className="grid gap-5 sm:grid-cols-2">
                  <Champ
                    libelle="Ville"
                    name="ville"
                    placeholder="Béjaïa"
                    value={adresse.ville}
                    onChange={changerAdresse}
                    erreur={erreurs.ville}
                  />
                  <Champ
                    libelle="Commune"
                    name="commune"
                    placeholder="El-Kseur"
                    value={adresse.commune}
                    onChange={changerAdresse}
                    erreur={erreurs.commune}
                  />
                </div>

                <Champ
                  libelle="Rue"
                  name="rue"
                  placeholder="Rue de la Gare, n° 12"
                  value={adresse.rue}
                  onChange={changerAdresse}
                  erreur={erreurs.rue}
                />
              </fieldset>

              {erreurs.global && (
                <div
                  role="alert"
                  className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-4 py-3 text-sm text-[var(--destructive)]"
                >
                  {erreurs.global}
                </div>
              )}

              <Bouton type="submit" taille="lg" chargement={envoi} className="w-full">
                {envoi ? "Réservation en cours…" : "Confirmer la réservation"}
              </Bouton>
            </form>
          </Carte>

          {/* ── Récapitulatif ── */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <Carte className="overflow-hidden">
              {voiture.imageUrl && (
                <img
                  src={voiture.imageUrl}
                  alt={`${voiture.marque} ${voiture.modele}`}
                  className="aspect-16/10 w-full object-cover"
                />
              )}

              <div className="space-y-5 p-7">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[var(--or)]">
                    {voiture.marque}
                  </p>
                  <h2 className="mt-1.5 text-2xl">{voiture.modele}</h2>
                </div>

                <dl className="space-y-3 border-t border-border-subtile pt-5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Prix journalier</dt>
                    <dd>{formaterPrix(voiture.prixParJour)} DA</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Durée</dt>
                    <dd>{devis ? `${devis.jours} jour(s)` : "—"}</dd>
                  </div>
                </dl>

                <div className="flex items-baseline justify-between border-t border-border pt-5">
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Receipt className="size-4 text-[var(--or)]" />
                    Total estimé
                  </span>
                  <span className="font-display text-2xl text-[var(--or)]">
                    {devis ? `${formaterPrix(devis.total)} DA` : "—"}
                  </span>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground">
                  Montant indicatif. Le total définitif est calculé par nos
                  services à la confirmation.
                </p>
              </div>
            </Carte>
          </aside>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
