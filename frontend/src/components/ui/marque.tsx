import { motion } from "framer-motion";

export default function MarquesSection() {
  const logos = [
    {
      
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Volkswagen_logo_2019.svg/640px-Volkswagen_logo_2019.svg.png",
    },
    {
      
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Renault_logo_1972-1992.svg/640px-Renault_logo_1972-1992.svg.png",
    },
    {
      
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Toyota_logo_%28Red%29.svg/640px-Toyota_logo_%28Red%29.svg.png",
    },
    {
      
      src: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/Citroen_2021_%28alternate%29.svg/640px-Citroen_2021_%28alternate%29.svg.png",
    },
    {
     
      src: "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
    },
  ];

  return (
    <section
      id="marques"
      className="py-16 px-6 sm:px-10 md:px-20 bg-white dark:bg-gray-900 transition-colors duration-500"
    >
      {/* Titre et description */}
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Nos Marques Partenaires
        </h2>
        <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Découvrez les marques de voitures les plus fiables et prestigieuses
          que nous mettons à votre disposition.
        </p>
      </div>

      {/* Grille de logos */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 items-center justify-center">
        {logos.map((logo, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: idx * 0.2, ease: "easeOut" }}
            viewport={{ once: true }}
            className="flex flex-col items-center space-y-3"
          >
            <img
              src={logo.src}
              
              className="w-20 md:w-24 dark:invert transition-all duration-500"
            />
            <p className="text-gray-800 dark:text-gray-300 font-medium">
              
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
