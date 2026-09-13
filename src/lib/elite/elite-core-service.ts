// Elite Core Engine
// Evaluates traders across multi-window PnL, rank persistence, consistency, and discovery capability
// Classifies into: ELITE_CORE, ELITE, RISING, WATCH, UNPROVEN

import { EliteClassification, EliteTraderScore } from '../types/elite';
import { FomoLeaderboardTrader, FomoTraderProfile } from '../fomo/types';

export interface EliteScoreWeights {
  pnl30d: number;      // 0.25
  pnl7d: number;       // 0.20
  pnl24h: number;      // 0.15
  consistency: number; // 0.15
  persistence: number; // 0.15
  discovery: number;   // 0.10
}

export const DEFAULT_ELITE_WEIGHTS: EliteScoreWeights = {
  pnl30d: 0.25,
  pnl7d: 0.20,
  pnl24h: 0.15,
  consistency: 0.15,
  persistence: 0.15,
  discovery: 0.10,
};

export class EliteCoreService {
  private weights: EliteScoreWeights;

  constructor(weights: EliteScoreWeights = DEFAULT_ELITE_WEIGHTS) {
    this.weights = weights;
  }

  /**
   * Log-scale normalization helper
   */
  private normalizePnl(pnl: number, minPnl: number, maxPnl: number): number {
    if (!pnl || pnl <= 0) return 0;
    const clamped = Math.min(maxPnl, Math.max(pnl, minPnl));
    const score = (Math.log10(clamped) - Math.log10(minPnl)) / (Math.log10(maxPnl) - Math.log10(minPnl));
    return Math.min(100, Math.max(0, score * 100));
  }

  /**
   * Computes EliteScore (0 - 100)
   */
  public calculateEliteScore(
    pnl30d: number,
    pnl7d: number,
    pnl24h: number,
    consistencyScore: number,
    persistenceScore: number,
    discoveryScore: number = 70
  ): number {
    // 30d PnL benchmarks: $1,000 to $1,000,000
    const s30d = this.normalizePnl(pnl30d, 1000, 1000000);
    // 7d PnL benchmarks: $500 to $250,000
    const s7d = this.normalizePnl(pnl7d, 500, 250000);
    // 24h PnL benchmarks: $100 to $50,000
    const s24h = this.normalizePnl(pnl24h, 100, 50000);

    const weightedScore =
      s30d * this.weights.pnl30d +
      s7d * this.weights.pnl7d +
      s24h * this.weights.pnl24h +
      consistencyScore * this.weights.consistency +
      persistenceScore * this.weights.persistence +
      discoveryScore * this.weights.discovery;

    return Math.min(100, Math.max(0, Math.round(weightedScore * 10) / 10));
  }

  /**
   * Computes EliteConfidence (0 - 100) based on sample size and stability
   */
  public calculateEliteConfidence(
    tradeCount: number,
    accountAgeDays: number,
    consistencyScore: number
  ): number {
    // Trades depth (50+ trades is high confidence)
    const tradeFactor = Math.min(1.0, tradeCount / 60);
    // Age depth (60+ days is mature)
    const ageFactor = Math.min(1.0, accountAgeDays / 60);
    // Consistency stability
    const consistencyFactor = Math.min(1.0, consistencyScore / 80);

    const confidence = (tradeFactor * 0.40 + ageFactor * 0.35 + consistencyFactor * 0.25) * 100;
    return Math.min(100, Math.max(10, Math.round(confidence * 10) / 10));
  }

  /**
   * Classifies trader into ELITE_CORE, ELITE, RISING, WATCH, or UNPROVEN
   */
  public classifyTrader(
    score: number,
    confidence: number,
    persistenceScore: number,
    accountAgeDays: number,
    winRate: number,
    pnlAll: number
  ): EliteClassification {
    // Rising talent: young account (< 30 days) with strong performance
    if (accountAgeDays > 0 && accountAgeDays <= 30 && winRate >= 0.55 && pnlAll >= 10000 && score >= 60) {
      return 'RISING';
    }

    // Elite Core: Top persistent performers with high confidence
    if (score >= 80 && confidence >= 65 && persistenceScore >= 60) {
      return 'ELITE_CORE';
    }

    // Elite: High scoring with solid confidence
    if (score >= 70 && confidence >= 45) {
      return 'ELITE';
    }

    // Watchlist
    if (score >= 50) {
      return 'WATCH';
    }

    return 'UNPROVEN';
  }

  /**
   * Fully evaluates a trader and returns an EliteTraderScore
   */
  public evaluateTrader(
    trader: {
      handle: string;
      displayName?: string;
      pnl30d?: number;
      pnl7d?: number;
      pnl24h?: number;
      pnlAll?: number;
      volumeUsd?: number;
      tradesCount?: number;
      accountAgeDays?: number;
      consistencyScore?: number;
      winRate?: number;
      primaryChain?: string;
      verified?: boolean;
      consecutiveSnapshotsInTop?: number;
      leadScore?: number;
      followScore?: number;
      discoveryScore?: number;
    },
    persistenceScore: number = 50
  ): EliteTraderScore {
    const handle = trader.handle;
    const displayName = trader.displayName || handle;
    const pnl30d = trader.pnl30d || trader.pnlAll || 0;
    const pnl7d = trader.pnl7d || 0;
    const pnl24h = trader.pnl24h || 0;
    const pnlAll = trader.pnlAll || pnl30d;
    const tradeCount = trader.tradesCount || 10;
    const accountAgeDays = trader.accountAgeDays || 30;
    const consistencyScore = trader.consistencyScore ?? 65;
    const winRate = trader.winRate ?? 0.55;
    const discoveryScore = trader.discoveryScore ?? 50;

    const eliteScore = this.calculateEliteScore(
      pnl30d,
      pnl7d,
      pnl24h,
      consistencyScore,
      persistenceScore,
      discoveryScore
    );

    const eliteConfidence = this.calculateEliteConfidence(
      tradeCount,
      accountAgeDays,
      consistencyScore
    );

    const classification = this.classifyTrader(
      eliteScore,
      eliteConfidence,
      persistenceScore,
      accountAgeDays,
      winRate,
      pnlAll
    );

    return {
      handle,
      displayName,
      eliteScore,
      eliteConfidence,
      classification,
      persistenceScore,
      leadScore: trader.leadScore ?? 50,
      followScore: trader.followScore ?? 50,
      discoveryScore,
      pnl30d,
      pnl7d,
      pnl24h,
      pnlAll,
      consistencyScore,
      winRate,
      accountAgeDays,
      tradeCount,
      primaryChain: trader.primaryChain || 'solana',
      verified: !!trader.verified,
      consecutiveSnapshotsInTop: trader.consecutiveSnapshotsInTop || 1,
    };
  }

  /**
   * Filters and sorts an array of evaluated traders into Elite Core roster
   */
  public filterEliteCore(evaluatedTraders: EliteTraderScore[]): EliteTraderScore[] {
    return evaluatedTraders
      .filter((t) => t.classification === 'ELITE_CORE' || t.classification === 'ELITE')
      .sort((a, b) => b.eliteScore - a.eliteScore);
  }
}

export const eliteCoreService = new EliteCoreService();
