import { useState } from "react";
import { useTheme } from "./themeProvider";
import { FaSun, FaMoon } from "react-icons/fa";
import { FiMenu, FiX } from "react-icons/fi";
import logo from "../assets/log.svg";
import { useNavigate } from "react-router-dom";
import { useFetchData } from "@/utils/api";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  interface User {
    nom: string,
    prenom: string
  }
  const { data: user, loading, error } = useFetchData<User>(`${API_URL}/users/profile`);
  if (loading) return <p className="text-center mt-10">Chargement...</p>;

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/users/logout`, {
        method: "POST",
        credentials: "include",
      });
     navigate("/")
    } catch (err) {
      console.error("Erreur de déconnexion :", err);
    }
  };
  return (
    <nav
      className={`w-full h-18 relative z-[100] top-0 left-0 px-8  ${theme === "dark" ? "bg-gray-900 text-white" : "bg-white text-black"
        }`}
    >
      <div className="flex items-center justify-between p-4 gap-4">
        {/* Logo */}
        <img
          src={logo}
          alt="logoVoiture"
          className="h-12 rounded-full select-none"
        />

        {/* Liens Desktop */}
        <div className="hidden md:flex space-x-14 items-center">
          <a href="#howItWorks" className="hover:text-blue-500 font-semibold py-2">
            Comment ça marche
          </a>
          <a href="#whyChooseUs" className="hover:text-blue-500 font-semibold py-2">
            Pourquoi nous choisir
          </a>
          <a href="#contact" className="hover:text-blue-500 font-semibold py-2">
            Contactez-nous
          </a>
          {!loading && (
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-blue-500 font-bold">
                    Salut, {user.nom} {user.prenom}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white font-semibold px-4 py-2 rounded-xl hover:bg-red-600 transition"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-500 px-4 py-2 rounded-xl font-semibold text-white hover:bg-blue-600 transition"
                >
                  Connexion
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bouton Thème */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          {theme === "dark" ? (
            <FaSun className="text-yellow-400" />
          ) : (
            <FaMoon className="text-gray-700" />
          )}
        </button>

        {/* Menu Hamburger (mobile uniquement) */}
        <button
          className="md:hidden ml-2 text-2xl"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Menu mobile (overlay propre) */}
      {isOpen && (
        <div
          className={`absolute top-full left-0 w-full bg-white dark:bg-gray-900 flex flex-col items-center py-6 space-y-4 shadow-lg z-[99] transition-all duration-300`}
        >
          <a
            href="#about"
            onClick={() => setIsOpen(false)}
            className="hover:text-blue-500"
          >
            Comment ça marche
          </a>
          <a
            href="#services"
            onClick={() => setIsOpen(false)}
            className="hover:text-blue-500"
          >
            Pourquoi nous choisir
          </a>
          <a
            href="#contact"
            onClick={() => setIsOpen(false)}
            className="hover:text-blue-500"
          >
            Contact
          </a>
            {!loading && (
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  <span className="text-blue-500 font-bold">
                    Salut, {user.nom} {user.prenom}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="bg-red-500 text-white px-4 py-2 rounded-xl font-semibold hover:bg-red-600 transition"
                  >
                    Déconnexion
                  </button>
                </>
              ) : (
                <button
                  onClick={() => navigate("/login")}
                  className="bg-blue-500 px-4 py-2 rounded-xl font-semibold text-white hover:bg-blue-600 transition"
                >
                  Connexion
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
