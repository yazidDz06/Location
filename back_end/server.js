const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const connectDB = require("./db");
const app = express();
const PORT = process.env.PORT || 5000; 
const cookieParser = require("cookie-parser");
const cors = require("cors");
app.use(cors({
  origin: "http://localhost:5173", 
  credentials: true, 
}));

app.use(cookieParser());
app.use(express.json());

const voitureRoutes = require("./routes/voitureRoute");
const userRoutes = require("./routes/userRoute");
const ReservationRoute = require("./routes/reservationRoute");

connectDB();

app.use("/voitures", voitureRoutes);
app.use("/users",userRoutes);
app.use("/appointments",ReservationRoute);

app.listen(PORT, () => {
  console.log(` Server running on port ${PORT}`);
});
