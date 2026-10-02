import { drizzle } from "drizzle-orm/neon-http";

import dotenv from "dotenv"
dotenv.config({
    path:"../.env"
})



const db = drizzle(process.env.DATABASE_URL!);

export default db;
