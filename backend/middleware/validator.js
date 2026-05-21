import { body, validationResult } from "express-validator";

/**
 * Sanitizes text input by trimming and removing HTML tags.
 * @param {string} value
 * @returns {string}
 */
export function sanitizeText(value) {
  const input = String(value || "");
  let inTag = false;
  let out = "";

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === "<") {
      inTag = true;
      continue;
    }
    if (char === ">") {
      inTag = false;
      continue;
    }
    if (!inTag) {
      out += char;
    }
  }

  return out.replace(/\s+/g, " ").trim();
}

/**
 * Validates request and throws validation error if invalid.
 * @param {import('express').Request} req
 * @param {import('express').Response} _res
 * @param {import('express').NextFunction} next
 * @returns {void}
 */
export function handleValidation(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    next();
    return;
  }

  const error = new Error("Validation failed");
  error.name = "ValidationError";
  error.details = result.array();
  next(error);
}

/**
 * Validation rules for validate endpoint.
 */
export const validateIdeaRules = [
  body("idea")
    .exists()
    .withMessage("idea is required")
    .bail()
    .isString()
    .withMessage("idea must be a string")
    .bail()
    .customSanitizer((value) => sanitizeText(value))
    .isLength({ min: 20, max: 1000 })
    .withMessage("idea must be between 20 and 1000 characters")
];

/**
 * Validation rules for counter endpoint.
 */
export const counterRules = [
  body("sessionId").exists().isString().withMessage("sessionId is required"),
  body("idea")
    .exists()
    .isString()
    .customSanitizer((value) => sanitizeText(value))
    .isLength({ min: 20, max: 1000 }),
  body("researchData").exists().isObject().withMessage("researchData is required"),
  body("currentVerdict").exists().isObject().withMessage("currentVerdict is required"),
  body("debateHistory").exists().isArray({ max: 20 }).withMessage("debateHistory must contain max 20 entries"),
  body("userCounter")
    .exists()
    .isString()
    .customSanitizer((value) => sanitizeText(value))
    .isLength({ min: 10, max: 2000 })
    .withMessage("userCounter must be between 10 and 2000 characters")
];

/**
 * Validation rules for plan endpoint.
 */
export const planRules = [
  body("sessionId").exists().isString().withMessage("sessionId is required"),
  body("idea")
    .exists()
    .isString()
    .customSanitizer((value) => sanitizeText(value))
    .isLength({ min: 20, max: 1000 }),
  body("researchData").exists().isObject().withMessage("researchData is required"),
  body("finalVerdict").exists().isObject().withMessage("finalVerdict is required"),
  body("debateHistory").exists().isArray({ max: 20 }).withMessage("debateHistory must contain max 20 entries")
];
