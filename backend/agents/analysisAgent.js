import { generateContent, repairAndCheckJson } from "../services/gemini.js";
import { logger } from "../utils/logger.js";

const FALLBACK_MAIN_RISK = "Evidence quality and execution risk remain high.";
const FALLBACK_HIDDEN_INSIGHT = "No hidden insight available.";
const MAX_IDEA_PREVIEW_LENGTH = 120;

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
    && verdict.pros.every((item) => typeof item === "string")
    && verdict.cons.every((item) => typeof item === "string")
    && typeof verdict?.summary === "string"
    && typeof verdict?.keyRisk === "string"
    && typeof verdict?.keyStrength === "string";
}

/**
 * Builds fallback verdict when parsing fails repeatedly.
 * @param {string} idea
 * @param {any} context
 * @returns {{ feasibilityScore: number, verdict: string, pros: string[], cons: string[], summary: string, keyRisk: string, keyStrength: string }}
 */
function buildFallbackVerdict(idea, context) {
  const topCompetitors = Array.isArray(context?.topCompetitors) ? context.topCompetitors : [];
  const marketSize = context?.marketSize || "Unknown";
  const mainRisk = context?.mainRisk || FALLBACK_MAIN_RISK;
  const hiddenInsight = context?.hiddenInsight || FALLBACK_HIDDEN_INSIGHT;
  const hasKnownMarketSignal = !String(marketSize).toLowerCase().includes("unknown");
  return {
    feasibilityScore: hasKnownMarketSignal ? 48 : 42,
    verdict: "RISKY",
    pros: [
      `Idea has a defined problem statement: ${idea.slice(0, MAX_IDEA_PREVIEW_LENGTH)}`,
      `Market framing exists: ${marketSize}`,
      `Differentiation angle: ${hiddenInsight}`
    ],
    cons: [
      `Primary risk: ${mainRisk}`,
      topCompetitors.length > 0
        ? `Competition pressure from ${topCompetitors.slice(0, 2).join(", ")}`
        : "Competition landscape is unclear"
    ],
    summary: "The idea shows potential but evidence quality is mixed, so this is classified as risky until stronger validation is available.",
    keyRisk: mainRisk,
    keyStrength: hasKnownMarketSignal ? `Addressable market signal: ${marketSize}` : "Clear problem framing"
  };
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
    logger.agent("AnalysisAgent", "RESEARCH_SUMMARY", { contextSize: JSON.stringify(researchData || {}).length });

    const systemPrompt = `You are an adversarial startup advisor. Your job is NOT to be nice —
it is to find every reason this idea could fail, backed by evidence.
But you are fair: if evidence supports success, acknowledge it.

Based on the research provided, analyze this startup idea and return:
- feasibilityScore: 0-100 (be harsh)
- verdict: "FEASIBLE" | "RISKY" | "NOT_FEASIBLE"
- pros: array of concise strings
- cons: array of concise strings
- keyRisk: the single biggest reason this could fail
- keyStrength: the single best thing about this idea
- summary: 2-3 sentence plain English verdict

Return ONLY valid JSON. No markdown. No backticks.`;

    const userPrompt = `Idea: ${idea}\nResearch Data: ${JSON.stringify(researchData)}`;
    logger.agent("AnalysisAgent", "COMPRESSED_PROMPT_READY", { promptLength: userPrompt.length });

    let parsed;
    let retryCount = 0;
    try {
      const firstPass = await generateContent(systemPrompt, userPrompt, {
        temperature: 0.25,
        maxOutputTokens: 1600,
        responseMimeType: "application/json",
        agentName: "AnalysisAgent"
      });
      parsed = repairAndCheckJson(firstPass, isVerdictValid);
    } catch (error) {
      logger.warn("AnalysisAgent", "PARSING_FAILURE", { stage: "first_pass", reason: error?.message || "parse_failed" });
      parsed = null;
    }

    if (!isVerdictValid(parsed)) {
      logger.warn("AnalysisAgent", "MALFORMED_VERDICT_REPROMPT");
      const repairPrompt = `${userPrompt}\nPrevious output invalid. Return ONLY valid JSON matching schema exactly.`;
      retryCount = 1;
      try {
        const secondPass = await generateContent(systemPrompt, repairPrompt, {
          temperature: 0.2,
          maxOutputTokens: 1600,
          responseMimeType: "application/json",
          agentName: "AnalysisAgent"
        });
        parsed = repairAndCheckJson(secondPass, isVerdictValid);
      } catch (error) {
        logger.warn("AnalysisAgent", "PARSING_FAILURE", { stage: "retry_pass", reason: error?.message || "parse_failed" });
        parsed = null;
      }
    }

    if (!isVerdictValid(parsed)) {
      logger.warn("AnalysisAgent", "FALLBACK_VERDICT_USED", { retryCount });
      parsed = buildFallbackVerdict(idea, researchData);
    }

    logger.agent("AnalysisAgent", "COMPLETE", {
      feasibilityScore: parsed.feasibilityScore,
      verdict: parsed.verdict,
      retryCount
    });

    return parsed;
  } catch (error) {
    logger.error("AnalysisAgent", "FAILED", error);
    throw error;
  }
}
