import { generateOtp, hashOtp } from "../../Utils/Otp.js";
import redis from "../../Utils/redisClient.js";
import { sendOtp } from "../email/email.js";

const sendOtpService = async (email: string, prefix?: string) => {
  const rateKey = `${prefix ? `${prefix}_` : ''}rate:${email}`;
  const count = await redis.incr(rateKey);

  if (count === 1) await redis.expire(rateKey, 60);
  if (count > 5) throw new Error("Too many requests");

  const otp = generateOtp();
  const hashed = hashOtp(otp);

  const keyPrefix = prefix ? `${prefix}_` : '';
  await redis.set(`${keyPrefix}otp:${email}`, hashed, { ex: 300 });

  await redis.del(`${keyPrefix}otp_attempts:${email}`);

  await sendOtp(email, otp);

  return true;
};

export default sendOtpService;
