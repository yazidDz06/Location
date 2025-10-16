import { useNavigate, useParams } from "react-router-dom";
import { useFetchData } from "@/utils/api";
import type { Voiture } from "../CarsDetail";
import type { Users } from "@/utils/api";
import type { Reservation } from "../Formulaire";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function Dashboard() {
  const navigate = useNavigate();


  const {
    data: cars,
    loading: loadingCars,
    error: errorCars,
  } = useFetchData<Voiture[]>(`${API_URL}/voitures`);

 
  const {
    data: usersData,
    loading: loadingUsers,
    error: errorUsers,
  } = useFetchData< Users[] >(`${API_URL}/users/All`);

  
  const {
    data: reservations,
    loading: loadingReservations,
    error: errorReservations,
  } = useFetchData<Reservation[]>(`${API_URL}/appointments`);

  if (loadingCars || loadingUsers || loadingReservations) {
    return <p className="text-center mt-10">Chargement des données...</p>;
  }

  if (errorCars || errorUsers || errorReservations) {
    return (
      <p className="text-center text-red-500 mt-10">
        Erreur lors du chargement des données.
      </p>
    );
  }

  const totalVoitures = cars?.length || 0;
  const totalUsers = usersData?.length || 0;
  const totalReservations = reservations?.length || 0;

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cet utilisateur ?")) return;

    try {
      const res = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        credentials:"include"
      });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      alert("Utilisateur supprimé avec succès !");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la suppression.");
    }
  };

  return (
    <div className="p-10 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <h1 className="text-3xl font-bold text-center mb-10 dark:text-white">
        Tableau de bord
      </h1>

      {/* === Cartes statistiques === */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
        {/* Voitures */}
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center cursor-pointer hover:scale-105 transition-transform"
          onClick={() => navigate("/admin/cars")}
        >
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Voitures disponibles
          </h2>
          <p className="text-4xl font-bold text-blue-600 mt-3">
            {totalVoitures}
          </p>
        </div>

        {/* Utilisateurs */}
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center cursor-pointer hover:scale-105 transition-transform"
         
        >
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Utilisateurs enregistrés
          </h2>
          <p className="text-4xl font-bold text-green-600 mt-3">
            {totalUsers}
          </p>
        </div>

        {/* Réservations */}
        <div
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 text-center cursor-pointer hover:scale-105 transition-transform"
          onClick={() => navigate("/resAdmin")}
        >
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200">
            Réservations totales
          </h2>
          <p className="text-4xl font-bold text-orange-600 mt-3">
            {totalReservations}
          </p>
        </div>
      </div>

      {/* === Liste des utilisateurs === */}
      <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4 text-center">
          Liste des utilisateurs
        </h2>

        <table className="w-full text-sm text-left text-gray-600 dark:text-gray-300">
          <thead className="text-xs uppercase bg-gray-200 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Prénom</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">Date de naissance</th>
              <th className="px-4 py-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {usersData?.length ? (
              usersData.map((user,index) => (
                <tr
                  key={index}
                  className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                >
                  <td className="px-4 py-2">{user.nom}</td>
                  <td className="px-4 py-2">{user.prenom}</td>
                  <td className="px-4 py-2">{user.numero}</td>
                  <td className="px-4 py-2">{user.dateNaissance}</td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => handleDeleteUser(user._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-4 text-gray-500 dark:text-gray-400"
                >
                  Aucun utilisateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
