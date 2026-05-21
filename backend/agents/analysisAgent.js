import { generateContent } from "../services/gemini.js";
import { logger } from "../utils/logger.js";

/**
 * Parses JSON safely.
 * @param {string} text
 * @returns {any}
 */
function parseJson(text) {
  const cleaned = text.replace(/^```json|```$/gim, "").trim();
  return JSON.parse(cleaned);
}

/**
 * Checks minimal verdict schema.
 * @param {any} verdict
 * @returns {boolean}
 */
function isVerdictValid(verdict) {
  return typeof verdict?.feasibilityScore === "number"
    && ["FEASIBLE", "RISKY", "NOT_FEASIBLE"].includes(verdict?.verdict)
    && Array.isArray(verdict?.pros)
    && Array.isArray(verdict?.cons)
    && typeof verdict?.summary === "string";
}

/**
 * Produces idea feasibility verdict.
 * @param {string} idea
 * @param {any} researchData
 * @returns {Promise<any>}
 */
export async function analysisAgent(idea, researchData) {
  try {
    logger.agent("AnalysisAgent", "START", { idea: idea.substring(0, 80) });
    logger.agent("AnalysisAgent", "RESEARCH_SUMMARY", {
      competitors: researchData?.competitors?.length || 0,
      regulations: researchData?.regulations?.length || 0,
      trends: researchData?.trends?.length || 0
    });

    const systemPrompt = `You are an adversarial startup advisor. Your job is NOT to be nice —
it is to find every reason this idea could fail, backed by evidence.
But you are fair: if evidence supports success, acknowledge it.

Based on the research provided, analyze this startup idea and return:
- feasibilityScore: 0-100 (be harsh)
- verdict: "FEASIBLE" | "RISKY" | "NOT_FEASIBLE"
- pros: array of {point, evidence, strength: "strong"|"weak"}
- cons: array of {point, evidence, severity: "critical"|"major"|"minor"}
- keyRisk: the single biggest reason this could fail
- keyStrength: the single best thing about this idea
- confidenceLevel: "high"|"medium"|"low" (based on data quality)
- summary: 2-3 sentence plain English verdict

Return ONLY valid JSON. No markdown. No backticks.`;

    const userPrompt = `Idea: ${idea}\nResearch Data: ${JSON.stringify(researchData)}`;
    logger.agent("AnalysisAgent", "GEMINI_CALL_START", { promptLength: userPrompt.length });

    let parsed;
    try {
      const firstPass = await generateContent(systemPrompt, userPrompt, { temperature: 0.3, maxOutputTokens: 2500 });
      parsed = parseJson(firstPass);
    } catch (_error) {
      parsed = null;
    }

    if (!isVerdictValid(parsed)) {
      logger.warn("AnalysisAgent", "MALFORMED_VERDICT_REPROMPT");
      const repairPrompt = `${userPrompt}\nPrevious output invalid. Return ONLY valid JSON matching schema exactly.`;
      const secondPass = await generateContent(systemPrompt, repairPrompt, { temperature: 0.2, maxOutputTokens: 2500 });
      parsed = parseJson(secondPass);
    }

    if (!isVerdictValid(parsed)) {
      const error = new Error("Invalid verdict schema from model");
      error.code = "GeminiError";
      throw error;
    }

    logger.agent("AnalysisAgent", "COMPLETE", {
      feasibilityScore: parsed.feasibilityScore,
      verdict: parsed.verdict
    });

    return parsed;
  } catch (error) {
    logger.error("AnalysisAgent", "FAILED", error);
    throw error;
  }
}
