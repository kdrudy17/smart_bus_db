import pool from "../config/db.js";

export const getFormulas = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM formulas");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createFormula = async (req, res) => {
  try {
    const { name, price, trips, duration_days } = req.body;
    await pool.query(
      "INSERT INTO formulas (name, price, trips, duration_days) VALUES (?, ?, ?, ?)",
      [name, price, trips, duration_days]
    );
    res.status(201).json({ message: "Formula created" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
