import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail", // or use SMTP config
  auth: {
    user: process.env.OWNER_EMAIL,
    pass: process.env.OWNER_EMAIL_PASSWORD
  }
});

export async function sendPaymentNotification({ phone, amount, referenceId }) {
  await transporter.sendMail({
    from: process.env.OWNER_EMAIL,
    to: process.env.OWNER_EMAIL, // send to app owner
    subject: "New MoMo Payment",
    text: `Payment of ${amount} XAF from ${phone}. Reference ID: ${referenceId}`
  });
}
