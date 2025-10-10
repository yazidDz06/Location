import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/voiture.svg";

export default function Register(){
     const navigate= useNavigate();
     const apiUrl = import.meta.env.VITE_API;
    interface newUser {
         nom : string,
         prenom: string,
         numero : string,
         dateNaissance:string,
         password: string
    }
    const[data,setData]=useState<newUser>({
        nom:"",
        prenom:"",
        numero:"",
        dateNaissance:"",
        password:""})
          const [confirmPassword, setConfirmPassword] = useState<string>("");

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setData((prev) => ({
            ...prev,
            [name]: value,
        } as newUser));
    };  
    const handleSubmit = async (e:React.FormEvent<HTMLFormElement>) =>{
         e.preventDefault();
          if (data.password !== confirmPassword) {
      alert("Les mots de passe ne correspondent pas !");
      return;
    }


        if (!data) {
            console.error("Les champs ne sont pas remplis !");
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/users/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
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
    }
     
    return(
        <div className="max-w-4xl max-sm:max-w-lg mx-auto p-6 mt-6">
            
      <div className="text-center mb-12 sm:mb-16">
        <a href="javascript:void(0)"><img
          src={logo} alt="logo" 
          className='w-44 inline-block rounded-2xl mt-3' />
        </a>
        <h4 className="text-slate-600 text-base mt-3">Sign up into your account</h4>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid sm:grid-cols-2 gap-8">
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">Nom</label>
            <input name="nom" type="text"
              value={data.nom} 
              onChange={handleChange}
            className="bg-slate-100 w-full text-slate-900 text-sm px-4 py-3 rounded-md focus:bg-transparent outline-blue-500 transition-all" 
            placeholder="Votre Nom" />
          </div>
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">Prenom</label>
            <input name="prenom" type="text" 
            value={data.prenom}
            onChange={handleChange}
            className="bg-slate-100 w-full text-slate-900 text-sm px-4 py-3 rounded-md focus:bg-transparent outline-blue-500 transition-all" 
            placeholder="Votre prénom" />
          </div>
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">Numero</label>
            <input name="numero" type="text"
             value={data.numero}
             onChange={handleChange}
            className="bg-slate-100 w-full text-slate-900 text-sm px-4 py-3 rounded-md focus:bg-transparent outline-blue-500 transition-all"
             placeholder="Numéro télephone" />
          </div>
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">Date Naiss</label>
            <input name="dateNaissance" type="text"
             value={data.dateNaissance}
             onChange={handleChange}
            className="bg-slate-100 w-full text-slate-900 text-sm px-4 py-3 rounded-md focus:bg-transparent outline-blue-500 transition-all" 
            placeholder="JJ-MM-AAAA" />
          </div>
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">Password</label>
            <input name="password" type="password"
             value={data.password}
             onChange={handleChange}
            className="bg-slate-100 w-full text-slate-900 text-sm px-4 py-3 rounded-md focus:bg-transparent outline-blue-500 transition-all" 
            placeholder="Créez un mot de passe" />
          </div>
          <div>
            <label className="text-slate-900 text-sm font-medium mb-2 block">Confirm Password</label>
                        <input
              name="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-100 w-full text-slate-900 text-sm px-4 py-3 rounded-md focus:bg-transparent outline-blue-500 transition-all"
              placeholder="Confirmez votre mot de passe"
              required
            />

          </div>
        </div>

        <div className="mt-12">
          <button type="submit" className="mx-auto block min-w-32 py-3 px-6 text-sm font-medium tracking-wider rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none cursor-pointer">
            Sign up
          </button>
        </div>
      </form>
    </div>
    )
}