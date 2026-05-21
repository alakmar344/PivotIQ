import { useMemo, useState } from "react";
import { usePivotIQ } from "./hooks/usePivotIQ";
import { IdeaInput } from "./components/IdeaInput";
import { LoadingAgent } from "./components/LoadingAgent";
import { VerdictCard } from "./components/VerdictCard";
import { ResearchSources } from "./components/ResearchSources";
import { CounterInput } from "./components/CounterInput";
import { DebateThread } from "./components/DebateThread";
import { BuildPlan } from "./components/BuildPlan";

/**
 * Main application component.
 * @returns {JSX.Element}
 */
function App() {
  const { state, submitIdea, submitCounter, generatePlan, startDebate, reset } = usePivotIQ();
  const [showSources, setShowSources] = useState(true);

  const isLoadingPhase = useMemo(() => ["researching", "analyzing", "planning"].includes(state.phase) || state.loading, [state.phase, state.loading]);

  /**
   * Handles disagreement trigger.
   * @returns {void}
   */
  function handleDisagree() {
    console.log("[PivotIQ] User entered debate mode");
    startDebate();
  }

  return (
    <div className="min-h-screen bg-bg text-textPrimary flex flex-col">
      <header className="sticky top-0 z-20 bg-bg/90 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold">PivotIQ</h1>
          <p className="text-sm text-textSecondary">The AI that argues with your idea — so the market doesn&apos;t have to.</p>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-5">
          {state.error ? <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-danger">{state.error}</div> : null}

          {state.phase === "idle" ? <IdeaInput onSubmit={submitIdea} loading={state.loading} /> : null}

          {isLoadingPhase ? <LoadingAgent agentActivity={state.agentActivity} /> : null}

          {state.phase === "verdict" ? (
            <div className="space-y-4 fade-in">
              <VerdictCard verdict={state.verdict} onDisagree={handleDisagree} />
              <button type="button" onClick={() => setShowSources((prev) => !prev)} className="text-sm text-primary">
                {showSources ? "Hide" : "Show"} Research Sources
              </button>
              {showSources ? <ResearchSources researchData={state.researchData} /> : null}
              <CounterInput onSubmit={submitCounter} loading={state.loading} />
            </div>
          ) : null}

          {state.phase === "debating" ? (
            <div className="space-y-4 fade-in">
              <VerdictCard verdict={state.verdict} compact />
              <DebateThread history={state.debateHistory} />
              <CounterInput onSubmit={submitCounter} loading={state.loading} />
              <button type="button" onClick={generatePlan} className="px-4 py-2 bg-success hover:bg-success/80 rounded-lg">
                Generate Build Plan
              </button>
            </div>
          ) : null}

          {state.phase === "complete" ? (
            <div className="space-y-4 fade-in">
              <BuildPlan plan={state.plan} />
              <button type="button" onClick={reset} className="px-4 py-2 bg-surface border border-border rounded-lg">
                Start Over
              </button>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-sm text-textSecondary text-center">
        Built for emerging market entrepreneurs
      </footer>
    </div>
  );
}

export default App;
