# PivotIQ

## Startup conviction, pressure-tested.

**PivotIQ is the AI cofounder built to stress-test startup ideas before founders invest time, money, and team bandwidth in the wrong direction.**

Built during a **Google XPRIZE Hackathon** sprint, PivotIQ is designed around one core mission:  
turn raw founder ambition into evidence-backed strategic clarity.

---

## The problem PivotIQ solves

Most startup ideas don’t fail because founders are lazy.  
They fail because founders move too fast with incomplete truth:

- Assumed demand instead of proven demand
- Excitement-driven product scope
- Weak understanding of market incumbents
- No clear monetization path
- No structured way to challenge their own assumptions

PivotIQ exists to close that gap with a repeatable validation engine.

---

## What makes PivotIQ different

PivotIQ is not a generic chatbot.  
It is a decision system built for founders who need hard strategic signals.

**PivotIQ is for founders who want signal over hype.**

### 1) Unified intelligence in one flow
- Market and competitor research
- Feasibility scoring and verdicting
- Adversarial debate guidance
- Execution plan generation

### 2) Boardroom-style verdicts
Each idea is evaluated with:
- Feasibility score
- Verdict class (`FEASIBLE`, `RISKY`, `NOT_FEASIBLE`)
- Strengths and critical weaknesses
- Confidence level
- Key strategic risk and key strategic advantage

### 3) Debate mode for founder defense
Founders can challenge the first verdict with counter-arguments.  
PivotIQ responds with pressure-test logic and evidence priorities, forcing the thesis to become stronger before execution.

### 4) Execution blueprint when the thesis survives
Once the idea passes readiness conditions, PivotIQ generates:
- MVP scope
- Weekly milestone roadmap
- Monetization direction
- Risk register with mitigations
- Resource and success metric guidance

---

## Product experience

PivotIQ is structured as a premium, phase-based founder workflow:

1. **Submit startup concept**
2. **Receive research-backed verdict**
3. **Enter adversarial debate mode**
4. **Harden assumptions with evidence**
5. **Unlock execution plan**
6. **Export plan as markdown**

Session continuity is built in via browser-stored chat history, allowing founders to revisit and refine prior decision cycles.

---

## Built for the Google XPRIZE Hackathon

PivotIQ was created as a high-impact hackathon build focused on practical startup outcomes:

- Faster founder decision quality
- Less capital wasted on weak assumptions
- More disciplined idea-to-execution transitions
- Clearer go / no-go confidence signals

In short: **fewer blind bets, smarter launches.**

---

## Technical product snapshot

### Frontend
- React 18
- Vite
- Tailwind CSS
- Axios
- DOMPurify for input sanitization

### Backend
- Node.js + Express
- Google Gemini structured generation pipeline
- Serper-powered web intelligence
- Input validation, timeout handling, rate limiting, and centralized error handling

### AI architecture highlights
- Unified agent orchestration to generate research, verdict, debate guide, and plan payloads
- Gemini model baseline: `gemini-3.5-flash`
- Schema-checked structured output pipeline
- Deterministic debate and planning gates for reliability

---

## API capabilities

### `POST /api/validate`
Accepts a founder idea and returns market research, verdict, debate guide, and session initialization data.

### `POST /api/counter`
Accepts founder counter-arguments and continues adversarial debate with readiness signaling.

### `POST /api/plan`
Returns structured execution planning when idea readiness criteria are met.

### `GET /api/ping/stream`
Server-sent keep-alive stream for stable frontend-backend connectivity behavior.

---

## Repository map

```text
PivotIQ/
├── backend/
│   ├── agents/        # AI orchestration logic
│   ├── routes/        # Validate / counter / plan endpoints
│   ├── middleware/    # Validation, rate limiting, error handling, ping stream
│   ├── services/      # Gemini + Serper integrations
│   ├── utils/         # Logging utilities
│   └── server.js      # Express app bootstrap
└── frontend/
    ├── src/components # Product UI surfaces (verdict, debate, plan, etc.)
    ├── src/hooks      # Core app state + workflow control
    ├── src/utils      # API client utilities
    └── src/App.jsx    # Main application experience
```

---

## Environment variables reference

PivotIQ uses environment-based configuration for secure runtime setup.

### Backend
- `NODE_ENV`
- `PORT`
- `GEMINI_API_KEY`
- `SERPER_API_KEY`
- `FRONTEND_URL`
- `TRUST_PROXY`
- `LOG_LEVEL`

### Frontend
- `VITE_API_URL`

---

## Security and reliability posture

PivotIQ includes production-conscious safeguards:

- Helmet security headers
- CORS origin controls
- API rate limiting
- Request validation and sanitization
- Structured error handling
- Request timeout protection
- SSE connection health support
- Frontend error boundary and sanitized inputs

If your team wants sharper market truth, stronger strategic confidence, and a clearer path from idea to execution, PivotIQ is your validation cockpit.

##project is open source under MIT LICENCE 
