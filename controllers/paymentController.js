import axios from "axios";

// Temporary in-memory status tracker (Replace with Database if you use one)
const paymentStatusMap = new Map();

export const processPayment = async (req, res) => {
  const { phone, amount } = req.body;
  
  const mtnPrefixes = ["67", "650", "651", "652", "653", "654", "680", "681", "682", "683", "684"];
  let operator = "CM_MTNMOBILEMONEY"; 
  if (!mtnPrefixes.some(p => phone?.replace(/^237/, "").startsWith(p))) {
    operator = "CM_ORANGEMONEY";
  }

  try {
    const paymentRequest = {
      service: process.env.MONETBIL_SERVICE_KEY,
      phonenumber: phone,
      amount: amount,
      operator: operator,
      currency: "XAF",
      country: "CM",
    };

    // Step 1: Initiate payment
    const placeResponse = await axios.post(
      "https://api.monetbil.com/payment/v1/placePayment",
      paymentRequest,
      { headers: { "Content-Type": "application/json" } }
    );

    const paymentId = String(placeResponse.data.paymentId);
    const status = placeResponse.data.status;

    if (status !== "REQUEST_ACCEPTED") {
      return res.status(400).json({ message: "Payment initiation failed", status });
    }

    console.log("✅ Payment initiated. paymentId:", paymentId);

    // Save initial status
    paymentStatusMap.set(paymentId, { status: "PENDING", transaction: null });

    // Start background checking loop WITHOUT holding the HTTP response
    checkStatusInBackground(paymentId);

    // Return IMMEDIATELY to the frontend (No timeout risk!)
    return res.status(200).json({
      message: "Payment initiated",
      paymentId
    });

  } catch (err) {
    console.error("❌ Payment error:", err.message);
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
};

// Background Poller
async function checkStatusInBackground(paymentId) {
  const maxAttempts = 15;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, 5000)); // wait 5 seconds
      
      const checkResponse = await axios.post(
        "https://api.monetbil.com/payment/v1/checkPayment",
        new URLSearchParams({ paymentId }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const checkData = checkResponse.data;
      console.log(`Background check ${i + 1} for ${paymentId}:`, checkData.message);

      if (checkData.message === "payment finish") {
        const txStatus = checkData.transaction?.status;
        if (txStatus === 1) {
          paymentStatusMap.set(paymentId, { status: "SUCCESS", transaction: checkData.transaction });
        } else {
          paymentStatusMap.set(paymentId, { status: "FAILED", transaction: checkData.transaction });
        }
        return; // End loop early on completion
      }
    } catch (error) {
      console.error(`Error during background poll for ${paymentId}:`, error.message);
    }
  }
  // If we exit the loop without a "payment finish", mark as timeout
  if (paymentStatusMap.get(paymentId)?.status === "PENDING") {
    paymentStatusMap.set(paymentId, { status: "TIMEOUT", transaction: null });
  }
}

// New endpoint to let the frontend verify status
export const verifyPaymentStatus = async (req, res) => {
  const { paymentId } = req.params;
  const currentStatus = paymentStatusMap.get(paymentId);

  if (!currentStatus) {
    return res.status(404).json({ message: "Payment records not found" });
  }

  return res.status(200).json(currentStatus);
};
