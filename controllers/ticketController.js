import pool from "../config/db.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

// Helper to extract user from token
const getUserId = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return null;
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id;
};

// Buy a ticket
export const buyTicket = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const trips = req.body.trips;
    if (!trips) return res.status(400).json({ message: "Trips count is required" });

    const price = trips * 250;
    const durationDays = 365;

    const [[{ count }]] = await pool.query(
      `SELECT COUNT(*) AS count FROM formulas WHERE trips = ?`,
      [trips]
    );

    
   let formulaResult;

if (count === 0) {
  [formulaResult] = await pool.query(
    "INSERT INTO formulas (name, price, trips, duration_days) VALUES (?, ?, ?, ?)",
    [`Custom - ${trips} trips`, price, trips, durationDays]
  );
} else {
  [formulaResult] = await pool.query(
    "SELECT * FROM formulas WHERE trips = ?",
    [trips]
  );
}
    const formula_id = count === 0 ? formulaResult.insertId : formulaResult[0].id;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + durationDays);

    const qrContent = `${userId}-${formula_id}-${Date.now()}`;
    const qrImage = await QRCode.toDataURL(qrContent);

    await pool.query(
      "INSERT INTO tickets (user_id, formula_id, qr_code, trips_remaining, expires_at, qr_payload) VALUES (?, ?, ?, ?, ?, ?)",
      [userId, formula_id, qrImage, trips, expiresAt, qrContent]
    );

    res.status(201).json({
      message: "Ticket purchased successfully",
      qr_code: qrImage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Get all tickets for a user
export const getMyTickets = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const [tickets] = await pool.query(
      `SELECT t.id, f.name, f.price, t.trips_remaining, t.expires_at, t.qr_code 
       FROM tickets t 
       JOIN formulas f ON t.formula_id = f.id 
       WHERE t.user_id = ?`,
      [userId]
    );

    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
