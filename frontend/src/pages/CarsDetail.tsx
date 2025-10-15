import { useParams, useNavigate } from "react-router-dom";
import { useFetchData } from "@/utils/api";
import { useEffect, useState } from "react";

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

interface User {
  _id: string;
  nom: string;
  prenom: string;
  email: string;
}

export default function VoitureDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  //état pour l'utilisateur connecté
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Vérifier si l'utilisateur est authentifié 
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch(`${API_URL}/users/profile`, {
          credentials: "include", 
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user || data);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erreur auth:", error);
        setUser(null);
      } finally {
        setCheckingAuth(false);
      }
    };
    checkAuth();
  }, []);

 
  const { data: voiture, loading, error } = useFetchData<Voiture>(
    id ? `${API_URL}/voitures/${id}` : ""
  );

  if (loading || checkingAuth)
    return <p className="text-center mt-10">Chargement...</p>;
  if (error)
    return (
      <p className="text-center text-red-500 mt-10">
        Erreur : {error.toString()}
      </p>
    );
  if (!voiture)
    return <p className="text-center mt-10">Aucune voiture trouvée.</p>;

 
  const handleReservation = () => {
    if (!user) {
      navigate("/login"); 
    } else {
      navigate(`/reservation/${voiture._id}`);
    }
  };

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
          <div className="p-6 space-y-2">
            <h2 className="text-xl font-bold mb-2">
              {voiture.marque} {voiture.modele}
            </h2>
            <p>Année : {voiture.annee}</p>
            <p>Type : {voiture.type}</p>
            <p>Kilométrage : {voiture.kilometrage} km</p>
            <p>Prix par jour : {voiture.prixParJour} DA</p>
            <p
              className={`font-semibold mt-3 ${
                voiture.disponible ? "text-green-600" : "text-red-500"
              }`}
            >
              {voiture.disponible ? "Disponible" : "Non disponible"}
            </p>

            {/* 🔘 Bouton Réserver */}
            {voiture.disponible && (
              <button
                onClick={handleReservation}
                className="w-full mt-5 py-2 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold transition duration-300"
              >
                Réserver
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
