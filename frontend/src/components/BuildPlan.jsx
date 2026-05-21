/**
 * Copies markdown content to clipboard.
 * @param {string} text
 * @returns {Promise<void>}
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    console.log("[PivotIQ] Plan copied to clipboard");
  } catch (error) {
    console.error("[PivotIQ] Failed to copy plan", error);
  }
}

/**
 * Converts plan JSON into markdown.
 * @param {any} plan
 * @returns {string}
 */
function toMarkdown(plan) {
  return `# ${plan.projectName}\n\n${plan.oneLiner}\n\n## MVP Features\n${(plan.mvpScope?.features || []).map((item) => `- ${item}`).join("\n")}\n\n## Weekly Milestones\n${(plan.weeklyMilestones || []).map((item) => `### Week ${item.week}: ${item.title}\n${(item.tasks || []).map((task) => `- ${task}`).join("\n")}\nDeliverable: ${item.deliverable}`).join("\n\n")}`;
}

/**
 * Build plan visualizer component.
 * @param {{ plan: any }} props
 * @returns {JSX.Element|null}
 */
export function BuildPlan({ plan }) {
  if (!plan) return null;

  return (
    <section className="space-y-5 fade-in">
      <div className="bg-card border border-border rounded-2xl p-6">
        <h2 className="text-3xl font-bold">{plan.projectName}</h2>
        <p className="text-textSecondary mt-2">{plan.oneLiner}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-2">MVP Scope</h3>
        <span className="inline-block mb-3 text-xs bg-primary/20 text-primary rounded-full px-2 py-1">{plan.mvpScope?.timeline}</span>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-textPrimary font-medium">Features</h4>
            <ul className="list-disc list-inside text-textSecondary">{(plan.mvpScope?.features || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <h4 className="text-textPrimary font-medium">Out of Scope</h4>
            <ul className="list-disc list-inside text-textSecondary">{(plan.mvpScope?.outOfScope || []).map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Tech Stack</h3>
        <div className="grid md:grid-cols-3 gap-3 text-sm">
          {Object.entries(plan.techStack || {}).map(([key, value]) => (
            <div key={key} className="bg-surface border border-border rounded-lg p-3">
              <p className="uppercase text-xs text-textSecondary">{key}</p>
              <p className="text-textPrimary">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Weekly Milestones</h3>
        <div className="grid md:grid-cols-2 gap-3">
          {(plan.weeklyMilestones || []).map((milestone) => (
            <div key={milestone.week} className="bg-surface border border-border rounded-lg p-3">
              <p className="text-primary font-medium">Week {milestone.week}: {milestone.title}</p>
              <ul className="list-disc list-inside text-sm text-textSecondary mt-1">
                {(milestone.tasks || []).map((task) => <li key={task}>{task}</li>)}
              </ul>
              <p className="text-xs mt-2 text-textSecondary">Deliverable: {milestone.deliverable}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Monetization Path</h3>
        <p className="text-textSecondary">{plan.monetizationPath?.model} — {plan.monetizationPath?.approach}</p>
        <p className="text-sm mt-2">First Revenue Estimate: {plan.monetizationPath?.firstRevenueEstimate}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Top Risks</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-textSecondary">
              <th className="pb-2">Risk</th>
              <th className="pb-2">Mitigation</th>
            </tr>
          </thead>
          <tbody>
            {(plan.topRisks || []).map((item, index) => (
              <tr key={index} className="border-t border-border">
                <td className="py-2">{item.risk}</td>
                <td className="py-2 text-textSecondary">{item.mitigation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-success/10 border border-success/30 rounded-2xl p-6">
        <h3 className="font-semibold mb-2">Do These TODAY</h3>
        <ol className="list-decimal list-inside text-textSecondary">
          {(plan.firstActions || []).slice(0, 3).map((action) => <li key={action}>{action}</li>)}
        </ol>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Resources Needed</h3>
        <p className="text-textSecondary">Budget: {plan.resourcesNeeded?.budget}</p>
        <p className="text-textSecondary">Team Size: {plan.resourcesNeeded?.teamSize}</p>
        <p className="text-textSecondary">Skills: {(plan.resourcesNeeded?.keySkills || []).join(", ")}</p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <h3 className="font-semibold mb-3">Success Metrics</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-textSecondary">
              <th className="pb-2">Metric</th>
              <th className="pb-2">Target</th>
              <th className="pb-2">Timeline</th>
            </tr>
          </thead>
          <tbody>
            {(plan.successMetrics || []).map((metric, index) => (
              <tr key={index} className="border-t border-border">
                <td className="py-2">{metric.metric}</td>
                <td className="py-2">{metric.target}</td>
                <td className="py-2 text-textSecondary">{metric.timeline}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => copyToClipboard(toMarkdown(plan))}
        className="px-4 py-2 bg-primary hover:bg-primaryHover rounded-lg"
      >
        Export as Markdown
      </button>
    </section>
  );
}
