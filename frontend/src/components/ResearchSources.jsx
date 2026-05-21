import { useMemo, useState } from "react";

/**
 * Extracts domain from URL.
 * @param {string} link
 * @returns {string}
 */
function getDomain(link) {
  try {
    return new URL(link).hostname.replace("www.", "");
  } catch (_error) {
    return link;
  }
}

/**
 * Shows source evidence and research summary.
 * @param {{ researchData: any }} props
 * @returns {JSX.Element|null}
 */
export function ResearchSources({ researchData }) {
  const [open, setOpen] = useState(false);
  const competitors = useMemo(() => researchData?.competitors || [], [researchData]);

  if (!researchData) return null;

  return (
    <section className="bg-card/80 border border-border rounded-2xl p-4 shadow-card">
      <button type="button" onClick={() => setOpen((prev) => !prev)} className="w-full text-left font-medium flex items-center justify-between">
        <span>Research Sources</span>
        <span className="text-textSecondary text-sm">{(researchData.sources || []).length} links {open ? "▲" : "▼"}</span>
      </button>
      {open ? (
        <div className="mt-4 space-y-4 text-sm text-textSecondary">
          <div>
            <h3 className="font-semibold text-textPrimary">Search Queries</h3>
            <ul className="list-disc list-inside">
              {(researchData.sourceQueries || []).map((query) => <li key={query}>{query}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-textPrimary">Market Size</h3>
            <p>{researchData.marketSize}</p>
          </div>

          <div>
            <h3 className="font-semibold text-textPrimary">Top Sources</h3>
            <div className="space-y-2">
              {(researchData.sources || []).slice(0, 8).map((source) => (
                <a key={source.link} href={source.link} target="_blank" rel="noreferrer" className="block bg-surface border border-border rounded-lg p-3 hover:border-primary">
                  <p className="text-textPrimary font-medium">{source.title}</p>
                  <p className="text-xs">{getDomain(source.link)}</p>
                  <p className="mt-1">{source.snippet}</p>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-textPrimary">Competitors</h3>
            <div className="grid md:grid-cols-2 gap-2">
              {competitors.map((competitor, idx) => (
                <div key={`${competitor.name}-${idx}`} className="bg-surface border border-border rounded-lg p-3">
                  <p className="text-textPrimary font-medium">{competitor.name}</p>
                  <p>{competitor.description}</p>
                  <p className="text-xs mt-1">Funding: {competitor.fundingStatus || "Unknown"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
