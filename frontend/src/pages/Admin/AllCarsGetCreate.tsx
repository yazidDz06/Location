import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-toastify";
import { Plus, X, Pencil, Trash2 } from "lucide-react";

import LayoutAdmin from "./LayoutAdmin";
import {
  Bouton,
  Carte,
  Champ,
  Chargement,
  EtatVide,
  Etiquette,
} from "@/components/ui/primitives";
import { api, ApiError } from "@/lib/api";
import { useRequete, formaterPrix } from "@/lib/hooks";
import type { Voiture, Motorisation } from "@/lib/types";

const MOTORISATIONS: Motorisation[] = ["essence", "diesel", "hybride", "electrique"];

const FORMULAIRE_VIDE = {
  marque: "",
  modele: "",
  annee: String(new Date().getFullYear()),
  type: "essence" as Motorisation,
  immatriculation: "",
  prixParJour: "",
  kilometrage: "0",
  imageUrl: "",
};

export default function AllCars() {
  const navigate = useNavigate();
  const { donnees: voitures, chargement, erreur, recharger } =
    useRequete<Voiture[]>("/voitures");

  const [panneauOuvert, setPanneauOuvert] = useState(false);
  const [formulaire, setFormulaire] = useState(FORMULAIRE_VIDE);
  const [erreurs, setErreurs] = useState<Record<string, string>>({});
  const [envoi, setEnvoi] = useState(false);
  const [suppressionEnCours, setSuppressionEnCours] = useState<string | null>(null);

  const changer = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormulaire((prec) => ({ ...prec, [name]: value }));
    setErreurs((prec) => ({ ...prec, [name]: "" }));
  };

  const valider = () => {
    const nouvelles: Record<string, string> = {};
    if (!formulaire.marque.trim()) nouvelles.marque = "Marque requise";
    if (!formulaire.modele.trim()) nouvelles.modele = "Modèle requis";
    if (!/^[A-Za-z0-9-]{4,20}$/.test(formulaire.immatriculation.trim()))
      nouvelles.immatriculation = "Format attendu : lettres, chiffres et tirets";
    if (Number(formulaire.prixParJour) <= 0)
      nouvelles.prixParJour = "Le prix doit être positif";
    if (
      formulaire.imageUrl &&
      !/^https?:\/\//i.test(formulaire.imageUrl.trim())
    )
      nouvelles.imageUrl = "L'URL doit commencer par http:// ou https://";

    setErreurs(nouvelles);
    return Object.keys(nouvelles).length === 0;
  };

  const soumettre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valider()) return;

    setEnvoi(true);
    try {
      // Les champs numériques sont convertis : le schéma serveur attend des
      // nombres, pas les chaînes que produit un <input>.
      await api.post<Voiture>("/voitures", {
        marque: formulaire.marque.trim(),
        modele: formulaire.modele.trim(),
        annee: Number(formulaire.annee),
        type: formulaire.type,
        immatriculation: formulaire.immatriculation.trim().toUpperCase(),
        prixParJour: Number(formulaire.prixParJour),
        kilometrage: Number(formulaire.kilometrage),
        ...(formulaire.imageUrl.trim()
          ? { imageUrl: formulaire.imageUrl.trim() }
          : {}),
      });

      toast.success("Véhicule ajouté au catalogue");
      setFormulaire(FORMULAIRE_VIDE);
      setPanneauOuvert(false);
      recharger();
    } catch (err) {
      const message =
        err instanceof ApiError ? err.messageComplet : "Ajout impossible";
      setErreurs({ global: message });
      toast.error(message);
    } finally {
      setEnvoi(false);
    }
  };

  const supprimer = async (voiture: Voiture) => {
    if (!confirm(`Supprimer ${voiture.marque} ${voiture.modele} ?`)) return;

    setSuppressionEnCours(voiture._id);
    try {
      await api.delete(`/voitures/${voiture._id}`);
      toast.success("Véhicule supprimé");
      recharger();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.messageComplet : "Suppression impossible"
      );
    } finally {
      setSuppressionEnCours(null);
    }
  };

  return (
    <LayoutAdmin
      titre="Véhicules"
      description={`${voitures?.length ?? 0} véhicule(s) au catalogue`}
      actions={
        <Bouton onClick={() => setPanneauOuvert((o) => !o)}>
          {panneauOuvert ? <X className="size-4" /> : <Plus className="size-4" />}
          {panneauOuvert ? "Fermer" : "Ajouter un véhicule"}
        </Bouton>
      }
    >
      {/* ── Formulaire d'ajout ── */}
      <AnimatePresence>
        {panneauOuvert && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="mb-10 overflow-hidden"
          >
            <Carte className="filet-or overflow-hidden">
              <form onSubmit={soumettre} className="space-y-6 p-7" noValidate>
                <h2 className="text-xl">Nouveau véhicule</h2>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <Champ
                    libelle="Marque"
                    name="marque"
                    placeholder="Volkswagen"
                    value={formulaire.marque}
                    onChange={changer}
                    erreur={erreurs.marque}
                  />
                  <Champ
                    libelle="Modèle"
                    name="modele"
                    placeholder="Golf 8"
                    value={formulaire.modele}
                    onChange={changer}
                    erreur={erreurs.modele}
                  />
                  <Champ
                    libelle="Immatriculation"
                    name="immatriculation"
                    placeholder="1234-ABC-16"
                    value={formulaire.immatriculation}
                    onChange={changer}
                    erreur={erreurs.immatriculation}
                  />
                  <Champ
                    libelle="Année"
                    name="annee"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={formulaire.annee}
                    onChange={changer}
                    erreur={erreurs.annee}
                  />

                  <div className="space-y-2">
                    <label
                      htmlFor="type"
                      className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
                    >
                      Motorisation
                    </label>
                    <select
                      id="type"
                      name="type"
                      value={formulaire.type}
                      onChange={changer}
                      className="h-12 w-full rounded-xl border border-border bg-[var(--surface)] px-4 text-sm capitalize outline-none transition-douce focus:border-[var(--or)]/60 focus:ring-4 focus:ring-[var(--or)]/12"
                    >
                      {MOTORISATIONS.map((m) => (
                        <option key={m} value={m} className="capitalize">
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Champ
                    libelle="Prix / jour (DA)"
                    name="prixParJour"
                    type="number"
                    min={1}
                    placeholder="4500"
                    value={formulaire.prixParJour}
                    onChange={changer}
                    erreur={erreurs.prixParJour}
                  />
                  <Champ
                    libelle="Kilométrage"
                    name="kilometrage"
                    type="number"
                    min={0}
                    value={formulaire.kilometrage}
                    onChange={changer}
                    erreur={erreurs.kilometrage}
                  />

                  <div className="sm:col-span-2">
                    <Champ
                      libelle="URL de l'image"
                      name="imageUrl"
                      type="url"
                      placeholder="https://…"
                      value={formulaire.imageUrl}
                      onChange={changer}
                      erreur={erreurs.imageUrl}
                      indice="Seules les URL http(s) sont acceptées"
                    />
                  </div>
                </div>

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
                    {envoi ? "Ajout…" : "Ajouter au catalogue"}
                  </Bouton>
                  <Bouton
                    type="button"
                    variante="fantome"
                    onClick={() => setPanneauOuvert(false)}
                  >
                    Annuler
                  </Bouton>
                </div>
              </form>
            </Carte>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Liste ── */}
      {chargement && <Chargement />}

      {erreur && (
        <EtatVide
          titre="Chargement impossible"
          description={erreur}
          action={<Bouton onClick={recharger}>Réessayer</Bouton>}
        />
      )}

      {!chargement && voitures?.length === 0 && (
        <EtatVide
          titre="Catalogue vide"
          description="Ajoutez votre premier véhicule pour commencer."
          action={<Bouton onClick={() => setPanneauOuvert(true)}>Ajouter</Bouton>}
        />
      )}

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {voitures?.map((voiture) => (
          <Carte key={voiture._id} className="overflow-hidden transition-douce hover:border-[var(--or)]/30">
            <div className="relative aspect-16/10 bg-muted">
              {voiture.imageUrl ? (
                <img
                  src={voiture.imageUrl}
                  alt={`${voiture.marque} ${voiture.modele}`}
                  loading="lazy"
                  className="size-full object-cover"
                />
              ) : (
                <div className="grid size-full place-items-center text-sm text-muted-foreground">
                  Sans photo
                </div>
              )}
              <div className="absolute left-3 top-3">
                <Etiquette ton={voiture.disponible ? "succes" : "danger"}>
                  {voiture.disponible ? "Disponible" : "Indisponible"}
                </Etiquette>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate">
                    {voiture.marque} {voiture.modele}
                  </h3>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {voiture.annee} · {voiture.immatriculation}
                  </p>
                </div>
                <p className="shrink-0 font-display text-[var(--or)]">
                  {formaterPrix(voiture.prixParJour)}
                </p>
              </div>

              <div className="flex gap-2">
                <Bouton
                  variante="contour"
                  taille="sm"
                  className="flex-1"
                  onClick={() => navigate(`/admin/voitures/${voiture._id}`)}
                >
                  <Pencil className="size-3.5" />
                  Modifier
                </Bouton>
                <Bouton
                  variante="danger"
                  taille="sm"
                  chargement={suppressionEnCours === voiture._id}
                  onClick={() => supprimer(voiture)}
                >
                  <Trash2 className="size-3.5" />
                </Bouton>
              </div>
            </div>
          </Carte>
        ))}
      </div>
    </LayoutAdmin>
  );
}
