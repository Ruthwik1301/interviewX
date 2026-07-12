import express from "express";
import cors from "cors";
import passport from "passport";
import { env } from "./config/env.js";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import runRoutes from "./routes/runRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

configurePassport();

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.corsOrigin, credentials: true }));
  app.use(express.json({ limit: "1mb" }));
  app.use(passport.initialize());

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/interviews", interviewRoutes);
  app.use("/api/run", runRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
