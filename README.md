# PivotIQ

**The AI cofounder that pressure-tests your startup idea before the market does.**

PivotIQ helps founders avoid expensive blind spots by combining live market intelligence, adversarial critique, and an execution blueprint in one premium workflow.  
Instead of “good idea” fluff, PivotIQ gives you a boardroom-style reality check.

---

## Why PivotIQ matters

Most early-stage ideas fail because founders ship before validating:
- Real market demand
- Competitive pressure
- Execution feasibility
- Monetization clarity

PivotIQ is built to close that gap fast.  
You submit your concept once, and the system:
1. Researches your market and competitors
2. Produces a feasibility verdict
3. Debates your counter-arguments
4. Generates a practical build plan once your thesis survives

This is decision intelligence for founders, not just chat responses.

---

## Product highlights

- **Professional founder dashboard UI** with clear phase-based flow
- **Multi-agent analysis pipeline** (research, analysis, adversarial challenge, planning)
- **Evidence-backed verdicting** with score, confidence, pros/cons, key risk, and key strength
- **Debate mode** to challenge assumptions with your own market logic
- **Local chat history** persisted in browser localStorage so past sessions can be reopened
- **Plan export** as markdown for immediate execution

---

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **AI Engine:** Google Gemini (`gemini-2.5-flash-preview-05-20`)
- **Web intelligence:** Serper API

---

## Repository structure

```text
PivotIQ/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── routes/
│   │   ├── validate.js
│   │   ├── counter.js
│   │   └── plan.js
│   ├── agents/
│   │   ├── researchAgent.js
│   │   ├── analysisAgent.js
│   │   ├── adversarialAgent.js
│   │   └── planAgent.js
│   ├── services/
│   │   ├── gemini.js
│   │   └── serper.js
│   ├── middleware/
│   └── utils/
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── hooks/usePivotIQ.js
    │   ├── components/
    │   └── utils/api.js
```

---

## Quick start

### 1) Clone and install

```bash
git clone https://github.com/alakmar344/PivotIQ.git
cd PivotIQ
```

Backend dependencies:

```bash
cd backend
npm install
cp .env.example .env
```

Frontend dependencies:

```bash
cd ../frontend
npm install
```

---

## Environment configuration

Update `backend/.env` with:

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | Yes | Runtime mode (`development` / `production`) |
| `PORT` | Yes | Backend port (example `3001`) |
| `GEMINI_API_KEY` | Yes | Gemini API key |
| `SERPER_API_KEY` | Yes | Serper API key |
| `FRONTEND_URL` | Yes | Allowed frontend origin for CORS |
| `LOG_LEVEL` | No | Logger verbosity |

Frontend environment:

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | Yes | Backend base URL |

---

## Run locally

Start backend:

```bash
cd backend
npm run dev
```

Start frontend in another terminal:

```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3001`

---

## API overview

### `POST /api/validate`
Submit a startup idea and get research + first verdict.

### `POST /api/counter`
Challenge the verdict with your argument and continue debate turns.

### `POST /api/plan`
Generate a build plan once the idea is ready for execution.

---

## Founder workflow

1. Describe idea in detail
2. Review feasibility verdict
3. Enter debate mode and defend your thesis
4. Let PivotIQ refine verdict confidence
5. Generate and export your execution plan
6. Reopen prior sessions from local chat history

---

## Security and production readiness

- Helmet headers
- CORS restrictions
- Rate limiting
- Input validation
- Global error handling
- Request timeout handling
- Retry logic for upstream AI calls
- Frontend error boundary

---

## Deployment

### Frontend (Vercel)
1. Import `frontend/`
2. Set `VITE_API_URL`
3. Deploy

### Backend (Render/Railway)
1. Import `backend/`
2. Set environment variables from `.env.example`
3. Start command: `npm start`
4. Ensure `FRONTEND_URL` matches deployed frontend domain

---

## Positioning statement

PivotIQ is for serious founders who want to de-risk decisions fast.  
If you need sharper market truth, stronger strategic clarity, and faster execution confidence, PivotIQ is your validation engine.
