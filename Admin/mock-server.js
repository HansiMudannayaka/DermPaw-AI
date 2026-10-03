import express from "express";
import cors from "cors";

const app = express();
const PORT = 4000;

// allow React dev server (http://localhost:3000) to call us
app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// -------------------------------------------------
// Mock data (replace with real DB / AI model later)
// -------------------------------------------------
let predictions = [
  {
    id: 1,
    pet: "Buddy",
    disease: "Mange",
    confidence: "98%",
    date: "2024‑07‑12",
  },
  {
    id: 2,
    pet: "Rocky",
    disease: "Ringworm",
    confidence: "94%",
    date: "2024‑07‑11",
  },
];

// -----------------------------------------------------------------
// Simulate live predictions: every 4 seconds push a new item
// -----------------------------------------------------------------
let nextId = 3;
setInterval(() => {
  const pets = ["Bella", "Max", "Luna", "Charlie"];
  const diseases = ["Dermatitis", "Fungal Infection", "Allergy"];
  const pet = pets[Math.floor(Math.random() * pets.length)];
  const disease = diseases[Math.floor(Math.random() * diseases.length)];
  const confidence = `${Math.floor(85 + Math.random() * 15)}%`;
  const date = new Date().toISOString().split("T")[0]; // YYYY‑MM‑DD

  predictions = [
    { id: nextId++, pet, disease, confidence, date },
    ...predictions.slice(0, 9), // keep only latest 10 items
  ];
}, 4000); // 4 s = “live” frequency

// -------------------------------------------------
// Static endpoints
// -------------------------------------------------
app.get("/api/stats", (req, res) => {
  res.json({
    totalUsers: "12,489",
    totalPets: "15,742",
    totalScans: "33,851",
    aiDetections: "1,243",
    doctors: "156",
    reviews: "48",
  });
});

app.get("/api/activities", (req, res) => {
  res.json([
    {
      pet: "Buddy",
      action: "Mange Detected",
      time: "2 min ago",
      color: "text-red-500",
    },
    {
      pet: "Rocky",
      action: "Ringworm Detected",
      time: "5 min ago",
      color: "text-orange-500",
    },
    {
      pet: "Bella",
      action: "Healthy",
      time: "12 min ago",
      color: "text-green-500",
    },
    {
      pet: "Max",
      action: "Dermatitis",
      time: "25 min ago",
      color: "text-purple-500",
    },
  ]);
});

// **Live predictions endpoint**
app.get("/api/predictions", (req, res) => {
  res.json(predictions); // returns the latest array (max 10)
});

app.listen(PORT, () => {
  console.log(`🚀 Mock server listening on http://localhost:${PORT}`);
});
