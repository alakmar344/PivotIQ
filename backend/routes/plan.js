import express from "express";
import { logger } from "../utils/logger.js";
import { handleValidation, planRules, sanitizeText } from "../middleware/validator.js";

const router = express.Router();

/**
 * Creates fast fallback plan if precomputed plan is missing.
 * @param {{ idea: string, finalVerdict: any }} payload
 * @returns {any}
 */
function buildFallbackPlan(payload) {
  const candidateName = payload.idea.split(" ").slice(0, 5).join(" ").trim();
  const projectName = candidateName.length >= 12 ? candidateName : "PivotIQ MVP Launch Plan";
  return {
    projectName,
    oneLiner: `Build and launch ${projectName} with a lean execution-first MVP.`,
    mvpScope: {
      features: ["Landing page + onboarding", "Core workflow", "Analytics baseline"],
      outOfScope: ["Advanced automations", "Enterprise customizations"],
      timeline: "8 weeks"
    },
    techStack: {
      frontend: "React + Vite",
      backend: "Node.js + Express",
      database: "PostgreSQL",
      ai: "Gemini API",
      payments: "Razorpay or Stripe",
      hosting: "Vercel + Render"
    },
    weeklyMilestones: [
      { week: 1, title: "Scoping", tasks: ["Define user flows", "Finalize MVP KPIs"], deliverable: "Validated scope doc" },
      { week: 2, title: "Foundation", tasks: ["Set up app architecture", "Auth + base APIs"], deliverable: "Working skeleton" },
      { week: 3, title: "Core Feature 1", tasks: ["Ship main value loop", "Instrument analytics"], deliverable: "Usable alpha" },
      { week: 4, title: "Core Feature 2", tasks: ["Improve UX", "Error hardening"], deliverable: "Internal beta" }
    ],
    monetizationPath: {
      model: "Subscription",
      firstRevenueEstimate: "Within 8-12 weeks post-launch",
      approach: "Pilot with early adopters and convert to paid tiers"
    },
    topRisks: [
      { risk: "Weak demand signal", mitigation: "Run weekly user interviews and measure activation" },
      { risk: "High acquisition cost", mitigation: "Test niche channels before scaling spend" }
    ],
    firstActions: ["Interview 10 target users", "Ship clickable prototype", "Define success dashboard"],
    resourcesNeeded: { budget: "₹1.5L-₹4L", teamSize: 2, keySkills: ["Frontend", "Backend", "Product"] },
    successMetrics: [
      { metric: "Activation rate", target: ">=30%", timeline: "First month" },
      { metric: "Weekly active users", target: "100+", timeline: "Within 8 weeks" }
    ]
  };
}

/**
 * Build plan generation endpoint.
 */
router.post("/", planRules, handleValidation, async (req, res, next) => {
  try {
    const payload = {
      ...req.body,
      idea: sanitizeText(req.body.idea)
    };

    const verdict = payload.finalVerdict?.verdict;
    const hasMitigations = Array.isArray(payload.finalVerdict?.cons) && payload.finalVerdict.cons.length > 0;
    const eligible = verdict === "FEASIBLE" || (verdict === "RISKY" && hasMitigations);

    if (!eligible) {
      const error = new Error("Idea is not ready for planning");
      error.name = "ValidationError";
      error.details = [{ msg: "planReady conditions failed" }];
      throw error;
    }

    logger.info("PlanRoute", "PLAN_REQUEST_RECEIVED", {
      sessionId: payload.sessionId,
      verdict
    });

    const precomputed = payload.researchData?.precomputedPlan;
    const plan = precomputed && typeof precomputed === "object" ? precomputed : buildFallbackPlan(payload);
    res.json({ plan });
  } catch (error) {
    next(error);
  }
});

export default router;
