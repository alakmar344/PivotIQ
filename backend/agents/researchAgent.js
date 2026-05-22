import { generateContent, repairAndCheckJson } from "../services/gemini.js";
import { compressSearchResults, searchMultiple } from "../services/serper.js";
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
 * Checks minimal research payload shape.
 * @param {any} value
 * @returns {boolean}
 */
function isResearchValid(value) {
  return Boolean(
    value
    && typeof value === "object"
    && typeof value.marketSize === "string"
    && Array.isArray(value.competitors)
    && Array.isArray(value.regulations)
    && Array.isArray(value.trends)
    && typeof value.mainRisk === "string"
    && typeof value.hiddenInsight === "string"
  );
}

/**
 * Creates compact analysis context from research data.
 * @param {any} research
 * @returns {{ marketSize: string, topCompetitors: string[], mainTrend: string, mainRisk: string, hiddenInsight: string }}
 */
function buildAnalysisContext(research) {
  const competitors = Array.isArray(research?.competitors) ? research.competitors : [];
  const trends = Array.isArray(research?.trends) ? research.trends : [];
  return {
    marketSize: research?.marketSize || "Unknown",
    topCompetitors: competitors.slice(0, 3).map((item) => item?.name || item?.description || "Unknown competitor"),
    mainTrend: trends[0] || "No major trend identified",
    mainRisk: research?.mainRisk || "No critical risk identified",
    hiddenInsight: research?.hiddenInsight || "No hidden insight available"
  };
}

/**
 * Returns fallback research payload.
 * @returns {{ marketSize: string, competitors: any[], regulations: string[], trends: string[], mainRisk: string, hiddenInsight: string }}
 */
function buildFallbackResearch() {
  return {
    marketSize: "Unknown market size",
    competitors: [],
    regulations: [],
    trends: [],
    mainRisk: "Insufficient structured evidence from upstream model output.",
    hiddenInsight: "Need additional primary user validation before committing resources."
  };
}

/**
 * Runs research workflow for startup idea.
 * @param {string} idea
 * @returns {Promise<any>}
 */
export async function researchAgent(idea) {
  try {
    logger.agent("ResearchAgent", "START", { idea: idea.substring(0, 80) });

    const parsedIdea = extractIdeaMetadata(idea);
    logger.agent("ResearchAgent", "IDEA_PARSED", parsedIdea);

    const queries = [
      `${idea} market size India 2024`,
      `${idea} existing solutions competitors`,
      `${idea} regulatory challenges`,
      `${idea} startup success failure cases`
    ];

    logger.agent("ResearchAgent", "SEARCH_QUERIES_GENERATED", { queries });

    const searchPayload = await searchMultiple(queries);
    logger.agent("ResearchAgent", "SEARCH_COMPLETE", {
      groupedCount: searchPayload.grouped.length,
      totalResults: searchPayload.results.length
    });
    const compressedGrouped = compressSearchResults(searchPayload.grouped);
    logger.agent("ResearchAgent", "COMPRESSED_SEARCH_READY", {
      compressedGroups: compressedGrouped.length,
      compressedResultCount: compressedGrouped.reduce((sum, group) => sum + group.results.length, 0)
    });

    const systemPrompt = `You are a research analyst for a startup advisory firm.
Given the following web search results about a startup idea,
extract and structure the following:
- Market size and growth rate (with source)
- Top 3-5 existing competitors or similar solutions
- Key regulatory considerations
- Recent news or trends relevant to this space
- Main strategic risk most likely to block traction
- One key insight that most people miss about this market

Return ONLY valid JSON. No markdown. No backticks.
Schema: { marketSize, competitors: [{name, description, fundingStatus}], regulations: [], trends: [], mainRisk, hiddenInsight }`;

    const userPrompt = `Idea: ${idea}\nParsed Idea: ${JSON.stringify(parsedIdea)}\nSearch Results: ${JSON.stringify(compressedGrouped)}`;
    logger.agent("ResearchAgent", "COMPRESSED_PROMPT_READY", {
      promptLength: userPrompt.length
    });

    let research = null;
    let retryCount = 0;
    try {
      const firstPass = await generateContent(systemPrompt, userPrompt, {
        temperature: 0.35,
        maxOutputTokens: 1800,
        responseMimeType: "application/json",
        agentName: "ResearchAgent"
      });
      research = repairAndCheckJson(firstPass, isResearchValid);
    } catch (error) {
      logger.warn("ResearchAgent", "PARSING_FAILURE", { stage: "first_pass", reason: error?.message || "parse_failed" });
    }

    if (!isResearchValid(research)) {
      retryCount = 1;
      try {
        const retryPrompt = `${userPrompt}\nPrevious output invalid. Return ONLY valid JSON matching schema exactly.`;
        const secondPass = await generateContent(systemPrompt, retryPrompt, {
          temperature: 0.2,
          maxOutputTokens: 1800,
          responseMimeType: "application/json",
          agentName: "ResearchAgent"
        });
        research = repairAndCheckJson(secondPass, isResearchValid);
      } catch (error) {
        logger.warn("ResearchAgent", "PARSING_FAILURE", { stage: "retry_pass", reason: error?.message || "parse_failed" });
      }
    }

    if (!isResearchValid(research)) {
      logger.warn("ResearchAgent", "FALLBACK_RESEARCH_USED", { retryCount });
      research = buildFallbackResearch();
    }

    const analysisContext = buildAnalysisContext(research);
    const response = {
      ...research,
      sourceQueries: queries,
      sources: searchPayload.results,
      parsedIdea,
      analysisContext
    };

    logger.agent("ResearchAgent", "COMPLETE", {
      marketSize: response.marketSize,
      competitors: Array.isArray(response.competitors) ? response.competitors.length : 0,
      analysisContextLength: JSON.stringify(analysisContext).length,
      retryCount
    });

    return response;
  } catch (error) {
    logger.error("ResearchAgent", "FAILED", error);
    throw error;
  }
}
