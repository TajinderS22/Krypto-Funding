import dotenv from "dotenv"
import { defineConfig } from "drizzle-kit";


dotenv.config({
    path:"../.env"
})

console.log(process.env.DATABASE_URL);

export default defineConfig({
  out: "./drizzle",
  schema: "./src/service/Drizzle/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
