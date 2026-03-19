import { getAccessToken } from "../utils/momo.js";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { sendPaymentNotification } from "../utils/mailer.js";

dotenv.config();

const { MOMO_BASE_URL, MOMO_CONSUMER_KEY } = process.env;
const REQUEST_TIMEOUT = 10000; // 10 seconds for MoMo API

export const processPayment = async (req, res) => {
  const { phone, amount } = req.body;

  try {
    // Input validation
    if (!phone || !amount) {
      return res.status(400).json({ message: "Phone and amount are required" });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: "Amount must be a positive number" });
    }

    const token = await getAccessToken();
    const referenceId = uuidv4();

    const paymentRequest = {
      amount: parseFloat(amount),
      currency: "EUR", // or XAF if supported in production
      externalId: referenceId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phone,
      },
      payerMessage: "Bus ticket payment",
      payeeNote: "Smart Bus System",
    };

    // Step 1: Initiate payment with timeout
    await axios.post(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      paymentRequest,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Reference-Id": referenceId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": MOMO_CONSUMER_KEY,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT
      }
    );

    console.log("✅ Payment request sent for:", phone, "Amount:", amount);

    // Step 2: Check payment status with timeout
    let statusResponse;
    try {
      statusResponse = await axios.get(
        `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "X-Target-Environment": "sandbox",
            "Ocp-Apim-Subscription-Key": MOMO_CONSUMER_KEY,
          },
          timeout: REQUEST_TIMEOUT
        }
      );
    } catch (statusErr) {
      // If status check fails, still return success (payment may be processing)
      console.warn("⚠️ Payment status check timeout - may be processing");
      statusResponse = { data: { status: "PENDING" } };
    }

    const status = statusResponse.data?.status || "PENDING";

    // Step 3: Notify owner if successful
    if (status === "SUCCESSFUL") {
      try {
        await sendPaymentNotification({ phone, amount, referenceId });
      } catch (notifyErr) {
        console.warn("⚠️ Payment notification failed:", notifyErr.message);
      }
    }

    console.log("📡 Payment status:", status);

    res.status(200).json({
      message: "Payment processed",
      status: status,
      phone,
      amount,
      referenceId,
      currency: "EUR"
    });
  } catch (err) {
    console.error("❌ Payment error:", err.message);
    if (err.response) {
      console.error("MoMo API error:", err.response.data);
    }
    
    res.status(500).json({
      message: "Payment failed",
      error: err.message,
      details: err.response?.data || null,
      referenceId: uuidv4()
    });
  }
};