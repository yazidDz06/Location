const { createClient } = require("redis");

const client = createClient();

client.on("error", (err) => console.error("❌ Redis error:", err));

async function connectRedis() {
  if (!client.isOpen) {
    await client.connect();
    console.log("✅ Redis connecté !");
  }
  return client;
}

module.exports = connectRedis;

