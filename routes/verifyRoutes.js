import express from "express";
import { verifyTicket } from "../controllers/verifyController.js";

const router = express.Router();

// Raspberry Pi sends scanned QR code to verify
router.post("/", verifyTicket);

export default router;
