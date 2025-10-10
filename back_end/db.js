const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.DB_URL || "mongodb://127.0.0.1:27017/location", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(" MongoDB connecté !");
  } catch (error) {
    console.error(" Erreur connexion MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;

