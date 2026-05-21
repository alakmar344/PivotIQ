import { useEffect, useState } from "react";

const rotatingMessages = [
  "Searching the web for market data...",
  "Analyzing competitors...",
  "Building feasibility model...",
  "Running adversarial analysis...",
  "Formulating challenge..."
];

/**
 * Loading state component for active agent work.
 * @param {{ agentActivity?: string|null }} props
 * @returns {JSX.Element}
 */
export function LoadingAgent({ agentActivity }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((prev) => (prev + 1) % rotatingMessages.length), 2000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fade-in bg-card border border-border rounded-2xl p-8 flex flex-col items-center gap-4">
      <div className="spinner" />
      <p className="text-lg font-medium">{agentActivity || "Working..."}</p>
      <p className="text-textSecondary">{rotatingMessages[index]}</p>
      <div className="pulse-dots text-primary text-xl"><span>.</span><span>.</span><span>.</span></div>
    </div>
  );
}
