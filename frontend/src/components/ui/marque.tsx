import { motion } from "framer-motion";

const MARQUES = [
  "Volkswagen",
  "Mercedes-Benz",
  "Audi",
  "BMW",
  "Renault",
  "Peugeot",
  "Toyota",
  "Hyundai",
];

/**
 * Bandeau de marques défilant en continu.
 * La liste est dupliquée pour que la translation de -50 % reboucle sans
 * saut visible.
 */
export default function MarquesSection() {
  const boucle = [...MARQUES, ...MARQUES];

  return (
    <section className="border-y border-border-subtile bg-[var(--surface)] py-14">
      <p className="mb-9 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
        Les constructeurs de notre flotte
      </p>

      <div
        className="relative overflow-hidden"
        // Les bords s'estompent : le défilement paraît infini.
        style={{
          maskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent, black 12%, black 88%, transparent)",
        }}
      >
        <motion.div
          className="flex w-max gap-16 pr-16"
          animate={{ x: ["0%", "-50%"] }}
          transition={{ duration: 32, ease: "linear", repeat: Infinity }}
        >
          {boucle.map((marque, index) => (
            <span
              key={`${marque}-${index}`}
              className="shrink-0 font-display text-2xl tracking-tight text-muted-foreground/45 transition-colors hover:text-[var(--or)] sm:text-3xl"
            >
              {marque}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
