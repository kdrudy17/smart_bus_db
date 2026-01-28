import { getAccessToken } from "../utils/momo.js";
import axios from "axios";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";
import { sendPaymentNotification } from "../utils/mailer.js";

dotenv.config();

const { MOMO_BASE_URL, MOMO_CONSUMER_KEY } = process.env;

export const processPayment = async (req, res) => {
  const { phone, amount } = req.body;

  try {
    const token = await getAccessToken();
    const referenceId = uuidv4();

    const paymentRequest = {
      amount,
      currency: "EUR", // or XAF if supported in production
      externalId: referenceId,
      payer: {
        partyIdType: "MSISDN",
        partyId: phone,
      },
      payerMessage: "Bus ticket payment",
      payeeNote: "Smart Bus System",
    };

    // Step 1: Initiate payment
    await axios.post(`${MOMO_BASE_URL}/collection/v1_0/requesttopay`, paymentRequest, {
      headers: {
        Authorization: `Bearer ${token}`,
        "X-Reference-Id": referenceId,
        "X-Target-Environment": "sandbox",
        "Ocp-Apim-Subscription-Key": MOMO_CONSUMER_KEY,
        "Content-Type": "application/json",
      },
    });

    console.log("✅ Payment request sent for:", phone);

    // Step 2: Check payment status
    const statusResponse = await axios.get(
      `${MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": MOMO_CONSUMER_KEY,
        },
      }
    );

   /* const status = statusResponse.data.status;
    console.log("📡 Payment status:", status);

    // Step 3: Notify owner if successful
    if (status === "SUCCESSFUL") {
      await sendPaymentNotification({ phone, amount, referenceId });
    }*/

    res.status(200).json({
      message: "Payment processed successfully",
      phone,
      amount,
      referenceId,
      /*status,*/
    });
  } catch (err) {
    console.error("❌ Payment error:", err.message);
    if (err.response) {
      console.error("MoMo API error:", err.response.data);
    }
    res.status(500).json({
      message: "Payment failed",
      error: err.message,
      details: err.response?.data,
    });
  }
};
