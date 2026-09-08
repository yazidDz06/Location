import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ThemeProvider } from "./components/themeProvider";
import RouteProtegee from "./components/RouteProtegee";
import { useAuth } from "./store/auth";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CarsList from "./pages/Cars";
import VoitureDetail from "./pages/CarsDetail";
import ReservationForm from "./pages/Formulaire";
import MesReservations from "./pages/MesReservations";

import LoginAdmin from "./pages/Admin/LoginAdmin";
import Dashboard from "./pages/Admin/Dashboard";
import AllCars from "./pages/Admin/AllCarsGetCreate";
import CarUpdate from "./pages/Admin/CarsUpdate";
import ReservationAdmin from "./pages/Admin/Reservations";

export default function App() {
  const initialiser = useAuth((etat) => etat.initialiser);

  // Une seule vérification de session au démarrage : les pages consomment
  // ensuite l'état du store au lieu d'appeler /users/profile chacune de leur
  // côté, comme c'était le cas auparavant.
  useEffect(() => {
    initialiser();
  }, [initialiser]);

  return (
    <BrowserRouter>
      <ThemeProvider defaultTheme="dark">
        <ToastContainer
          position="top-right"
          autoClose={3500}
          theme="dark"
          toastClassName="!rounded-xl !border !border-[var(--border)] !bg-[var(--surface)] !text-[var(--foreground)]"
        />

        <Routes>
          {/* ── Public ── */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/voitures" element={<CarsList />} />
          <Route path="/voitures/:id" element={<VoitureDetail />} />
          <Route path="/adminlog" element={<LoginAdmin />} />

          {/* ── Client connecté ── */}
          <Route
            path="/reservation/:id"
            element={
              <RouteProtegee>
                <ReservationForm />
              </RouteProtegee>
            }
          />
          <Route
            path="/mes-reservations"
            element={
              <RouteProtegee>
                <MesReservations />
              </RouteProtegee>
            }
          />

          {/* ── Administration ── */}
          <Route
            path="/admin"
            element={
              <RouteProtegee adminRequis>
                <Dashboard />
              </RouteProtegee>
            }
          />
          <Route
            path="/admin/voitures"
            element={
              <RouteProtegee adminRequis>
                <AllCars />
              </RouteProtegee>
            }
          />
          <Route
            path="/admin/voitures/:id"
            element={
              <RouteProtegee adminRequis>
                <CarUpdate />
              </RouteProtegee>
            }
          />
          <Route
            path="/admin/reservations"
            element={
              <RouteProtegee adminRequis>
                <ReservationAdmin />
              </RouteProtegee>
            }
          />

          {/* ── Anciennes URL conservées pour ne pas casser les liens ── */}
          <Route path="/Register" element={<Navigate to="/register" replace />} />
          <Route path="/Voitures" element={<Navigate to="/voitures" replace />} />
          <Route path="/dashboardAdmin" element={<Navigate to="/admin" replace />} />
          <Route path="/admin/cars" element={<Navigate to="/admin/voitures" replace />} />
          <Route path="/resAdmin" element={<Navigate to="/admin/reservations" replace />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ThemeProvider>
    </BrowserRouter>
  );
}
