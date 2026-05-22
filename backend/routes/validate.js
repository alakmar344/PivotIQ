import express from "express";
import { v4 as uuidv4 } from "uuid";
import { unifiedAgent } from "../agents/unifiedAgent.js";
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

    const unified = await unifiedAgent(idea);
    const researchData = {
      ...unified.researchData,
      debateGuide: unified.debateGuide,
      precomputedPlan: unified.plan
    };
    const verdict = unified.verdict;
    const sessionId = uuidv4();

    res.json({ researchData, verdict, sessionId });
  } catch (error) {
    next(error);
  }
});

export default router;
