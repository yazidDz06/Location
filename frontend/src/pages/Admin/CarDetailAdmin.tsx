import { useParams, useNavigate } from "react-router-dom";
import { useFetchData, useSendData } from "@/utils/api";
import { toast } from "react-toastify";
import type { Voiture } from "../CarsDetail";
import { useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function CarDetailAdmin() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: voiture, loading, error } = useFetchData<Voiture>(
    id ? `${API_URL}/voitures/${id}` : ""
  );

  const { sendData, data: deleteResponse, loading: deleting, error: deleteError } =
    useSendData<null, any>(`${API_URL}/voitures/${id}`, "DELETE");

  
  useEffect(() => {
    if (deleteResponse) {
      toast.success("Voiture supprimée avec succès !");
      navigate("/admin/cars"); 
    }
  }, [deleteResponse, navigate]);

  useEffect(() => {
    if (deleteError) toast.error(`Erreur : ${deleteError}`);
  }, [deleteError]);

 
  const handleDelete = async () => {
    if (window.confirm("Voulez-vous vraiment supprimer cette voiture ?")) {
      await sendData();
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center text-red-500 mt-10">Erreur : {error}</p>;
  if (!voiture) return <p className="text-center mt-10">Aucune voiture trouvée.</p>;

  return (
    <div className="flex-grow container mx-auto px-6 py-10 bg-gray-100 dark:bg-gray-800 min-h-screen">
      <h1 className="text-2xl font-semibold text-center mb-8 text-gray-900 dark:text-white">
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
            <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
              {voiture.marque} {voiture.modele}
            </h2>
            <p>Année : {voiture.annee}</p>
            <p>Type : {voiture.type}</p>
            <p>Kilométrage : {voiture.kilometrage} km</p>
            <p>Prix par jour : {voiture.prixParJour} DA</p>
            <p>Matricule : {voiture.immatriculation}</p>
            <p>Énergie : {voiture.type}</p>
            <p
              className={`font-semibold mt-3 ${
                voiture.disponible ? "text-green-600" : "text-red-500"
              }`}
            >
              {voiture.disponible ? "Disponible" : "Non disponible"}
            </p>

           
            <div className="flex justify-between mt-6">
              <button
                onClick={() => navigate(`/admin/cars/${voiture._id}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              >
                Modifier
              </button>

              <button
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg"
                disabled={deleting}
              >
                {deleting ? "Suppression..." : "Supprimer"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

