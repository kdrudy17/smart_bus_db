import pool from "../config/db.js";

export const verifyTicket = async (req, res) => {
  try {
    const { qrContent } = req.body; // e.g., "userId-formulaId-timestamp"

    // Search ticket by QR code content
    const [rows] = await pool.query("SELECT * FROM tickets");
    const ticket = rows.find((t) => t.qr_payload.includes(qrContent));

    if (!ticket) return res.status(404).json({ message: "Invalid QR code" });

    // Check expiration
    if (new Date(ticket.expires_at) < new Date()) {
      return res.status(400).json({ message: "Ticket expired" });
    }

    // Check remaining trips
    if (ticket.trips_remaining <= 0) {
      await pool.query("DELETE FROM tickets where trips_remaining = 0 and expires_at < NOW()");
      return res.status(400).json({ message: "No rides left" });
    }

    // Decrement ride count
    await pool.query("UPDATE tickets SET trips_remaining = trips_remaining - 1 WHERE id = ?", [
      ticket.id,
    ]);

    res.json({ message: "Access granted ✅", remaining: ticket.trips_remaining - 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
