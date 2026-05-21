import express from "express";
import { v4 as uuidv4 } from "uuid";
import { researchAgent } from "../agents/researchAgent.js";
import { analysisAgent } from "../agents/analysisAgent.js";
import { logger } from "../utils/logger.js";
import { handleValidation, validateIdeaRules, sanitizeText } from "../middleware/validator.js";

const router = express.Router();

/**
 * Validate startup idea endpoint.
 */
router.post("/", validateIdeaRules, handleValidation, async (req, res, next) => {
  try {
    const idea = sanitizeText(req.body.idea);
    logger.info("ValidateRoute", "REQUEST_RECEIVED", { ideaLength: idea.length });

    const researchData = await researchAgent(idea);
    const verdict = await analysisAgent(idea, researchData);
    const sessionId = uuidv4();

    res.json({ researchData, verdict, sessionId });
  } catch (error) {
    next(error);
  }
});

export default router;
