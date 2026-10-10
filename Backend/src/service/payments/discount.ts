import { eq } from "drizzle-orm";
import { challenges } from "../Drizzle/db/schema.js";
import db from "../Drizzle/index.js";
import { sendEmail } from "../email/email.js";

type DiscountCodesType = {
  code: string;
  discountPercentage: number;
  description: string;
  sendEmail: boolean;
  maxPrice?: number;
  minPrice?: number;
};

export const discountCodes: Record<string, DiscountCodesType> = {
  KPTFT: {
    code: "KPTFT",
    discountPercentage: 100,
    description: "you have this code because you know Tajinder Singh 😄",
    sendEmail: true,
    maxPrice: 10,
  },
  KPT50: {
    code: "KPT50",
    discountPercentage: 50,
    description: "congratulations on getting 50% discount",
    sendEmail: false,
    minPrice: 5,
  },
};

export type ApplyDiscountType = {
  discountCode: string;
  userId?: string;
  challengeId: string;
};

export const applyDiscount = async ({ data }: { data: ApplyDiscountType }) => {
  const { discountCode, challengeId } = data;

  const discountRules: DiscountCodesType | undefined =
    discountCodes[discountCode.toUpperCase()];

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId));

  const fee = Number(challenge?.price);

  const isDiscountApplicable = (
    fee: number,
    discountRules: DiscountCodesType,
  ) => {
    if (discountRules.minPrice) {
      if (fee < discountRules.minPrice) {
        return false;
      }
    }

    if (discountRules.maxPrice) {
      if (fee > discountRules.maxPrice) {
        return false;
      }
    }

    return true;
  };

  if (discountRules) {
    const isApplicable = isDiscountApplicable(fee, discountRules);
    const discountedChallengeFee = isApplicable
      ? fee - fee * (discountRules.discountPercentage / 100)
      : fee;

    const {
      challengeFee,
      platformFee,
      baseCharges,
      gst,
      gstDiscount,
      finalPrice,
    } = calculateFinalPrice(discountedChallengeFee, fee);

    const resData = {
      challengeFee: discountedChallengeFee,
      platformFee: platformFee,
      baseCharges: `${challengeFee} + ${platformFee} = ${baseCharges}`,
      gst: gst,
      gstDiscount: gstDiscount,
      finalPrice: finalPrice,
      message: discountRules.description,
      code: discountRules.code,
      discountApplied: true,
    };

    return resData;
  }

  const {
    challengeFee,
    platformFee,
    baseCharges,
    gst,
    gstDiscount,
    finalPrice,
  } = calculateFinalPrice(fee, fee);
  return {
    challengeFee: challengeFee,
    platformFee: platformFee,
    baseCharges: `${challengeFee} + ${platformFee} = ${baseCharges}`,
    gst: gst,
    gstDiscount: gstDiscount,
    finalPrice: finalPrice,
    dicountApplied: false,
    message: "Code is Invalid",
  };
};

export const calculateFinalPrice = (fee: Number, originalFee?: Number) => {
  const platformFee = Number(originalFee) * 0.05;
  const baseCharges = Number(fee) + platformFee;
  const gst = 0.18 * baseCharges;
  const gstDiscount = -gst;
  const finalPrice = Number(fee) + platformFee + gst + gstDiscount;

  return {
    challengeFee: Number(fee),
    platformFee: platformFee,
    baseCharges: baseCharges,
    gst: gst,
    gstDiscount: gstDiscount,
    finalPrice: finalPrice,
  };
};

export const applyDiscountVerbose = async ({
  data,
}: {
  data: ApplyDiscountType;
}) => {
  const { discountCode, challengeId } = data;

  const discountRules: DiscountCodesType | undefined =
    discountCodes[discountCode.toUpperCase()];

  const [challenge] = await db
    .select()
    .from(challenges)
    .where(eq(challenges.id, challengeId));

  const fee = Number(challenge?.price);

  const isDiscountApplicable = (
    fee: number,
    discountRules: DiscountCodesType,
  ) => {
    if (discountRules.minPrice) {
      if (fee < discountRules.minPrice) {
        return false;
      }
    }

    if (discountRules.maxPrice) {
      if (fee > discountRules.maxPrice) {
        return false;
      }
    }

    return true;
  };

  if (discountRules) {
    const isApplicable = isDiscountApplicable(fee, discountRules);
    const discountedChallengeFee = isApplicable
      ? fee - fee * (discountRules.discountPercentage / 100)
      : fee;

    const {
      challengeFee,
      platformFee,
      baseCharges,
      gst,
      gstDiscount,
      finalPrice,
    } = calculateFinalPrice(discountedChallengeFee, fee);

    const gstPercentage = 18 / 100;

    const gstActual = gstPercentage * fee;
    const gstDiscountActual = -gstActual;
    const baseChargesActual = fee + platformFee;

    const resData = {
      challengeFeeFinal: discountedChallengeFee,
      platformFee: platformFee,
      baseChargesFinal: `${discountedChallengeFee} + ${platformFee} = ${baseCharges}`,
      gstFinal: gst,
      gstDiscountFinal: gstDiscount,
      finalPrice: finalPrice,
      message: discountRules.description,
      code: discountRules.code,
      discountApplied: true,
      challengeFeeActual: fee,
      baseChargesActual: `${fee} + ${platformFee} = ${baseChargesActual}`,
      gstActual: gstActual,
      gstDiscountActual: gstDiscountActual,
      totalDiscount:
        finalPrice - (fee + gstActual + gstDiscountActual + platformFee),
      discountPercentage: discountRules.discountPercentage,
    };

    return resData;
  }

  const {
    challengeFee,
    platformFee,
    baseCharges,
    gst,
    gstDiscount,
    finalPrice,
  } = calculateFinalPrice(fee, fee);
  return {
    challengeFeeActual: challengeFee,
    challengeFeeFinal: null,
    platformFee: platformFee,
    baseChargesActual: `${challengeFee} + ${platformFee} = ${baseCharges}`,
    gstActual: gst,
    gstDiscountActual: gstDiscount,
    finalPrice: finalPrice,
    discountApplied: false,
    message: "Code is Invalid",
    code: discountCode,
    baseChargesFinal: null,
    gstFinal: gst,
    gstDiscountFinal: gstDiscount,
    totalDiscount:
      finalPrice - (fee + gst + gst + platformFee),
    discountPercentage: 0,
  };
};
