# FOMO Alpha Scanner: Smart Trader & Coin Signal Dashboard

> **"Follow the smartest money, not the crowd."**

A production-ready crypto intelligence terminal and signal dashboard that connects to the **FOMO API** (`api.fomoapi.io`) to identify high-conviction coins by tracking what elite, historically profitable FOMO traders are buying in real time.

---

## 🌟 Core Concepts & Methodology

1. **Find High-Quality Traders**: We evaluate traders across multiple windows (`24h`, `7d`, `30d`, `all`) using a configurable **Trader Quality Score** (PnL, consistency, win rate, account age, average hold time, volume, and verification status) rather than blindly copying rank #1.
2. **Detect Smart Money Convergence**: The central alpha engine. When multiple elite traders independently accumulate the same coin within a narrow time window, a high-conviction signal is generated.
3. **Early Entry & Cascade Detection**: Identifies **who entered first**, the elapsed time until followers entered, and the duration of the accumulation window.
4. **Time Decay Recency**: Applies exponential time decay (e.g. 5m = 1.00, 15m = 0.95, 30m = 0.90, 1h = 0.80, 24h = 0.10).
5. **Universal Token Identification**: Strictly identifies coins by `NETWORK + CONTRACT_ADDRESS` (e.g. `SOLANA:DezXAZ...`, `ROBINHOOD:0x39dbed...`). Never by symbol alone.
6. **Zero-Capital Paper Trading**: Simulates copy-trading strategies with configurable capital, position sizing, slippage, automated stop-loss, take-profit, trailing stops, and smart-money exit triggers.
7. **Production Separation**: Isolates signal generation from execution. Live execution is guarded behind manual verification and safety toggles.
8. **Usage-Based Credit Management**: Real-time monitoring of metered credit consumption, rate limits, and endpoint cost tracking.

---

## 🏗 System Architecture

```
FOMO API (REST + WebSocket: wss://api.fomoapi.io/ws/alerts)
    │
    ▼
[ FomoApiClient ] ─── (Credit accounting, caching, rate-limiting)
    │
    ▼
[ Normalization Layer ] ─── (Deduplicates by NETWORK + CONTRACT)
    │
    ├─► [ Trader Quality Scoring Engine ] ─── (Configurable weights)
    │
    ├─► [ Smart Money Convergence Engine ] ── (Multi-trader aggregation + time decay)
    │
    ├─► [ Early Entry Detector ] ─────────── (First buyer + follower cascade)
    │
    ├─► [ Risk Management Engine ] ───────── (Dev rug checks, liquidity warnings)
    │
    ├─► [ Paper Trading Simulator ] ──────── (Auto SL/TP, trailing stops, P&L)
    │
    ├─► [ Realtime SSE Stream ] ──────────── (Zero-refresh dashboard updates)
    │
    └─► [ Optional Telegram Bot ] ────────── (Instant high-conviction alerts)
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- **Node.js**: v18.17+ or v20+ / v22+
- **npm** or **pnpm**

### 2. Environment Setup
Clone the repository and copy the environment template:
```bash
cp .env.example .env
```

Edit `.env`:
```env
# FOMO API Key (From https://fomoapi.io/dashboard)
# If left blank, the platform operates in High-Fidelity Simulation Mode
FOMO_API_KEY=

# Base Endpoints
FOMO_BASE_URL=https://api.fomoapi.io
FOMO_WS_URL=wss://api.fomoapi.io/ws/alerts

# Database (SQLite default for zero-config; PostgreSQL supported)
DATABASE_URL="file:./dev.db"

# Optional Telegram Dispatcher
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_ENABLED=false
```

### 3. Install & Run
```bash
# Install dependencies
npm install

# Initialize Database
npm run prisma:push

# Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📊 Dashboard Modules & Pages

| Page | Path | Description |
|---|---|---|
| **Dashboard** | `/` | KPI metrics, real-time alpha ticker, early entry spotlight, and Top Winning Coins table |
| **Winning Coins** | `/winning-coins` | Primary discovery terminal. Multi-trader convergence matrix filterable by chain, score, and time window (5m to 24h) |
| **Who Is Buying Now?** | `/live-trades` | Real-time firehose of verified FOMO smart money fills with highlight triggers |
| **Smart Traders** | `/traders` | Ranked trader leaderboard with configurable Trader Quality Scores and universe filtering |
| **Trader Detail** | `/traders/[handle]` | Full trader dossier: Solana + EVM wallets, multi-chain holdings, PnL breakdown, and spotlight theses |
| **Token Detail** | `/tokens/[id]` | Deep coin intelligence: accumulation timeline, order flow windows, deployer holdings, and copy-trade modal |
| **Paper Trading** | `/paper-trading` | Portfolio simulator tracking open positions, unrealized PnL, automated stops, and closed trade logs |
| **Backtesting** | `/backtest` | Strategy backtester testing thresholds against benchmark Buy & Hold with interactive equity curves |
| **Alpha Alerts** | `/alerts` | Notification center for accumulation triggers, top trader buys, and exit dump warnings |
| **Settings** | `/settings` | Real-time configuration of scoring weights, universe criteria, paper trading rules, and Telegram |
| **API & Credits** | `/api-health` | Credit monitor tracking usage, remaining balance, projections, latency, and WebSocket status |

---

## 🧪 Running Automated Tests

Run the built-in test suite:
```bash
npm test
```
The suite verifies:
- API Client response schemas against OpenAPI 3.1 specifications.
- Trader Quality Scoring and configurable weights.
- Multi-trader convergence detection and recency decay.
- Early entry first-buyer detection and follower sequence timing.
- Paper trading automated stop-loss, take-profit, and trailing stop triggers.

---

## 🔒 Security & Safe Trading

- **API Key Protection**: Never exposed in frontend JavaScript; handled exclusively by the server-side API proxy layer.
- **Credit Preservation**: Implements aggressive caching (5m for profiles, 60s for leaderboards), deduplication, and WebSocket-first trade ingestion (WebSocket messages are free).
- **Execution Safety Gate**: Live trading cannot be accidentally triggered; the platform defaults to `PAPER` simulation mode and requires dual-confirmation staging before live wallet execution.
