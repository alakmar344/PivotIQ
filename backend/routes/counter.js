import express from "express";
import { logger } from "../utils/logger.js";
import { counterRules, handleValidation, sanitizeText } from "../middleware/validator.js";

const router = express.Router();

/**
 * Builds deterministic debate response.
 * @param {{ userCounter: string, currentVerdict: any, researchData: any }} payload
 * @returns {{ responseType: string, agentResponse: string, updatedVerdict: any, verdictChanged: boolean, changeReason: string|null, planReady: boolean }}
 */
function buildDebateResult(payload) {
  const { userCounter, currentVerdict, researchData } = payload;
  const guide = researchData?.debateGuide || {};
  const rebuttals = Array.isArray(guide.coreRebuttals) ? guide.coreRebuttals.slice(0, 2) : [];
  const evidenceToWatch = Array.isArray(guide.evidenceToWatch) ? guide.evidenceToWatch.slice(0, 2) : [];
  const hasDataClaim = /\d|%|according to|study|report|market|competitor|law|regulation/i.test(userCounter);
  const verdict = currentVerdict?.verdict;
  const hasMitigations = Array.isArray(currentVerdict?.cons) && currentVerdict.cons.length > 0;
  const planReady = verdict === "FEASIBLE" || (verdict === "RISKY" && hasMitigations);
  const responseType = planReady ? "plan_ready" : "challenged";

  const responseLines = [
    hasDataClaim
      ? "Thanks — you introduced a factual angle, so the right move is to verify the evidence quality and timing assumptions before changing the thesis."
      : "Good counterpoint — the next step is tightening the causal link between your argument and measurable traction outcomes.",
    rebuttals.length
      ? `Key pressure-test points: ${rebuttals.join(" | ")}.`
      : "Keep pressure-testing market pull, distribution reliability, and execution risk before scaling confidence.",
    evidenceToWatch.length
      ? `Evidence to validate next: ${evidenceToWatch.join(" | ")}.`
      : "Bring source-backed metrics for CAC, retention, and conversion to strengthen your position."
  ];

  return {
    responseType,
    agentResponse: responseLines.join(" "),
    updatedVerdict: null,
    verdictChanged: false,
    changeReason: null,
    planReady
  };
}

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

    const result = buildDebateResult(payload);

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
