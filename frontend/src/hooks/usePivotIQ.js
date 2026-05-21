import { useReducer } from "react";
import { api } from "../utils/api";

const initialState = {
  phase: "idle",
  idea: "",
  researchData: null,
  verdict: null,
  debateHistory: [],
  currentAgentResponse: null,
  plan: null,
  loading: false,
  error: null,
  sessionId: null,
  agentActivity: null
};

/**
 * Sanitizes user-entered text.
 * @param {string} value
 * @returns {string}
 */
function sanitizeInput(value) {
  return String(value || "")
    .split("<").join("")
    .split(">").join("")
    .trim();
}

/**
 * Reducer for PivotIQ state transitions.
 * @param {typeof initialState} state
 * @param {{ type: string, payload?: any }} action
 * @returns {typeof initialState}
 */
function reducer(state, action) {
  console.log("[PivotIQ] State action:", action.type, action.payload || null);
  switch (action.type) {
    case "SET_LOADING":
      return {
        ...state,
        loading: action.payload.loading,
        agentActivity: action.payload.agentActivity || null,
        phase: action.payload.phase || state.phase
      };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false, agentActivity: null };
    case "IDEA_SUCCESS":
      return {
        ...state,
        phase: "verdict",
        loading: false,
        error: null,
        idea: action.payload.idea,
        researchData: action.payload.researchData,
        verdict: action.payload.verdict,
        sessionId: action.payload.sessionId,
        agentActivity: null
      };
    case "COUNTER_SUCCESS":
      return {
        ...state,
        phase: action.payload.planReady ? "planning" : "debating",
        loading: false,
        error: null,
        currentAgentResponse: action.payload.agentTurn,
        verdict: action.payload.verdict,
        debateHistory: [...state.debateHistory, action.payload.agentTurn],
        agentActivity: null
      };
    case "PLAN_SUCCESS":
      return {
        ...state,
        phase: "complete",
        loading: false,
        error: null,
        plan: action.payload,
        agentActivity: null
      };
    case "RESET":
      return initialState;
    case "START_DEBATE":
      return { ...state, phase: "debating" };
    default:
      return state;
  }
}

/**
 * Central PivotIQ hook.
 * @returns {{ state: typeof initialState, submitIdea: (idea: string) => Promise<void>, submitCounter: (counter: string) => Promise<void>, generatePlan: () => Promise<void>, startDebate: () => void, reset: () => void }}
 */
export function usePivotIQ() {
  const [state, dispatch] = useReducer(reducer, initialState);

  /**
   * Submits startup idea for validation.
   * @param {string} idea
   * @returns {Promise<void>}
   */
  async function submitIdea(idea) {
    try {
      console.log("[PivotIQ Hook] action started", { action: "submitIdea", idea: idea.substring(0, 50) });
      const cleaned = sanitizeInput(idea);
      if (cleaned.length < 20 || cleaned.length > 1000) {
        throw new Error("Idea must be between 20 and 1000 characters");
      }

      dispatch({
        type: "SET_LOADING",
        payload: { loading: true, phase: "researching", agentActivity: "Researching market and competitors..." }
      });
      console.log("[PivotIQ] Submitting idea:", cleaned.substring(0, 50));
      const response = await api.post("/api/validate", { idea: cleaned });

      dispatch({
        type: "IDEA_SUCCESS",
        payload: {
          idea: cleaned,
          researchData: response.data.researchData,
          verdict: response.data.verdict,
          sessionId: response.data.sessionId
        }
      });

      console.log("[PivotIQ] Verdict received:", {
        score: response.data.verdict?.feasibilityScore,
        verdict: response.data.verdict?.verdict
      });
      console.log("[PivotIQ Hook] action complete", { action: "submitIdea" });
    } catch (error) {
      console.error("[PivotIQ] submitIdea failed", error);
      dispatch({ type: "SET_ERROR", payload: error.response?.data?.error?.message || error.message || "Failed to validate idea" });
    }
  }

  /**
   * Submits user counter-argument.
   * @param {string} counter
   * @returns {Promise<void>}
   */
  async function submitCounter(counter) {
    try {
      console.log("[PivotIQ Hook] action started", { action: "submitCounter", counter: counter.substring(0, 50) });
      const cleaned = sanitizeInput(counter);
      if (cleaned.length < 10 || cleaned.length > 2000) {
        throw new Error("Counter must be between 10 and 2000 characters");
      }

      dispatch({
        type: "SET_LOADING",
        payload: { loading: true, phase: "debating", agentActivity: "Running adversarial analysis..." }
      });
      console.log("[PivotIQ] Counter submitted, turn:", state.debateHistory.length + 1);

      const response = await api.post("/api/counter", {
        sessionId: state.sessionId,
        idea: state.idea,
        researchData: state.researchData,
        currentVerdict: state.verdict,
        debateHistory: state.debateHistory,
        userCounter: cleaned
      });

      const nextVerdict = response.data.verdictChanged ? response.data.updatedVerdict : state.verdict;
      const agentTurn = {
        userCounter: cleaned,
        agentResponse: response.data.agentResponse,
        responseType: response.data.responseType,
        verdictChanged: response.data.verdictChanged,
        updatedVerdict: response.data.updatedVerdict || null,
        changeReason: response.data.changeReason || null,
        createdAt: new Date().toISOString()
      };

      if (response.data.verdictChanged) {
        console.log("[PivotIQ] Verdict changed:", {
          from: state.verdict?.verdict,
          to: response.data.updatedVerdict?.verdict
        });
      }

      dispatch({
        type: "COUNTER_SUCCESS",
        payload: {
          agentTurn,
          verdict: nextVerdict,
          planReady: response.data.planReady
        }
      });

      console.log("[PivotIQ Hook] action complete", { action: "submitCounter" });
    } catch (error) {
      console.error("[PivotIQ] submitCounter failed", error);
      dispatch({ type: "SET_ERROR", payload: error.response?.data?.error?.message || error.message || "Failed to submit counter" });
    }
  }

  /**
   * Requests final execution plan.
   * @returns {Promise<void>}
   */
  async function generatePlan() {
    try {
      console.log("[PivotIQ Hook] action started", { action: "generatePlan" });
      dispatch({
        type: "SET_LOADING",
        payload: { loading: true, phase: "planning", agentActivity: "Generating execution plan..." }
      });
      console.log("[PivotIQ] Plan generation started");

      const response = await api.post("/api/plan", {
        sessionId: state.sessionId,
        idea: state.idea,
        researchData: state.researchData,
        finalVerdict: state.verdict,
        debateHistory: state.debateHistory
      });

      dispatch({ type: "PLAN_SUCCESS", payload: response.data.plan });
      console.log("[PivotIQ] Plan received:", { milestones: response.data.plan?.weeklyMilestones?.length || 0 });
      console.log("[PivotIQ Hook] action complete", { action: "generatePlan" });
    } catch (error) {
      console.error("[PivotIQ] generatePlan failed", error);
      dispatch({ type: "SET_ERROR", payload: error.response?.data?.error?.message || error.message || "Failed to generate plan" });
    }
  }

  /**
   * Resets all application state.
   * @returns {void}
   */
  function reset() {
    console.log("[PivotIQ Hook] action started", { action: "reset" });
    dispatch({ type: "RESET" });
    console.log("[PivotIQ Hook] action complete", { action: "reset" });
  }

  /**
   * Moves app into debate phase.
   * @returns {void}
   */
  function startDebate() {
    console.log("[PivotIQ Hook] action started", { action: "startDebate" });
    dispatch({ type: "START_DEBATE" });
    console.log("[PivotIQ Hook] action complete", { action: "startDebate" });
  }

  return { state, submitIdea, submitCounter, generatePlan, startDebate, reset };
}
