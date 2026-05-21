import express from "express";
import cors from "cors";
import helmet from "helmet";
import validateRoute from "./routes/validate.js";
import counterRoute from "./routes/counter.js";
import planRoute from "./routes/plan.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { logger } from "./utils/logger.js";

try {
  const dotenv = await import("dotenv");
  dotenv.default.config();
} catch (error) {
  if (error.code !== "ERR_MODULE_NOT_FOUND") {
    throw error;
  }
  console.warn("dotenv package not found; continuing with host-provided environment variables.");
}

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const version = "1.0.0";

/**
 * Request timeout middleware.
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
function requestTimeout(_req, res, next) {
  res.setTimeout(30000, () => {
    const error = new Error("Request timed out");
    error.code = "TimeoutError";
    next(error);
  });
  next();
}

app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: "50kb" }));
app.use(requestTimeout);
app.use("/api", apiRateLimiter);

app.use((req, res, next) => {
  req.requestStartTime = Date.now();
  logger.info("HTTP", "REQUEST", {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get("user-agent")
  });
  next();
});

app.use((req, res, next) => {
  const originalEnd = res.end;
  res.end = function wrappedEnd(...args) {
    const elapsed = Date.now() - req.requestStartTime;
    res.setHeader("X-Response-Time", `${elapsed}ms`);
    logger.api(req.method, req.originalUrl, res.statusCode, elapsed);
    return originalEnd.apply(this, args);
  };
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), version });
});

app.use("/api/validate", validateRoute);
app.use("/api/counter", counterRoute);
app.use("/api/plan", planRoute);

app.use(errorHandler);

const server = app.listen(port, () => {
  logger.info("Server", "STARTED", { port, frontendUrl });
});

process.on("unhandledRejection", (reason) => {
  logger.error("Server", "UNHANDLED_REJECTION", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Server", "UNCAUGHT_EXCEPTION", error);
});

/**
 * Gracefully shuts down server.
 * @param {string} signal
 * @returns {void}
 */
function shutdown(signal) {
  logger.warn("Server", "SHUTDOWN_SIGNAL_RECEIVED", { signal });
  server.close(() => {
    logger.info("Server", "SHUTDOWN_COMPLETE");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
