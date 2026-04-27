import nodemailer from "nodemailer";
import dotenv from "dotenv"

dotenv.config({
  path:"../.env"
})

console.log(process.env.BREVO_SMTP_KEY);

const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "a8ea0d001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY,
  },
});

export default transporter;
