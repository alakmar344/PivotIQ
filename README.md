# PivotIQ

The AI that argues with your idea — so the market doesn't have to.

PivotIQ is an autonomous multi-agent startup idea validator that researches your market, generates a hard-nosed feasibility verdict, debates your counter-arguments, and produces an actionable execution plan when your thesis survives scrutiny.

## Tech Stack

- **Frontend:** React 18 + Vite + Tailwind CSS v3
- **Backend:** Node.js + Express
- **AI:** Google Gemini 2.5 Flash (`gemini-2.5-flash-preview-05-20`)
- **Web Search:** Serper API

## Repository Structure

```text
pivotiq/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── package.json
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
│   │   ├── errorHandler.js
│   │   ├── rateLimiter.js
│   │   └── validator.js
│   └── utils/
│       └── logger.js
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css
│       ├── components/
│       │   ├── IdeaInput.jsx
│       │   ├── VerdictCard.jsx
│       │   ├── DebateThread.jsx
│       │   ├── CounterInput.jsx
│       │   ├── BuildPlan.jsx
│       │   ├── LoadingAgent.jsx
│       │   ├── ResearchSources.jsx
│       │   └── ErrorBoundary.jsx
│       ├── hooks/
│       │   └── usePivotIQ.js
│       └── utils/
│           └── api.js
└── README.md
```

## Setup

### 1) Clone

```bash
git clone https://github.com/alakmar344/PivotIQ.git
cd PivotIQ
```

### 2) Backend install and env

```bash
cd backend
cp .env.example .env
npm install
```

Update `.env` values for your API keys.

### 3) Frontend install

```bash
cd ../frontend
npm install
```

### 4) Run development servers

Terminal 1:

```bash
cd backend
npm run dev
```

Terminal 2:

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173` and backend at `http://localhost:3001`.

## Environment Variables

| Variable | Required | Example | Description |
|---|---|---|---|
| `NODE_ENV` | Yes | `development` | Runtime mode |
| `PORT` | Yes | `3001` | Backend server port |
| `GEMINI_API_KEY` | Yes | `AIza...` | Google Gemini API key |
| `SERPER_API_KEY` | Yes | `abc123...` | Serper API key |
| `FRONTEND_URL` | Yes | `http://localhost:5173` | Allowed CORS origin |
| `LOG_LEVEL` | No | `info` | Logger threshold |
| `VITE_API_URL` | Yes (frontend) | `http://localhost:3001` | Backend API base URL |

## API Documentation

### `POST /api/validate`

Validates a startup idea.

**Request body**

```json
{ "idea": "An AI tutor for JEE students in Hindi with adaptive practice tests" }
```

**Response**

```json
{
  "researchData": {},
  "verdict": {},
  "sessionId": "uuid"
}
```

### `POST /api/counter`

Submits a counter-argument in debate mode.

**Request body**

```json
{
  "sessionId": "uuid",
  "idea": "...",
  "researchData": {},
  "currentVerdict": {},
  "debateHistory": [],
  "userCounter": "Your assumptions ignore district-level school adoption data."
}
```

**Response**

```json
{
  "agentResponse": "...",
  "updatedVerdict": {},
  "verdictChanged": true,
  "planReady": false,
  "responseType": "verdict_updated",
  "changeReason": "..."
}
```

### `POST /api/plan`

Generates an execution plan after feasibility threshold is met.

**Request body**

```json
{
  "sessionId": "uuid",
  "idea": "...",
  "researchData": {},
  "finalVerdict": {},
  "debateHistory": []
}
```

**Response**

```json
{ "plan": {} }
```

## Architecture Diagram (ASCII)

```text
┌─────────────┐        HTTP         ┌────────────────┐
│ React UI    │ ─────────────────▶ │ Express API     │
│ (Vite)      │ ◀───────────────── │ /validate       │
└─────┬───────┘                     │ /counter        │
      │                             │ /plan           │
      │                             └──────┬──────────┘
      │                                    │
      │                       ┌────────────▼────────────┐
      │                       │ Agent Orchestration      │
      │                       │ Research/Analysis/       │
      │                       │ Adversarial/Plan         │
      │                       └──────┬──────────┬────────┘
      │                              │          │
      │                     ┌────────▼───┐   ┌──▼─────────┐
      │                     │ Gemini API │   │ Serper API │
      │                     └────────────┘   └────────────┘
```

## Get API Keys

- Gemini API key: https://ai.google.dev/
- Serper API key: https://serper.dev/

## Deployment Guide

### Frontend (Vercel)
1. Import `frontend` directory into Vercel.
2. Set `VITE_API_URL` to your backend public URL.
3. Deploy.

### Backend (Railway/Render)
1. Import `backend` directory.
2. Set environment variables from `.env.example`.
3. Start command: `npm start`.
4. Ensure CORS `FRONTEND_URL` matches deployed frontend domain.

## Production Hardening Included

- Helmet security headers
- CORS restricted to frontend origin
- Express rate limiting (`30 requests / 15 min`)
- JSON body size limit (`50kb`)
- Global error handling with production-safe responses
- Request timeout handling (30s)
- Graceful shutdown and process-level exception handlers
- Serper in-memory cache (10 minutes)
- Gemini retry logic with exponential backoff
- React Error Boundary and robust async error handling
