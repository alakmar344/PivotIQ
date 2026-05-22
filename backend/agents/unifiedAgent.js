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

  const systemPrompt = `You are PivotIQ's lead startup analyst.
You must output ONE valid JSON object only (no markdown/backticks) with this exact top-level schema:
{
  researchData: {
    marketSize: string,
    competitors: [{ name: string, description: string, fundingStatus: string }],
    regulations: string[],
    trends: string[],
    hiddenInsight: string
  },
  verdict: {
    feasibilityScore: number,
    verdict: "FEASIBLE" | "RISKY" | "NOT_FEASIBLE",
    pros: [{ point: string, evidence: string, strength: "strong" | "weak" }],
    cons: [{ point: string, evidence: string, severity: "critical" | "major" | "minor" }],
    keyRisk: string,
    keyStrength: string,
    confidenceLevel: "high" | "medium" | "low",
    summary: string
  },
  debateGuide: {
    coreRebuttals: string[],
    evidenceToWatch: string[],
    escalationTriggers: string[]
  },
  plan: {
    projectName: string,
    oneLiner: string,
    mvpScope: { features: string[], outOfScope: string[], timeline: "4 weeks" | "8 weeks" | "12 weeks" },
    techStack: { frontend: string, backend: string, database: string, ai: string, payments: string, hosting: string },
    weeklyMilestones: [{ week: number, title: string, tasks: string[], deliverable: string }],
    monetizationPath: { model: string, firstRevenueEstimate: string, approach: string },
    topRisks: [{ risk: string, mitigation: string }],
    firstActions: string[],
    resourcesNeeded: { budget: string, teamSize: number, keySkills: string[] },
    successMetrics: [{ metric: string, target: string, timeline: string }]
  }
}`;

  const userPrompt = `Idea: ${idea}
Parsed Idea: ${JSON.stringify(parsedIdea)}
Search Results (grouped): ${JSON.stringify(searchPayload.grouped)}
Search Results (flat): ${JSON.stringify(searchPayload.results)}`;

  const parsed = await generateStructuredContent(systemPrompt, userPrompt, {
    temperature: 0.35,
    maxOutputTokens: 4090,
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

  const systemPrompt = `You are PivotIQ's lead startup analyst.
You must output ONE valid JSON object only (no markdown/backticks) with this exact top-level schema:
{
  researchData: {
    marketSize: string,
    competitors: [{ name: string, description: string, fundingStatus: string }],
    regulations: string[],
    trends: string[],
    hiddenInsight: string
  },
  verdict: {
    feasibilityScore: number,
    verdict: "FEASIBLE" | "RISKY" | "NOT_FEASIBLE",
    pros: [{ point: string, evidence: string, strength: "strong" | "weak" }],
    cons: [{ point: string, evidence: string, severity: "critical" | "major" | "minor" }],
    keyRisk: string,
    keyStrength: string,
    confidenceLevel: "high" | "medium" | "low",
    summary: string
  },
  debateGuide: {
    coreRebuttals: string[],
    evidenceToWatch: string[],
    escalationTriggers: string[]
  },
  plan: {
    projectName: string,
    oneLiner: string,
    mvpScope: { features: string[], outOfScope: string[], timeline: "4 weeks" | "8 weeks" | "12 weeks" },
    techStack: { frontend: string, backend: string, database: string, ai: string, payments: string, hosting: string },
    weeklyMilestones: [{ week: number, title: string, tasks: string[], deliverable: string }],
    monetizationPath: { model: string, firstRevenueEstimate: string, approach: string },
    topRisks: [{ risk: string, mitigation: string }],
    firstActions: string[],
    resourcesNeeded: { budget: string, teamSize: number, keySkills: string[] },
    successMetrics: [{ metric: string, target: string, timeline: string }]
  }
}`;

  const userPrompt = `Idea: ${idea}
Parsed Idea: ${JSON.stringify(parsedIdea)}
Search Results (grouped): ${JSON.stringify(searchPayload.grouped)}
Search Results (flat): ${JSON.stringify(searchPayload.results)}`;

  const parsed = await generateStructuredContent(systemPrompt, userPrompt, {
    temperature: 0.35,
    maxOutputTokens: 4000,
    responseMimeType: "application/json",
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
    
