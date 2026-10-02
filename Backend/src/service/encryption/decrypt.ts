import crypto from "crypto";
import dotenv from "dotenv";

dotenv.config({
  path: "../.env",
});

const ALGORITHM = process.env.ENC_DEC_ALGORITHM;

const KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY!, "hex");
export function decrypt(encrypted: string, iv: string, authTag: string) {
  if (!ALGORITHM) {
    return;
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, "hex"),
  );
  (decipher as crypto.DecipherGCM).setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
