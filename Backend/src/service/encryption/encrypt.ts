import crypto from "crypto";

import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

const ALGORITHM = "aes-256-gcm";




const KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY!, "hex");

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY , iv);

  let encrypted = cipher.update(text, "utf8", "hex");

  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};
