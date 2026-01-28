import express from "express";
import { getFormulas, createFormula } from "../controllers/formulaController.js";

const router = express.Router();

// Get all formulas (e.g. 10 trips, 20 trips, etc.)
router.get("/", getFormulas);

// Add a new formula (admin)
router.post("/", createFormula);

export default router;
