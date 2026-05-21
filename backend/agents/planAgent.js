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
 * Creates startup build plan.
 * @param {{ idea: string, researchData: any, finalVerdict: any, debateHistory: any[] }} params
 * @returns {Promise<any>}
 */
export async function planAgent(params) {
  const { idea, researchData, finalVerdict, debateHistory } = params;
  try {
    logger.agent("PlanAgent", "START", {
      idea: idea.substring(0, 80),
      verdict: finalVerdict?.verdict
    });

    const systemPrompt = `You are a startup technical architect and product strategist.
Based on the validated idea and full debate context, generate a complete
execution plan for an indie developer / small team.

Return ONLY valid JSON. No markdown. No backticks. Use this schema:
{
  projectName: string,
  oneLiner: string,
  mvpScope: { features: string[], outOfScope: string[], timeline: "4 weeks" | "8 weeks" | "12 weeks" },
  techStack: { frontend, backend, database, ai, payments, hosting },
  weeklyMilestones: [{ week: number, title: string, tasks: string[], deliverable: string }],
  monetizationPath: { model: string, firstRevenueEstimate: string, approach: string },
  topRisks: [{ risk: string, mitigation: string }],
  firstActions: string[],
  resourcesNeeded: { budget: string, teamSize: number, keySkills: string[] },
  successMetrics: [{ metric: string, target: string, timeline: string }]
}`;

    const userPrompt = `Idea: ${idea}\nResearch Data: ${JSON.stringify(researchData)}\nFinal Verdict: ${JSON.stringify(finalVerdict)}\nDebate History: ${JSON.stringify(debateHistory)}`;
    logger.agent("PlanAgent", "GEMINI_CALL_START", { promptLength: userPrompt.length });

    const output = await generateContent(systemPrompt, userPrompt, { temperature: 0.4, maxOutputTokens: 3500 });
    const parsed = parseJson(output);

    logger.agent("PlanAgent", "COMPLETE", {
      projectName: parsed?.projectName,
      milestones: parsed?.weeklyMilestones?.length || 0
    });

    return parsed;
  } catch (error) {
    logger.error("PlanAgent", "FAILED", error);
    throw error;
  }
}
