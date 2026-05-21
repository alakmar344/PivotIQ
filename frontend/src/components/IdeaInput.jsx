import { useState } from "react";

const examples = [
  "An AI tutor for JEE students in Hindi",
  "A hyperlocal delivery app for rural Rajasthan",
  "A B2B SaaS for small Indian textile exporters"
];

/**
 * Startup idea submission component.
 * @param {{ onSubmit: (idea: string) => void, loading: boolean }} props
 * @returns {JSX.Element}
 */
export function IdeaInput({ onSubmit, loading }) {
  const [idea, setIdea] = useState("");

  /**
   * Handles form submission.
   * @param {React.FormEvent} event
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(idea);
  }

  return (
    <form onSubmit={handleSubmit} className="fade-in bg-card/80 border border-border rounded-2xl p-6 md:p-8 max-w-3xl w-full mx-auto shadow-card">
      <textarea
        value={idea}
        onChange={(event) => setIdea(event.target.value)}
        placeholder="Describe your startup idea in 2-3 sentences. Be specific about who it's for and what problem it solves."
        className="w-full h-40 bg-surface/90 border border-border rounded-xl p-4 text-textPrimary focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div className="mt-2 text-sm text-textSecondary">{idea.trim().length} / 1000 (min 20)</div>

      <button
        type="submit"
        disabled={loading || idea.trim().length < 20 || idea.trim().length > 1000}
        className="mt-4 px-5 py-3 bg-primary hover:bg-primaryHover disabled:opacity-50 rounded-lg font-medium shadow-lg shadow-primary/20"
      >
        Validate My Idea →
      </button>

      <div className="mt-6 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            type="button"
            key={example}
            onClick={() => setIdea(example)}
            className="text-sm bg-surface border border-border rounded-full px-3 py-1 hover:border-primary"
          >
            {example}
          </button>
        ))}
      </div>
    </form>
  );
}
