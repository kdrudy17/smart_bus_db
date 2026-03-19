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

// ✅ Updated CORS to support multiple origins (Vercel, Netlify, localhost)
const allowedOrigins = [
  'https://bus-istama.netlify.app',
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
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

// ⚠️ Routes
app.use("/auth", authRoutes);
app.use("/formulas", formulaRoutes);
app.use("/tickets", ticketRoutes);
app.use("/scan", verifyRoutes);
app.use("/payments", paymentRoutes);

// ✅ Health check endpoint for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// ✅ EXPORT for Vercel serverless functions
export default app;