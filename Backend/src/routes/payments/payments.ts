import { Router } from "express";
import userMiddleware from "../user/middleware/middleware.js";
import {
  applyDiscount,
  calculateFinalPrice,
  type ApplyDiscountType,
} from "../../service/payments/discount.js";
import db from "../../service/Drizzle/index.js";
import {
  challenges,
  challengeStatus,
  discountTracker,
  orders,
  purchases,
} from "../../service/Drizzle/db/schema.js";
import { and, desc, eq, isNull, ne, or, sql } from "drizzle-orm";

import rzpInstance from "../../service/payments/rzpInstance.js";
import {
  handleDiscount,
  handleInrUsdConversion,
  razorpaySignatureValid,
} from "../../service/payments/payment.js";

const paymentRouter = Router();

paymentRouter.post("/discount", userMiddleware, async (req, res) => {
  try {
    const { discountCode, challengeId } = req.body ?? {};

    if (!challengeId) {
      res.status(400).json({ message: "challengeId is required" });
      return;
    }

    if (!discountCode || typeof discountCode !== "string" || discountCode.trim().length === 0) {
      res.status(400).json({ message: "discountCode is required" });
      return;
    }

    const data = {
      discountCode: discountCode.trim(),
      challengeId,
    };
    const discountDetail = await applyDiscount({ data });
    res.status(200).json(discountDetail);
  } catch (error: any) {
    console.error("error at /payments/discount", error);
    if (error?.message?.includes("Challenge not found")) {
      res.status(404).json({ message: error.message });
      return;
    }
    res.status(500).json({
      message: "Failed to apply discount.",
    });
  }
});

paymentRouter.get("/pending/:challengeId", userMiddleware, async (req, res) => {
  try {
    const userId = Number((req as any).user_id.user.id);
    const challengeId = req.params.challengeId as string;

    if (!challengeId) {
      res.status(400).json({ message: "challengeId is required" });
      return;
    }

    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.user_id, userId),
          eq(orders.challenge_id, challengeId),
          or(ne(orders.pg_status, "paid"), isNull(orders.pg_status)),
        ),
      )
      .orderBy(desc(orders.created_at))
      .limit(1);

    const pendingOrder = pendingOrders[0];
    if (!pendingOrder) {
      res.status(200).json({ hasPendingOrder: false });
      return;
    }

    let trackerDetails: any = null;
    if (pendingOrder.discount_tracker_id) {
      const [tracker] = await db
        .select()
        .from(discountTracker)
        .where(eq(discountTracker.id, pendingOrder.discount_tracker_id));
      trackerDetails = tracker ?? null;
    }

    const challengeFee: number | undefined = trackerDetails?.challenge_fee_final
      ? Number(trackerDetails.challenge_fee_final)
      : undefined;
    const platformFee: number | undefined = trackerDetails?.platform_fee
      ? Number(trackerDetails.platform_fee)
      : undefined;
    const gst: number | undefined = trackerDetails?.gst_final
      ? Number(trackerDetails.gst_final)
      : undefined;
    const gstDiscount: number | undefined = trackerDetails?.gst_discount_final
      ? Number(trackerDetails.gst_discount_final)
      : undefined;
    const finalPrice: number = trackerDetails?.final_price
      ? Number(trackerDetails.final_price)
      : Number(pendingOrder.final_price);

    res.status(200).json({
      hasPendingOrder: true,
      pgOrderId: pendingOrder.pg_order_id,
      orderId: pendingOrder.id,
      idempotencyKey: pendingOrder.idempotency_key,
      discountTrackerId: pendingOrder.discount_tracker_id,
      discountApplied: pendingOrder.discount_applied ?? false,
      discountCode:
        pendingOrder.discount_code ?? trackerDetails?.discount_code ?? null,
      challengeFee,
      platformFee,
      gst,
      gstDiscount,
      finalPrice,
      status: pendingOrder.pg_status,
    });
  } catch (error) {
    console.error("error at /payments/pending/:challengeId", error);
    res.status(500).json({
      message: "failed to check pending order",
    });
  }
});

paymentRouter.delete("/pending/:challengeId", userMiddleware, async (req, res) => {
  try {
    const userId = Number((req as any).user_id.user.id);
    const challengeId = req.params.challengeId as string;

    if (!challengeId) {
      res.status(400).json({ message: "challengeId is required" });
      return;
    }

    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.user_id, userId),
          eq(orders.challenge_id, challengeId),
          or(ne(orders.pg_status, "paid"), isNull(orders.pg_status)),
        ),
      );

    if (pendingOrders.length === 0) {
      res.status(200).json({
        message: "No pending orders to delete.",
      });
      return;
    }

    for (const pendingOrder of pendingOrders) {
      await db.delete(orders).where(eq(orders.id, pendingOrder.id));

      if (pendingOrder.discount_tracker_id) {
        await db
          .delete(discountTracker)
          .where(eq(discountTracker.id, pendingOrder.discount_tracker_id));
      }
    }

    res.status(200).json({
      message: "Pending order cancelled and deleted successfully.",
    });
  } catch (error) {
    console.error("error at DELETE /payments/pending/:challengeId", error);
    res.status(500).json({
      message: "Failed to delete pending order",
    });
  }
});

paymentRouter.post("/order", userMiddleware, async (req, res) => {
  try {
    const userId = Number((req as any).user_id.user.id);
    const { challengeId, discountCode } = req.body;

    if (!challengeId) {
      res.status(400).json({ message: "challengeId is required" });
      return;
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));

    if (!challenge || !challenge.price) {
      res.status(404).json({ message: "Challenge not found" });
      return;
    }

    // Check if there is any pending payment for this user and challenge
    const pendingOrders = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.user_id, userId),
          eq(orders.challenge_id, challengeId),
          or(ne(orders.pg_status, "paid"), isNull(orders.pg_status)),
        ),
      )
      .orderBy(desc(orders.created_at))
      .limit(1);

    const pendingOrder = pendingOrders[0];

    if (pendingOrder) {
      let rzpOrder: any = null;
      try {
        rzpOrder = await rzpInstance.orders.fetch(pendingOrder.pg_order_id);
      } catch (err) {
        console.error("Error fetching pending order from Razorpay:", err);
      }

      // If Razorpay indicates that this order has actually been paid already
      if (rzpOrder && rzpOrder.status === "paid") {
        await db
          .update(orders)
          .set({
            pg_status: "paid",
            amount_paid: String((rzpOrder.amount_paid / 100).toFixed(2)),
            amount_due: String((rzpOrder.amount_due / 100).toFixed(2)),
            attempts: rzpOrder.attempts,
            updated_at: sql`now()`,
          })
          .where(eq(orders.id, pendingOrder.id));

        res.status(400).json({
          message: "Payment for this challenge has already been completed.",
          status: "paid",
          orderId: pendingOrder.id,
          pgOrderId: pendingOrder.pg_order_id,
        });
        return;
      }

      // Sync status and attempts if Razorpay state has updated
      if (
        rzpOrder &&
        (rzpOrder.status !== pendingOrder.pg_status ||
          rzpOrder.attempts !== pendingOrder.attempts)
      ) {
        await db
          .update(orders)
          .set({
            pg_status: rzpOrder.status,
            attempts: rzpOrder.attempts,
            updated_at: sql`now()`,
          })
          .where(eq(orders.id, pendingOrder.id));
      }

      let trackerDetails: any = null;
      if (pendingOrder.discount_tracker_id) {
        const [tracker] = await db
          .select()
          .from(discountTracker)
          .where(eq(discountTracker.id, pendingOrder.discount_tracker_id));
        trackerDetails = tracker ?? null;
      }

      let challengeFee: number | undefined = trackerDetails?.challenge_fee_final
        ? Number(trackerDetails.challenge_fee_final)
        : undefined;
      let platformFee: number | undefined = trackerDetails?.platform_fee
        ? Number(trackerDetails.platform_fee)
        : undefined;
      let gst: number | undefined = trackerDetails?.gst_final
        ? Number(trackerDetails.gst_final)
        : undefined;
      let gstDiscount: number | undefined = trackerDetails?.gst_discount_final
        ? Number(trackerDetails.gst_discount_final)
        : undefined;
      let finalPrice: number = trackerDetails?.final_price
        ? Number(trackerDetails.final_price)
        : Number(pendingOrder.final_price);

      if (!trackerDetails && challenge?.price) {
        const pricing = calculateFinalPrice(
          Number(challenge.price),
          Number(challenge.price),
        );
        challengeFee = pricing.challengeFee;
        platformFee = pricing.platformFee;
        gst = pricing.gst;
        gstDiscount = pricing.gstDiscount;
        finalPrice = pricing.finalPrice;
      }

      const amountPaise = rzpOrder
        ? rzpOrder.amount
        : Math.round(Number(pendingOrder.final_price) * 100);
      const amountPaidPaise = rzpOrder
        ? rzpOrder.amount_paid
        : Math.round(Number(pendingOrder.amount_paid ?? 0) * 100);
      const amountDuePaise = rzpOrder
        ? rzpOrder.amount_due
        : Math.round(
            Number(pendingOrder.amount_due ?? pendingOrder.final_price) * 100,
          );
      const attemptsCount = rzpOrder?.attempts ?? pendingOrder.attempts ?? 0;
      const orderStatus =
        rzpOrder?.status ?? pendingOrder.pg_status ?? "created";

      res.status(200).json({
        pgOrderId: pendingOrder.pg_order_id,
        status: orderStatus,
        amountPaid: amountPaidPaise,
        amountDue: amountDuePaise,
        attempts: attemptsCount,
        amount: amountPaise,
        currency: pendingOrder.currency ?? "INR",
        orderId: pendingOrder.id,
        idempotencyKey: pendingOrder.idempotency_key,
        discountTrackerId: pendingOrder.discount_tracker_id,
        discountApplied: pendingOrder.discount_applied ?? false,
        discountCode:
          pendingOrder.discount_code ?? trackerDetails?.discount_code ?? null,
        challengeFee,
        platformFee,
        gst,
        gstDiscount,
        finalPrice,
        isPendingOrder: true,
      });
      return;
    }

    // If no pending order exists, proceed with standard order creation
    const headerIdempotency = req.headers["idempotency-key"];
    const idempotencyKey =
      typeof headerIdempotency === "string" &&
      headerIdempotency.trim() !== "" &&
      headerIdempotency.trim() !== "null" &&
      headerIdempotency.trim() !== "undefined"
        ? headerIdempotency.trim()
        : null;

    const cleanDiscountCode =
      typeof discountCode === "string" && discountCode.trim().length > 0
        ? discountCode.trim()
        : null;

    const challengePrice = challenge.price;

    let finalPriceObject: any;

    if (cleanDiscountCode) {
      finalPriceObject = await handleDiscount(
        cleanDiscountCode,
        userId,
        challengeId,
        idempotencyKey,
      );

      if (!finalPriceObject.discountApplied) {
        res.status(400).json({
          message:
            finalPriceObject.message ||
            "Discount code is invalid or not applicable for this challenge.",
        });
        return;
      }
    } else {
      finalPriceObject = {
        ...calculateFinalPrice(
          Number(challengePrice),
          Number(challengePrice),
        ),
        discountApplied: false,
        discountTrackerId: null,
        totalDiscount: null,
        discountPercentage: null,
        challengeFeeFinal: Number(challengePrice),
      };
    }

    const inrPrice = await handleInrUsdConversion(finalPriceObject.finalPrice);

    // If final price is 0 (e.g. 100% discount with waived platform fee),
    // Razorpay requires a minimum transaction of 1 INR (100 paise)
    const isZeroAmount = Number(finalPriceObject.finalPrice) === 0;
    const finalPriceInr = isZeroAmount ? "1.00" : inrPrice.toFixed(2);
    const rzpAmountPaise = isZeroAmount
      ? 100
      : Math.max(100, Math.round(Number(finalPriceInr) * 100));

    const options = {
      amount: rzpAmountPaise,
      currency: "INR",
      notes: {
        userId: String(userId),
        challengeId: String(challengeId),
        idempotencyKey: idempotencyKey ?? "",
        discountCode: cleanDiscountCode ?? "",
        isZeroAmountOrder: isZeroAmount ? "true" : "false",
      },
    };

    const rzpOrder = await rzpInstance.orders.create(options);

    console.log(rzpOrder);

    console.log(finalPriceObject);

    if (!rzpOrder.id) {
      res.status(400).json({
        message:
          "Razorpay request failed, please try again later or contact us.",
      });
      return;
    }
    const razorpayCreatedAt = new Date(rzpOrder.created_at * 1000);

    const [order] = await db
      .insert(orders)
      .values({
        user_id: userId,
        challenge_id: challengeId,
        idempotency_key: idempotencyKey,
        discount_applied: finalPriceObject.discountApplied,
        discount_code: cleanDiscountCode,
        discount_tracker_id: finalPriceObject.discountTrackerId ?? null,
        final_price: finalPriceInr,
        pg_order_id: rzpOrder.id,
        amount_due: String((rzpOrder.amount_due / 100).toFixed(2)),
        currency: rzpOrder.currency,
        pg_status: rzpOrder.status,
        amount_paid: String((rzpOrder.amount_paid / 100).toFixed(2)),
        attempts: rzpOrder.attempts,
        entity: rzpOrder.entity,
        discount:
          finalPriceObject.totalDiscount !== null &&
          finalPriceObject.totalDiscount !== undefined
            ? Number(finalPriceObject.totalDiscount).toFixed(2)
            : null,
        discount_percentage:
          finalPriceObject.discountPercentage !== null &&
          finalPriceObject.discountPercentage !== undefined
            ? Number(finalPriceObject.discountPercentage).toFixed(2)
            : null,
        created_at: razorpayCreatedAt,
        updated_at: razorpayCreatedAt,
      })
      .returning();

    if (!order?.id) {
      res
        .status(400)
        .json({ message: "something went wrong, please contact us " });
      return;
    }

    res.status(200).json({
      pgOrderId: rzpOrder.id,
      status: rzpOrder.status,
      amountPaid: rzpOrder.amount_paid,
      amountDue: rzpOrder.amount_due,
      attempts: rzpOrder.attempts,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      orderId: order?.id,
      idempotencyKey: order?.idempotency_key,
      discountTrackerId: order?.discount_tracker_id,
      discountApplied: finalPriceObject.discountApplied,
      discountCode: cleanDiscountCode,
      challengeFee:
        (finalPriceObject as any).challengeFeeFinal !== undefined
          ? Number((finalPriceObject as any).challengeFeeFinal)
          : undefined,
      platformFee:
        (finalPriceObject as any).platformFee !== undefined
          ? Number((finalPriceObject as any).platformFee)
          : undefined,
      gst:
        (finalPriceObject as any).gstFinal !== undefined
          ? Number((finalPriceObject as any).gstFinal)
          : undefined,
      gstDiscount:
        (finalPriceObject as any).gstDiscountFinal !== undefined
          ? Number((finalPriceObject as any).gstDiscountFinal)
          : undefined,
      finalPrice: Number(finalPriceObject.finalPrice),
      isPendingOrder: false,
    });
  } catch (error) {
    console.error("error at /payments/order", error);
    res.status(500).json({
      message: "some error occured.",
    });
  }
});

paymentRouter.post("/capture", userMiddleware, async (req, res) => {
  const userId = Number((req as any).user_id.user.id);
  try {
    const {
      pgPaymentId,
      pgOrderId,
      signature,
      challengeId,
      discountTrackerId,
      idempotencyKey,
      orderId,
    } = req.body;

    // const paymentDetails = await rzpInstance.orders.fetch(pgOrderId)

    if (!pgOrderId) {
      res.status(404).json({
        message: "Order Id not found,Please initiate new payment. ",
        status: "failed",
      });
      return;
    }

    const [order] = await db
      .select()
      .from(orders)
      .where(eq(orders.pg_order_id, pgOrderId));

    if (!order?.id) {
      res.status(404).json({
        message: "order not found",
        status: "failed",
      });
      return;
    }

    const rzpOrder = await rzpInstance.orders.fetch(pgOrderId);

    if (
      !razorpaySignatureValid(signature, {
        razorpayOrderId: pgOrderId,
        razorpayPaymentId: pgPaymentId,
      })
    ) {
      res.status(400).json({
        message: "payment signature is invalid.",
        status: "failed",
      });
      return;
    }

    await db
      .update(orders)
      .set({
        pg_status: rzpOrder.status,
        amount_paid: String((rzpOrder.amount_paid / 100).toFixed(2)),
        amount_due: String((rzpOrder.amount_due / 100).toFixed(2)),
        attempts: rzpOrder.attempts,
        pg_payment_id: pgPaymentId,
        pg_signature: signature,
      })
      .where(eq(orders.id, order.id));

    const [newPurchase] = await db
      .insert(purchases)
      .values({
        user_id: userId,
        challenge_id: challengeId,
        final_amount: order.final_price,
        order_id: order.id,
        discount_tracker_id: order.discount_tracker_id,
      })
      .returning();

    if (!newPurchase?.id) {
      res.status(400).json({
        message:
          "failed to buy the challenge, please try later or contact support.",
        status: "failed",
      });
      return;
    }

    const [challenge] = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, order.challenge_id!));

    if (!challenge) {
      res.status(404).json({
        message: "challenge not found",
      });
      return;
    }

    if (!order.challenge_id) {
      res.status(400).json({
        message: "challenge id missing for payment capture",
      });
      return;
    }

    const [challengeStatusInsert] = await db
      .insert(challengeStatus)
      .values({
        user_id: userId,
        challenge_id: order.challenge_id,
        purchase_id: newPurchase.id,
        order_id: order.id,
        discount_tracker_id: order.discount_tracker_id ?? undefined,
        certificate_id: undefined,
        current_step: 1,
        steps: challenge.steps ?? 1,
        status: "active",
        value: Number(challenge.value ?? 0),
      })
      .returning();

    if (challengeStatusInsert?.id) {
      res.status(200).json({
        message: "purchase successfull",
        status: "paid",
        purchaseId: newPurchase.id,
      });
    } else {
      res.status(400).json({
        message: "unable to purchase the challenge.",
        status: "failed",
      });
    }
  } catch (error) {
    console.error("error at /payments/capture", error);
    res.status(500).json({
      message: "some error occured.",
      status: "failed",
    });
  }
});

paymentRouter.post("/capture/failed", userMiddleware, async (req, res) => {
  const userId = (req as any).user_id.user.id;

  const { pgOrderId, challengeId } = req.body;

  if (!challengeId || !pgOrderId) {
    res.status(404).json({
      message: "Order not found",
    });
    return;
  }

  const rzpOrder = await rzpInstance.orders.fetch(pgOrderId);

  await db
    .update(orders)
    .set({
      attempts: rzpOrder.attempts,
      pg_status: rzpOrder.status,
      amount_paid: String(rzpOrder.amount_paid),
      amount_due: String(rzpOrder.amount_due),
      updated_at: sql`now()`,
    })
    .where(eq(orders.pg_order_id,pgOrderId));

  res.status(200).json({
    message:"updated the order status "
  });
});

export default paymentRouter;
