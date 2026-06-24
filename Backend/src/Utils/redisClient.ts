import { Redis } from "@upstash/redis";
import dotenv from "dotenv";

dotenv.config({
  path: "../../.env",
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

export default redis;
