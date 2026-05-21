import { logger } from "../utils/logger.js";

/**
 * Global Express error handler.
 * @param {any} err
 * @param {import('express').Request} _req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 * @returns {void}
 */
export function errorHandler(err, _req, res, _next) {
  logger.error("ErrorHandler", "REQUEST_FAILED", err);

  const timestamp = new Date().toISOString();
  let code = "InternalServerError";
  let status = 500;
  let message = "An unexpected error occurred";

  if (err?.name === "ValidationError") {
    code = "ValidationError";
    status = 400;
    message = "Request validation failed";
  } else if (err?.code === "GeminiError") {
    code = "GeminiError";
    status = 502;
    message = "AI provider request failed";
  } else if (err?.code === "SerperError") {
    code = "SerperError";
    status = 502;
    message = "Search provider request failed";
  }

  if (process.env.NODE_ENV !== "production") {
    res.status(status).json({
      error: {
        code,
        message,
        timestamp,
        details: err?.details || err?.message,
        stack: err?.stack
      }
    });
    return;
  }

  res.status(status).json({
    error: {
      code,
      message,
      timestamp
    }
  });
}
