import express from "express";
import { buyTicket, getMyTickets } from "../controllers/ticketController.js";

const router = express.Router();

// Buy a formula (creates a ticket & QR)
router.post("/buy", buyTicket);

// Get all tickets for the logged-in user
router.get("/my", getMyTickets);

export default router;
