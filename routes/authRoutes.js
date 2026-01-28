import express from "express";
import { register, login } from "../controllers/authController.js";

const router = express.Router();

// User registration
router.post("/register", register);

// User login
router.post("/login", login);

export default router;
