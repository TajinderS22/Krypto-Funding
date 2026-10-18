import axios from "axios";
import redis from "../../Utils/redisClient.js";
import { discountTracker } from "../Drizzle/db/schema.js";
import { and, eq } from "drizzle-orm";
import { applyDiscountVerbose } from "./discount.js";
import db from "../Drizzle/index.js";
import { createHmac, timingSafeEqual } from "node:crypto";

export const handleInrUsdConversion = async (usd: number) => {
  const conversionRateCache = await redis.get("inr-usd-conversion-rate");

  let conversionRate;
  if (!conversionRateCache) {
    const exchangeRateApiKey = process.env.EXCHANGE_RATE_API_KEY;

    if (!exchangeRateApiKey) {
      throw new Error("Exchange-rate-api-key-not-found.");
    }

    const res = await axios.get(
      `https://v6.exchangerate-api.com/v6/${exchangeRateApiKey}/pair/USD/INR`,
    );
    conversionRate = res.data.conversion_rate;

    await redis.set("inr-usd-conversion-rate", conversionRate, {
      EX: 86400,
    });
  } else {
    conversionRate = conversionRateCache;
  }

  return usd * Number(conversionRate);
};

export const handleDiscount = async (
  discountCode: string,
  userId: number,
  challengeId: string,
  idempotencyKey?: string | null,
) => {
  const discountResult = await applyDiscountVerbose({
    data: {
      challengeId,
      discountCode,
    },
  });

  // If discount was not applicable or invalid, do not create a discountTracker entry
  if (!discountResult.discountApplied) {
    return { ...discountResult, discountTrackerId: null };
  }

  const cleanIdempotency =
    idempotencyKey &&
    idempotencyKey !== "null" &&
    idempotencyKey !== "undefined"
      ? idempotencyKey
      : null;

  let discountTrackerId: string;

  if (cleanIdempotency) {
    const [existingTracker] = await db
      .select({ id: discountTracker.id })
      .from(discountTracker)
      .where(eq(discountTracker.idempotency_key, cleanIdempotency));

    if (existingTracker) {
      discountTrackerId = existingTracker.id;
      return { ...discountResult, discountTrackerId };
    }
  }

  const [insertedDiscountTracker] = await db
    .insert(discountTracker)
    .values({
      user_id: userId,
      challenge_id: challengeId,
      idempotency_key: cleanIdempotency,
      discount_code: discountResult.code,
      challenge_fee_final: String(discountResult.challengeFeeFinal),
      challenge_fee_actual: String(discountResult.challengeFeeActual),
      platform_fee: String(discountResult.platformFee),
      gst_final: String(discountResult.gstFinal),
      gst_actual: String(discountResult.gstActual),
      gst_discount_actual: String(discountResult.gstDiscountActual),
      gst_discount_final: String(discountResult.gstDiscountFinal),
      discount_applied: discountResult.discountApplied,
      total_discount: String(discountResult.totalDiscount),
      discount_percentage: String(discountResult.discountPercentage),
      final_price: String(discountResult.finalPrice),
    })
    .returning({ id: discountTracker.id });

  if (!insertedDiscountTracker) {
    throw new Error("Failed to create discount tracker");
  }

  discountTrackerId = insertedDiscountTracker.id;
  return { ...discountResult, discountTrackerId };
};

export const razorpaySignatureValid = (
  razorpaySignature: string,
  {
    razorpayOrderId,
    razorpayPaymentId,
  }: { razorpayOrderId: string; razorpayPaymentId: string },
): boolean => {
  const secretKey = process.env.RAZORPAY_KEY_SECRET;

  if (!secretKey) {
    console.error("Razorpay secret key not configured");
    return false;
  }

  const generatedSignature = createHmac("sha256", secretKey)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");

  try {
    const expectedBuffer = Buffer.from(generatedSignature, "hex");
    const receivedBuffer = Buffer.from(razorpaySignature, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
  } catch {
    return false;
  }
};