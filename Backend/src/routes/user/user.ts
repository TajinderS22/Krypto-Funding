import { Router } from "express";
import bcrypt from "bcrypt";
import db from "../../service/Drizzle/index.js";
import {
  challenges,
  usersTable,
  challengeStatus,
  purchases,
  apiKeys,
} from "../../service/Drizzle/db/schema.js";
import { eq, and, sql } from "drizzle-orm";
import { sendWelocmeEmail } from "../../service/email/email.js";
import sendOtpService from "../../service/OTP/sendOtpService.js";
import userMiddleware from "./middleware/middleware.js";
import redis from "../../Utils/redisClient.js";
import { hashOtp } from "../../Utils/Otp.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { UserSchema } from "../../validation/userSchema.js";
import { encrypt } from "../../service/encryption/encrypt.js";
import { decrypt } from "../../service/encryption/decrypt.js";
import { createLanguageService } from "typescript";
import createClient from "../../service/bybit/createClient.js";
import clients from "../../Utils/clients.js";

dotenv.config({
  path: "../../.env",
});

const userRouter = Router();

const salRounds = 10;

userRouter.get("/ping", (req, res) => {
  res.status(200).json({
    message: "Hello form User (Tajinder)",
  });
});

userRouter.post("/auth/signup", async (req, res) => {
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
      .from(usersTable)
      .where(eq(usersTable.email, validatedUser.email));

    if (existing.length > 0) {
      res.status(409).json({
        message: "User already Registered Please login ",
      });
      return;
    }
    validatedUser.password = await bcrypt.hash(
      validatedUser.password,
      salRounds,
    );
    const savedUser = await db
      .insert(usersTable)
      .values(validatedUser)
      .returning();

    await sendWelocmeEmail(validatedUser);

    res.status(200).json({
      message: "User created Successfully",
      user: savedUser,
    });
  } catch (error) {
    console.error(error);
  }
});

userRouter.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const key = `otp:${email}`;
  const stored = await redis.get(key);

  if (!stored) {
    return res.status(400).json({
      message: "OTP expired or invalid",
    });
  }

  const attemptsKey = `otp_attempts:${email}`;

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
      id: usersTable.id,
      firstname: usersTable.firstname,
      lastname: usersTable.lastname,
      email: usersTable.email,
      username: usersTable.username,
    })
    .from(usersTable)
    .where(eq(usersTable.email, email));

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

  await redis.set(`session:${email}`, refreshToken, { ex: 7 * 24 * 3600 });

  res.status(200).json({
    message: "Authenticated",
  });
});

userRouter.post("/auth/refresh", async (req, res) => {
  const token = req.cookies.refreshToken;

  if (!token) return res.sendStatus(401);

  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;

    const stored = await redis.get(`session:${payload.user.email}`);
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

    await redis.set(`session:${payload.user.email}`, newRefreshToken, {
      ex: 7 * 24 * 3600,
    });

    res.json({ message: "Refreshed" });
  } catch {
    res.sendStatus(403);
  }
});

userRouter.post("/auth/send-otp", async (req, res) => {
  const { email } = req.body;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing.length === 0) {
    res.status(404).json({
      message: "User not Registered Please Signup.",
    });
    return;
  }

  try {
    await sendOtpService(email);
    res.status(200).json({
      message: "OTP sent to your E-Mail",
    });
  } catch (err) {
    res.status(429).json({
      message: err,
    });
  }
});

userRouter.post("/auth/signin", async (req, res) => {
  const email = req.body.user.email;
  const password = req.body.user.password;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email));

  if (existing.length === 0) {
    res.status(404).json({
      message: "User not Registered Please Signup.",
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
    await sendOtpService(email);

    return res.status(200).json({
      message: "OTP sent to Registered E-Mail",
    });
  } catch (error) {
    res.status(429).json({
      message: error,
    });
  }
});

userRouter.get("/challenges", async (req, res) => {
  const result = await db.select().from(challenges);

  res.status(200).json({
    challenges: result,
  });
});

userRouter.get(
  "/challenges/my-challenges",
  userMiddleware,
  async (req, res) => {
    try {
      const userId = (req as any).user_id.user.id;

      const myChallenges = (await db
        .select({
          purchase_id: purchases.id,
          purchase_date: purchases.purchase_date,
          status: {
            id: challengeStatus.id,
            status: challengeStatus.status,
            passed: challengeStatus.passed,
            currentStepStatus: challengeStatus.currentStepStatus,
            value: challengeStatus.value,
            currentBalance: challengeStatus.current_balance,
            steps: challengeStatus.steps,
            hasApiKey: challengeStatus.has_api_key,
            updated_at: challengeStatus.updated_at,
          },
          challenge: {
            id: challenges.id,
            creator_id: challenges.creator_id,
            title: challenges.title,
            description: challenges.description,
            value: challenges.value,
            price: challenges.price,
            steps: challenges.steps,
            drawdown: challenges.drawdown,
            target: challenges.target,
            created_at: challenges.created_at,
            updated_at: challenges.updated_at,
          },
        })
        .from(purchases)
        .innerJoin(
          challengeStatus,
          and(
            eq(challengeStatus.user_id, purchases.user_id),
            eq(challengeStatus.challenge_id, purchases.challenge_id),
            eq(challengeStatus.purchase_id, purchases.id),
          ),
        )
        .innerJoin(challenges, eq(challenges.id, purchases.challenge_id))
        .where(eq(purchases.user_id, userId))) as {
        purchase_id: number;
        purchase_date: Date | null;
        status: {
          id: number;
          status: string;
          passed: boolean;
          currentStepStatus: number | null;
          steps: number | null;
          hasApiKey: boolean;
          updated_at: Date | null;
        };
        challenge: {
          id: string;
          creator_id: number;
          title: string;
          description: string | null;
          value: number | null;
          price: string | null;
          steps: number | null;
          drawdown: number | null;
          target: number | null;
          created_at: Date | null;
          updated_at: Date | null;
        };
      }[];

      const active = myChallenges.filter((mc) => mc.status.status === "active");
      const failed = myChallenges.filter((mc) => mc.status.status === "failed");
      const passed = myChallenges.filter((mc) => mc.status.status === "passed");

      console.log(myChallenges.length);

      res.status(200).json({ active, failed, passed });
    } catch (error) {
      console.error("Error fetching my challenges:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
);

userRouter.post("/challenges/buy", userMiddleware, async (req, res) => {
  try {
    const { challengeId } = req.body;
    const userId = (req as any).user_id.user.id;

    if (!challengeId) {
      return res.status(400).json({ message: "challengeId is required" });
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    const [purchase] = await db
      .insert(purchases)
      .values({
        user_id: userId,
        challenge_id: challengeId,
      })
      .returning();

    const [status] = await db
      .insert(challengeStatus)
      .values({
        user_id: userId,
        challenge_id: challengeId,
        status: "active",
        passed: false,
        currentStepStatus: 1,
        steps: challenge.steps ?? 1,
        purchase_id: purchase!.id,
      })
      .returning();

    res.status(200).json({
      message: "Challenge purchased successfully",
      purchase,
      status,
    });
  } catch (error) {
    console.error("Buy challenge error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

userRouter.post("/api-key", userMiddleware, async (req, res) => {
  const userId = (req as any).user_id.user.id;

  const { apiKey, apiSecret, purchaseId, challengeId } = req.body;

  const apiCredentials = JSON.stringify({
    apiKey,
    apiSecret,
  });

  if (!apiKey || !apiSecret || !purchaseId || !challengeId) {
    res.status(422).json({
      message: "Please send all fields correctly",
    });
    return;
  }

  try {
    const encryptedApiCredentials = encrypt(apiCredentials);

    const isKeyPresent = await db
      .select()
      .from(apiKeys)
      .where(
        and(eq(apiKeys.pruchase_id, purchaseId), eq(apiKeys.user_id, userId)),
      );

    if (isKeyPresent.length > 0) {
      res.status(200).json({
        message: "Key already added for this purchase.",
      });
      return;
    }

    const addedKey = await db
      .insert(apiKeys)
      .values({
        user_id: userId,
        challenge_id: challengeId,
        pruchase_id: purchaseId,
        encrypted_api_key_credentials: encryptedApiCredentials.encrypted,
        iv: encryptedApiCredentials.iv,
        auth_tag: encryptedApiCredentials.authTag,
      })
      .returning();

    const currChallenge = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!addedKey) {
      res.status(400).json({
        message: "Please check all required fields",
      });
      return;
    }

    let client = clients.get(userId + purchaseId);

    if (!client) {
      client = createClient(apiKey, apiSecret);
      clients.set(userId + purchaseId, client);
    }

    const challengeValue = currChallenge[0]?.value;

    if (challengeValue == null) {
      res.status(400).json({
        message: "Challenge value not found",
      });
      return;
    }
    const updatedStatus = await db
      .update(challengeStatus)
      .set({
        has_api_key: true,
        value: challengeValue,
        current_balance: challengeValue,
      })
      .where(
        and(
          eq(challengeStatus.user_id, userId),
          eq(challengeStatus.challenge_id, challengeId),
          eq(challengeStatus.purchase_id, purchaseId),
        ),
      )
      .returning();


    const params = {
      adjustType: 0 as const,
      utaDemoApplyMoney: [
        {
          coin: "USDT",
          amountStr: challengeValue.toString(),
        },
      ],
    };

    await client.requestDemoTradingFunds(params);

    res.status(200).json({
      message: " saved your credentials successfully ",
    });
  } catch (error) {
    console.error(error);
  }
});

export default userRouter;
