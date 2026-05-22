import express from "express";
import { adversarialAgent } from "../agents/adversarialAgent.js";
import { logger } from "../utils/logger.js";
import { counterRules, handleValidation, sanitizeText } from "../middleware/validator.js";

const router = express.Router();

/**
 * Debate counter endpoint.
 */
router.post("/", counterRules, handleValidation, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      idea: sanitizeText(req.body.idea),
      userCounter: sanitizeText(req.body.userCounter)
    };

    logger.info("CounterRoute", "COUNTER_RECEIVED", {
      sessionId: payload.sessionId,
      turn: payload.debateHistory.length + 1,
      counterLength: payload.userCounter.length
    });

    const result = await adversarialAgent({
      idea: payload.idea,
      researchData: payload.researchData,
      currentVerdict: payload.currentVerdict,
      debateHistory: payload.debateHistory,
      userCounter: payload.userCounter
    });

    res.json({
      agentResponse: result.agentResponse,
      updatedVerdict: result.updatedVerdict,
      verdictChanged: Boolean(result.verdictChanged),
      planReady: Boolean(result.planReady),
      responseType: result.responseType,
      changeReason: result.changeReason
    });
  } catch (error) {
    next(error);
  }
});

export default router;
