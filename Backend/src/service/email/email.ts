import nodemailer from "nodemailer";
import dotenv from "dotenv";
import type { UserType } from "../../validation/userSchema.js";

dotenv.config({
  path: "../.env",
});


const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: "a8ea0d001@smtp-brevo.com",
    pass: process.env.BREVO_SMTP_KEY,
  },
});


export interface EmailOptions {
  to?: string;
  subject: string;
  html: string;
}

export const sendEmail = async (data: EmailOptions) => {
  const recipient = data.to ;
  try {
    if (!recipient) {
    throw new Error("No recipient defined for email");
  }
  await transporter.sendMail({
    from: '"Krypto Funding" <no-reply.krypto-funding@tajinder.in>',
    to: recipient,
    subject: data.subject,
    html: data.html,
  });
  } catch (error) {
    console.log(error)
  }
};



export const sendWelocmeEmail = async (user: UserType) => {
  await transporter.sendMail({
    from: '"Krypto Funding" <no-reply.krypto-funding@tajinder.in>',
    to: user.email,
    subject: "Welcome to Krypto Funding 🚀",
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">

        <div style="max-width:600px; margin:auto; background:#ffffff; padding:30px; border-radius:10px;">

          <h2 style="color:#333;">Welcome to Krypto Funding, ${user.firstname}! 🎉</h2>

          <p style="font-size:16px; color:#555;">
            Hi <strong>${user.firstname + " " + user.lastname}</strong>,
          </p>

          <p style="font-size:16px; color:#555;">
            We’re excited to have you on board! 🚀
            Your journey towards smarter trading and funding starts here.
          </p>

          <p style="font-size:16px; color:#555;">
            At <strong>Krypto Funding</strong>, you can:
          </p>

          <ul style="color:#555; font-size:15px;">
            <li>📈 Practice funded trading accounts</li>
            <li>⚡ Trade with advanced tools on bybit</li>
            <li>💰 Scale your mindset efficiently</li>
          </ul>

          <div style="text-align:center; margin:30px 0;">
            <a href="https://krypto-funding.tajinder.in/client/dashboard"
               style="background:#4CAF50; color:white; padding:12px 20px; text-decoration:none; border-radius:5px;">
              Go to Dashboard
            </a>
          </div>

          <p style="font-size:14px; color:#777;">
            If you have any questions, feel free to reach out—we’re here to help.
          </p>

          <p style="font-size:14px; color:#777;">
            Cheers,<br/>
            <strong>Krypto Funding Team</strong>
          </p>

        </div>

        <p style="text-align:center; font-size:12px; color:#aaa; margin-top:10px;">
          © ${new Date().getFullYear()} Krypto Funding. All rights reserved.
        </p>

      </div>
    `,
  });
};

export const sendOtp = async (email:string,otp:string) => {
  await transporter.sendMail({
    from: '"Krypto Funding" <no-reply.krypto-funding@tajinder.in>',
    to: email,
    subject: "OTP for Login to your Krypto Funding Account.",
    html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>OTP Verification</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: #ffffff; padding: 20px; border-radius: 8px;">
    
    <h2 style="text-align: center; color: #333;">Verify Your Account</h2>
    
    <p style="font-size: 16px; color: #555;">
      Use the OTP below to complete your verification. This code is valid for 5 minutes.
    </p>
    
    <div style="text-align: center; margin: 20px 0;">
      <span style="display: inline-block; padding: 15px 25px; font-size: 24px; letter-spacing: 5px; background: #007bff; color: #ffffff; border-radius: 5px;">
        ${otp}
      </span>
    </div>
    
    <p style="font-size: 14px; color: #999;">
      If you did not request this, please ignore this email.
    </p>

  </div>
</body>
</html>`,
  });
};

export default transporter;
