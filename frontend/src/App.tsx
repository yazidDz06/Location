import { BrowserRouter,Routes,Route } from "react-router-dom"
import Home from "./pages/Home";
import { ThemeProvider } from "./components/themeProvider";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CarsList from "./pages/Cars";
import LoginAdmin from "./pages/Admin/LoginAdmin";
import VoitureDetailAdmin from "./pages/CarsDetail";
import AllCars from "./pages/Admin/AllCarsGetCreate";
export default function App() {


  return (
    
      <BrowserRouter>
        <ThemeProvider  defaultTheme="system">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
             <Route path="/Voitures" element={<CarsList />} />
             <Route path="/voitures/:id" element={<VoitureDetailAdmin />} />
              <Route path="/adminlog" element={<LoginAdmin />} />
              <Route path="/admin/cars" element={<AllCars />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
   
  )
}


