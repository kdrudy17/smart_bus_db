import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.OWNER_EMAIL,
    pass: process.env.OWNER_EMAIL_PASSWORD
  }
});

export async function sendPaymentNotification({ phone, amount, referenceId }) {
  try {
    await transporter.sendMail({
      from: process.env.OWNER_EMAIL,
      to: process.env.OWNER_EMAIL,
      subject: "New MoMo Payment",
      text: `Payment of ${amount} XAF from ${phone}. Reference ID: ${referenceId}`
    });
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Payment notification sent");
    }
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
    throw err;
  }
}