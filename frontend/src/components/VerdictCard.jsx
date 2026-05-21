import { useEffect, useState } from "react";

/**
 * Renders feasibility verdict details.
 * @param {{ verdict: any, onDisagree?: () => void, compact?: boolean }} props
 * @returns {JSX.Element|null}
 */
export function VerdictCard({ verdict, onDisagree, compact = false }) {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let raf;
    let start = 0;
    const target = verdict?.feasibilityScore || 0;

    const animate = () => {
      start += Math.max(1, Math.ceil(target / 25));
      if (start <= target) {
        setDisplayScore(start);
        raf = requestAnimationFrame(animate);
      } else {
        setDisplayScore(target);
      }
    };

    animate();
    return () => cancelAnimationFrame(raf);
  }, [verdict?.feasibilityScore]);

  if (!verdict) return null;

  const badgeColor = verdict.verdict === "FEASIBLE" ? "bg-success/20 text-success" : verdict.verdict === "RISKY" ? "bg-warning/20 text-warning" : "bg-danger/20 text-danger";

  return (
    <section className="fade-in bg-card/80 border border-border rounded-2xl p-6 space-y-5 shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm text-textSecondary">Feasibility Score</div>
          <div className="text-5xl font-bold tracking-tight">{displayScore}</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${badgeColor}`}>{verdict.verdict}</div>
      </div>

      <div className="text-sm text-textSecondary">Confidence: <span className="text-textPrimary uppercase">{verdict.confidenceLevel}</span></div>

      {!compact && (
        <>
          <div>
            <h3 className="font-semibold mb-2">Pros</h3>
            <ul className="space-y-2">
              {(verdict.pros || []).map((pro, idx) => (
                <li key={`${pro.point}-${idx}`} className="text-sm text-textSecondary flex gap-2">
                  <span className={pro.strength === "strong" ? "text-success" : "text-warning"}>●</span>
                  <span><strong className="text-textPrimary">{pro.point}</strong> — {pro.evidence}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Cons</h3>
            <ul className="space-y-2">
              {(verdict.cons || []).map((con, idx) => (
                <li key={`${con.point}-${idx}`} className="text-sm text-textSecondary flex gap-2">
                  <span className={con.severity === "critical" ? "text-danger" : con.severity === "major" ? "text-warning" : "text-textSecondary"}>●</span>
                  <span><strong className="text-textPrimary">{con.point}</strong> — {con.evidence}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid md:grid-cols-2 gap-3">
            <div className="bg-danger/10 border border-danger/30 rounded-xl p-3">
              <h4 className="text-danger font-semibold">Key Risk</h4>
              <p className="text-sm text-textSecondary">{verdict.keyRisk}</p>
            </div>
            <div className="bg-success/10 border border-success/30 rounded-xl p-3">
              <h4 className="text-success font-semibold">Key Strength</h4>
              <p className="text-sm text-textSecondary">{verdict.keyStrength}</p>
            </div>
          </div>
        </>
      )}

      <p className="text-textSecondary">{verdict.summary}</p>

      {onDisagree ? (
        <button type="button" onClick={onDisagree} className="px-4 py-2 bg-surface border border-border rounded-lg hover:border-primary">
          I Disagree — Here&apos;s Why
        </button>
      ) : null}
    </section>
  );
}
