import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import apiRouter from "./routes/api.js";

dotenv.config({
  path: "../.env",
});

const port = process.env.BACKEND_PORT || 3005;

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Hello from Tajinder Singh.",
  });
});

app.use("/api/v1", apiRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
