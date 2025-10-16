import { useFetchData } from "@/utils/api";
import { useNavigate } from "react-router-dom";
import type { Voiture } from "../CarsDetail";
import type { Users } from "@/utils/api";
import { useState, useEffect } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

type StatutRes = "en_attente" | "confirmée" | "terminée" | "annulée";

interface ReservationAdminType {
  _id: string;
  client: Users | string;
  voiture: Voiture | string;
  adresse?: {
    ville?: string;
    commune?: string;
    rue?: string;
  };
  dateDebut: string;
  dateFin: string;
  prixTotal: number;
  statut: StatutRes;
}

export default function ReservationAdmin() {
  const { data, loading, error } = useFetchData<ReservationAdminType[]>(
    `${API_URL}/appointments`
  );
 

  const [reservations, setReservations] = useState<ReservationAdminType[]>([]);
  const [updating, setUpdating] = useState<string | null>(null);

 
  useEffect(() => {
    if (data) setReservations(data);
  }, [data]);

  
  const updateReservationStatus = async (id: string, statut: StatutRes, voitureId?: string) => {
    try {
      setUpdating(id);

      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour du statut");

      if (statut === "terminée" && voitureId) {
        await fetch(`${API_URL}/voitures/${voitureId}`, {
          method: "PATCH",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disponible: true }),
        });
      }

      setReservations((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, statut } : r
        )
      );
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdating(null);
    }
  };

  const handleCancelReservation = async (id: string) => {
    if (!confirm("Voulez-vous vraiment annuler cette réservation ?")) return;

    try {
      const response = await fetch(`${API_URL}/appointments/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: "annulée" }),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour.");

      alert("Réservation annulée avec succès.");

      
      setReservations((prev) =>
        prev.map((r) =>
          r._id === id ? { ...r, statut: "annulée" } : r
        )
      );
    } catch (error) {
      console.error("Erreur lors de l'annulation :", error);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen text-blue-600 font-semibold text-lg">
        Chargement des réservations...
      </div>
    );

  if (error)
    return (
      <div className="flex justify-center items-center h-screen text-red-500 font-semibold text-lg">
        Erreur lors du chargement des réservations
      </div>
    );

  if (!reservations || reservations.length === 0)
    return (
      <div className="flex justify-center items-center h-screen text-gray-500 text-lg">
        Aucune réservation trouvée.
      </div>
    );

  const getStatutStyle = (statut: StatutRes) => {
    switch (statut) {
      case "en_attente":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "confirmée":
        return "bg-green-100 text-green-700 border-green-300";
      case "terminée":
        return "bg-blue-100 text-blue-700 border-blue-300";
      case "annulée":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8 text-center">
        Liste des Réservations
      </h1>

      <div className="overflow-x-auto shadow-md rounded-xl bg-white dark:bg-gray-800">
        <table className="w-full text-left border-collapse">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-3">Client</th>
              <th className="px-6 py-3">Voiture</th>
              <th className="px-6 py-3">Adresse</th>
              <th className="px-6 py-3">Date Début</th>
              <th className="px-6 py-3">Date Fin</th>
              <th className="px-6 py-3">Prix Total</th>
              <th className="px-6 py-3 text-center">Statut</th>
              <th className="px-6 py-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {reservations.map((res, i) => {
              const voitureObj =
                typeof res.voiture === "object" ? res.voiture : null;
              const voitureLabel = voitureObj
                ? `${voitureObj.marque} ${voitureObj.modele}`
                : "—";

              const clientLabel =
                typeof res.client === "object"
                  ? `${res.client.nom || ""} ${res.client.prenom || ""}`
                  : res.client;

              return (
                <tr
                  key={i}
                  className={`border-b ${
                    i % 2 === 0
                      ? "bg-gray-50 dark:bg-gray-700"
                      : "bg-gray-100 dark:bg-gray-800"
                  } hover:bg-blue-50 dark:hover:bg-gray-600 transition`}
                >
                  <td className="px-6 py-3 font-medium text-gray-800 dark:text-gray-200">
                    {clientLabel}
                  </td>

                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {voitureLabel}
                  </td>

                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {res.adresse?.ville || "—"}, {res.adresse?.commune || ""}
                    <br />
                    <span className="text-sm text-gray-500">
                      {res.adresse?.rue || ""}
                    </span>
                  </td>

                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {new Date(res.dateDebut).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {new Date(res.dateFin).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-3 text-gray-700 dark:text-gray-300">
                    {res.prixTotal.toLocaleString()} DA
                  </td>

                  <td className="px-6 py-3 text-center">
                    <span
                      className={`px-3 py-1 rounded-full border text-sm font-semibold ${getStatutStyle(
                        res.statut
                      )}`}
                    >
                      {res.statut}
                    </span>
                  </td>

                  <td className="px-6 py-3 text-center space-x-3">
                    {res.statut === "en_attente" && (
                      <button
                        disabled={updating === res._id}
                        onClick={() =>
                          updateReservationStatus(res._id, "confirmée")
                        }
                        className="text-green-600 hover:underline font-semibold"
                      >
                        {updating === res._id ? "..." : "Confirmer"}
                      </button>
                    )}

                    {res.statut !== "annulée" && res.statut !== "terminée" && (
                      <button
                        disabled={updating === res._id}
                        onClick={() => handleCancelReservation(res._id)}
                        className="text-red-600 hover:underline font-semibold"
                      >
                        {updating === res._id ? "..." : "Annuler"}
                      </button>
                    )}

                    {res.statut === "confirmée" && (
                      <button
                        disabled={updating === res._id}
                        onClick={() =>
                          updateReservationStatus(
                            res._id,
                            "terminée",
                            typeof res.voiture === "object"
                              ? res.voiture._id
                              : undefined
                          )
                        }
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        {updating === res._id ? "..." : "Terminer"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
