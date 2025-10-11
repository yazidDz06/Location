import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePostData } from "@/utils/api";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

interface AdminLogin {
  numero: string;
  password: string;
}

interface LoginResponse {
  message: string;
}

export default function LoginAdmin() {
  const navigate = useNavigate();

  const { postData, loading, error } = usePostData<AdminLogin, LoginResponse>(
    `${API_URL}/users/login`
  );

  const [formData, setFormData] = useState<AdminLogin>({
    numero: "",
    password: "",
  });

  const [success, setSuccess] = useState<string | null>(null);

  // 🧩 Gestion des champs
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 🧭 Soumission du formulaire
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    const response = await postData(formData);
    console.log("Réponse backend :", response);

    if (response && response.message === "Connexion réussie") {
      setSuccess("Connexion réussie !");
      // Redirige directement après succès
      navigate("/admin/cars");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-6">
          Connexion administrateur
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Numéro
            </label>
            <input
              type="text"
              name="numero"
              placeholder="Numéro"
              value={formData.numero}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              name="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        {error && <p className="text-red-500 text-center mt-4">{error}</p>}
        {success && <p className="text-green-600 text-center mt-4">{success}</p>}
      </div>
    </div>
  );
}
