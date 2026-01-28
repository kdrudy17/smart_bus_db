import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import authRoutes from "./routes/authRoutes.js";
import formulaRoutes from "./routes/formulaRoutes.js";
import ticketRoutes from "./routes/ticketRoutes.js";
import verifyRoutes from "./routes/verifyRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import pool from "./config/db.js";

const app = express();

app.use(cors());
app.use(bodyParser.json());

// MySQL Connection Test
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/formulas", formulaRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/scan", verifyRoutes);
app.use("/api/payments", paymentRoutes);

// Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));

