import { generateContent } from "../services/gemini.js";
import { searchMultiple } from "../services/serper.js";
import { logger } from "../utils/logger.js";

/**
 * Safely parses JSON text from model output.
 * @param {string} text
 * @returns {any}
 */
function parseJson(text) {
  const cleaned = text.replace(/^```json|```$/gim, "").trim();
  return JSON.parse(cleaned);
}

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

    const systemPrompt = `You are a research analyst for a startup advisory firm.
Given the following web search results about a startup idea,
extract and structure the following:
- Market size and growth rate (with source)
- Top 3-5 existing competitors or similar solutions
- Key regulatory considerations
- Recent news or trends relevant to this space
- One key insight that most people miss about this market

Return ONLY valid JSON. No markdown. No backticks.
Schema: { marketSize, competitors: [{name, description, fundingStatus}], regulations: [], trends: [], hiddenInsight }`;

    const userPrompt = `Idea: ${idea}\nParsed Idea: ${JSON.stringify(parsedIdea)}\nSearch Results: ${JSON.stringify(searchPayload.grouped)}`;

    logger.agent("ResearchAgent", "GEMINI_CALL_START", { promptLength: userPrompt.length });
    const modelOutput = await generateContent(systemPrompt, userPrompt, { temperature: 0.4, maxOutputTokens: 3000 });
    logger.agent("ResearchAgent", "GEMINI_CALL_COMPLETE", { outputLength: modelOutput.length });

    const research = parseJson(modelOutput);
    const response = {
      ...research,
      sourceQueries: queries,
      sources: searchPayload.results,
      parsedIdea
    };

    logger.agent("ResearchAgent", "COMPLETE", {
      marketSize: response.marketSize,
      competitors: Array.isArray(response.competitors) ? response.competitors.length : 0
    });

    return response;
  } catch (error) {
    logger.error("ResearchAgent", "FAILED", error);
    throw error;
  }
}
