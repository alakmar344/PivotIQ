import { useState } from "react";

/**
 * Counter argument input component.
 * @param {{ onSubmit: (counter: string) => void, loading: boolean }} props
 * @returns {JSX.Element}
 */
export function CounterInput({ onSubmit, loading }) {
  const [counter, setCounter] = useState("");

  /**
   * Handles submit event.
   * @param {React.FormEvent} event
   * @returns {void}
   */
  function handleSubmit(event) {
    event.preventDefault();
    onSubmit(counter);
    setCounter("");
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card/80 border border-border rounded-2xl p-4 shadow-card">
      <textarea
        value={counter}
        onChange={(event) => setCounter(event.target.value)}
        className="w-full h-28 bg-surface/90 border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary"
        placeholder="Make your case. Add evidence, correct assumptions, or propose changes..."
      />
      <div className="mt-2 text-sm text-textSecondary">{counter.trim().length} / 2000 (min 10)</div>
      <button
        type="submit"
        disabled={loading || counter.trim().length < 10 || counter.trim().length > 2000}
        className="mt-3 px-4 py-2 bg-primary hover:bg-primaryHover disabled:opacity-50 rounded-lg shadow-lg shadow-primary/20"
      >
        Counter the AI →
      </button>
      <p className="mt-2 text-xs text-textSecondary">Tip: Specific evidence and data change the AI&apos;s mind. Opinions rarely do.</p>
    </form>
  );
}
