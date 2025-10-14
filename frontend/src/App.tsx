import { BrowserRouter, Routes, Route } from "react-router-dom"
import Home from "./pages/Home";
import { ThemeProvider } from "./components/themeProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CarsList from "./pages/Cars";
import LoginAdmin from "./pages/Admin/LoginAdmin";
import VoitureDetail from "./pages/CarsDetail";
import CarUpdate from "./pages/Admin/CarsUpdate";
import AllCars from "./pages/Admin/AllCarsGetCreate";
import CarDetailAdmin from "./pages/Admin/CarDetailAdmin";
export default function App() {


  return (

    <BrowserRouter>
      <ThemeProvider defaultTheme="system">
        <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/Register" element={<Register />} />
          <Route path="/Voitures" element={<CarsList />} />
          <Route path="/voitures/:id" element={<VoitureDetail />} />
          <Route path="/adminlog" element={<LoginAdmin />} />
          <Route path="/admin/cars" element={<AllCars />} />
          <Route path="/admin/cars/:id" element={<CarUpdate />} />
          <Route path="/admin/CarDetail/:id" element={<CarDetailAdmin />} />

        </Routes>
      </ThemeProvider>
    </BrowserRouter>

  )
}


