const express = require("express");
const connectRedis = require("../redis"); 
const router = express.Router();

// Charger Redis avant d'utiliser les routes
let redisClient;

(async () => {
  redisClient = await connectRedis();
})();

// Route pour obtenir le thème global
router.get("/", async (req, res) => {
  try {
    const theme = (await redisClient.get("theme")) || "light";
    res.json({ theme });
  } catch (err) {
    console.error("Erreur Redis GET:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Route pour mettre à jour le thème
router.post("/", async (req, res) => {
  try {
    const { theme } = req.body;

    if (theme !== "light" && theme !== "dark") {
      return res.status(400).json({ message: "Thème invalide" });
    }

    await redisClient.set("theme", theme);
    res.json({ message: "Thème mis à jour avec succès" });
  } catch (err) {
    console.error("Erreur Redis SET:", err);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

module.exports = router;
