import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock DB
const mockSelect = vi.fn();
vi.mock("../Drizzle/index.js", () => ({
  default: {
    select: () => mockSelect(),
  },
}));

import {
  calculateFinalPrice,
  isDiscountApplicable,
  evaluateDiscount,
  applyDiscount,
  applyDiscountVerbose,
  discountCodes,
  round2,
} from "./discount.js";

describe("Discount Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("calculateFinalPrice & round2", () => {
    it("correctly calculates pricing with 5% platform fee and full GST discount", () => {
      const pricing = calculateFinalPrice(10, 10);
      expect(pricing.challengeFee).toBe(10);
      expect(pricing.platformFee).toBe(0.5);
      expect(pricing.baseCharges).toBe(10.5);
      expect(pricing.gst).toBe(1.89);
      expect(pricing.gstDiscount).toBe(-1.89);
      expect(pricing.finalPrice).toBe(10.5);
    });

    it("correctly calculates pricing when challenge fee is discounted but platform fee uses original fee", () => {
      // 50% discount on $10 challenge: discounted fee = $5, original fee = $10
      const pricing = calculateFinalPrice(5, 10);
      expect(pricing.challengeFee).toBe(5);
      expect(pricing.platformFee).toBe(0.5); // 5% of 10
      expect(pricing.baseCharges).toBe(5.5);
      expect(pricing.gst).toBe(0.99); // 18% of 5.5 = 0.99
      expect(pricing.gstDiscount).toBe(-0.99);
      expect(pricing.finalPrice).toBe(5.5);
    });

    it("handles 100% discount", () => {
      const pricing = calculateFinalPrice(0, 10);
      expect(pricing.challengeFee).toBe(0);
      expect(pricing.platformFee).toBe(0.5);
      expect(pricing.baseCharges).toBe(0.5);
      expect(pricing.gst).toBe(0.09);
      expect(pricing.gstDiscount).toBe(-0.09);
      expect(pricing.finalPrice).toBe(0.5);
    });
  });

  describe("isDiscountApplicable", () => {
    it("rejects code when fee is below minPrice", () => {
      const rule = discountCodes.KPT50!; // minPrice: 5
      const result = isDiscountApplicable(3, rule);
      expect(result.applicable).toBe(false);
      if (!result.applicable) {
        expect(result.reason).toContain("requires a minimum challenge price of $5");
      }
    });

    it("rejects code when fee is above maxPrice", () => {
      const rule = discountCodes.KPTFT!; // maxPrice: 10
      const result = isDiscountApplicable(15, rule);
      expect(result.applicable).toBe(false);
      if (!result.applicable) {
        expect(result.reason).toContain("only valid for challenge prices up to $10");
      }
    });

    it("accepts code when fee is within bounds", () => {
      expect(isDiscountApplicable(5, discountCodes.KPT50!).applicable).toBe(true);
      expect(isDiscountApplicable(10, discountCodes.KPT50!).applicable).toBe(true);
      expect(isDiscountApplicable(10, discountCodes.KPTFT!).applicable).toBe(true);
      expect(isDiscountApplicable(8, discountCodes.KPTFT!).applicable).toBe(true);
    });
  });

  describe("evaluateDiscount / applyDiscount / applyDiscountVerbose", () => {
    it("returns discountApplied: false when price exceeds maxPrice", async () => {
      const challengeId = "test-challenge-high";
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: challengeId, price: "100.00" }]),
        }),
      });

      const res = await applyDiscount({
        data: {
          challengeId,
          discountCode: "KPTFT", // maxPrice: 10
        },
      });

      expect(res.discountApplied).toBe(false);
      expect(res.message).toContain("only valid for challenge prices up to $10");
      expect(res.code).toBe("KPTFT");
      expect(res.challengeFee).toBe(100);
      expect(res.finalPrice).toBe(105);
      expect(res.totalDiscount).toBe(0);
      expect(res.discountPercentage).toBe(0);
    });

    it("returns discountApplied: false when price is below minPrice", async () => {
      const challengeId = "test-challenge-low";
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: challengeId, price: "3.00" }]),
        }),
      });

      const res = await applyDiscount({
        data: {
          challengeId,
          discountCode: "KPT50", // minPrice: 5
        },
      });

      expect(res.discountApplied).toBe(false);
      expect(res.message).toContain("requires a minimum challenge price of $5");
      expect(res.challengeFee).toBe(3);
      expect(res.finalPrice).toBe(3.15);
      expect(res.totalDiscount).toBe(0);
    });

    it("returns discountApplied: false for non-existent code", async () => {
      const challengeId = "test-challenge-1";
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: challengeId, price: "10.00" }]),
        }),
      });

      const res = await applyDiscount({
        data: {
          challengeId,
          discountCode: "NONEXISTENT",
        },
      });

      expect(res.discountApplied).toBe(false);
      expect(res.message).toBe("Code is Invalid");
      expect(res.finalPrice).toBe(10.5);
      expect(res.totalDiscount).toBe(0);
    });

    it("successfully applies discount when fee is in range (case-insensitive)", async () => {
      const challengeId = "test-challenge-valid";
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: challengeId, price: "10.00" }]),
        }),
      });

      const res = await applyDiscount({
        data: {
          challengeId,
          discountCode: "kpt50", // lowercase input
        },
      });

      expect(res.discountApplied).toBe(true);
      expect(res.code).toBe("KPT50");
      expect(res.discountPercentage).toBe(50);
      expect(res.challengeFee).toBe(5);
      expect(res.platformFee).toBe(0.5);
      expect(res.finalPrice).toBe(5.5);
      expect(res.totalDiscount).toBe(5);
      expect(res.message).toBe("congratulations on getting 50% discount");
    });

    it("applyDiscountVerbose returns comprehensive schema with actual and final figures", async () => {
      const challengeId = "test-challenge-verbose";
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: challengeId, price: "10.00" }]),
        }),
      });

      const res = await applyDiscountVerbose({
        data: {
          challengeId,
          discountCode: "KPTFT", // 100% discount, maxPrice: 10
        },
      });

      expect(res.discountApplied).toBe(true);
      expect(res.challengeFeeActual).toBe(10);
      expect(res.challengeFeeFinal).toBe(0);
      expect(res.platformFee).toBe(0.5);
      expect(res.finalPrice).toBe(0.5);
      expect(res.totalDiscount).toBe(10);
      expect(res.discountPercentage).toBe(100);
      expect(res.gstActual).toBe(1.89);
      expect(res.gstFinal).toBe(0.09);
    });

    it("handles waived platform fee (0 final price) with KPTZERO", async () => {
      const challengeId = "test-challenge-zero";
      mockSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: challengeId, price: "10.00" }]),
        }),
      });

      const res = await applyDiscount({
        data: {
          challengeId,
          discountCode: "KPTZERO",
        },
      });

      expect(res.discountApplied).toBe(true);
      expect(res.code).toBe("KPTZERO");
      expect(res.discountPercentage).toBe(100);
      expect(res.challengeFee).toBe(0);
      expect(res.platformFee).toBe(0);
      expect(res.gst).toBe(0);
      expect(res.gstDiscount).toBe(-0);
      expect(res.finalPrice).toBe(0);
      expect(res.totalDiscount).toBe(10.5);
      expect(res.waivePlatformFee).toBe(true);
    });
  });
});
