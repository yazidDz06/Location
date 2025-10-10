import { useFetchData } from "@/utils/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/ui/Footer"; // 

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Car {
  marque: string;
  modele: string;
  annee: string;
  type: string;
  prixParJour: number;
  imageUrl: string;
}

export default function CarsList() {
  const { data: cars, loading, error } = useFetchData<Car[]>(`${API_URL}/voitures`);
 // {data:cars} c'est pour renomer data récupérés par la fonction génerique et lui attribuer un nom localement
  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Erreur : {error}</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* ✅ Navbar en haut */}
      <Navbar />

      {/* ✅ Liste des voitures */}
      <main className="flex-grow container mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white text-center">
          Liste des voitures disponibles
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cars?.map((car, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:scale-[1.02] transition-transform"
            >
              <img
                src={car.imageUrl}
                alt={`${car.marque} ${car.modele}`}
                className="w-full h-56 object-cover"
              />
              <div className="p-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {car.marque} {car.modele}
                </h2>
                <p className="text-gray-600 dark:text-gray-300">{car.annee} • {car.type}</p>
                <p className="text-blue-600 font-semibold dark:text-blue-400 mt-2">
                  {car.prixParJour} DA / jour
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}

