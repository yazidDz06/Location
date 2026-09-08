import { Link } from "react-router-dom";
import { CarFront, Phone, Mail, MapPin } from "lucide-react";

const COLONNES = [
  {
    titre: "Découvrir",
    liens: [
      { libelle: "Nos véhicules", href: "/voitures" },
      { libelle: "Comment ça marche", href: "/#fonctionnement" },
      { libelle: "Pourquoi nous choisir", href: "/#atouts" },
    ],
  },
  {
    titre: "Compte",
    liens: [
      { libelle: "Connexion", href: "/login" },
      { libelle: "Créer un compte", href: "/register" },
      { libelle: "Mes réservations", href: "/mes-reservations" },
    ],
  },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      className="grain relative mt-24 border-t border-border bg-[var(--surface)]"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {/* Marque */}
          <div className="space-y-5 lg:col-span-1">
            <Link to="/" className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[var(--or-clair)] to-[var(--or-sombre)]">
                <CarFront className="size-5 text-[oklch(0.17_0.014_60)]" />
              </span>
              <span className="font-display text-lg">
                Prestige<span className="texte-or"> Auto</span>
              </span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
              Des véhicules d'exception, livrés à votre porte. La location
              automobile pensée comme un service d'hôtellerie.
            </p>
          </div>

          {COLONNES.map((colonne) => (
            <div key={colonne.titre} className="space-y-4">
              <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--or)]">
                {colonne.titre}
              </h3>
              <ul className="space-y-3">
                {colonne.liens.map((lien) => (
                  <li key={lien.href}>
                    <Link
                      to={lien.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {lien.libelle}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="font-display text-sm uppercase tracking-[0.2em] text-[var(--or)]">
              Nous joindre
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <Phone className="size-4 shrink-0 text-[var(--or)]/70" />
                <a href="tel:+213555000000" className="hover:text-foreground">
                  +213 555 00 00 00
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="size-4 shrink-0 text-[var(--or)]/70" />
                <a
                  href="mailto:contact@prestige-auto.dz"
                  className="hover:text-foreground"
                >
                  contact@prestige-auto.dz
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-4 shrink-0 text-[var(--or)]/70" />
                Béjaïa, Algérie
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border-subtile pt-8 text-xs text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Prestige Auto. Tous droits réservés.</p>
          <p className="tracking-wide">
            Projet de démonstration — portfolio de Yazid Khoualdi
          </p>
        </div>
      </div>
    </footer>
  );
}
