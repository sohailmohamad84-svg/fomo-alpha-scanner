# Architecture Audit: FOMO Alpha Scanner (Pre-Upgrade Baseline)

**Date**: September 12, 2026  
**Auditor**: Antigravity Engineering Team  
**System**: FOMO Alpha Scanner (https://fomo-alpha-scanner.vercel.app/)  

---

## 1. System Overview & Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Framework** | Next.js 15.5.25 (App Router) | React 19, TypeScript 5.7, Webpack, Tailwind CSS 3.4 |
| **Runtime** | Node.js (v20+ target) | Serverless execution on Vercel; containerized worker on Render (ender.yaml) |
| **Database & ORM** | Prisma ORM 6.4.1 | SQLite (ile:./dev.db) for local; PostgreSQL schema supported |
| **State Management** | React useState / useEffect + SSE EventSource | In-memory singleton stores on server side (ventBus, omoClient, paperTradingEngine) |
| **Realtime Stream** | ws 8.18.0 & SSE /api/realtime/stream | Multi-listener Node EventEmitter bridge connecting FOMO WSS to browser clients |
| **Testing** | Node.js Test Runner via 	sx --test | 13 test suites (unit + 23-step acceptance workflow) |

---

## 2. Component Architecture & Implementation Status

### A. Frontend Architecture
- **Location**: src/app/ and src/components/
- **Pages**:
  - / (Home / Dashboard): Alpha Ticker, Top KPI cards, Early Entry radar spotlight, Top Winning Coins table.
  - /winning-coins: Multi-trader convergence matrix with time filters (5m to 24h), chain filter, min score slider.
  - /live-trades: Real-time trade firehose populated via initial fetch + SSE /api/realtime/stream.
  - /traders: Leaderboard table with Quality Score, multi-window PnL, follower stats, on-chain wallet addresses.
  - /traders/[handle]: Detailed trader dossier showing Solana + EVM wallets, balances, and spotlight theses.
  - /tokens/[id]: Token intelligence view with accumulation timeline, order flow breakdown, and dev wallet warning.
  - /paper-trading: Active open positions, realized/unrealized PnL, automated stop marks, closed trade history.
  - /backtest: Strategy parameter panel with client-side SVG equity curve comparison vs Buy & Hold.
  - /alerts: Real-time alert list with read status toggles.
  - /settings: Live slider configuration for trader weights, scoring weights, paper trading rules, Telegram keys.
  - /api-health: Credit usage meters, remaining quota, endpoint latency, WebSocket connection status.

### B. Backend API Routes (src/app/api/)
- GET /api/fomo/leaderboard: Enriches FOMO leaderboard with Trader Quality Scores; supports window & minScore filtering.
- GET /api/fomo/tokens/winning: Aggregates trades by token, calculates Smart Money Scores, and sorts by conviction.
- GET /api/fomo/tokens/[id]: Returns token stats, accumulation cascade, order flow, dev holdings, and thesis data.
- GET /api/fomo/traders/[handle]: Returns trader profile, wallet addresses, balances, and recent trades.
- GET /api/fomo/trades/recent: Returns recent trade stream from memory cache.
- GET /api/health: Health probe and telemetry metrics.
- GET /api/realtime/stream: Server-Sent Events (SSE) pipe streaming live trades and status events to client browsers.
- GET & POST /api/paper-trading/positions: Fetches open/closed positions; accepts manual buy/sell/close orders.
- GET /api/paper-trading/stats: Returns portfolio capital, PnL, win rate, and ROI.
- GET & POST /api/settings: Reads/updates runtime algorithm weights and credentials in-memory.
- POST /api/backtest/run: Runs parameter backtest simulations.

---

## 3. Data Flow & Integration Reality Check

### What is Real (Connected to Live Endpoints)
1. **Live FOMO REST API**: FomoApiClient (src/lib/fomo/client.ts) handles real bearer authorization with FOMO_API_KEY. It parses x-credits-cost and x-credits-remaining response headers.
2. **Live Leaderboard**: Calls /v2/leaderboard/{window}?limit=... directly when API key is provided.
3. **Live Token Boards**: Calls /v2/leaderboard/tokens/trending, most-held, graduated.
4. **Live User Profiles & Trades**: Calls /v2/users/{handle} and /v2/users/{handle}/trades.
5. **Live Token Holders & Devs**: Calls /token/{address}/holders and /v2/token/{address}/devs.
6. **Live WebSocket /ws/alerts**: FomoWsManager (src/lib/realtime/ws-manager.ts) connects to wss://api.fomoapi.io/ws/alerts?key=....

### What is Mocked / Fallback
1. **Simulation Fallback Mode**: When FOMO_API_KEY is not provided, or when 401/402 credit exhaustion occurs, FomoApiClient falls back to src/lib/fomo/mock-data.ts.
2. **On-Chain Stream (/ws/trades)**: Not yet implemented; currently only /ws/alerts is wired into FomoWsManager.
3. **Theses (/v2/thesis & /v2/users/{handle}/spotlight)**: Currently spotlight theses are parsed from mock/spotlight responses, but dedicated thesis endpoints are not yet fully ingested or semantically parsed into narratives.
4. **Notifications (/v2/notifications)**: Not yet integrated into a dedicated engine.
5. **Database Syncing at Runtime**: Prisma models exist in prisma/schema.prisma and SQLite was seeded locally, but runtime API routes primarily query in-memory stores (omoClient, paperTradingEngine) to ensure serverless Vercel compatibility without external DB latency.

---

## 4. Current Scoring Formulas & Limitations

### A. Trader Quality Score (TraderScorer)
Current formula in src/lib/scoring/trader-scorer.ts:
`
TraderScore = 0.30*PnL + 0.20*Consistency + 0.15*RecentPerf + 0.10*Activity + 0.10*AccountAge + 0.05*Verified + 0.05*Volume + 0.05*Holding
`
- **Limitation**: Uses raw PnL volume heavily. Does not separate **CopySignalScore** (post-observation profitability) from historical trader PnL. Young accounts with strong early discovery are penalised rather than evaluated as "Rising Talent". No trader regime detection (HOT/COLD/SCALPER).

### B. Smart Money Convergence Score (SmartMoneyEngine)
Current formula in src/lib/scoring/smart-money-engine.ts:
- Time decay: -5\text{m} = 1.0, \dots, 24\text{h}+ = 0.10$.
- Additive points: +25 high quality buy, +20 multi-trader buy, +15 top-ranked, +10 verified, +10 recent, +5 holding, etc.
- Penalties: -20 heavy selling, -15 quick exit, -10 stale, -10 low liquidity.
- **Limitation**: Does not incorporate **Trader DNA**, **Thesis Quality/Novelty**, **Smart-Money Holder Concentration**, or **Early Alpha on-chain latency**.

### C. Early Entry Detector (detectEarlyEntry)
- Tracks first buyer vs follower timestamps and computes window duration.
- **Limitation**: Only examines trades present in the feed; does not detect the "First Small Buy -> Later Large Buy" position-building pattern, nor on-chain vs feed latency delta.

### D. Paper Trading & Backtesting
- Paper trading supports stop-loss, take-profit, and trailing stops.
- **Limitation**: Backtesting uses synthetic walk logic (unBacktest) rather than strict walk-forward out-of-sample data with latency-aware entry delays (0s, 5s, 15s, 30s) and signal family attribution.

---

## 5. Technical Debt & Performance Bottlenecks

1. **Credit Exhaustion Risk**: If aggressive polling is triggered on /v2/users/{handle} (2,500 credits each), free or starter quotas can deplete quickly without adaptive priority budgeting.
2. **Serverless In-Memory State on Vercel**: On Vercel, separate serverless lambdas do not share memory. Realtime WebSockets are maintained only while the process lives, or fall back to client polling. A persistent worker (e.g. Render) is ideal for persistent WebSocket background streaming.
3. **Signal Attribution Absence**: Signals do not record their granular component contributions or strategy versions, making scientific backtesting and walk-forward validation impossible in the current state.
4. **No Multi-Dimensional Trader DNA**: Traders are ranked globally without chain specialization (e.g., Robinhood vs Solana).

---

## 6. Upgrade Roadmap Alignment

This audit establishes the baseline for the **Intelligence Upgrade**:
- **Phase 1**: Architecture audit & foundational data services (SOLID separation).
- **Phase 2**: Trader DNA, Regime Engine, Account Maturity, CopySignalScore.
- **Phase 3**: Thesis Intelligence, Narrative Radar, Semantic Clustering.
- **Phase 4**: Smart-Money Holder Engine & Accumulation/Distribution Lifecycle.
- **Phase 5**: Dual-Stream (On-Chain + Feed) & Early Alpha Engine.
- **Phase 6**: Robinhood Chain Mode & Winner Hunter ("Next Moves").
- **Phase 7**: Research Lab, Walk-Forward Backtester, UI Matrix, and Verification.
