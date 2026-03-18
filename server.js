import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

import authRoutes from "../routes/authRoutes.js";
import formulaRoutes from "../routes/formulaRoutes.js";
import ticketRoutes from "../routes/ticketRoutes.js";
import verifyRoutes from "../routes/verifyRoutes.js";
import paymentRoutes from "../routes/paymentRoutes.js";

import pool from "../config/db.js";

const app = express();

app.use(cors({
  origin: 'https://bus-istama.netlify.app',
  credentials: true
}));

app.use(bodyParser.json());

// DB test (runs on cold start)
(async () => {
  try {
    await pool.query("SELECT 1");
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
  }
})();

// ⚠️ IMPORTANT: REMOVE /api prefix here
app.use("/auth", authRoutes);
app.use("/formulas", formulaRoutes);
app.use("/tickets", ticketRoutes);
app.use("/scan", verifyRoutes);
app.use("/payments", paymentRoutes);

// ✅ EXPORT instead of listen
export default app;
