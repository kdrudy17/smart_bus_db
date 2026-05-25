import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

// Global map to temporarily track payment statuses in memory
// Key: paymentId (string) -> Value: { status: "PENDING"|"SUCCESS"|"FAILED"|"TIMEOUT", transaction: null|Object }
const paymentStatusMap = new Map();

export const processPayment = async (req, res) => {
  const { phone, amount } = req.body;

  const mtnPrefixes = ["67", "650", "651", "652", "653", "654", "680", "681", "682", "683", "684"];
  const orangePrefixes = ["69", "655", "656", "657", "658", "659", "685", "686", "687", "688", "689"];

  // Normalize and detect provider
  const cleanPhone = phone?.replace(/^237/, "");
  let operator = "CM_MTNMOBILEMONEY";
  if (orangePrefixes.some(p => cleanPhone?.startsWith(p))) {
    operator = "CM_ORANGEMONEY";
  }

  try {
    const paymentRequest = {
      service: process.env.MONETBIL_SERVICE_KEY || "hX2MBNuuk7uj1giLmblYptxPqiDXfEUf", // Best practice: use .env
      phonenumber: phone,
      amount: amount,
      operator: operator,
      currency: "XAF",
      country: "CM",
    };

    // Step 1: Initiate payment request to Monetbil
    const placeResponse = await axios.post(
      "https://api.monetbil.com/payment/v1/placePayment",
      paymentRequest,
      { headers: { "Content-Type": "application/json" } }
    );

    const { paymentId, status } = placeResponse.data; 
    
    if (status !== "REQUEST_ACCEPTED") {
      return res.status(400).json({ message: "Payment initiation failed", status });
    }

    const stringPaymentId = String(paymentId);
    console.log("✅ Payment initiated on Monetbil for:", phone, "| ID:", stringPaymentId);

    // Initialize the status in our local state map
    paymentStatusMap.set(stringPaymentId, { status: "PENDING", transaction: null });

    // Step 2: Fire off the polling loop IN THE BACKGROUND. Do NOT use 'await' here.
    // This allows the function to keep running while we instantly return a response.
    checkStatusInBackground(stringPaymentId);

    // Step 3: Respond to your frontend IMMEDIATELY (Takes < 1 second, zero timeout risks)
    return res.status(200).json({
      message: "Payment initiated successfully",
      paymentId: stringPaymentId
    });

  } catch (err) {
    console.error("❌ Payment initiation error:", err.message);
    return res.status(500).json({
      message: "Payment initiation failed",
      error: err.message,
      details: err.response?.data,
    });
  }
};

/**
 * Worker function that runs asynchronously in the server background 
 * to monitor when a user inputs their PIN code.
 */
async function checkStatusInBackground(paymentId) {
  const maxAttempts = 15; // 15 attempts * 5s = 75 seconds total wait time

  for (let i = 0; i < maxAttempts; i++) {
    try {
      // Delay for 5 seconds before checking status
      await new Promise(resolve => setTimeout(resolve, 5000));

      const checkResponse = await axios.post(
        "https://api.monetbil.com/payment/v1/checkPayment",
        new URLSearchParams({ paymentId }), 
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const checkData = checkResponse.data;
      console.log(`Background check for ID ${paymentId} (Attempt ${i + 1}):`, checkData.message);

      if (checkData.message === "payment finish") {
        const transaction = checkData.transaction;
        
        if (transaction && transaction.status === 1) {
          paymentStatusMap.set(paymentId, { status: "SUCCESS", transaction });
          console.log(`💰 Payment ID ${paymentId} marked as SUCCESS`);
        } else {
          paymentStatusMap.set(paymentId, { status: "FAILED", transaction });
          console.log(`❌ Payment ID ${paymentId} marked as FAILED`);
        }
        return; // Break out of the background worker completely
      }
    } catch (error) {
      console.error(`Error during background poll for ID ${paymentId}:`, error.message);
    }
  }

  // If the loop finishes and it is still pending, mark it as a timeout
  if (paymentStatusMap.get(paymentId)?.status === "PENDING") {
    paymentStatusMap.set(paymentId, { status: "TIMEOUT", transaction: null });
    console.log(`⏱️ Payment ID ${paymentId} reached polling timeout.`);
  }
}

/**
 * Endpoint called repeatedly by your frontend to check the actual status
 */
export const verifyPaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const currentStatus = paymentStatusMap.get(String(paymentId));

  if (!currentStatus) {
    return res.status(404).json({ message: "No transaction history found for this ID" });
  }

  return res.status(200).json(currentStatus);
};
