// src/routes/paymentRoutes.js
import express from "express";
import { processPayment } from "../controllers/paymentController.js";

const router = express.Router();

router.post("/pay", processPayment);

export default router;
