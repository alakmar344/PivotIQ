import { generateStructuredContent } from "../services/gemini.js";
import { searchMultiple } from "../services/serper.js";
import { logger } from "../utils/logger.js";

/**
 * Creates simple idea metadata.
 * @param {string} idea
 * @returns {{ industry: string, targetMarket: string, coreProblem: string, proposedSolution: string }}
 */
function extractIdeaMetadata(idea) {
  const chunks = idea.split(/[.,]/).map((part) => part.trim()).filter(Boolean);
  return {
    industry: chunks[0] || "Unknown",
    targetMarket: chunks[1] || "Unknown",
    coreProblem: chunks[2] || "Unknown",
    proposedSolution: chunks.slice(3).join(", ") || chunks[0] || idea
  };
}

/**
 * Validates minimal unified payload shape.
 * @param {any} value
 * @returns {boolean}
 */
function isUnifiedPayloadValid(value) {
  return Boolean(
    value
    && typeof value === "object"
    && value.researchData
    && value.verdict
    && value.plan
    && value.debateGuide
    && typeof value.verdict.feasibilityScore === "number"
    && ["FEASIBLE", "RISKY", "NOT_FEASIBLE"].includes(value.verdict.verdict)
    && Array.isArray(value.verdict.pros)
    && Array.isArray(value.verdict.cons)
    && typeof value.verdict.summary === "string"
    && typeof value.plan.projectName === "string"
    && Array.isArray(value.plan.weeklyMilestones)
    && Array.isArray(value.debateGuide.coreRebuttals)
  );
}

/**
 * Truncates text to maxLen characters at a word boundary.
 * @param {string} text
 * @param {number} maxLen
 * @returns {string}
 */
function truncateAtWord(text, maxLen) {
  if (!text || text.length <= maxLen) return text;
  const cut = text.lastIndexOf(" ", maxLen);
  return (cut > 0 ? text.substring(0, cut) : text.substring(0, maxLen)) + "…";
}

/**
 * Trims search groups to a compact form: top 5 results per query,
 * no links, snippets capped at ~100 characters on a word boundary.
 * @param {Array<{query: string, results: Array<{title: string, link: string, snippet: string}>}>} grouped
 * @returns {Array<{query: string, results: Array<{title: string, snippet: string}>}>}
 */
function slimSearchGroups(grouped) {
  return grouped.map(({ query, results }) => ({
    query,
    results: results.slice(0, 5).map(({ title, snippet }) => ({
      title,
      snippet: truncateAtWord(snippet, 100)
    }))
  }));
}

// Compact schema template sent to the model — keep as JSON.stringify so the prompt stays token-efficient.
const OUTPUT_SCHEMA = JSON.stringify({
  researchData: { marketSize: "", competitors: [{ name: "", description: "", fundingStatus: "" }], regulations: [], trends: [], hiddenInsight: "" },
  verdict: { feasibilityScore: 0, verdict: "FEASIBLE|RISKY|NOT_FEASIBLE", pros: [{ point: "", evidence: "", strength: "strong|weak" }], cons: [{ point: "", evidence: "", severity: "critical|major|minor" }], keyRisk: "", keyStrength: "", confidenceLevel: "high|medium|low", summary: "" },
  debateGuide: { coreRebuttals: [], evidenceToWatch: [], escalationTriggers: [] },
  plan: { projectName: "", oneLiner: "", mvpScope: { features: [], outOfScope: [], timeline: "4 weeks|8 weeks|12 weeks" }, techStack: { frontend: "", backend: "", database: "", ai: "", payments: "", hosting: "" }, weeklyMilestones: [{ week: 1, title: "", tasks: [], deliverable: "" }], monetizationPath: { model: "", firstRevenueEstimate: "", approach: "" }, topRisks: [{ risk: "", mitigation: "" }], firstActions: [], resourcesNeeded: { budget: "", teamSize: 1, keySkills: [] }, successMetrics: [{ metric: "", target: "", timeline: "" }] }
});

/**
 * Runs research + verdict + debate guide + plan generation in one Gemini call.
 * @param {string} idea
 * @returns {Promise<{ researchData: any, verdict: any, plan: any, debateGuide: any }>}
 */
export async function unifiedAgent(idea) {
  logger.agent("UnifiedAgent", "START", { idea: idea.substring(0, 80) });

  const parsedIdea = extractIdeaMetadata(idea);
  const queries = [
    `${idea} market size India 2024`,
    `${idea} existing solutions competitors`,
    `${idea} regulatory challenges`,
    `${idea} startup success failure cases`
  ];

  const searchPayload = await searchMultiple(queries);
  logger.agent("UnifiedAgent", "SEARCH_COMPLETE", {
    groupedCount: searchPayload.grouped.length,
    totalResults: searchPayload.results.length
  });

  const systemPrompt = `You are PivotIQ's startup analyst. Output ONE valid JSON object only (no markdown/backticks): ${OUTPUT_SCHEMA}`;

  const slimmedSearch = slimSearchGroups(searchPayload.grouped);
  const userPrompt = `Idea: ${idea}
Search Results: ${JSON.stringify(slimmedSearch)}`;

  const parsed = await generateStructuredContent(systemPrompt, userPrompt, {
  temperature: 0.35,
  maxOutputTokens: 1200,
  checker: isUnifiedPayloadValid
});

const response = {
  researchData: {
    ...parsed.researchData,
    sourceQueries: queries,
    sources: searchPayload.results,
    parsedIdea
  },
  verdict: parsed.verdict,
  debateGuide: parsed.debateGuide,
  plan: parsed.plan
};

logger.agent("UnifiedAgent", "COMPLETE", {
  verdict: response.verdict?.verdict,
  score: response.verdict?.feasibilityScore,
  milestones: response.plan?.weeklyMilestones?.length || 0
});

return response;
}

