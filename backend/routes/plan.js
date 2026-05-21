import express from "express";
import { planAgent } from "../agents/planAgent.js";
import { logger } from "../utils/logger.js";
import { handleValidation, planRules, sanitizeText } from "../middleware/validator.js";

const router = express.Router();

/**
 * Build plan generation endpoint.
 */
router.post("/", planRules, handleValidation, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      idea: sanitizeText(req.body.idea)
    };

    const verdict = payload.finalVerdict?.verdict;
    const hasMitigations = Array.isArray(payload.finalVerdict?.cons) && payload.finalVerdict.cons.length > 0;
    const eligible = verdict === "FEASIBLE" || (verdict === "RISKY" && hasMitigations);

    if (!eligible) {
      const error = new Error("Idea is not ready for planning");
      error.name = "ValidationError";
      error.details = [{ msg: "planReady conditions failed" }];
      throw error;
    }

    logger.info("PlanRoute", "PLAN_REQUEST_RECEIVED", {
      sessionId: payload.sessionId,
      verdict
    });

    const plan = await planAgent(payload);
    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

export default router;
