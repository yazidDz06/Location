import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostData } from "@/utils/api";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface Adresse {
  ville: string;
  commune: string;
  rue: string;
}

export interface Reservation {
  voiture: string; 
  dateDebut: string;
  dateFin: string;
  adresse: Adresse;
}

export interface ReservationResponse {
  message: string;
  prixTotal: number;
  jours: number;
}

export default function ReservationForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { postData, loading, error } = usePostData<Reservation, ReservationResponse>(
    `${API_URL}/appointments`
  );

  const [formData, setFormData] = useState<Reservation>({
    voiture: id || "",
    dateDebut: "",
    dateFin: "",
    adresse: { ville: "", commune: "", rue: "" },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "ville" || name === "commune" || name === "rue") {
      setFormData({
        ...formData,
        adresse: { ...formData.adresse, [name]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await postData(formData);
    if (response) {
      alert(` Réservation réussie !
Prix total : ${response.prixTotal} DA
Durée : ${response.jours} jour(s)`);
      navigate("/Voitures");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg w-full max-w-md space-y-5"
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 dark:text-white">
          Réserver la voiture
        </h2>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Date de début</label>
          <input
            type="date"
            name="dateDebut"
            value={formData.dateDebut}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Date de fin</label>
          <input
            type="date"
            name="dateFin"
            value={formData.dateFin}
            onChange={handleChange}
            required
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Ville</label>
          <input
            type="text"
            name="ville"
            value={formData.adresse.ville}
            onChange={handleChange}
            required
            placeholder="ex: Béjaïa"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Commune</label>
          <input
            type="text"
            name="commune"
            value={formData.adresse.commune}
            onChange={handleChange}
            required
            placeholder="ex: El-Kseur"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-700 dark:text-gray-300 mb-1">Rue</label>
          <input
            type="text"
            name="rue"
            value={formData.adresse.rue}
            onChange={handleChange}
            required
            placeholder="ex: Rue de la Gare"
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300"
        >
          Réserver
        </button>
      </form>
    </div>
  );
}

