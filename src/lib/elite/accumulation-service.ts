// Fresh Accumulation & Position Building Service
// Differentiates existing legacy holdings from fresh buying today
// Detects Position Building patterns: Starter Buy -> Larger Conviction Buy

import { TraderHoldingState } from '../types/elite';

export interface TraderBalanceSnapshot {
  handle: string;
  tokenAddress: string;
  priorBalance: number;
  currentBalance: number;
  lastTradeTimestamp: number;
  lastTradeSide: 'BUY' | 'SELL';
  lastTradeUsd: number;
}

export interface PositionBuildingSequence {
  handle: string;
  tokenAddress: string;
  starterBuyUsd: number;
  starterBuyTimestamp: number;
  convictionBuyUsd: number;
  convictionBuyTimestamp: number;
  sizeMultiplier: number;
  timeDeltaMinutes: number;
}

export class AccumulationService {
  constructor() {}

  /**
   * Classifies trader holding velocity state
   */
  public classifyHoldingState(
    priorBalance: number,
    currentBalance: number,
    lastTradeSide: 'BUY' | 'SELL'
  ): TraderHoldingState {
    if (currentBalance <= 0) {
      return priorBalance > 0 ? 'EXITED' : 'NOT_HELD';
    }

    if (priorBalance <= 0 && currentBalance > 0) {
      return 'NEW_ENTRY';
    }

    const deltaPct = (currentBalance - priorBalance) / priorBalance;

    if (lastTradeSide === 'BUY') {
      if (deltaPct >= 0.15) {
        return 'ACCUMULATING'; // Added >= 15%
      }
      return 'HOLDING';
    } else {
      // Selling
      if (deltaPct <= -0.75 || currentBalance <= 0) {
        return 'EXITED';
      }
      if (deltaPct <= -0.15) {
        return 'REDUCING';
      }
      return 'HOLDING';
    }
  }

  /**
   * Detects starter buy -> larger conviction buy pattern for a single trader
   */
  public detectPositionBuilding(
    trades: Array<{
      handle: string;
      tokenAddress: string;
      side: string;
      valueUsd: number;
      timestamp: number;
    }>
  ): PositionBuildingSequence | null {
    const buyTrades = trades
      .filter((t) => t.side.toUpperCase() === 'BUY')
      .sort((a, b) => a.timestamp - b.timestamp);

    if (buyTrades.length < 2) return null;

    // Inspect pairs of consecutive buys
    for (let i = 0; i < buyTrades.length - 1; i++) {
      const first = buyTrades[i];
      const second = buyTrades[i + 1];

      // Second buy must be larger than first buy (at least 1.5x larger)
      if (second.valueUsd >= first.valueUsd * 1.5) {
        const timeDeltaMs = second.timestamp - first.timestamp;
        const timeDeltaMin = timeDeltaMs / (1000 * 60);

        // Sequence must occur within 24 hours (1440 mins) and not simultaneously (< 1 min)
        if (timeDeltaMin >= 1 && timeDeltaMin <= 1440) {
          return {
            handle: first.handle,
            tokenAddress: first.tokenAddress,
            starterBuyUsd: first.valueUsd,
            starterBuyTimestamp: first.timestamp,
            convictionBuyUsd: second.valueUsd,
            convictionBuyTimestamp: second.timestamp,
            sizeMultiplier: Math.round((second.valueUsd / first.valueUsd) * 10) / 10,
            timeDeltaMinutes: Math.round(timeDeltaMin * 10) / 10,
          };
        }
      }
    }

    return null;
  }

  /**
   * Computes EliteAccumulationScore (0 - 100)
   * High score requires fresh buying today from multiple elite wallets
   */
  public calculateAccumulationScore(
    walletStates: Array<{
      handle: string;
      eliteScore: number;
      state: TraderHoldingState;
      lastTradeUsd: number;
      tradeAgeHours: number;
    }>
  ): {
    score: number;
    newEntriesCount: number;
    accumulatingCount: number;
    reducingCount: number;
    isFresh: boolean;
  } {
    let score = 0;
    let newEntriesCount = 0;
    let accumulatingCount = 0;
    let reducingCount = 0;

    for (const w of walletStates) {
      const qualityFactor = (w.eliteScore || 60) / 100;
      const recencyBonus = w.tradeAgeHours <= 4 ? 1.2 : w.tradeAgeHours <= 12 ? 1.0 : 0.6;

      if (w.state === 'NEW_ENTRY') {
        newEntriesCount++;
        score += 35 * qualityFactor * recencyBonus;
      } else if (w.state === 'ACCUMULATING') {
        accumulatingCount++;
        score += 25 * qualityFactor * recencyBonus;
      } else if (w.state === 'HOLDING') {
        // Holding is passive; adds minimal fresh score
        score += 5 * qualityFactor;
      } else if (w.state === 'REDUCING') {
        reducingCount++;
        score -= 30 * qualityFactor;
      } else if (w.state === 'EXITED') {
        reducingCount++;
        score -= 40 * qualityFactor;
      }
    }

    const isFresh = (newEntriesCount >= 1 || accumulatingCount >= 1) && reducingCount === 0;

    return {
      score: Math.min(100, Math.max(0, Math.round(score * 10) / 10)),
      newEntriesCount,
      accumulatingCount,
      reducingCount,
      isFresh,
    };
  }
}

export const accumulationService = new AccumulationService();
