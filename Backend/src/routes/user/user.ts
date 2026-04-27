import { Router } from "express";
import transporter from "../../service/email/email.js";
import bcrypt from "bcrypt";

import * as z from "zod";
import db from "../../service/Drizzle/index.js";
import { usersTable } from "../../service/Drizzle/db/schema.js";
import { eq } from "drizzle-orm";

const userRouter = Router();

const salRounds = 10;

const UserSchema = z.object({
  firstname: z.string(),
  lastname: z.string(),
  username: z.string(),
  email: z.email(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50)
    .regex(/[A-Z]/, "Must include uppercase letter")
    .regex(/[a-z]/, "Must include lowercase letter")
    .regex(/[0-9]/, "Must include number"),
});

userRouter.get("/ping", (req, res) => {
  res.status(200).json({
    message: "Hello form User (Tajinder)",
  });
});

userRouter.post("/auth/signup", async (req, res) => {
  const user = req.body.user;
  console.log(req.body);
  const email = user.email;
  try {
    const passedValidation = await UserSchema.safeParse(user);

    if(!passedValidation){
      res.json({
        message:"Some Error"
      })
    }
    const existing = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email));

    console.log(existing);

    if (existing.length > 0) {
      res.status(409).json({
        message: "User already Registered Please login ",
      });
      return;
    }
    const password = user.password;
    const hashedPassword = await bcrypt.hash(password, salRounds);
    user.password = hashedPassword;
    const savedUser = await db.insert(usersTable).values(user).returning();

    await transporter.sendMail({
      from: '"Krypto Funding" <no-reply.krypto-funding@tajinder.in>',
      to: email,
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

    res.status(200).json({
      message: "User created Successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error(error)
  }
});

userRouter.post("/auth/signin", async (req, res) => {
  console.log(req.body);
  const email = req.body.email;

  res.status(200).json("user Signed in success.");
});

export default userRouter;
