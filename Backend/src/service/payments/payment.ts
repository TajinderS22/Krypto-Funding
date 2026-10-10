import axios from "axios";
import redis from "../../Utils/redisClient.js";
import { discountTracker } from "../Drizzle/db/schema.js";
import { and, eq } from "drizzle-orm";
import { applyDiscountVerbose } from "./discount.js";
import db from "../Drizzle/index.js";
import { createHmac } from "node:crypto";

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

export 
const handleDiscount = async (
  discountCode: any,
  userId: any,
  challengeId: any,
  idempotencyKey: any,
  res: any,
) => {
  const inputForApplyDiscountVerbose: {
    challengeId: string;
    discountCode: string;
  } = {
    challengeId,
    discountCode,
  };

  const discountResult = await applyDiscountVerbose({
    data: inputForApplyDiscountVerbose,
  });

  const discountTrackerExist = await db
    .select()
    .from(discountTracker)
    .where(
      and(
        eq(discountTracker.user_id, userId),
        eq(discountTracker.challenge_id, challengeId),
      ),
    );

  const duplicateDiscountTrx = discountTrackerExist.filter(
    (x) => x.idempotency_key === idempotencyKey,
  );

  let discountTrackerId: string;

  const existingDiscountTracker = duplicateDiscountTrx[0];

  if (existingDiscountTracker) {
    res.status(200).json({
      message: "transaction already initiated",
    });
    discountTrackerId = existingDiscountTracker.id;
  } else {
    const [insertedDiscountTracker] = await db
      .insert(discountTracker)
      .values({
        user_id: userId,
        challenge_id: challengeId,
        idempotency_key: idempotencyKey !== "null" ? idempotencyKey : null,
        discount_code: discountResult.code,
        challenge_fee_final:
          discountResult.challengeFeeFinal === null
            ? null
            : String(discountResult.challengeFeeFinal),
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

    console.log("inserted to the discountTracker ");
    discountTrackerId = insertedDiscountTracker.id;
  }

  return { ...discountResult, discountTrackerId };
};



export const razorpaySignatureValid= async(razorpaySignature:string,{razorpayOrderId,razorpayPaymentId}:{razorpayOrderId:string,razorpayPaymentId:string})=>{

    const secretKey= process.env.RAZORPAY_KEY_SECRET;

    if(!secretKey){
        return "Razorpay Secret Not Avaialabe."
    }


    const hmac = createHmac(razorpayOrderId+"|"+razorpayPaymentId,secretKey)
    const signature = hmac.digest("hex");

    return signature === razorpaySignature;

}