import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock middleware
vi.mock("../user/middleware/middleware.js", () => ({
  default: (req: any, res: any, next: any) => {
    req.user_id = { user: { id: 42 } };
    next();
  },
}));

// Mock DB
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock("../../service/Drizzle/index.js", () => ({
  default: {
    select: () => mockSelect(),
    insert: () => mockInsert(),
    update: () => mockUpdate(),
    delete: () => mockDelete(),
  },
}));

// Mock Razorpay instance
const mockRzpFetch = vi.fn();
const mockRzpCreate = vi.fn();

vi.mock("../../service/payments/rzpInstance.js", () => ({
  default: {
    orders: {
      fetch: (...args: any[]) => mockRzpFetch(...args),
      create: (...args: any[]) => mockRzpCreate(...args),
    },
  },
}));

// Mock currency conversion
vi.mock("../../service/payments/payment.js", () => ({
  handleDiscount: vi.fn(),
  handleInrUsdConversion: vi.fn(() => Promise.resolve(8500)),
  razorpaySignatureValid: vi.fn(() => true),
}));

import paymentRouter from "./payments.js";

function getRouteHandler(method: string, path: string) {
  const layer = (paymentRouter as any).stack.find(
    (s: any) => s.route && s.route.path === path && s.route.methods[method.toLowerCase()],
  );
  if (!layer) {
    throw new Error(`Route not found: ${method} ${path}`);
  }
  // The last handler in the route stack is the actual handler (after middleware)
  const handlers = layer.route.stack.map((s: any) => s.handle);
  return handlers[handlers.length - 1];
}

function createReqRes(body: any = {}, headers: any = {}, params: any = {}) {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const req = {
    user_id: { user: { id: 42 } },
    body,
    headers,
    params,
  } as any;
  const res = {
    status,
    json,
    headersSent: false,
  } as any;
  return { req, res, status, json };
}

describe("Payment Pending Order Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /payments/order with pending order in DB", () => {
    it("returns existing pending order details and idempotency key from database", async () => {
      const challengeId = "11111111-1111-1111-1111-111111111111";
      const existingOrderId = "22222222-2222-2222-2222-222222222222";
      const existingPgOrderId = "order_rzp_pending_123";
      const existingIdempotencyKey = "33333333-3333-3333-3333-333333333333";

      // Mock challenge lookup
      const challengeSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: challengeId, price: "100.00", title: "Test Challenge" },
          ]),
        }),
      };

      // Mock pending orders lookup
      const pendingOrdersSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: existingOrderId,
                  user_id: 42,
                  challenge_id: challengeId,
                  pg_order_id: existingPgOrderId,
                  pg_status: "created",
                  idempotency_key: existingIdempotencyKey,
                  final_price: "8500.00",
                  amount_due: "8500.00",
                  amount_paid: "0.00",
                  attempts: 0,
                  currency: "INR",
                  discount_tracker_id: null,
                  discount_applied: false,
                  discount_code: null,
                },
              ]),
            }),
          }),
        }),
      };

      // Select mock sequence: 1st for challenge, 2nd for pending order
      mockSelect
        .mockReturnValueOnce(challengeSelectChain)
        .mockReturnValueOnce(pendingOrdersSelectChain);

      // Razorpay order fetch returns live status "created"
      mockRzpFetch.mockResolvedValueOnce({
        id: existingPgOrderId,
        status: "created",
        amount: 850000,
        amount_due: 850000,
        amount_paid: 0,
        attempts: 0,
        currency: "INR",
      });

      const handler = getRouteHandler("POST", "/order");
      const { req, res, status, json } = createReqRes({ challengeId });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          pgOrderId: existingPgOrderId,
          orderId: existingOrderId,
          idempotencyKey: existingIdempotencyKey,
          amount: 850000,
          status: "created",
          isPendingOrder: true,
        }),
      );

      // Razorpay create should NOT be called since order was pending in DB
      expect(mockRzpCreate).not.toHaveBeenCalled();
    });

    it("rejects with 400 if Razorpay indicates existing order was already paid", async () => {
      const challengeId = "11111111-1111-1111-1111-111111111111";
      const existingOrderId = "22222222-2222-2222-2222-222222222222";
      const existingPgOrderId = "order_rzp_paid_123";

      const challengeSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            { id: challengeId, price: "100.00" },
          ]),
        }),
      };

      const pendingOrdersSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: existingOrderId,
                  user_id: 42,
                  challenge_id: challengeId,
                  pg_order_id: existingPgOrderId,
                  pg_status: "created",
                  final_price: "8500.00",
                },
              ]),
            }),
          }),
        }),
      };

      mockSelect
        .mockReturnValueOnce(challengeSelectChain)
        .mockReturnValueOnce(pendingOrdersSelectChain);

      mockRzpFetch.mockResolvedValueOnce({
        id: existingPgOrderId,
        status: "paid",
        amount: 850000,
        amount_paid: 850000,
        amount_due: 0,
        attempts: 1,
      });

      const updateSet = vi.fn().mockReturnValue({
        where: vi.fn().mockResolvedValue([]),
      });
      mockUpdate.mockReturnValue({ set: updateSet });

      const handler = getRouteHandler("POST", "/order");
      const { req, res, status, json } = createReqRes({ challengeId });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Payment for this challenge has already been completed.",
          status: "paid",
        }),
      );
    });
  });

  describe("GET /payments/pending/:challengeId", () => {
    it("returns hasPendingOrder: false if no pending order exists", async () => {
      const challengeId = "11111111-1111-1111-1111-111111111111";

      const pendingOrdersSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([]),
            }),
          }),
        }),
      };
      mockSelect.mockReturnValueOnce(pendingOrdersSelectChain);

      const handler = getRouteHandler("GET", "/pending/:challengeId");
      const { req, res, status, json } = createReqRes({}, {}, { challengeId });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({ hasPendingOrder: false });
    });

    it("returns pending order details and idempotencyKey when pending order exists", async () => {
      const challengeId = "11111111-1111-1111-1111-111111111111";
      const existingOrderId = "22222222-2222-2222-2222-222222222222";
      const existingPgOrderId = "order_rzp_pending_456";
      const existingIdempotencyKey = "44444444-4444-4444-4444-444444444444";

      const pendingOrdersSelectChain = {
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: existingOrderId,
                  user_id: 42,
                  challenge_id: challengeId,
                  pg_order_id: existingPgOrderId,
                  idempotency_key: existingIdempotencyKey,
                  discount_tracker_id: null,
                  discount_applied: false,
                  final_price: "9000.00",
                  pg_status: "created",
                },
              ]),
            }),
          }),
        }),
      };
      mockSelect.mockReturnValueOnce(pendingOrdersSelectChain);

      const handler = getRouteHandler("GET", "/pending/:challengeId");
      const { req, res, status, json } = createReqRes({}, {}, { challengeId });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          hasPendingOrder: true,
          pgOrderId: existingPgOrderId,
          orderId: existingOrderId,
          idempotencyKey: existingIdempotencyKey,
          finalPrice: 9000,
        }),
      );
    });
  });

  describe("DELETE /payments/pending/:challengeId", () => {
    it("deletes unpaid pending order and returns 200", async () => {
      const challengeId = "11111111-1111-1111-1111-111111111111";
      const existingOrderId = "22222222-2222-2222-2222-222222222222";

      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([
            {
              id: existingOrderId,
              user_id: 42,
              challenge_id: challengeId,
              pg_status: "created",
              discount_tracker_id: "tracker-123",
            },
          ]),
        }),
      });

      const mockWhere = vi.fn().mockResolvedValue([]);
      mockDelete.mockReturnValue({ where: mockWhere });

      const handler = getRouteHandler("DELETE", "/pending/:challengeId");
      const { req, res, status, json } = createReqRes({}, {}, { challengeId });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        message: "Pending order cancelled and deleted successfully.",
      });
      expect(mockDelete).toHaveBeenCalled();
    });

    it("returns 200 with message if no pending orders found to delete", async () => {
      const challengeId = "11111111-1111-1111-1111-111111111111";

      mockSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

      const handler = getRouteHandler("DELETE", "/pending/:challengeId");
      const { req, res, status, json } = createReqRes({}, {}, { challengeId });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(200);
      expect(json).toHaveBeenCalledWith({
        message: "No pending orders to delete.",
      });
    });
  });
});
