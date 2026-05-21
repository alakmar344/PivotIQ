import { useEffect, useRef } from "react";

const typeStyles = {
  challenged: "bg-danger/20 text-danger",
  acknowledged: "bg-warning/20 text-warning",
  verdict_updated: "bg-primary/20 text-primary",
  plan_ready: "bg-success/20 text-success"
};

const typeLabels = {
  challenged: "AI Challenged You",
  acknowledged: "AI Acknowledged",
  verdict_updated: "Verdict Updated",
  plan_ready: "Ready to Plan!"
};

/**
 * Debate conversation thread component.
 * @param {{ history: any[] }} props
 * @returns {JSX.Element}
 */
export function DebateThread({ history }) {
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  return (
    <section className="bg-card/80 border border-border rounded-2xl p-4 max-h-[500px] overflow-y-auto space-y-4 shadow-card">
      {history.map((turn, idx) => (
        <article key={turn.createdAt || idx} className="space-y-2 fade-in">
          <div className="bg-surface/90 border border-border rounded-xl p-3">
            <p className="text-xs text-textSecondary mb-1">You</p>
            <p>{turn.userCounter}</p>
          </div>
          <div className="bg-primary/10 border border-primary/30 rounded-xl p-3">
            <div className={`inline-flex px-2 py-1 rounded-full text-xs mb-2 ${typeStyles[turn.responseType] || "bg-surface"}`}>
              {typeLabels[turn.responseType] || "AI Response"}
            </div>
            <p className="text-textSecondary whitespace-pre-wrap">{turn.agentResponse}</p>
            {turn.verdictChanged ? (
              <p className="mt-2 text-sm text-primary animate-pulse">Verdict updated: {turn.updatedVerdict?.verdict} ({turn.changeReason})</p>
            ) : null}
          </div>
        </article>
      ))}
      <div ref={endRef} />
    </section>
  );
}
