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
  discountTracker,
  orders,
  purchases,
} from "../../service/Drizzle/db/schema.js";
import { eq } from "drizzle-orm";

import rzpInstance from "../../service/payments/rzpInstance.js";
import {
  handleDiscount,
  handleInrUsdConversion,
  razorpaySignatureValid,
} from "../../service/payments/payment.js";

const paymentRouter = Router();

paymentRouter.post("/discount", userMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user_id.user.id;
    const { discountCode, challengeId }: ApplyDiscountType = req.body;
    const data = {
      discountCode,
      challengeId,
    };
    const discountDetail = await applyDiscount({ data });
    res.status(200).json(discountDetail);
  } catch (error) {
    console.error("error at /payments/discount", error);
  }
});

paymentRouter.post("/order", userMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user_id.user.id;
    const { challengeId, discountCode } = req.body;

    const challenge = await db
      .select()
      .from(challenges)
      .where(eq(challenges.id, challengeId));
    const idempotencyKey = String(req.headers["idempotency-key"] ?? null);

    const challengePrice = challenge?.[0]?.price;
    if (!challengePrice) {
      throw new Error("Challenge not found");
    }

    const finalPriceObject = discountCode
      ? await handleDiscount(
          discountCode,
          userId,
          challengeId,
          idempotencyKey,
          res,
        )
      : {
          ...calculateFinalPrice(
            Number(challengePrice),
            Number(challengePrice),
          ),
          discountApplied: false,
          discountTrackerId: null,
          totalDiscount: null,
          discountPercentage: null,
        };

    if (res.headersSent) {
      return;
    }

    const inrPrice = await handleInrUsdConversion(finalPriceObject.finalPrice);

    const finalPriceInr = inrPrice.toFixed(2);

    const options = {
      amount: Number(finalPriceInr) * 100,
      currency: "INR",
      notes: {
        userId: userId,
        challengeId: challengeId,
        idempotencyKey: idempotencyKey,
        discountCode: discountCode,
      },
    };

    const rzpOrder = await rzpInstance.orders.create(options);

    if (rzpOrder.id) {
      const razorpayCreatedAt = new Date(rzpOrder.created_at * 1000);

      const [order] = await db
        .insert(orders)
        .values({
          user_id: userId,
          challenge_id: challengeId,
          idempotency_key: idempotencyKey !== "null" ? idempotencyKey : null,
          discount_applied: finalPriceObject.discountApplied,
          discount_code: discountCode ?? null,
          discount_tracker_id: finalPriceObject.discountTrackerId,
          final_price: finalPriceInr,
          pg_order_id: rzpOrder.id,
          amount_due: (rzpOrder.amount_due / 100).toFixed(2),
          currency: rzpOrder.currency,
          pg_status: rzpOrder.status,
          amount_paid: (rzpOrder.amount_paid / 100).toFixed(2),
          attempts: rzpOrder.attempts,
          entity: rzpOrder.entity,
          discount: String(finalPriceObject.totalDiscount),
          discount_percentage: String(finalPriceObject.discountPercentage),
          created_at: razorpayCreatedAt,
          updated_at: razorpayCreatedAt,
        })
        .returning();

      if (order?.id) {
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
        });
      } else {
        res
          .status(400)
          .json({ message: "something went wrong, please contact us " });
      }
    } else {
      res.status(401).json({
        message: "razorpay error",
      });
    }
  } catch (error) {
    console.error("error at /payments/order", error);
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

    if (!orderId) {
    }

    if (pgOrderId) {
      const [order] = await db
        .select()
        .from(orders)
        .where(eq(orders.pg_order_id, pgOrderId));

      if (!order?.id) {
        res.status(404).json({
          message: "order not found",
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
        });
        return;
      }
      await db.update(orders).set({
        pg_status: rzpOrder.status,
        amount_paid: String(rzpOrder.amount_paid),
        amount_due: String(rzpOrder.amount_due),
        attempts: rzpOrder.attempts,
        pg_payment_id: pgPaymentId,
        pg_signature: signature,
      });

      await db.insert(purchases).values({
        user_id: userId,
        challenge_id: challengeId,
        final_amount: order.final_price,
        order_id: order.id,
        discount_tracker_id: order.discount_tracker_id,
      });
    }
  } catch (error) {}
});

export default paymentRouter;
