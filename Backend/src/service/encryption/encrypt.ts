import crypto from "crypto";

import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

const ALGORITHM = process.env.ENC_DEC_ALGORITHM;

const KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY!, "hex");

export const encrypt = (text: string) => {
  const iv = crypto.randomBytes(12);

  if (!ALGORITHM) {
    return;
  }

  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);

  let encrypted = cipher.update(text, "utf8", "hex");

  encrypted += cipher.final("hex");

  const authTag = (cipher as crypto.CipherGCM).getAuthTag();

  return {
    encrypted,
    iv: iv.toString("hex"),
    authTag: authTag.toString("hex"),
  };
};
