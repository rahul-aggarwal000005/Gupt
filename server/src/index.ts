import "./env";

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes";
import vaultRoutes from "./routes/vault.routes";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import { generalRateLimiter } from "./middleware/rate-limiter.middleware";

const app = express();
const port = process.env.PORT || 3001;

// Trust reverse proxy in production (e.g. AWS ALB, Render, Cloudflare, Nginx)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Global Security & Parsing Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.APP_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(generalRateLimiter);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/vault", vaultRoutes);

// Health endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// Unmatched Route (404) & Centralized Error Handlers
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
