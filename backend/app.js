import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import resumeRoutes from "./routes/resume.routes.js";
import chatRoutes from "./routes/chat.routes.js";
import bookingRoutes from "./routes/booking.routes.js";
import { razorpayWebhook, stripeWebhook } from "./controllers/payment.controller.js";

import {
  notFoundHandler,
  errorHandler,
} from "./middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

// app.use(
//   rateLimit({
//     windowMs: 15 * 60 * 1000,
//     limit: 200,
//     standardHeaders: "draft-8",
//     legacyHeaders: false,
//   })
// );

// Stripe webhook ke liye raw body ka dedicated route
// signature verification requires the unparsed request bytes.
app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  stripeWebhook
);
app.post(
  "/api/payments/razorpay/webhook",
  express.raw({ type: "application/json", limit: "1mb" }),
  razorpayWebhook,
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Career Platform API is running",
  });
});

// Domain routes yahan register honge.
// Example: app.use("/api/auth", authRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/consultations", bookingRoutes);

app.use(notFoundHandler);
app.use(errorHandler);



export default app;
