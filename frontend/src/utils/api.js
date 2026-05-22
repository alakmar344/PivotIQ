import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Axios API client.
 */
export const api = axios.create({
  baseURL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" }
});

/**
 * Builds absolute API URL.
 * @param {string} path
 * @returns {string}
 */
export function getApiUrl(path) {
  return `${baseURL.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;
}
