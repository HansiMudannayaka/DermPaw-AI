const dns = require("dns");
dns.setDefaultResultOrder("ipv4first"); // force IPv4 DNS resolution

const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const app = express();

/* ================= MIDDLEWARE ================= */
app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "50mb" }));         // large enough for base64 Grad-CAM in save requests
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

/* ================= TEST ================= */
app.get("/", (req, res) => {
  res.json({ message: "DermPaw API is running 🚀" });
});

/* ================= ROUTES ================= */
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/users");
const petRoutes          = require("./routes/petRoutes");
const articleRoutes      = require("./routes/articleRoutes");
const consultationRoutes = require("./routes/consultationRoutes");
const scanRoutes         = require("./routes/scanRoutes");
const agentRoutes        = require("./routes/agentRoutes");
const doctorRoutes       = require("./routes/doctorRoutes");
const adminRoutes        = require("./routes/adminRoutes");
const chatRoutes         = require("./routes/chatRoutes");

app.use("/api/auth",          authRoutes);
app.use("/api/users",         userRoutes);
app.use("/api/pets",          petRoutes);
app.use("/api/articles",      articleRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/scans",         scanRoutes);   // POST / GET scan history (existing)
app.use("/api/scan",          scanRoutes);   // POST /analyze and GET /ml-health (new)
app.use("/api/agent",         agentRoutes);
app.use("/api/doctor",        doctorRoutes);
app.use("/api/admin",         adminRoutes);
app.use("/api/chat",          chatRoutes);

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