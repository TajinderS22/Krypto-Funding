import { eq } from "drizzle-orm";
import { challenges } from "../Drizzle/db/schema.js";
import db from "../Drizzle/index.js";

export type DiscountCodesType = {
  code: string;
  discountPercentage: number;
  description: string;
  sendEmail: boolean;
  maxPrice?: number;
  minPrice?: number;
  waivePlatformFee?: boolean; // When true, platform fee is 0/null
};

export const discountCodes: Record<string, DiscountCodesType> = {
  KPTFT: {
    code: "KPTFT",
    discountPercentage: 100,
    description: "you have this code because you know Tajinder Singh 😄",
    sendEmail: true,
    maxPrice: 10,
    waivePlatformFee: false,
  },
  KPT50: {
    code: "KPT50",
    discountPercentage: 50,
    description: "congratulations on getting 50% discount",
    sendEmail: false,
    minPrice: 5,
    waivePlatformFee: false,
  },
  KPTZERO: {
    code: "KPTZERO",
    discountPercentage: 100,
    description: "100% discount with zero platform fee (₹1 Razorpay authorization applies) 🎉",
    sendEmail: true,
    maxPrice: 20,
    waivePlatformFee: true,
  },
  KPTFREE: {
    code: "KPTFREE",
    discountPercentage: 100,
    description: "100% challenge & platform fee waiver (₹1 Razorpay authorization applies) 🚀",
    sendEmail: true,
    maxPrice: 20,
    waivePlatformFee: true,
  },
};

export type ApplyDiscountType = {
  discountCode: string;
  userId?: string;
  challengeId: string;
};

export const round2 = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

export type DiscountApplicabilityResult =
  | { applicable: true }
  | { applicable: false; reason: string };

export const isDiscountApplicable = (
  fee: number,
  discountRules: DiscountCodesType,
): DiscountApplicabilityResult => {
  if (discountRules.minPrice !== undefined && fee < discountRules.minPrice) {
    return {
      applicable: false,
      reason: `Code "${discountRules.code}" requires a minimum challenge price of $${discountRules.minPrice}.`,
    };
  }

  if (discountRules.maxPrice !== undefined && fee > discountRules.maxPrice) {
    return {
      applicable: false,
      reason: `Code "${discountRules.code}" is only valid for challenge prices up to $${discountRules.maxPrice}.`,
    };
  }

  return { applicable: true };
};

export const calculateFinalPrice = (
  fee: number,
  originalFee?: number,
  waivePlatformFee: boolean = false,
) => {
  const actualOriginalFee =
    originalFee !== undefined ? Number(originalFee) : Number(fee);
  const numericFee = Number(fee);

  const platformFee = waivePlatformFee ? 0 : round2(actualOriginalFee * 0.05);
  const baseCharges = round2(numericFee + platformFee);
  const gst = round2(0.18 * baseCharges);
  const gstDiscount = -gst;
  const finalPrice = round2(numericFee + platformFee + gst + gstDiscount);

  return {
    challengeFee: numericFee,
    platformFee,
    baseCharges,
    gst,
    gstDiscount,
    finalPrice,
  };
};

export type EvaluatedDiscount = {
  discountApplied: boolean;
  message: string;
  code: string;
  discountPercentage: number;
  totalDiscount: number;
  challengeFeeActual: number;
  challengeFeeFinal: number;
  platformFee: number;
  baseChargesActual: string;
  baseChargesFinal: string;
  gstActual: number;
  gstFinal: number;
  gstDiscountActual: number;
  gstDiscountFinal: number;
  finalPrice: number;
  waivePlatformFee: boolean;
};

export const evaluateDiscount = async (
  data: ApplyDiscountType,
): Promise<EvaluatedDiscount> => {
  const { discountCode, challengeId } = data;
  const normalizedCode = (discountCode ?? "").trim().toUpperCase();

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId));

  if (!challenge || challenge.price === null || challenge.price === undefined) {
    throw new Error(`Challenge not found with id: ${challengeId}`);
  }

  const fee = Number(challenge.price);
  if (isNaN(fee)) {
    throw new Error(`Invalid price for challenge ${challengeId}`);
  }

  const actualPricing = calculateFinalPrice(fee, fee, false);
  const discountRules: DiscountCodesType | undefined =
    discountCodes[normalizedCode];

  // If code does not exist in our dictionary
  if (!discountRules) {
    return {
      discountApplied: false,
      message: "Code is Invalid",
      code: normalizedCode,
      discountPercentage: 0,
      totalDiscount: 0,
      challengeFeeActual: fee,
      challengeFeeFinal: fee,
      platformFee: actualPricing.platformFee,
      baseChargesActual: `${fee} + ${actualPricing.platformFee} = ${actualPricing.baseCharges}`,
      baseChargesFinal: `${fee} + ${actualPricing.platformFee} = ${actualPricing.baseCharges}`,
      gstActual: actualPricing.gst,
      gstFinal: actualPricing.gst,
      gstDiscountActual: actualPricing.gstDiscount,
      gstDiscountFinal: actualPricing.gstDiscount,
      finalPrice: actualPricing.finalPrice,
      waivePlatformFee: false,
    };
  }

  // Check if discount rules apply to this challenge fee
  const applicability = isDiscountApplicable(fee, discountRules);
  if (!applicability.applicable) {
    return {
      discountApplied: false,
      message: applicability.reason,
      code: discountRules.code,
      discountPercentage: 0,
      totalDiscount: 0,
      challengeFeeActual: fee,
      challengeFeeFinal: fee,
      platformFee: actualPricing.platformFee,
      baseChargesActual: `${fee} + ${actualPricing.platformFee} = ${actualPricing.baseCharges}`,
      baseChargesFinal: `${fee} + ${actualPricing.platformFee} = ${actualPricing.baseCharges}`,
      gstActual: actualPricing.gst,
      gstFinal: actualPricing.gst,
      gstDiscountActual: actualPricing.gstDiscount,
      gstDiscountFinal: actualPricing.gstDiscount,
      finalPrice: actualPricing.finalPrice,
      waivePlatformFee: false,
    };
  }

  // Discount applies successfully
  const waivePlatformFee = Boolean(discountRules.waivePlatformFee);
  const discountedChallengeFee = round2(
    fee - fee * (discountRules.discountPercentage / 100),
  );
  const finalPricing = calculateFinalPrice(
    discountedChallengeFee,
    fee,
    waivePlatformFee,
  );
  const totalDiscount = round2(
    actualPricing.finalPrice - finalPricing.finalPrice,
  );

  return {
    discountApplied: true,
    message: discountRules.description,
    code: discountRules.code,
    discountPercentage: discountRules.discountPercentage,
    totalDiscount,
    challengeFeeActual: fee,
    challengeFeeFinal: discountedChallengeFee,
    platformFee: finalPricing.platformFee,
    baseChargesActual: `${fee} + ${actualPricing.platformFee} = ${actualPricing.baseCharges}`,
    baseChargesFinal: `${discountedChallengeFee} + ${finalPricing.platformFee} = ${finalPricing.baseCharges}`,
    gstActual: actualPricing.gst,
    gstFinal: finalPricing.gst,
    gstDiscountActual: actualPricing.gstDiscount,
    gstDiscountFinal: finalPricing.gstDiscount,
    finalPrice: finalPricing.finalPrice,
    waivePlatformFee,
  };
};

export const applyDiscount = async ({ data }: { data: ApplyDiscountType }) => {
  const evaluated = await evaluateDiscount(data);

  return {
    challengeFee: evaluated.challengeFeeFinal,
    platformFee: evaluated.platformFee,
    baseCharges: evaluated.baseChargesFinal,
    gst: evaluated.gstFinal,
    gstDiscount: evaluated.gstDiscountFinal,
    finalPrice: evaluated.finalPrice,
    message: evaluated.message,
    code: evaluated.code,
    discountApplied: evaluated.discountApplied,
    discountPercentage: evaluated.discountPercentage,
    totalDiscount: evaluated.totalDiscount,
    waivePlatformFee: evaluated.waivePlatformFee,
  };
};

export const applyDiscountVerbose = async ({
  data,
}: {
  data: ApplyDiscountType;
}) => {
  return await evaluateDiscount(data);
};
