import axios from "axios";
import { logger } from "../utils/logger.js";

const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

/**
 * Creates a cache key from query options.
 * @param {string} query
 * @param {{ num?: number, type?: "search"|"news" }} options
 * @returns {string}
 */
function getCacheKey(query, options) {
  return `${options.type || "search"}:${options.num || 8}:${query.toLowerCase()}`;
}

/**
 * Gets valid cached result.
 * @param {string} key
 * @returns {unknown|null}
 */
function getCached(key) {
  const hit = cache.get(key);
  if (!hit) {
    return null;
  }
  if (Date.now() - hit.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return hit.value;
}

/**
 * Saves cache entry.
 * @param {string} key
 * @param {unknown} value
 * @returns {void}
 */
function setCache(key, value) {
  cache.set(key, { timestamp: Date.now(), value });
}

/**
 * Normalizes Serper results.
 * @param {any} data
 * @returns {{ results: Array<{title: string, link: string, snippet: string}>, searchTime: number|null, totalResults: string|number|null }}
 */
function normalizeResults(data) {
  const items = data.organic || data.news || [];
  return {
    results: items.slice(0, 20).map((item) => ({
      title: item.title || "Untitled",
      link: item.link || "",
      snippet: item.snippet || ""
    })),
    searchTime: data.searchParameters?.timeTakenDisplayed ? Number(data.searchParameters.timeTakenDisplayed) : null,
    totalResults: data.searchInformation?.totalResults || null
  };
}

/**
 * Compresses grouped search results for prompt-safe context windows.
 * Keeps only top 2 results per query and only title/snippet/link fields.
 * @param {Array<{query: string, results: Array<any>}>} grouped
 * @returns {Array<{query: string, results: Array<{title: string, snippet: string, link: string}>}>}
 */
export function compressSearchResults(grouped = []) {
  return grouped.map(({ query, results }) => ({
    query,
    results: (Array.isArray(results) ? results : []).slice(0, 2).map((item) => ({
      title: item?.title || "Untitled",
      snippet: item?.snippet || "",
      link: item?.link || ""
    }))
  }));
}

/**
 * Runs a web search via Serper.
 * @param {string} query
 * @param {{ num?: number, type?: "search"|"news" }} [options]
 * @returns {Promise<{ results: Array<{title: string, link: string, snippet: string}>, searchTime: number|null, totalResults: string|number|null }>}
 */
export async function searchWeb(query, options = {}) {
  const num = options.num ?? 8;
  const type = options.type ?? "search";
  const key = getCacheKey(query, { num, type });

  const cached = getCached(key);
  if (cached) {
    logger.info("SerperService", "CACHE_HIT", { query, num, type, resultCount: cached.results.length });
    return cached;
  }

  const startedAt = Date.now();
  try {
    const endpoint = type === "news" ? "https://google.serper.dev/news" : "https://google.serper.dev/search";
    const response = await axios.post(
      endpoint,
      { q: query, num },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 20000
      }
    );

    const normalized = normalizeResults(response.data || {});
    setCache(key, normalized);
    logger.info("SerperService", "SEARCH_COMPLETE", {
      query,
      resultCount: normalized.results.length,
      latencyMs: Date.now() - startedAt
    });

    return normalized;
  } catch (error) {
    logger.warn("SerperService", "SEARCH_FAILED", {
      query,
      error: error?.message || "Unknown error",
      latencyMs: Date.now() - startedAt
    });

    return {
      results: [],
      searchTime: null,
      totalResults: null
    };
  }
}

/**
 * Runs multiple searches with concurrency limit and deduplicates results.
 * @param {string[]} queries
 * @returns {Promise<{ results: Array<{title: string, link: string, snippet: string}>, grouped: Array<{query: string, results: Array<{title: string, link: string, snippet: string}>}> }>} 
 */
export async function searchMultiple(queries) {
  try {
    const responses = await Promise.all(
      queries.map(async (query) => {
        const res = await searchWeb(query, { num: 8, type: "search" });
        return { query, ...res };
      })
    );
    const grouped = responses.map((response) => ({ query: response.query, results: response.results }));
    const flat = responses.flatMap((response) => response.results);

    const seen = new Set();
    const deduped = flat.filter((item) => {
      if (!item.link || seen.has(item.link)) {
        return false;
      }
      seen.add(item.link);
      return true;
    });

    return { results: deduped, grouped };
  } catch (error) {
    logger.warn("SerperService", "SEARCH_MULTIPLE_FAILED", { error: error?.message || "Unknown error" });
    return { results: [], grouped: [] };
  }
}
