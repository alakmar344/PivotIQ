import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";

const MODEL_NAME = "gemini-2.5-flash-preview-05-20";
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
