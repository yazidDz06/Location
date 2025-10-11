import { BrowserRouter,Routes,Route } from "react-router-dom"
import Home from "./pages/Home";
import { ThemeProvider } from "./components/themeProvider";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CarsList from "./pages/Cars";
import LoginAdmin from "./pages/Admin/LoginAdmin";
import VoitureDetailAdmin from "./pages/CarsDetail";
import AllCars from "./pages/Admin/AllCarsGetCreate";
import CarUpdateAndDelete from "./pages/Admin/CarsUpdateAndDelete";
export default function App() {


  return (
    
      <BrowserRouter>
        <ThemeProvider  defaultTheme="system">
             <ToastContainer position="top-right" autoClose={3000} theme="colored" />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
             <Route path="/Voitures" element={<CarsList />} />
             <Route path="/voitures/:id" element={<VoitureDetailAdmin />} />
              <Route path="/adminlog" element={<LoginAdmin />} />
              <Route path="/admin/cars" element={<AllCars />} />
              <Route path="/admin/cars/:id" element={<CarUpdateAndDelete />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
   
  )
}


