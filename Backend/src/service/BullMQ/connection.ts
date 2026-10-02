import dotenv from "dotenv";
import type { ConnectionOptions } from "bullmq";

dotenv.config({
  path: "../.env",
});

const getConnectionOptions = (): ConnectionOptions => {
  if (process.env.REDIS_URL) {
    return {
      url: process.env.REDIS_URL,
      maxRetriesPerRequest: null,
    };
  }

  if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
    try {
      const url = new URL(process.env.UPSTASH_REDIS_URL);
      return {
        host: url.hostname,
        port: Number(process.env.REDIS_PORT) || 6379,
        username: "default",
        password: process.env.UPSTASH_REDIS_TOKEN,
        tls: {},
        maxRetriesPerRequest: null,
      };
    } catch {
      // fallback
    }
  }

  return {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
  };
};

const connection = getConnectionOptions();

export default connection;
