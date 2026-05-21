import { useMemo, useState } from "react";
import { usePivotIQ } from "./hooks/usePivotIQ";
import { IdeaInput } from "./components/IdeaInput";
import { LoadingAgent } from "./components/LoadingAgent";
import { VerdictCard } from "./components/VerdictCard";
import { ResearchSources } from "./components/ResearchSources";
import { CounterInput } from "./components/CounterInput";
import { DebateThread } from "./components/DebateThread";
import { BuildPlan } from "./components/BuildPlan";

function truncateText(value, maxLength = 140) {
  if (!value) return "";
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

/**
 * Main application component.
 * @returns {JSX.Element}
 */
function App() {
  const { state, historySessions, submitIdea, submitCounter, generatePlan, startDebate, reset, loadSession, deleteHistorySession, clearHistory } = usePivotIQ();
  const [showSources, setShowSources] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

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
    <div className="min-h-screen bg-bg text-textPrimary flex flex-col bg-grid">
      <header className="sticky top-0 z-20 bg-bg/85 backdrop-blur border-b border-border px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">PivotIQ</h1>
            <p className="text-xs text-textSecondary">AI cofounder stress-testing your startup thesis before you spend a rupee.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowHistory((prev) => !prev)}
            className="px-3 py-1.5 text-sm bg-surface border border-border rounded-lg hover:border-primary"
          >
            {showHistory ? "Hide" : "Show"} History ({historySessions.length})
          </button>
        </div>
      </header>

      <main className="flex-1 px-6 py-8">
        <div className="max-w-6xl mx-auto space-y-5">
          <section className="bg-card/80 border border-border rounded-2xl p-6 md:p-8 shadow-card">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary mb-3">Investor-ready validation engine</p>
              <h2 className="text-2xl md:text-4xl font-bold leading-tight">From raw idea to market-tested execution strategy.</h2>
              <p className="text-textSecondary mt-3">
                PivotIQ combines market research, adversarial questioning, and a tactical build roadmap in one decision cockpit.
              </p>
            </div>
          </section>

          {showHistory ? (
            <section className="bg-card/80 border border-border rounded-2xl p-4 md:p-6 space-y-3 shadow-card fade-in">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Previous Chats</h3>
                {historySessions.length ? (
                  <button type="button" onClick={clearHistory} className="text-xs text-danger hover:underline">
                    Clear All
                  </button>
                ) : null}
              </div>
              {historySessions.length ? (
                <div className="grid gap-3 md:grid-cols-2">
                  {historySessions.map((session) => (
                    <article key={session.sessionId} className="bg-surface/90 border border-border rounded-xl p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-textSecondary">{new Date(session.updatedAt).toLocaleString()}</span>
                        <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">{session.verdict?.verdict || "IN PROGRESS"}</span>
                      </div>
                      <p className="text-sm">{truncateText(session.idea)}</p>
                      <p className="text-xs text-textSecondary">
                        Debate turns: {session.debateHistory?.length || 0} · Phase: {session.phase}
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => loadSession(session.sessionId)}
                          className="px-3 py-1.5 text-xs bg-primary hover:bg-primaryHover rounded-lg"
                        >
                          Load Chat
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteHistorySession(session.sessionId)}
                          className="px-3 py-1.5 text-xs bg-surface border border-border rounded-lg hover:border-danger"
                        >
                          Delete
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-textSecondary">No previous chats yet. Your validated ideas and debates will be stored locally in this browser.</p>
              )}
            </section>
          ) : null}

          {state.error ? <div className="bg-danger/10 border border-danger/30 rounded-xl p-4 text-danger">{state.error}</div> : null}

          {state.phase === "idle" ? <IdeaInput onSubmit={submitIdea} loading={state.loading} /> : null}

          {isLoadingPhase ? <LoadingAgent agentActivity={state.agentActivity} /> : null}

          {state.phase === "verdict" ? (
            <div className="space-y-4 fade-in">
              <VerdictCard verdict={state.verdict} onDisagree={handleDisagree} />
              <button type="button" onClick={() => setShowSources((prev) => !prev)} className="text-sm text-primary hover:underline">
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
              <button type="button" onClick={generatePlan} className="px-4 py-2 bg-success hover:bg-success/80 rounded-lg font-medium">
                Generate Build Plan
              </button>
            </div>
          ) : null}

          {state.phase === "complete" ? (
            <div className="space-y-4 fade-in">
              <BuildPlan plan={state.plan} />
              <button type="button" onClick={reset} className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary">
                Start Over
              </button>
            </div>
          ) : null}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 text-sm text-textSecondary text-center">
        Built for founders who want proof before product.
      </footer>
    </div>
  );
}

export default App;
