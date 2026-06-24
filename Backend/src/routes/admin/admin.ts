

import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../../service/Drizzle/index.js";
import { usersTable, adminsTable, challanges } from "../../service/Drizzle/db/schema.js";
import { eq } from "drizzle-orm";
import { sendWelocmeEmail } from "../../service/email/email.js";
import sendOtpService from "../../service/OTP/sendOtpService.js";
import redis from "../../Utils/redisClient.js";
import { hashOtp } from "../../Utils/Otp.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserSchema } from "../../validation/userSchema.js";
import adminMiddleware from "./middleware/adminMiddlewere.js";

dotenv.config({
  path: "../../.env",
});

const adminRouter= Router();


const salRounds = 10;

adminRouter.get("/ping", (req, res) => {
  res.status(200).json({
    message: "Hello form Admin (Tajinder)",
  });
});

adminRouter.post("/auth/signup", async (req, res) => {
  try {
    const result = UserSchema.safeParse(req.body.user);

    if (!result.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: result.error.issues,
      });
      return;
    }

    const validatedUser = result.data;

    const existing = await db
      .select()
      .from(adminsTable)
      .where(eq(adminsTable.email, validatedUser.email));

    if (existing.length > 0) {
      res.status(409).json({
        message: "Admin already Registered Please login ",
      });
      return;
    }
    validatedUser.password = await bcrypt.hash(validatedUser.password, salRounds);
    const savedUser = await db.insert(adminsTable).values(validatedUser).returning();

    await sendWelocmeEmail(validatedUser);

    res.status(200).json({
      message: "User created Successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error(error);
  }
});

adminRouter.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const key = `admin_otp:${email}`;
  const stored = await redis.get(key);

  if (!stored) {
    return res.status(400).json({
      message: "OTP expired or invalid",
    });
  }

  const attemptsKey = `admin_otp_attempts:${email}`;

  const attempts = await redis.incr(attemptsKey);

  if (attempts === 1) await redis.expire(attemptsKey, 300);
  if (attempts > 3) {
    await redis.del(key);
    return res.status(429).json({ message: "Too many requests" });
  }

  if (hashOtp(otp) != stored) {
    return res.status(400).json({
      message: "OTP is invalid",
    });
  }

  await redis.del(key);
  await redis.del(attemptsKey);

  const [user] = await db
    .select({
      id: adminsTable.id,
      firstname: adminsTable.firstname,
      lastname: adminsTable.lastname,
      email: adminsTable.email,
      username: adminsTable.username,
    })
    .from(adminsTable)
    .where(eq(adminsTable.email, email));

  const accessToken = jwt.sign({ user }, process.env.JWT_SECRET!, {
    expiresIn: "6h",
  });

  const refreshToken = jwt.sign({ user }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  await redis.set(`admin_session:${email}`, refreshToken, { ex: 7 * 24 * 3600 });

  res.status(200).json({
    message: "Authenticated",
  });
});

adminRouter.post("/auth/refresh", async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.sendStatus(401);

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    const stored = await redis.get(`admin_session:${payload.user.email}`);
    if (stored !== token) return res.sendStatus(403);

    const newAccessToken = jwt.sign(
      { user: payload.user },
      process.env.JWT_SECRET!,
      { expiresIn: "15m" },
    );

    const newRefreshToken = jwt.sign(
      { user: payload.user },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "7d" },
    );

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await redis.set(`admin_session:${payload.user.email}`, newRefreshToken, { ex: 7 * 24 * 3600 });

    res.json({ message: "Refreshed" });
  } catch {
    res.sendStatus(403);
  }
});

adminRouter.post("/auth/logout", async (req, res) => {
  const token = req.cookies.refreshToken;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
      await redis.del(`admin_session:${payload.user.email}`);
    } catch {}

  }

  const isProduction = process.env.NODE_ENV === "production";

  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

adminRouter.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  const existing = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.email, email));

  if (existing.length === 0) {
    res.status(404).json({
      message: "Admin not registered. Please sign up.",
    });
    return;
  }

  try {
    await sendOtpService(email, 'admin');
    res.status(200).json({
      message: "OTP sent to your E-Mail",
    });
  } catch (err) {
    res.status(429).json({
      message: err,
    });
  }
});

adminRouter.post("/auth/signin", async (req, res) => {
  const email = req.body.user.email;
  const password = req.body.user.password;

  const existing = await db
    .select()
    .from(adminsTable)
    .where(eq(adminsTable.email, email));

  if (existing.length === 0) {
    res.status(404).json({
      message: "Admin not registered. Please sign up.",
    });
    return;
  }

  const authenticate = await bcrypt.compare(password, existing[0]!.password);

  if (!authenticate) {
    res.status(401).json({
      message: "Invalid credentials",
    });
    return;
  }

  try {
    await sendOtpService(email, 'admin');

    return res.status(200).json({
      message: "OTP sent to Registered E-Mail",
    });
  } catch (error) {
    res.status(429).json({
      message: error,
    });
  }
});




adminRouter.post("/create/challenge",adminMiddleware,async(req,res)=>{
    const data = req.body;


    const {title ,description ,price, value, steps, drawdown, target }= data;
    
    if(!title || !description || !price){
        return res.status(400).json({
            message:"All fields are required"
        });
    }

    const creator_id = (req as any).user_id.user.id;


    try {
        const challenge = await db.insert(challanges).values({
            title,
            description,
            price,
            creator_id,
            value,
            steps: steps ?? 1,
            drawdown: drawdown ?? 10,
            target: target ?? 10
        }).returning();


        res.status(200).json({
            message:"Challenge created successfully."
        })

    }catch(e){
        console.error(e)
    }

})

adminRouter.get("/challenges", async (_req, res) => {
  try {
    const allChallenges = await db.select().from(challanges);
    res.status(200).json(allChallenges);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch challenges" });
  }
});

adminRouter.get("/challenge/:id", async (req, res) => {
  try {
    const id = req.params.id as string;
    const [challenge] = await db
      .select()
      .from(challanges)
      .where(eq(challanges.id, id));

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json(challenge);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch challenge" });
  }
});

adminRouter.put("/challenge/:id", adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const { title, description, price, steps, drawdown, target } = req.body;

    const [updated] = await db
      .update(challanges)
      .set({ title, description, price, steps, drawdown, target, updated_at: new Date() })
      .where(eq(challanges.id, id))
      .returning(); 

    if (!updated) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json({ message: "Challenge updated successfully", challenge: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update challenge" });
  }
});

adminRouter.delete("/challenge/:id", adminMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;

    const [deleted] = await db
      .delete(challanges)
      .where(eq(challanges.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    res.status(200).json({ message: "Challenge deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete challenge" });
  }
});

export default adminRouter;
