import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config({
  path: "../.env",
});

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

if (!keyId || !keySecret) {
  throw new Error("Missing Razorpay credentials");
}

console.log("rzpKeyId",keyId)
console.log("rzpKeySecret",keySecret)

const rzpInstance = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

export default rzpInstance 
