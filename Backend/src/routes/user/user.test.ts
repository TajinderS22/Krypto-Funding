import { describe, it, expect, vi, beforeEach } from "vitest";
import { UserSchema } from "../../validation/userSchema.js";

// Drizzle DB chaining mock
const mockWhere = vi.fn().mockResolvedValue([]);
const mockFrom = vi.fn().mockReturnValue({ where: mockWhere });
const mockSelect = vi.fn().mockReturnValue({ from: mockFrom });
const mockReturning = vi.fn().mockResolvedValue([{ id: 1 }]);
const mockValues = vi.fn().mockReturnValue({ returning: mockReturning });
const mockInsert = vi.fn().mockReturnValue({ values: mockValues });

vi.mock("../../service/Drizzle/index.js", () => ({
  default: {
    select: mockSelect,
    insert: mockInsert,
  },
}));

vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn(() => Promise.resolve("$2b$10$hashedpassword")),
  },
}));

vi.mock("../../service/email/email.js", () => ({
  sendWelocmeEmail: vi.fn(() => Promise.resolve()),
}));

vi.mock("../../Utils/redisClient.js", () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    del: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
  },
}));

const validUserData = {
  firstname: "John",
  lastname: "Doe",
  username: "johndoe",
  email: "john@example.com",
  password: "Password123",
};

function createReqRes(body?: unknown) {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return {
    req: { body: body ?? {} } as any,
    res: { json, status } as any,
    json,
    status,
  };
}

describe("POST /auth/signup — validation flow", () => {
  let userRouter: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    userRouter = (await import("./user.js")).default;
  });

  function findSignupHandler() {
    for (const layer of userRouter.stack) {
      if (layer.route?.path === "/auth/signup" && layer.route.methods?.post) {
        return layer.route.stack[0]?.handle;
      }
    }
    return null;
  }

  describe("validation rejects invalid input", () => {
    const invalidCases = [
      { name: "missing firstname", override: { firstname: undefined } },
      { name: "missing lastname", override: { lastname: undefined } },
      { name: "missing username", override: { username: undefined } },
      { name: "missing email", override: { email: undefined } },
      { name: "missing password", override: { password: undefined } },
      { name: "malformed email", override: { email: "not-an-email" } },
      { name: "short password", override: { password: "Ab1" } },
      { name: "password without uppercase", override: { password: "password123" } },
      { name: "password without lowercase", override: { password: "PASSWORD123" } },
      { name: "password without number", override: { password: "Password!" } },
    ];

    invalidCases.forEach(({ name, override }) => {
      it(`returns 400 for ${name}`, async () => {
        const handler = findSignupHandler();
        expect(handler).toBeDefined();

        const { req, res, status } = createReqRes({
          user: { ...validUserData, ...override },
        });

        await handler(req, res);

        expect(status).toHaveBeenCalledWith(400);
      });
    });

    it("returns validation error details in body", async () => {
      const handler = findSignupHandler();
      expect(handler).toBeDefined();

      const { req, res, status, json } = createReqRes({
        user: { ...validUserData, email: "bad-email", password: "short" },
      });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(400);
      expect(json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Validation failed",
          errors: expect.arrayContaining([
            expect.objectContaining({ message: expect.any(String) }),
          ]),
        }),
      );
    });
  });

  describe("valid input proceeds to database", () => {
    it("does not return 400 for valid input", async () => {
      const handler = findSignupHandler();
      expect(handler).toBeDefined();

      const { req, res, status } = createReqRes({ user: validUserData });

      await handler(req, res);

      expect(status).not.toHaveBeenCalledWith(400);
    });

    it("invokes db.insert with validated data", async () => {
      const handler = findSignupHandler();
      expect(handler).toBeDefined();

      const { req, res } = createReqRes({ user: validUserData });

      await handler(req, res);

      // Should have called insert with the validated user (password hashed)
      expect(mockInsert).toHaveBeenCalled();
      const insertedData = mockValues.mock.calls[0]?.[0];
      expect(insertedData?.email).toBe("john@example.com");
      expect(insertedData?.password).toContain("$2b$10$");
    });

    it("returns 200 on success", async () => {
      const handler = findSignupHandler();
      expect(handler).toBeDefined();

      const { req, res, status } = createReqRes({ user: validUserData });

      await handler(req, res);

      expect(status).toHaveBeenCalledWith(200);
    });
  });
});
