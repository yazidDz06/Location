import { BrowserRouter,Routes,Route } from "react-router-dom"
import Home from "./pages/Home";
import { ThemeProvider } from "./components/themeProvider";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CarsList from "./pages/Cars";
import CarsAdmin from "./pages/Admin/CarsAdmin";
import VoitureDetailAdmin from "./pages/Admin/CarsDetail";
export default function App() {


  return (
    
      <BrowserRouter>
        <ThemeProvider  defaultTheme="system">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/Register" element={<Register />} />
             <Route path="/Voitures" element={<CarsList />} />
             <Route path="/carsAdmin" element={<CarsAdmin />} />
             <Route path="/carDetailAdmin" element={<VoitureDetailAdmin />} />
          </Routes>
        </ThemeProvider>
      </BrowserRouter>
   
  )
}


