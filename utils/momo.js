// src/utils/momo.js
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const { MOMO_CONSUMER_KEY, MOMO_API_USER , MOMO_API_KEY , MOMO_BASE_URL } = process.env;

// Get access token
export async function getAccessToken() { 
  const credentials = Buffer.from(`${MOMO_API_USER}:${MOMO_API_KEY}`).toString("base64"); 
  try { 
    const response = await axios.post(`${MOMO_BASE_URL}/collection/token/`, null,
      { 
        headers: { Authorization: `Basic ${credentials}`, "Ocp-Apim-Subscription-Key": MOMO_CONSUMER_KEY, }, }); 
        console.log("🔑 Access Token:", response.data.access_token); 
    return response.data.access_token; } 
  catch (err) { console.error("❌ Error getting MoMo token:", err.response?.data || err.message); throw err; } }
