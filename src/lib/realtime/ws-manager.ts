import WebSocket from 'ws';
import { eventBus } from './event-bus';
import { normalizeTrade } from '../normalizer';
import { smartMoneyEngine } from '../scoring/smart-money-engine';
import { traderScorer } from '../scoring/trader-scorer';
import { paperTradingEngine } from '../simulator/paper-trading';
import { alertEngine } from '../alerts/alert-engine';
import { telegramDispatcher } from '../alerts/telegram';
import { MOCK_TRADERS, MOCK_TOKENS } from '../fomo/mock-data';

export type WsConnectionStatus = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'ERROR';

export class FomoWsManager {
  private ws: WebSocket | null = null;
  private status: WsConnectionStatus = 'DISCONNECTED';
  private reconnectAttempts = 0;
  private maxReconnectDelay = 30000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private simulationInterval: NodeJS.Timeout | null = null;
  private processedEvents = new Set<string>();
  private apiKey: string;
  private wsUrl: string;

  constructor() {
    this.apiKey = process.env.FOMO_API_KEY || '';
    this.wsUrl = process.env.FOMO_WS_URL || 'wss://api.fomoapi.io/ws/alerts';
  }

  public getStatus(): WsConnectionStatus {
    return this.status;
  }

  public start() {
    if (this.apiKey && this.apiKey.trim().length > 0) {
      this.connect();
    } else {
      console.log('[FOMO WS] No FOMO_API_KEY provided; starting high-fidelity trade simulator.');
      this.status = 'CONNECTED';
      this.startSimulation();
      eventBus.broadcast('status', { status: this.status, mode: 'simulation' });
    }
  }

  public stop() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.pingInterval) clearInterval(this.pingInterval);
    if (this.simulationInterval) clearInterval(this.simulationInterval);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.status = 'DISCONNECTED';
    eventBus.broadcast('status', { status: this.status });
  }

  private connect() {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.close();
    }

    this.status = this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING';
    eventBus.broadcast('status', { status: this.status });

    const targetUrl = `${this.wsUrl}?key=${this.apiKey}`;
    try {
      this.ws = new WebSocket(targetUrl);

      this.ws.on('open', () => {
        console.log('[FOMO WS] Connected to FOMO Realtime stream');
        this.status = 'CONNECTED';
        this.reconnectAttempts = 0;
        eventBus.broadcast('status', { status: this.status });

        // Heartbeat ping every 30 seconds
        this.pingInterval = setInterval(() => {
          if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.ping();
          }
        }, 30000);
      });

      this.ws.on('message', (rawData: WebSocket.Data) => {
        try {
          const str = rawData.toString();
          const message = JSON.parse(str);
          this.handleMessage(message);
        } catch (err: any) {
          console.error('[FOMO WS] Message parse error:', err.message);
        }
      });

      this.ws.on('error', (err: Error) => {
        console.warn('[FOMO WS] WebSocket Error:', err.message);
        this.status = 'ERROR';
        eventBus.broadcast('status', { status: this.status, error: err.message });
      });

      this.ws.on('close', (code: number, reason: Buffer) => {
        console.log(`[FOMO WS] Closed: ${code} - ${reason.toString()}`);
        this.status = 'DISCONNECTED';
        eventBus.broadcast('status', { status: this.status });
        this.scheduleReconnect();
      });
    } catch (err: any) {
      console.error('[FOMO WS] Connection exception:', err.message);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), this.maxReconnectDelay);
    console.log(`[FOMO WS] Reconnecting in ${delay / 1000}s (attempt ${this.reconnectAttempts})...`);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  private handleMessage(msg: any) {
    if (msg.type === 'welcome') {
      console.log(`[FOMO WS] Welcome received. Freshness: realtime=${msg.realtime}, delay=${msg.delaySeconds || 0}s`);
      return;
    }

    if (msg.type === 'alert' && (msg.alertType === 'buy' || msg.alertType === 'sell')) {
      const eventKey = `${msg.trader}_${msg.tokenAddress}_${msg.ts || Date.now()}_${msg.alertType}`;
      if (this.processedEvents.has(eventKey)) return;
      this.processedEvents.add(eventKey);
      if (this.processedEvents.size > 2000) this.processedEvents.clear();

      const normalized = normalizeTrade(
        {
          tradeId: msg.id || `ws_${Date.now()}`,
          token: { symbol: msg.token || 'UNKNOWN', address: msg.tokenAddress || '' },
          side: msg.alertType,
          status: msg.alertType === 'buy' ? 'open' : 'closed',
          sizeUsd: msg.usdValue || 1000,
          avgEntryPrice: msg.price,
          chain: msg.chain,
          chainId: msg.chainId,
          ts: msg.ts || Date.now(),
          source: msg.source || 'feed',
        },
        msg.trader || 'anonymous'
      );

      this.processTradeEvent(normalized);
    }
  }

  public processTradeEvent(trade: ReturnType<typeof normalizeTrade>) {
    // 1. Broadcast trade to live tickers
    eventBus.broadcast('trade', trade);

    // 2. Evaluate paper trading rules if buy
    if (trade.side === 'BUY') {
      const entryCheck = paperTradingEngine.evaluateSignalForEntry({
        tokenAddress: trade.tokenAddress,
        network: trade.network,
        symbol: trade.symbol,
        priceUsd: trade.priceUsd || 0.05,
        smartMoneyScore: 85, // will update with aggregated score
        uniqueTraders: 3,
        signalAgeMinutes: 1,
        tradersInvolved: [trade.traderHandle],
      });

      if (entryCheck.entered && entryCheck.position) {
        eventBus.broadcast('paper_trade', entryCheck.position);
      }
    } else {
      // If sell, update price and check exits
      paperTradingEngine.updatePrice(trade.tokenAddress, trade.priceUsd);
    }
  }

  private startSimulation() {
    // Generates a realistic incoming trade every 8 - 15 seconds to demonstrate live updates
    const runSimTick = () => {
      const randomTrader = MOCK_TRADERS[Math.floor(Math.random() * MOCK_TRADERS.length)];
      const randomToken = MOCK_TOKENS[Math.floor(Math.random() * MOCK_TOKENS.length)];
      const isBuy = Math.random() > 0.2;
      const sizeUsd = Math.round(5000 + Math.random() * 25000);
      const price = randomToken.priceUsd * (1 + (Math.random() - 0.48) * 0.02);

      const simTrade = normalizeTrade(
        {
          tradeId: `sim_${Date.now()}`,
          token: { symbol: randomToken.token.symbol, address: randomToken.token.address },
          side: isBuy ? 'buy' : 'sell',
          status: isBuy ? 'open' : 'closed',
          sizeUsd,
          avgEntryPrice: price,
          chain: randomToken.network,
          ts: Date.now(),
          source: 'feed',
        },
        randomTrader.handle,
        {
          symbol: randomToken.token.symbol,
          name: randomToken.token.name,
          network: randomToken.network,
        }
      );

      this.processTradeEvent(simTrade);

      // Random delay between 7 and 14 seconds for next tick
      const nextDelay = 7000 + Math.random() * 7000;
      this.simulationInterval = setTimeout(runSimTick, nextDelay);
    };

    this.simulationInterval = setTimeout(runSimTick, 4000);
  }
}

// Global Singleton WS Manager
declare global {
  var __fomoWsManager: FomoWsManager | undefined;
}

export const fomoWsManager = global.__fomoWsManager || new FomoWsManager();
if (process.env.NODE_ENV !== 'production') {
  global.__fomoWsManager = fomoWsManager;
}
