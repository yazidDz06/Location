import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

/* ═══════════════════════════════ Bouton ═════════════════════════════════ */

type VarianteBouton = "or" | "contour" | "fantome" | "sombre" | "danger";
type TailleBouton = "sm" | "md" | "lg";

const VARIANTES: Record<VarianteBouton, string> = {
  or: "bg-gradient-to-b from-[var(--or-clair)] to-[var(--or)] text-[oklch(0.17_0.014_60)] hover:brightness-105 hover:-translate-y-0.5 ombre-or font-semibold",
  contour:
    "border border-[var(--or)]/45 text-[var(--or)] hover:bg-[var(--or)]/10 hover:border-[var(--or)]",
  fantome: "text-foreground/75 hover:text-foreground hover:bg-accent",
  sombre:
    "bg-primary text-primary-foreground hover:opacity-90 hover:-translate-y-0.5",
  danger: "bg-[var(--destructive)] text-white hover:brightness-110",
};

const TAILLES: Record<TailleBouton, string> = {
  sm: "h-9 px-4 text-sm rounded-lg",
  md: "h-11 px-6 text-[0.95rem] rounded-xl",
  lg: "h-14 px-9 text-base rounded-xl",
};

interface ProprietesBouton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteBouton;
  taille?: TailleBouton;
  chargement?: boolean;
}

export const Bouton = forwardRef<HTMLButtonElement, ProprietesBouton>(
  (
    { className, variante = "or", taille = "md", chargement, children, disabled, ...reste },
    ref
  ) => (
    <button
      ref={ref}
      // `disabled` pendant le chargement : empêche la double soumission d'un
      // formulaire, qui créerait deux réservations ou deux comptes.
      disabled={disabled || chargement}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-medium tracking-tight",
        "transition-douce disabled:opacity-50 disabled:pointer-events-none",
        "cursor-pointer select-none whitespace-nowrap",
        VARIANTES[variante],
        TAILLES[taille],
        className
      )}
      {...reste}
    >
      {chargement && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
);
Bouton.displayName = "Bouton";

/* ═══════════════════════════════ Champ ══════════════════════════════════ */

interface ProprietesChamp extends React.InputHTMLAttributes<HTMLInputElement> {
  libelle: string;
  erreur?: string;
  indice?: string;
}

export const Champ = forwardRef<HTMLInputElement, ProprietesChamp>(
  ({ libelle, erreur, indice, className, id, ...reste }, ref) => {
    const identifiant = id ?? reste.name ?? libelle;
    const idErreur = `${identifiant}-erreur`;

    return (
      <div className="space-y-2">
        <label
          htmlFor={identifiant}
          className="block text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground"
        >
          {libelle}
        </label>
        <input
          ref={ref}
          id={identifiant}
          // Le lecteur d'écran doit annoncer l'erreur, pas seulement la couleur.
          aria-invalid={Boolean(erreur)}
          aria-describedby={erreur ? idErreur : undefined}
          className={cn(
            "w-full h-12 px-4 rounded-xl bg-[var(--surface)] text-foreground",
            "border border-border placeholder:text-muted-foreground/55",
            "transition-douce outline-none",
            "focus:border-[var(--or)]/60 focus:ring-4 focus:ring-[var(--or)]/12",
            erreur && "border-[var(--destructive)]/70 focus:ring-[var(--destructive)]/12",
            className
          )}
          {...reste}
        />
        {erreur ? (
          <p id={idErreur} role="alert" className="text-sm text-[var(--destructive)]">
            {erreur}
          </p>
        ) : indice ? (
          <p className="text-xs text-muted-foreground">{indice}</p>
        ) : null}
      </div>
    );
  }
);
Champ.displayName = "Champ";

/* ═══════════════════════════════ Carte ══════════════════════════════════ */

export function Carte({
  className,
  children,
  ...reste
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-[var(--card)] ombre-douce",
        className
      )}
      {...reste}
    >
      {children}
    </div>
  );
}

/* ══════════════════════════════ Étiquette ═══════════════════════════════ */

type TonEtiquette = "or" | "succes" | "danger" | "neutre" | "attention";

const TONS: Record<TonEtiquette, string> = {
  or: "bg-[var(--or)]/12 text-[var(--or)] border-[var(--or)]/25",
  succes: "bg-[var(--succes)]/12 text-[var(--succes)] border-[var(--succes)]/25",
  danger:
    "bg-[var(--destructive)]/12 text-[var(--destructive)] border-[var(--destructive)]/25",
  attention:
    "bg-[var(--attention)]/12 text-[var(--attention)] border-[var(--attention)]/25",
  neutre: "bg-muted text-muted-foreground border-border",
};

export function Etiquette({
  ton = "neutre",
  className,
  children,
}: {
  ton?: TonEtiquette;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
        "text-xs font-medium tracking-wide",
        TONS[ton],
        className
      )}
    >
      {children}
    </span>
  );
}

/* ═══════════════════════ États de chargement / vide ═════════════════════ */

export function Chargement({ message = "Chargement…" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex flex-col items-center justify-center gap-4 py-24 text-muted-foreground"
    >
      <div className="relative size-12">
        <div className="absolute inset-0 rounded-full border-2 border-border" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[var(--or)] animate-spin" />
      </div>
      <p className="text-sm tracking-wide">{message}</p>
    </div>
  );
}

export function EtatVide({
  titre,
  description,
  action,
}: {
  titre: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
      <h3 className="text-xl text-foreground">{titre}</h3>
      {description && (
        <p className="max-w-md text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

/** Squelette de chargement : évite le saut de mise en page à l'arrivée des données. */
export function Squelette({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-muted/60", className)} />
  );
}

/* ═══════════════════════════ Titre de section ═══════════════════════════ */

export function TitreSection({
  surtitre,
  titre,
  description,
  centre = true,
}: {
  surtitre?: string;
  titre: React.ReactNode;
  description?: string;
  centre?: boolean;
}) {
  return (
    <div className={cn("max-w-2xl space-y-4", centre && "mx-auto text-center")}>
      {surtitre && (
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-[var(--or)]">
          {surtitre}
        </p>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] interligne-titre">
        {titre}
      </h2>
      {description && (
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      )}
    </div>
  );
}
