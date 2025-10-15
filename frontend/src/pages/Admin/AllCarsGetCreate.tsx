import { useState, useEffect } from "react";
import { useFetchData, usePostData } from "@/utils/api";
import type { Voiture } from "../CarsDetail";
import { useNavigate } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function AllCars() {


 

  const navigate = useNavigate();
  const { data: carsData, loading, error } = useFetchData<Voiture[]>(`${API_URL}/voitures`);
  const { postData, loading: posting, error: postError } = usePostData<Voiture, Voiture>(`${API_URL}/voitures`);

  const [cars, setCars] = useState<Voiture[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (carsData) setCars(carsData);
  }, [carsData]);


  const [formData, setFormData] = useState<Voiture>({
    marque: "",
    modele: "",
    annee: 2020,
    type: "essence",
    immatriculation: "",
    prixParJour: 0,
    disponible: true,
    kilometrage: 0,
    imageUrl: "",
  });

  //  Gestion des changements généraux
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type } = target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? target.checked : value,
    });
  };

  //  Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Conversion manuelle des champs numériques
    const carToSend = {
      ...formData,
      annee: Number(formData.annee),
      prixParJour: Number(formData.prixParJour),
      kilometrage: Number(formData.kilometrage),
    };

    const newCar = await postData(carToSend);

    if (newCar) {
      setCars((prev) => [...prev, newCar]);
      setFormData({
        marque: "",
        modele: "",
        annee: 2020,
        type: "essence",
        immatriculation: "",
        prixParJour: 0,
        disponible: true,
        kilometrage: 0,
        imageUrl: "",
      });
      setIsOpen(false);
    }
  };

  if (loading) return <p className="text-center mt-10">Chargement...</p>;
  if (error) return <p className="text-center text-red-500 mt-10 font-bold">Erreur : {error}</p>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <main className="flex-grow container mx-auto px-6 py-10">

        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Liste des voitures disponibles
          </h1>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {isOpen ? "Fermer" : "Ajouter voiture"}
          </button>
        </div>


        {isOpen && (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <input
                type="text"
                name="marque"
                placeholder="Marque"
                value={formData.marque}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="text"
                name="modele"
                placeholder="Modèle"
                value={formData.modele}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="number"
                name="annee"
                placeholder="Année"
                value={formData.annee}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="border p-2 rounded w-full"
              >
                <option value="essence">essence</option>
                <option value="diesel">diesel</option>
                <option value="hybride">hybride</option>

              </select>
              <input
                type="text"
                name="immatriculation"
                placeholder="Immatriculation"
                value={formData.immatriculation}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="number"
                name="prixParJour"
                placeholder="Prix par jour"
                value={formData.prixParJour}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="number"
                name="kilometrage"
                placeholder="Kilométrage"
                value={formData.kilometrage}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <input
                type="text"
                name="imageUrl"
                placeholder="URL de l'image"
                value={formData.imageUrl}
                onChange={handleChange}
                className="border p-2 rounded w-full"
                required
              />
              <label className="flex items-center space-x-2 mt-2">
                <input
                  type="checkbox"
                  name="disponible"
                  checked={formData.disponible}
                  onChange={handleChange}
                  className="w-4 h-4"
                />
                <span className="text-gray-700 dark:text-gray-300">Disponible</span>
              </label>
            </div>

            <button
              type="submit"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg"
              disabled={posting}
            >
              {posting ? "Ajout..." : "Enregistrer"}
            </button>

            {postError && <p className="text-red-500 mt-2">{postError}</p>}
          </form>
        )}


        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {cars.map((car, index) => (
            <div

              className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:scale-[1.02] transition-transform"
              key={car._id || car._id || index}
              onClick={() => navigate(`/admin/CarDetail/${car._id}`)}

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
                <p className="text-gray-600 dark:text-gray-300">
                  {car.annee} • {car.type}
                </p>
                <p className="text-blue-600 font-semibold dark:text-blue-400 mt-2">
                  {car.prixParJour} DA / jour
                </p>
                <p
                  className={`mt-1 font-semibold ${car.disponible ? "text-green-600" : "text-red-500"
                    }`}
                >
                  {car.disponible ? "Disponible" : "Non disponible"}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
