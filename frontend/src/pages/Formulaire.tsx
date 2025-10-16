import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePostData } from "@/utils/api";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { fr } from "date-fns/locale";
import { TextField } from "@mui/material";

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

  // 🔹 gestion texte (adresse)
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

  // 🔹 gestion des dates avec MUI
  const handleDateChange = (field: "dateDebut" | "dateFin", value: Date | null) => {
    setFormData({
      ...formData,
      [field]: value ? value.toISOString().split("T")[0] : "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await postData(formData);
    if (response) {
      alert(`Réservation réussie !
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

        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
          <div>
            <DatePicker
              label="Date de début"
              value={formData.dateDebut ? new Date(formData.dateDebut) : null}
              onChange={(date) => handleDateChange("dateDebut", date)}
              format="dd/MM/yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  variant: "outlined",
                  size: "small",
                } as any,
              }}
            />
          </div>

          <div>
            <DatePicker
              label="Date de fin"
              value={formData.dateFin ? new Date(formData.dateFin) : null}
              onChange={(date) => handleDateChange("dateFin", date)}
              format="dd/MM/yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  required: true,
                  variant: "outlined",
                  size: "small",
                } as any,
              }}
            />
          </div>
        </LocalizationProvider>

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
          disabled={loading}
          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-300"
        >
          {loading ? "Réservation en cours..." : "Réserver"}
        </button>

        {error && (
          <p className="text-red-500 text-center text-sm mt-2">
            Une erreur est survenue lors de la réservation.
          </p>
        )}
      </form>
    </div>
  );
}

