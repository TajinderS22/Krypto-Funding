import crypto from "crypto";
const ALGORITHM = "aes-256-gcm";
const KEY = Buffer.from(process.env.MASTER_ENCRYPTION_KEY!, "hex");
export function decrypt(encrypted: string, iv: string, authTag: string) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    KEY,
    Buffer.from(iv, "hex"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
