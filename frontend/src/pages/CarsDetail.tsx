import { useParams } from "react-router-dom";
import { useFetchData } from "@/utils/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

 type Energie = "diesel" | "essence" | "hybride";

export interface Voiture {
  _id?: string;
  marque: string;
  modele: string;
  annee: number;
  type: Energie;
  immatriculation: string;
  prixParJour: number;
  disponible: boolean;
  kilometrage: number;
  imageUrl: string;
}

export default function VoitureDetail() {
  const { id } = useParams(); 
const { data: voiture, loading, error } = useFetchData<Voiture>(
  id ? `${API_URL}/voitures/${id}` : ""
);


  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Erreur : {error}</p>;
  if (!voiture) return <p className="text-center mt-10">Aucune voiture trouvée.</p>;

  return (
    <div className="flex-grow container mx-auto px-6 py-10 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h1 className="text-2xl font-semibold text-center mb-8">
        Détails de la voiture
      </h1>

      <div className="flex justify-center">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden max-w-md">
          <img
            src={voiture.imageUrl}
            alt={`${voiture.marque} ${voiture.modele}`}
            className="w-full h-64 object-cover"
          />
          <div className="p-6">
            <h2 className="text-xl font-bold mb-2">
              {voiture.marque} {voiture.modele}
            </h2>
            <p>Année : {voiture.annee}</p>
            <p>Type : {voiture.type}</p>
            <p>Kilométrage : {voiture.kilometrage} km</p>
          
            <p>Prix par jour : {voiture.prixParJour} €</p>
            <p
              className={`font-semibold mt-3 ${
                voiture.disponible ? "text-green-600" : "text-red-500"
              }`}
            >
              {voiture.disponible ? "Disponible" : "Non disponible"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

