import rateLimit from "express-rate-limit";

/**
 * API rate limiter middleware.
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: "RateLimitExceeded",
      message: "Too many requests. Please try again later.",
      timestamp: new Date().toISOString()
    }
  }
});
