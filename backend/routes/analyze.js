import express from "express";
import { analysisAgent } from "../agents/analysisAgent.js";
import { logger } from "../utils/logger.js";
import { analysisRules, handleValidation, sanitizeText } from "../middleware/validator.js";

const router = express.Router();

/**
 * Analyze startup idea endpoint.
 */
router.post("/", analysisRules, handleValidation, async (req, res, next) => {
  try {
    const idea = sanitizeText(req.body.idea);
    const researchData = req.body.researchData;
    logger.info("AnalyzeRoute", "REQUEST_RECEIVED", {
      ideaLength: idea.length,
      sessionId: req.body.sessionId
    });

    const verdict = await analysisAgent(idea, researchData);

    res.json({
      verdict,
      planReady: verdict?.verdict === "FEASIBLE"
    });
  } catch (error) {
    next(error);
  }
});

export default router;
