import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

export const processPayment = async (req, res) => {
  const { phone, amount } = req.body;

  const mtnPrefixes = ["67", "650", "651", "652", "653", "654", "680", "681", "682", "683", "684"];
  const orangePrefixes = ["69", "655", "656", "657", "658", "659", "685", "686", "687", "688", "689"];

  const prefix = phone?.replace(/^237/, "").substring(0, 2);
  let operator = "CM_MTNMOBILEMONEY";
  if (orangePrefixes.some(p => phone?.replace(/^237/, "").startsWith(p))) {
    operator = "CM_ORANGEMONEY";
  }

  try {
    const paymentRequest = {
      service: "hX2MBNuuk7uj1giLmblYptxPqiDXfEUf",
      phonenumber: phone,
      amount: amount,
      operator: operator,
      currency: "XAF",
      country: "CM",
    };

    const placeResponse = await axios.post(
      "https://api.monetbil.com/payment/v1/placePayment",
      paymentRequest,
      { headers: { "Content-Type": "application/json" } }
    );

    const { paymentId, status } = placeResponse.data; 
    
    if (status !== "REQUEST_ACCEPTED") {
      return res.status(400).json({ message: "Payment initiation failed", status });
    }

    console.log("✅ Payment request sent for:", phone, "| paymentId:", paymentId);

    let transaction = null;
    const maxAttempts = 10;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));

      const checkResponse = await axios.post(
        "https://api.monetbil.com/payment/v1/checkPayment",
        new URLSearchParams({ paymentId: String(paymentId) }), // form-encoded
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );

      const checkData = checkResponse.data;
      console.log(`🔄 Check attempt ${i + 1}:`, checkData.message);

      if (checkData.message === "payment finish") {
        transaction = checkData.transaction;
        break;
      }
    }

    if (!transaction) {
      return res.status(202).json({ message: "Payment pending or timed out", paymentId });
    }

    if (transaction.status == 1) {
      return res.status(200).json({
        message: "Payment processed successfully",
        phone,
        amount,
        paymentId,
        transaction,
      });
    } else {
      return res.status(400).json({
        message: transaction.status === -1 ? "Payment cancelled" : "Payment failed",
        transaction,
      });
    }

  } catch (err) {
    console.error("❌ Payment error:", err.message);
    res.status(500).json({
      message: "Payment failed",
      error: err.message,
      details: err.response?.data,
    });
  }
};
