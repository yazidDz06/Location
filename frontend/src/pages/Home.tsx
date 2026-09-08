import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  KeyRound,
  BadgeCheck,
  Headphones,
  Zap,
  ArrowRight,
  Star,
} from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer";
import MarquesSection from "@/components/ui/marque";
import { Bouton, TitreSection } from "@/components/ui/primitives";
import voitureSvg from "@/assets/voiture.svg";
import golf from "@/assets/golf.webp";

const ETAPES = [
  {
    icone: MapPin,
    titre: "Choisissez le lieu",
    texte: "Indiquez où vous êtes : nous livrons le véhicule à votre adresse.",
  },
  {
    icone: CalendarDays,
    titre: "Sélectionnez vos dates",
    texte: "Départ et retour, à la journée comme au long cours.",
  },
  {
    icone: KeyRound,
    titre: "Prenez la route",
    texte: "Clés en main, assurance incluse, aucune paperasse superflue.",
  },
];

const ATOUTS = [
  {
    icone: BadgeCheck,
    titre: "Tarifs transparents",
    texte:
      "Le prix affiché est le prix payé. Aucun frais caché, aucune surprise au retour du véhicule.",
  },
  {
    icone: Headphones,
    titre: "Assistance 24/7",
    texte:
      "Une équipe joignable à toute heure, où que vous soyez sur la route.",
  },
  {
    icone: Zap,
    titre: "Réservation immédiate",
    texte:
      "Trois clics suffisent. Confirmation instantanée, livraison sous 24 heures.",
  },
];

const CHIFFRES = [
  { valeur: "120+", libelle: "véhicules au catalogue" },
  { valeur: "4,9/5", libelle: "note moyenne client" },
  { valeur: "24 h", libelle: "délai de livraison" },
  { valeur: "0", libelle: "frais caché" },
];

// Fait apparaître les blocs à l'entrée dans le champ de vision.
const apparition = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const },
};

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ═══════════════════════ Hero ═══════════════════════ */}
      <section className="grain relative overflow-hidden">
        {/* Halos décoratifs : profondeur sans image lourde. */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 -right-32 size-[34rem] rounded-full bg-[var(--or)]/12 blur-[110px]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-1/3 -left-40 size-[26rem] rounded-full bg-[var(--or-sombre)]/10 blur-[120px]"
        />

        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:gap-8 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 space-y-8 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--or)]/25 bg-[var(--or)]/8 px-4 py-1.5">
              <Star className="size-3.5 fill-[var(--or)] text-[var(--or)]" />
              <span className="text-xs font-medium tracking-wide text-[var(--or)]">
                Location premium en Algérie
              </span>
            </div>

            <h1 className="interligne-titre text-[2.6rem] sm:text-6xl lg:text-[4.2rem]">
              Le luxe de
              <br />
              <span className="texte-or italic">conduire</span> sans
              <br />
              contrainte
            </h1>

            <p className="mx-auto max-w-md text-lg leading-relaxed text-muted-foreground lg:mx-0">
              Une sélection de véhicules d'exception, livrés chez vous et prêts
              à partir. Réservez en quelques secondes.
            </p>

            <div className="flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              <Bouton taille="lg" onClick={() => navigate("/voitures")}>
                Découvrir la flotte
                <ArrowRight className="size-4" />
              </Bouton>
              <Bouton
                variante="contour"
                taille="lg"
                onClick={() => navigate("/#fonctionnement")}
              >
                Comment ça marche
              </Bouton>
            </div>

            {/* Chiffres clés */}
            <dl className="grid grid-cols-2 gap-6 border-t border-border pt-8 sm:grid-cols-4 lg:gap-4">
              {CHIFFRES.map((c) => (
                <div key={c.libelle} className="space-y-1">
                  <dt className="font-display text-2xl text-[var(--or)]">
                    {c.valeur}
                  </dt>
                  <dd className="text-xs leading-snug text-muted-foreground">
                    {c.libelle}
                  </dd>
                </div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 60, scale: 0.94 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            className="halo-or relative flex items-center justify-center"
          >
            <img
              src={voitureSvg}
              alt="Illustration d'une berline de prestige"
              className="relative z-10 w-full max-w-xl select-none drop-shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════ Fonctionnement ═══════════════════ */}
      <section id="fonctionnement" className="scroll-mt-24 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <motion.div {...apparition}>
            <TitreSection
              surtitre="En trois étapes"
              titre={
                <>
                  Réserver n'a jamais été
                  <span className="texte-or italic"> aussi simple</span>
                </>
              }
              description="De la sélection à la remise des clés, tout se règle en ligne."
            />
          </motion.div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {ETAPES.map((etape, index) => (
              <motion.article
                key={etape.titre}
                {...apparition}
                transition={{ ...apparition.transition, delay: index * 0.12 }}
                className="filet-or group relative overflow-hidden rounded-2xl border border-border bg-[var(--card)] p-8 transition-douce hover:-translate-y-1.5 hover:border-[var(--or)]/35 hover:ombre-portee"
              >
                <span className="absolute right-6 top-6 font-display text-6xl text-[var(--or)]/8 transition-douce group-hover:text-[var(--or)]/14">
                  0{index + 1}
                </span>

                <span className="mb-6 grid size-14 place-items-center rounded-2xl bg-[var(--or)]/10 text-[var(--or)] transition-douce group-hover:bg-[var(--or)]/16">
                  <etape.icone className="size-6" />
                </span>

                <h3 className="mb-3 text-xl">{etape.titre}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {etape.texte}
                </p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* ═════════════════════ Atouts ═════════════════════ */}
      <section id="atouts" className="scroll-mt-24 py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-16 px-5 sm:px-8 lg:grid-cols-2">
          <motion.div {...apparition} className="order-2 lg:order-1">
            <TitreSection
              surtitre="Pourquoi nous choisir"
              centre={false}
              titre={
                <>
                  Une exigence de
                  <span className="texte-or italic"> chaque instant</span>
                </>
              }
            />

            <div className="mt-10 space-y-8">
              {ATOUTS.map((atout, index) => (
                <motion.div
                  key={atout.titre}
                  {...apparition}
                  transition={{ ...apparition.transition, delay: index * 0.1 }}
                  className="flex gap-5"
                >
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-[var(--or)]/20 bg-[var(--or)]/8 text-[var(--or)]">
                    <atout.icone className="size-5" />
                  </span>
                  <div className="space-y-1.5">
                    <h3 className="text-lg">{atout.titre}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {atout.texte}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            {...apparition}
            className="order-1 lg:order-2"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border ombre-portee">
              <img
                src={golf}
                alt="Volkswagen Golf disponible à la location"
                className="aspect-4/3 w-full object-cover transition-transform duration-[1.2s] hover:scale-105"
              />
              {/* Voile dégradé : garantit le contraste du texte sur l'image. */}
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
              />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <p className="text-xs uppercase tracking-[0.25em] text-[var(--or-clair)]">
                  Le choix de la semaine
                </p>
                <p className="mt-2 font-display text-2xl text-white">
                  Volkswagen Golf 8
                </p>
                <p className="mt-1 text-sm text-white/70">
                  À partir de 4 500 DA / jour
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <MarquesSection />

      {/* ═══════════════════ Appel à l'action ═══════════════════ */}
      <section className="px-5 py-16 sm:px-8">
        <motion.div
          {...apparition}
          className="halo-or relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-[var(--or)]/20 bg-[var(--surface)] px-8 py-16 text-center"
        >
          <div className="relative z-10 space-y-6">
            <h2 className="mx-auto max-w-2xl text-3xl sm:text-4xl interligne-titre">
              Votre prochaine voiture vous attend
            </h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Créez votre compte en une minute et réservez le véhicule qui vous
              correspond.
            </p>
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Bouton taille="lg" onClick={() => navigate("/voitures")}>
                Voir les véhicules
                <ArrowRight className="size-4" />
              </Bouton>
              <Bouton
                variante="contour"
                taille="lg"
                onClick={() => navigate("/register")}
              >
                Créer un compte
              </Bouton>
            </div>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
