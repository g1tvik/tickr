# StockBuddy – Trading Education, Paper Trading, and AI Coaching

StockBuddy is a full-stack learning and simulation environment for new and intermediate traders. It combines a modern React/Vite frontend, an Express backend with file-based storage, realistic market data via Alpaca, and an AI Trading Coach for concept-first education.

## Goals
- Teach trading fundamentals, technicals, risk, and psychology through interactive content
- Let users practice with safe, realistic paper trading and portfolio tracking
- Provide an AI coach that explains, not advises; educates without prescribing trades

## High-level Features
- Frontend (React 19 + Vite + lightweight-charts)
  - SuperChart with multiple intervals, indicators (SMA/EMA/VWAP/Bollinger), drawing tools, and a global chart store
  - Paper trading UI: search, quotes, buy/sell, portfolio, transactions
  - Learn path with units, lessons, quizzes, XP/coins, daily goals, and a shop
  - AI Coach page for educational chat plus scenario analysis challenges
- Backend (Express)
  - Auth (JWT + optional Google OAuth)
  - Trading API: quotes, search, historical candles, portfolio, transactions, buy/sell
  - Data sources: Alpaca Market Data v2 (primary) with safe fallbacks; optional WebSocket stream for FAANG
  - File-based storage for users/portfolios/transactions (no DB required)

## Monorepo Structure
- `auth-backend/` (Express API, file storage, routes)
- `stockbuddy/` (React app, UI/UX, charts, lessons, shop)
- Startup helpers at root: `start-stockbuddy.*`, `restart-stockbuddy.js`, `check-status.js`

## Frontend Overview (stockbuddy)
- Routing: Home, SignIn/SignUp, Dashboard, Trade, Learn, LessonDetail, AICoach, Profile, Settings, Shop
- SuperChart (`src/components/SuperChart.tsx`)
  - Intervals: 1m, 5m, 15m, 1h, 4h, 1d, 1w, 1M
  - Indicators via `IndicatorManager.tsx`: SMA, EMA, VWAP, Bollinger
  - Drawing tools via `drawTools/DrawingTools.tsx`: trendline, horizontal/vertical lines, Fibonacci, text
  - Global state via `stores/chartStore.ts` (Zustand)
- Data fetching
  - `useChartData.ts` calls backend `/api/trading/chart/:symbol` with optional date range
  - `useTrading.js` orchestrates market data, portfolio, and orders using `services/api.js`
- Caching & UX
  - Ticker and homepage preload using `utils/stockCache.js` with localStorage cache
  - Vite dev proxy: `/api -> http://localhost:5001`

## Backend Overview (auth-backend)
- Server: `server.js`
  - Express + CORS + JSON
  - File storage class persisting to `data/users.json`, `data/portfolios.json`, `data/transactions.json`
  - Routes mounted under `/api`: `auth`, `trading`, `ai-coach`
- Data sources
  - Primary quotes and bars from Alpaca Market Data v2
    - Quotes: `https://data.alpaca.markets/v2/stocks/quotes/latest` (primary endpoint for quotes)
    - Bars: `https://data.alpaca.markets/v2/stocks/{symbol}/bars`
    - Latest trade: `.../trades/latest` where needed
  - Assets metadata and listings from Alpaca Paper API (for search/autocomplete)
  - Fallbacks (where enabled): Yahoo Finance for historical bars
  - Optional WebSocket: Alpaca IEX/delayed SIP for FAANG symbols (`websocket-client.js`)

### Trading API (key endpoints)
- `GET /api/trading/portfolio` (auth)
- `GET /api/trading/quote/:symbol` (public)
- `GET /api/trading/search?query=...` (public) – ranked relevance search over Alpaca assets
- `GET /api/trading/autocomplete?query=...` (public)
- `POST /api/trading/buy` (auth) – updates file-based portfolio and records a transaction
- `POST /api/trading/sell` (auth)
- `GET /api/trading/transactions` (auth)
- `GET /api/trading/market` (public) – FAANG snapshot using WS when available, REST otherwise
- `GET /api/trading/chart/:symbol?timeframe=...&limit=...&start=YYYY-MM-DD&end=YYYY-MM-DD` (public)
- Utilities: `GET /api/trading/health`, `/cache-status`, `/websocket-status`, `/test`

Notes
- Portfolio values refresh by fetching current quotes per position
- Historical data tries Alpaca first, then Yahoo; as a last resort, it may synthesize realistic candles for demo/dev

### Auth API (high-level)
- `POST /api/auth/register`, `POST /api/auth/login`
- `POST /api/auth/google` (optional Google OAuth)
- `GET /api/auth/profile`, `PUT /api/auth/profile`
- `GET/PUT /api/auth/learning-preferences`
- `POST /api/auth/send-goal-reminder` (email via Nodemailer)

## AI Coach
Backend route: `auth-backend/routes/ai-coach.js`

- Providers
  - Groq (OpenAI-compatible) primary if `GROQ_API_KEY` is set
  - Fallback to local Ollama (`OLLAMA_BASE_URL`, `OLLAMA_MODEL`) for generate endpoints
- Endpoints
  - `GET /api/ai-coach/diagnostics` – connectivity checks (Ollama, Groq)
  - `POST /api/ai-coach/chat`
    - System rules: teach, do not give buy/sell/hold, avoid predictions, no code blocks
    - Input: `{ message, scenario }`
    - Output: `{ success, response }`
  - `POST /api/ai-coach/analyze`
    - Returns STRICT JSON scoring a user’s decision against an optimal strategy
    - Input: `{ userDecisions, scenario, optimalStrategy }`
    - Output: `{ success, analysis }` where `analysis` matches:
      {"totalScore":<0-100>,"detailedFeedback":[{"step":1,"score":<0-100>,"feedback":"...","strengths":["..."],"weaknesses":["..."]}],"coaching":{"overall":"...","marketPsychology":"...","fundamentals":"...","technicalAnalysis":"...","riskManagement":"...","nextSteps":["..."]},"strengths":["..."],"weaknesses":["..."]}

Frontend: `src/pages/AICoach.jsx`
- Scenario-driven challenges (TSLA 2020, GME squeeze, AAPL 2007, BTC 2017)
- Chat UI for educational Q&A and a decision form that triggers `/analyze`

## Data, Caching, and Performance
- Backend caching
  - Alpaca assets cache (10 min)
  - Market snapshot cache (30 s)
  - Chart data cache per symbol/timeframe/date range (5 min)
- Frontend caching
  - LocalStorage-based stock cache (`utils/stockCache.js`, 30 min)
  - In-hook cache for chart data (`useChartData.ts`)
- WebSocket live data (when available), with REST fallbacks

## Error-handling Philosophy
- API endpoints return `{ success: false, message }` on errors
- Historical data attempts multiple providers before failing; some routes may synthesize demo candles when real data is unavailable during development

## Environment Variables
Backend (`auth-backend/.env`)
- `PORT=5001`
- `JWT_SECRET=...`
- `GOOGLE_CLIENT_ID=...` (optional)
- Alpaca: `ALPACA_API_KEY=...`, `ALPACA_SECRET_KEY=...`
- AI Coach: `GROQ_API_KEY=...`, `GROQ_MODEL=llama-3.1-8b-instant` (default), `OLLAMA_BASE_URL=...`, `OLLAMA_MODEL=...`

Frontend (`stockbuddy/.env`)
- `VITE_API_URL=http://localhost:5001/api`
- `VITE_GOOGLE_CLIENT_ID=...` (optional; used by Google Sign-In)

## Local Development
- One-command menu (Windows/macOS/Linux options):
  - `node start-stockbuddy.js` (or double-click `start-stockbuddy.bat` on Windows)
  - Start both services, backend only, frontend only, quick restart, or status check
- Manual
  - Backend: `cd auth-backend && npm install && npm start`
  - Frontend: `cd stockbuddy && npm install && npm run dev`

See `STARTUP_GUIDE.md` and `setup.md` for more.

## API Contracts (quick reference for LLMs)
- Quotes: primary endpoint is `https://data.alpaca.markets/v2/stocks/quotes/latest` with headers `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY`
- Charts: `GET /api/trading/chart/:symbol?timeframe=1d|1h|...&limit=...&start=YYYY-MM-DD&end=YYYY-MM-DD`
- Orders: `POST /api/trading/{buy|sell}` body: `{ symbol, shares }`
- Portfolio: `GET /api/trading/portfolio`
- AI Coach chat: `POST /api/ai-coach/chat` body: `{ message, scenario }`
- AI Coach analyze: `POST /api/ai-coach/analyze` body: `{ userDecisions, scenario, optimalStrategy }`

## Learning & Gamification
- Progress persisted in file storage; XP/coins, lesson attempts, unit/final tests
- Daily goals, reminders via email (Nodemailer test/production transports)
- In-app Shop purchases consume coins and can activate boosters/features

## Deployment
- Frontend: Vercel (`vercel.json`) builds `stockbuddy/dist`
- Backend: deploy as Node service (file storage persists in `auth-backend/data/`)

## Notes for AI Agents Reading This
- The AI Coach must avoid prescriptive advice: no buy/sell/hold directives or predictions; focus on concepts and reasoning quality
- The analyze endpoint must return STRICT JSON as documented (no extra text)

---

References
- `ALPACA_SETUP.md` – keys and demo mode
- `GOOGLE_OAUTH_SETUP.md` – Google auth flow
- `STARTUP_GUIDE.md`, `setup.md` – running locally
- `stockbuddy/README.md` – legacy frontend readme


