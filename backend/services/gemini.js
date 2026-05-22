import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";

const MODEL_NAME = "gemini-3.5-flash";
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = [1000, 2000, 4000];

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  logger.warn("GeminiService", "GEMINI_API_KEY is not configured");
}

const client = new GoogleGenerativeAI(apiKey || "missing-key");

/**
 * Sleeps for given milliseconds.
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Determines if a Gemini error is retryable.
 * @param {unknown} error
 * @returns {boolean}
 */
function isRetryableError(error) {
  const status = error?.status || error?.response?.status;
  if (status === 429 || (status >= 500 && status < 600)) {
    return true;
  }
  const message = String(error?.message || "").toLowerCase();
  return message.includes("rate") || message.includes("timeout") || message.includes("unavailable");
}

/**
 * Normalizes Gemini API errors.
 * @param {unknown} error
 * @returns {{ code: string, message: string, retryable: boolean }}
 */
function toGeminiError(error) {
  return {
    code: "GeminiError",
    message: error?.message || "Gemini API call failed",
    retryable: isRetryableError(error)
  };
}

/**
 * Parses text output from Gemini candidates.
 * @param {unknown} response
 * @returns {string}
 */
function extractText(response) {
  try {
    if (typeof response?.text === "function") {
      return response.text();
    }
    if (typeof response?.response?.text === "function") {
      return response.response.text();
    }
    return response?.response?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || "";
  } catch (_error) {
    return "";
  }
}

/**
 * Removes markdown code fences from model text.
 * @param {string} text
 * @returns {string}
 */
function stripCodeFences(text) {
  return String(text || "")
    .replace(/^```(?:json)?/gim, "")
    .replace(/```$/gim, "")
    .trim();
}

/**
 * Applies lightweight JSON normalization.
 * @param {string} text
 * @returns {string}
 */
function normalizeJsonText(text) {
  return String(text || "")
    .replace(/[\u201C\u201D]/g, "\"")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .trim();
}

/**
 * Extracts first balanced JSON object/array from text.
 * @param {string} text
 * @returns {string}
 */
function extractBalancedJson(text) {
  const input = String(text || "");
  const start = input.search(/[{\[]/);
  if (start < 0) return input;

  const stack = [];
  let inString = false;
  let escape = false;

  for (let i = start; i < input.length; i += 1) {
    const ch = input[i];
    if (inString) {
      if (escape) {
        escape = false;
      } else if (ch === "\\") {
        escape = true;
      } else if (ch === "\"") {
        inString = false;
      }
      continue;
    }

    if (ch === "\"") {
      inString = true;
      continue;
    }

    if (ch === "{" || ch === "[") {
      stack.push(ch);
      continue;
    }

    if (ch === "}" || ch === "]") {
      const top = stack[stack.length - 1];
      if ((ch === "}" && top === "{") || (ch === "]" && top === "[")) {
        stack.pop();
        if (stack.length === 0) {
          return input.slice(start, i + 1);
        }
      }
    }
  }

  return input.slice(start);
}

/**
 * Parses and validates structured JSON using a 5-step repair/checker flow.
 * @param {string} text
 * @param {(value: any) => boolean} checker
 * @returns {any}
 */
export function repairAndCheckJson(text, checker) {
  const step1 = stripCodeFences(text);
  let parsed = null;

  // Step 1: direct parse after fence strip.
  try {
    parsed = JSON.parse(step1);
  } catch (_error) {
    parsed = null;
  }

  // Step 2: normalized parse.
  if (!parsed) {
    const step2 = normalizeJsonText(step1);
    try {
      parsed = JSON.parse(step2);
    } catch (_error) {
      parsed = null;
    }
  }

  // Step 3: parse extracted balanced block.
  if (!parsed) {
    const step3 = extractBalancedJson(step1);
    try {
      parsed = JSON.parse(step3);
    } catch (_error) {
      parsed = null;
    }
  }

  // Step 4: normalize extracted block and parse.
  if (!parsed) {
    const step4 = normalizeJsonText(extractBalancedJson(step1));
    try {
      parsed = JSON.parse(step4);
    } catch (_error) {
      parsed = null;
    }
  }

  // Step 5: schema check.
  if (!parsed || (typeof checker === "function" && !checker(parsed))) {
    const error = new Error("Structured JSON repair/check failed");
    error.code = "GeminiError";
    throw error;
  }

  return parsed;
}

/**
 * Generates text content from Gemini with retry logic.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ temperature?: number, maxOutputTokens?: number }} [options]
 * @returns {Promise<string>}
 */
export async function generateContent(systemPrompt, userPrompt, options = {}) {
  const temperature = options.temperature ?? 0.7;
  const maxOutputTokens = options.maxOutputTokens ?? 4096;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt += 1) {
    const startedAt = Date.now();
    try {
      logger.info("GeminiService", "REQUEST_START", {
        model: MODEL_NAME,
        promptLength: systemPrompt.length + userPrompt.length,
        attempt
      });

      const model = client.getGenerativeModel({ model: MODEL_NAME });
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
        generationConfig: { temperature, maxOutputTokens }
      });

      const response = result?.response;
      const text = extractText(result);
      const usageMetadata = response?.usageMetadata || {};
      const finishReason = response?.candidates?.[0]?.finishReason || "unknown";

      logger.info("GeminiService", "REQUEST_COMPLETE", {
        latencyMs: Date.now() - startedAt,
        finishReason,
        totalTokenCount: usageMetadata.totalTokenCount || null,
        promptTokenCount: usageMetadata.promptTokenCount || null,
        candidatesTokenCount: usageMetadata.candidatesTokenCount || null
      });

      if (finishReason === "MAX_TOKENS") {
        logger.warn("GeminiService", "MAX_TOKENS_TRUNCATION", {
          maxOutputTokens,
          candidatesTokenCount: usageMetadata.candidatesTokenCount || null,
          hint: "Response was cut off. Increase maxOutputTokens to avoid truncated JSON."
        });
      }

      return text;
    } catch (error) {
      const normalizedError = toGeminiError(error);
      logger.error("GeminiService", "API_CALL_FAILED", {
        attempt,
        error: normalizedError,
        latencyMs: Date.now() - startedAt
      });

      if (!normalizedError.retryable || attempt === MAX_RETRIES) {
        throw normalizedError;
      }

      await sleep(RETRY_BACKOFF_MS[attempt - 1] || 4000);
    }
  }

  throw { code: "GeminiError", message: "Gemini retries exhausted", retryable: false };
}

/**
 * Generates structured JSON in a single model call with local repair/check.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {{ temperature?: number, maxOutputTokens?: number, checker?: (value: any) => boolean }} [options]
 * @returns {Promise<any>}
 */
export async function generateStructuredContent(systemPrompt, userPrompt, options = {}) {
  const text = await generateContent(systemPrompt, userPrompt, options);
  return repairAndCheckJson(text, options.checker);
}

/**
 * Streams content chunks from Gemini.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {(chunk: string) => void} onChunk
 * @returns {Promise<void>}
 */
export async function streamContent(systemPrompt, userPrompt, onChunk) {
  const startedAt = Date.now();
  try {
    logger.info("GeminiService", "STREAM_START", {
      model: MODEL_NAME,
      promptLength: systemPrompt.length + userPrompt.length
    });

    const model = client.getGenerativeModel({ model: MODEL_NAME });
    const streamResult = await model.generateContentStream({
      contents: [{ role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096 }
    });

    for await (const chunk of streamResult.stream) {
      const text = extractText(chunk);
      if (text) {
        onChunk(text);
      }
    }

    logger.info("GeminiService", "STREAM_COMPLETE", { latencyMs: Date.now() - startedAt });
  } catch (error) {
    const normalizedError = toGeminiError(error);
    logger.error("GeminiService", "STREAM_FAILED", normalizedError);
    throw normalizedError;
  }
}
