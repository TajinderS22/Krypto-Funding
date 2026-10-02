// import { Redis } from "@upstash/redis";
import dotenv from "dotenv";
import { createClient } from "redis";

dotenv.config({
  path: "../.env",
});

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_URL!,
//   token: process.env.UPSTASH_REDIS_TOKEN!,
// });

const redis = await createClient({
     url: process.env.REDIS_URL || 'redis://localhost:6379'
}).connect()

export default redis;
