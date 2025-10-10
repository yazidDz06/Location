import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import CarSvg from "@/assets/voiture.svg";
import { useTheme } from "@/components/themeProvider";
import { FaMapMarkerAlt, FaCalendarAlt, FaCar, FaTags, FaComments, FaBolt } from "react-icons/fa";
import golf from "../assets/golf.webp";
import MarquesSection from "@/components/ui/marque";
import Footer from "@/components/ui/Footer";
export default function Home() {
    const { theme } = useTheme();

    return (
        <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-500">
            <Navbar />

            {/* Section Hero */}
            <section className="flex flex-col-reverse md:flex-row items-center justify-between px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-20 gap-10 md:gap-0">
                {/*  Partie gauche - voiture animée */}
                <div className="w-full md:w-1/2 flex justify-center items-center overflow-hidden">
                    <motion.img
                        src={CarSvg}
                        alt="Voiture"
                        className="w-[85%] sm:w-[70%] md:w-[90%] lg:w-[95%] max-w-[500px] select-none"
                        initial={{ x: -200, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        style={{
                            filter: theme === "dark" ? "brightness(0.8)" : "brightness(1)",
                        }}
                    />
                </div>


                <motion.div
                    initial={{ x: 200, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    className="w-full md:w-1/2 text-center md:text-left space-y-5"
                >
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl max-w-96 font-bold text-gray-900 dark:text-white leading-tight">
                        Louez votre voiture en toute simplicité
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 text-base sm:text-lg max-w-md mx-auto md:mx-0">
                        Trouvez, comparez et réservez la voiture parfaite pour vos trajets —
                        que ce soit pour un week-end ou un long voyage.
                    </p>
                    <div className="pt-4 flex justify-center md:justify-start">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-all duration-300 text-sm sm:text-base"
                        >
                            Réserver maintenant
                        </motion.button>
                    </div>
                </motion.div>
            </section>
            <section className="py-16 px-6 bg-white dark:bg-gray-900">
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
       gap-10 text-center">


                    <div className="flex flex-col items-center space-y-4">
                        <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-2xl flex justify-center items-center">
                            <FaMapMarkerAlt className="text-blue-600 dark:text-blue-400 text-4xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Choisir la localisation
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs">
                            Trouvez les voitures disponible dans votre région
                        </p>
                    </div>


                    <div className="flex flex-col items-center space-y-4">
                        <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-2xl flex justify-center items-center">
                            <FaCalendarAlt className="text-blue-600 dark:text-blue-400 text-4xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            choisir une date
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs">
                            Tu choisis date d'emprunt et remise
                        </p>
                    </div>


                    <div className="flex flex-col items-center space-y-4">
                        <div className="bg-blue-100 dark:bg-blue-900 p-6 rounded-2xl flex justify-center items-center">
                            <FaCar className="text-blue-600 dark:text-blue-400 text-4xl" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Choisir la voiture
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm max-w-xs">
                            Choisi ta voiture et on l'améne chez toi
                        </p>
                    </div>
                </div>
            </section>
            <section className="flex flex-col-reverse md:flex-row items-center justify-between px-6 sm:px-10 md:px-16 lg:px-24 py-10 md:py-20 gap-10 md:gap-0 bg-white dark:bg-gray-900">


                <div id="whyChooseUs" className="w-full md:w-1/2 flex flex-col space-y-8">


                    <div className="flex items-center space-x-6">
                        <div className="bg-blue-100 dark:bg-blue-800 p-4 rounded-2xl flex justify-center items-center">
                            <FaTags className="text-blue-600 dark:text-blue-400 text-3xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Meilleurs prix
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Profitez des offres les plus compétitives sur le marché, sans frais cachés.
                            </p>
                        </div>
                    </div>


                    <div className="flex items-center space-x-6">
                        <div className="bg-green-100 dark:bg-green-800 p-4 rounded-2xl flex justify-center items-center">
                            <FaComments className="text-green-600 dark:text-green-400 text-3xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Assistance 24/7
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Notre équipe est disponible à tout moment pour répondre à vos besoins.
                            </p>
                        </div>
                    </div>


                    <div className="flex items-center space-x-6">
                        <div className="bg-yellow-100 dark:bg-yellow-800 p-4 rounded-2xl flex justify-center items-center">
                            <FaBolt className="text-yellow-600 dark:text-yellow-400 text-3xl" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                                Réservation rapide
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm">
                                Réservez votre voiture en quelques clics seulement, en toute simplicité.
                            </p>
                        </div>
                    </div>
                </div>


                <div

                    className="w-full md:w-1/2 flex justify-center items-center"
                >
                    <img
                        src={golf}
                        alt="Voiture"
                        className="w-[80%] md:w-[90%] object-contain bg-transparent dark:bg-black rounded-xl p-2"
                    />
                </div>
            </section>
            <MarquesSection />
            <Footer />
        </div>
    );
}

