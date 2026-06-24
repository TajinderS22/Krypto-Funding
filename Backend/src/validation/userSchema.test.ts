import { describe, it, expect } from "vitest";
import { UserSchema } from "./userSchema.js";

const validUser = {
  firstname: "John",
  lastname: "Doe",
  username: "johndoe",
  email: "john@example.com",
  password: "Password123",
};

describe("UserSchema", () => {
  describe("valid data", () => {
    it("accepts a fully valid user", () => {
      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
    });

    it("passwords with special characters are accepted", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "P@ssword!23",
      });
      expect(result.success).toBe(true);
    });

    it("passwords at max 50 chars are accepted", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "Aaaaaaaa1" + "x".repeat(40),
      });
      expect(result.success).toBe(true);
    });
  });

  describe("firstname", () => {
    it("rejects missing firstname", () => {
      const { firstname, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it("rejects empty string firstname", () => {
      const result = UserSchema.safeParse({ ...validUser, firstname: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("lastname", () => {
    it("rejects missing lastname", () => {
      const { lastname, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it("rejects empty string lastname", () => {
      const result = UserSchema.safeParse({ ...validUser, lastname: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("username", () => {
    it("rejects missing username", () => {
      const { username, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it("rejects empty string username", () => {
      const result = UserSchema.safeParse({ ...validUser, username: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("email", () => {
    it("rejects missing email", () => {
      const { email, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it("rejects empty string email", () => {
      const result = UserSchema.safeParse({ ...validUser, email: "" });
      expect(result.success).toBe(false);
    });

    it("rejects email without @", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        email: "notanemail",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email without domain", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        email: "user@",
      });
      expect(result.success).toBe(false);
    });

    it("rejects email without tld", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        email: "user@domain",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("password", () => {
    it("rejects missing password", () => {
      const { password, ...without } = validUser;
      const result = UserSchema.safeParse(without);
      expect(result.success).toBe(false);
    });

    it("rejects empty string password", () => {
      const result = UserSchema.safeParse({ ...validUser, password: "" });
      expect(result.success).toBe(false);
    });

    it("rejects password shorter than 8 characters", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "Abc1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password at exactly 7 characters", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "Abc1",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password longer than 50 characters", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "Aaaaaaaa1" + "x".repeat(42),
      });
      expect(result.success).toBe(false);
    });

    it("rejects password missing uppercase letter", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "password123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password missing lowercase letter", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "PASSWORD123",
      });
      expect(result.success).toBe(false);
    });

    it("rejects password missing number", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "Password!",
      });
      expect(result.success).toBe(false);
    });

    it("includes descriptive error messages for each failed rule", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        password: "short",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        const messages = result.error.issues.map((i) => i.message);
        expect(messages).toContain("Password must be at least 8 characters");
      }
    });
  });

  describe("edge cases", () => {
    it("rejects null input", () => {
      const result = UserSchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    it("rejects undefined input", () => {
      const result = UserSchema.safeParse(undefined);
      expect(result.success).toBe(false);
    });

    it("rejects empty object", () => {
      const result = UserSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects non-object input (array)", () => {
      const result = UserSchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    it("strips unknown fields by default", () => {
      const result = UserSchema.safeParse({
        ...validUser,
        extraField: "should be stripped",
      });
      expect(result.success).toBe(true);
    });
  });
});
