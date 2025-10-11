import { useSendData } from "@/utils/api";
import type { Voiture } from "../CarsDetail";
import { useState, useEffect } from "react";
import {  useParams } from "react-router-dom";
import { toast } from "react-toastify";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export default function CarUpdateAndDelete(){
    type CarUpdate = Partial<Pick<Voiture, "prixParJour" | "kilometrage" | "disponible">>;

    const { id } = useParams<{ id: string }>();
    const { sendData, data, loading, error } = useSendData<CarUpdate, Voiture>(`${API_URL}/voitures/${id}`, "PUT");
 
    const [formData, setFormData] = useState<CarUpdate>({
        prixParJour:0,
        kilometrage:0,
        disponible:false,
    });
     useEffect(() => {
    if (data) {
      toast.success(" Voiture mise à jour avec succès !");
      console.log("Voiture mise à jour avec succès:", data);
    }
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(` Erreur lors de la mise à jour : ${error}`);
    }
  }, [error]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]: type === "checkbox" ? e.target.checked : value,
        });
    };
    const carToSend = {
    ...formData,
   
    prixParJour: Number(formData.prixParJour),
    kilometrage: Number(formData.kilometrage),
  };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        sendData(carToSend);
    };
    {loading && <p className="text-blue-500 text-center">Mise à jour en cours...</p>}
{error && <p className="text-red-500 text-center">{error}</p>}


    return(
       
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Mettre à jour les détails de la voiture
        </h1>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="prixParJour" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Prix par jour
            </label>
            <input
              type="number"
              id="prixParJour"
              name="prixParJour"
              value={formData.prixParJour}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="kilometrage" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Kilométrage
            </label>
            <input
              type="number"
              id="kilometrage"
              name="kilometrage"
              value={formData.kilometrage}
              onChange={handleChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            />
          </div>
          <div className="mb-4">
            <label htmlFor="disponible" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Disponible
            </label>
            <input
              type="checkbox"
              id="disponible"
              name="disponible"
              checked={formData.disponible}
              onChange={handleChange}
              className="mt-1 block h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white font-bold py-2 px-4 rounded-md shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            Mettre à jour
          </button>
        </form>
      </div>
    </div>
    )
}