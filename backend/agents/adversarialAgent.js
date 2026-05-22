import { generateContent } from "../services/gemini.js";
import { searchWeb } from "../services/serper.js";
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
 * Normalizes verdict list fields to string arrays.
 * @param {any} verdict
 * @returns {any}
 */
function normalizeVerdict(verdict) {
  if (!verdict || typeof verdict !== "object") return verdict;
  const toTextArray = (items) => {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
      if (typeof item === "string") return item;
      if (item && typeof item === "object") {
        return item.point || item.evidence || "Additional consideration provided";
      }
      return String(item || "");
    }).filter(Boolean);
  };
  return {
    ...verdict,
    pros: toTextArray(verdict.pros),
    cons: toTextArray(verdict.cons)
  };
}

/**
 * Detects if user counter likely introduces factual claim.
 * @param {string} text
 * @returns {boolean}
 */
function hasSpecificClaim(text) {
  return /\d|%|according to|study|report|market|competitor|law|regulation/i.test(text);
}

/**
 * Runs adversarial debate turn.
 * @param {{ idea: string, researchData: any, currentVerdict: any, debateHistory: any[], userCounter: string }} params
 * @returns {Promise<any>}
 */
export async function adversarialAgent(params) {
  const { idea, researchData, currentVerdict, debateHistory, userCounter } = params;
  try {
    logger.agent("AdversarialAgent", "START", {
      turn: debateHistory.length + 1,
      counterLength: userCounter.length
    });

    const recentHistory = debateHistory.slice(-6);
    let updatedSearchResults = [];
    if (hasSpecificClaim(userCounter)) {
      logger.agent("AdversarialAgent", "TARGETED_SEARCH_START", { userCounter: userCounter.substring(0, 120) });
      const search = await searchWeb(userCounter, { num: 6, type: "search" });
      updatedSearchResults = search.results;
      logger.agent("AdversarialAgent", "TARGETED_SEARCH_COMPLETE", { resultCount: updatedSearchResults.length });
    }

    const systemPrompt = `You are a world-class startup advisor engaged in an adversarial but intellectually honest debate.

Your job:
1. Carefully analyze the user's counter-argument
2. Identify if they have introduced: new facts, logical arguments, or emotional pushback
3. If new facts: research them (you have been given updated search results)
4. If logical arguments: engage at the same depth, find deeper flaws OR acknowledge merit
5. If emotional: gently redirect to evidence
6. Update your feasibility verdict ONLY if the user has genuinely changed your analysis
7. Never capitulate without reason. Never refuse to change without reason.

Respond with:
- responseType: "challenged" | "acknowledged" | "verdict_updated" | "plan_ready"
- agentResponse: your detailed counter or acknowledgment (plain English, 150-250 words)
- updatedVerdict: updated verdict object using schema
  { feasibilityScore, verdict, pros: string[], cons: string[], summary, keyRisk, keyStrength }
  or null if unchanged
- verdictChanged: boolean
- changeReason: why verdict changed (if it did)
- planReady: true if you now agree the idea is feasible enough to plan

Return ONLY valid JSON. No markdown. No backticks.`;

    const userPrompt = `Idea: ${idea}\nCurrent Verdict: ${JSON.stringify(currentVerdict)}\nResearch Data: ${JSON.stringify(researchData)}\nDebate History (max 6): ${JSON.stringify(recentHistory)}\nUser Counter: ${userCounter}\nUpdated Search Results: ${JSON.stringify(updatedSearchResults)}`;

    const output = await generateContent(systemPrompt, userPrompt, { temperature: 0.5, maxOutputTokens: 2500 });
    const parsed = parseJson(output);

    logger.agent("AdversarialAgent", "COMPLETE", {
      responseType: parsed.responseType,
      verdictChanged: parsed.verdictChanged,
      planReady: parsed.planReady
    });

    return {
      ...parsed,
      updatedVerdict: normalizeVerdict(parsed.updatedVerdict)
    };
  } catch (error) {
    logger.error("AdversarialAgent", "FAILED", error);
    throw error;
  }
}
