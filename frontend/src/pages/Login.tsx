import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/voiture.svg";

export default function Login() {
    const navigate = useNavigate();
    const apiUrl = import.meta.env.VITE_API;

    type FormData = {
        numero: string,
        password: string
    }


    const [formData, setFormData] = useState<FormData>({
        numero: "",
        password: "",
    });


    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Si formData est null, on crée un nouvel objet vide au lieu de l'étendre
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        } as FormData));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();


        if (!formData) {
            console.error("Les champs ne sont pas remplis !");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/users/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
                credentials: "include",
            });

            if (!response.ok) {
                console.error("Erreur lors de la connexion");
                return;
            }

            const result = await response.json();
            console.log("Résultat :", result);
            navigate("/Voitures");
        } catch (error) {
            console.error("Erreur de connexion :", error);
        }
    };

    return (
        <div className="flex flex-col justify-center sm:h-screen p-4">
      <div className="max-w-md w-full mx-auto border border-gray-300 rounded-2xl p-8">
        <div className="text-center mb-12">
          <a href="/"><img
            src={logo} alt="logo" className="w-40 inline-block" />
          </a>
          <h1 className="text-blue font-semibold mt-3">Connexion a votre compte</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label className="text-slate-900 text-sm font-medium mb-2 block">Télephone</label>
              <input name="numero" type="text" 
              className="text-slate-900 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500" 
              placeholder="Entrez votre numéro"
              value={formData.numero}
              onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-slate-900 text-sm font-medium mb-2 block">Password</label>
              <input name="password" 
              type="password" 
               className="text-slate-900 bg-white border border-gray-300 w-full text-sm px-4 py-3 rounded-md outline-blue-500"
                placeholder="Entrez votre mot de passe"
                value={formData.password}
                onChange={handleChange}
                />
            </div>


            <div className="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" 
              className="h-4 w-4 shrink-0 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" />
              <label  className="text-slate-600 ml-3 block text-sm">
                I accept the <a href="javascript:void(0);"
                 className="text-blue-600 font-medium hover:underline ml-1">
                    Terms and Conditions</a>
              </label>
            </div>
          </div>

          <div className="mt-12">
            <button type="submit" className="w-full py-3 px-4 text-sm tracking-wider font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer">
              Connexion
            </button>
          </div>
          <p className="text-slate-600 text-sm mt-6 text-center">Pas de compte?
             <a href="/Register" className="text-blue-600 font-medium hover:underline ml-1">
                Inscrivez vous</a></p>
        </form>
      </div>
    </div>
    );
}
