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
import clients, { getClientKey } from "../../Utils/clients.js";

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

  await redis.set(`session:${email}`, refreshToken, { EX: 7 * 24 * 3600 });

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
      EX: 7 * 24 * 3600,
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
            fullyPassed: challengeStatus.fully_passed,
            passedStep1: challengeStatus.passed_step_1,
            passedStep2: challengeStatus.passed_step_2,
            failed: challengeStatus.failed,
            currentStep: challengeStatus.current_step,
            value: challengeStatus.value,
            currentBalance: challengeStatus.current_balance,
            steps: challengeStatus.steps,
            hasApiKey: challengeStatus.has_api_key,
            fullyPassedAt: challengeStatus.fully_passed_at,
            passedStep1At: challengeStatus.passed_step_1_at,
            passedStep2At: challengeStatus.passed_step_2_at,
            failedAt: challengeStatus.failed_at,
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
          fullyPassed: boolean;
          passedStep1:boolean;
          passedStep2:boolean;
          failed: boolean;
          currentStep: number | null;
          steps: number | null;
          hasApiKey: boolean;
          fullyPassedAt: Date | null;
          passedStep1At: Date | null;
          passedStep2At: Date | null;
          failedAt: Date | null;
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

      // partially_passed (stage 1 done, later stage running) is still in
      // progress: it must ship in the active bucket or the detail page
      // can never find the row.
      const active = myChallenges.filter(
        (mc) =>
          mc.status.status === "active" ||
          mc.status.status === "partially_passed",
      );
      const failed = myChallenges.filter((mc) => mc.status.status === "failed");
      const passed = myChallenges.filter((mc) => mc.status.status === "passed");

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
        // fully: false,
        current_step: 1,
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
    const [currentStatus] = await db
      .select()
      .from(challengeStatus)
      .where(
        and(
          eq(challengeStatus.user_id, userId),
          eq(challengeStatus.purchase_id, purchaseId),
        ),
      );

    if (!currentStatus) {
      res.status(404).json({
        message: "Challenge status not found",
      });
      return;
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    // A mismatched challengeId would insert the key row but match no status
    // row (the UPDATE filters on challenge_id), leaving has_api_key=false
    // forever while the duplicate-check short-circuits every retry.
    if (!challenge || currentStatus.challenge_id !== challengeId) {
      res.status(400).json({
        message: "Challenge does not match this purchase",
      });
      return;
    }

    const challengeValue = challenge.value;

    if (challengeValue == null) {
      res.status(400).json({
        message: "Challenge value not found",
      });
      return;
    }

    const currentStep = currentStatus.current_step ?? 1;
    const totalSteps = currentStatus.steps ?? challenge.steps ?? 1;
    const liveSteps = challenge.steps ?? null;

    // Stale terminal row: status claims "passed" but the final step was never
    // finished (keys never submitted for the pointer step, or the pointer is
    // behind the challenge's real step count). Such rows must resume, never
    // block the user — see docs/challengeStatusFixPitch_001.md §1.
    const isStalePassed =
      currentStatus.status === "passed" &&
      (currentStatus.has_api_key !== true ||
        currentStep < totalSteps ||
        (liveSteps != null && currentStep < liveSteps));

    if (currentStatus.status === "failed") {
      res.status(409).json({
        message: "This challenge has already failed.",
      });
      return;
    }

    if (currentStatus.status === "passed" && !isStalePassed) {
      res.status(409).json({
        message: "This challenge is already completed.",
      });
      return;
    }

    // Pointer > 1 means a previous stage passed: record partially_passed
    // (stage-1 done, current stage running). This also repairs stale rows
    // whose status wrongly says "passed" — so the certificate can only ever
    // render for a genuine full completion written by the balance worker.
    // Failed/completed rows were rejected above, so clearing the terminal
    // mirrors here is always safe.
    const statusPatch = {
      status: currentStep > 1 ? "partially_passed" : "active",
      passed: false,
      failed: false,
      passed_at: null,
      has_api_key: true,
      value: challengeValue,
      current_balance: String(challengeValue),
      steps: isStalePassed
        ? Math.max(currentStatus.steps ?? 0, liveSteps ?? 0) || 1
        : (currentStatus.steps ?? liveSteps ?? 1),
      updated_at: sql`now()`,
    };

    const statusWhere = and(
      eq(challengeStatus.user_id, userId),
      eq(challengeStatus.challenge_id, challengeId),
      eq(challengeStatus.purchase_id, purchaseId),
    );

    const encryptedApiCredentials = encrypt(apiCredentials);

    const isKeyPresent = await db
      .select()
      .from(apiKeys)
      .where(
        and(
          eq(apiKeys.purchase_id, purchaseId),
          eq(apiKeys.user_id, userId),
          eq(apiKeys.current_step, currentStep),
        ),
      );

    if (isKeyPresent.length > 0) {
      // Duplicate submit: the key row exists but the status row may still be
      // stale — run the same normalization first so a retry is self-healing.
      await db.update(challengeStatus).set(statusPatch).where(statusWhere);
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
        purchase_id: purchaseId,
        current_step: currentStep,
        encrypted_api_key_credentials: encryptedApiCredentials!.encrypted,
        iv: encryptedApiCredentials!.iv,
        auth_tag: encryptedApiCredentials!.authTag,
      })
      .returning();

    if (!addedKey) {
      res.status(400).json({
        message: "Please check all required fields",
      });
      return;
    }

    const clientKey = getClientKey(userId, purchaseId);
    const client = createClient(apiKey, apiSecret);
    clients.set(clientKey, client);
    clients.set(userId + purchaseId, client);

    const updatedStatus = await db
      .update(challengeStatus)
      .set(statusPatch)
      .where(statusWhere)
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
      status: updatedStatus[0]?.status ?? null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
});

export default userRouter;
