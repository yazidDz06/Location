import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { ArrowLeft } from "lucide-react";

import LayoutAdmin from "./LayoutAdmin";
import {
  Bouton,
  Carte,
  Champ,
  Chargement,
  EtatVide,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useRequete, formaterPrix } from "@/lib/hooks";
import type { Voiture } from "@/lib/types";

export default function CarUpdate() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { donnees: voiture, chargement } = useRequete<Voiture>(
    id ? `/voitures/${id}` : null
  );

  const [formulaire, setFormulaire] = useState({
    prixParJour: "",
    kilometrage: "",
    disponible: true,
  });
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);

  // Le formulaire est pré-rempli dès l'arrivée des données du véhicule.
  useEffect(() => {
    if (!voiture) return;
    setFormulaire({
      prixParJour: String(voiture.prixParJour),
      kilometrage: String(voiture.kilometrage),
      disponible: !voiture.horsService,
    });
  }, [voiture]);

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();

    const nouvelles: Record<string, string> = {};
    if (Number(formulaire.prixParJour) <= 0)
      nouvelles.prixParJour = "Le prix doit être positif";
    if (Number(formulaire.kilometrage) < 0)
      nouvelles.kilometrage = "Le kilométrage ne peut pas être négatif";

    setErreurs(nouvelles);
    if (Object.keys(nouvelles).length > 0) return;

    setEnvoi(true);
    try {
      await api.put<Voiture>(`/voitures/${id}`, {
        prixParJour: Number(formulaire.prixParJour),
        kilometrage: Number(formulaire.kilometrage),
        disponible: formulaire.disponible,
      });
      toast.success("Véhicule mis à jour");
      navigate("/admin/voitures");
    } catch (err) {
      const message =
        err instanceof ApiError ? err.messageComplet : "Mise à jour impossible";
      setErreurs({ global: message });
      toast.error(message);
    } finally {
      setEnvoi(false);
    }
  };

  if (chargement) {
    return (
      <LayoutAdmin titre="Modifier un véhicule">
        <Chargement />
      </LayoutAdmin>
    );
  }

  if (!voiture) {
    return (
      <LayoutAdmin titre="Modifier un véhicule">
        <EtatVide
          titre="Véhicule introuvable"
          action={
            <Bouton onClick={() => navigate("/admin/voitures")}>
              Retour au catalogue
            </Bouton>
          }
        />
      </LayoutAdmin>
    );
  }

  return (
    <LayoutAdmin
      titre={`${voiture.marque} ${voiture.modele}`}
      description={`Immatriculation ${voiture.immatriculation} · ${voiture.annee}`}
    >
      <Link
        to="/admin/voitures"
        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-[var(--or)]"
      >
        <ArrowLeft className="size-4" />
        Retour au catalogue
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <Carte className="filet-or overflow-hidden">
          <form onSubmit={soumettre} className="space-y-6 p-7" noValidate>
            <h2 className="text-xl">Informations modifiables</h2>

            <Champ
              libelle="Prix par jour (DA)"
              name="prixParJour"
              type="number"
              min={1}
              value={formulaire.prixParJour}
              onChange={(e) => {
                setFormulaire((p) => ({ ...p, prixParJour: e.target.value }));
                setErreurs((p) => ({ ...p, prixParJour: "" }));
              }}
              erreur={erreurs.prixParJour}
            />

            <Champ
              libelle="Kilométrage"
              name="kilometrage"
              type="number"
              min={0}
              value={formulaire.kilometrage}
              onChange={(e) => {
                setFormulaire((p) => ({ ...p, kilometrage: e.target.value }));
                setErreurs((p) => ({ ...p, kilometrage: "" }));
              }}
              erreur={erreurs.kilometrage}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-[var(--surface)] p-4">
              <input
                type="checkbox"
                checked={formulaire.disponible}
                onChange={(e) =>
                  setFormulaire((p) => ({ ...p, disponible: e.target.checked }))
                }
                className="mt-0.5 size-4 accent-[var(--or)]"
              />
              <span className="space-y-1">
                <span className="block text-sm">Proposé à la location</span>
                <span className="block text-xs text-muted-foreground">
                  Décochez pour retirer le véhicule du catalogue (entretien,
                  vente…). Les réservations en cours ne sont pas affectées.
                </span>
              </span>
            </label>

            {erreurs.global && (
              <div
                role="alert"
                className="rounded-xl border border-[var(--destructive)]/30 bg-[var(--destructive)]/8 px-4 py-3 text-sm text-[var(--destructive)]"
              >
                {erreurs.global}
              </div>
            )}

            <div className="flex gap-3">
              <Bouton type="submit" chargement={envoi}>
                {envoi ? "Enregistrement…" : "Enregistrer"}
              </Bouton>
              <Bouton
                type="button"
                variante="fantome"
                onClick={() => navigate("/admin/voitures")}
              >
                Annuler
              </Bouton>
            </div>
          </form>
        </Carte>

        <Carte className="h-fit overflow-hidden">
          {voiture.imageUrl && (
            <img
              src={voiture.imageUrl}
              alt={`${voiture.marque} ${voiture.modele}`}
              className="aspect-16/10 w-full object-cover"
            />
          )}
          <dl className="space-y-3 p-6 text-sm">
            {[
              ["Marque", voiture.marque],
              ["Modèle", voiture.modele],
              ["Année", String(voiture.annee)],
              ["Motorisation", voiture.type],
              ["Prix actuel", `${formaterPrix(voiture.prixParJour)} DA / jour`],
            ].map(([libelle, valeur]) => (
              <div key={libelle} className="flex justify-between gap-4">
                <dt className="text-muted-foreground">{libelle}</dt>
                <dd className="text-right capitalize">{valeur}</dd>
              </div>
            ))}
          </dl>
        </Carte>
      </div>
    </LayoutAdmin>
  );
}
