const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ================= TEST ================= */
app.get("/", (req, res) => {
  res.json({ message: "DermPaw API is running 🚀" });
});

/* ================= ROUTES ================= */
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/users");

app.use("/api/auth", authRoutes);   // ✅ LOGIN + REGISTER
app.use("/api/users", userRoutes);  // ✅ CRUD

/* ================= DB ================= */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected ✅");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

/* ================= START ================= */
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running 🚀`);
    console.log(`http://localhost:${PORT}`);
  });
};

startServer();