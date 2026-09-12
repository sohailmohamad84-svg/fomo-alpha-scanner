import { FomoTraderProfile, FomoLeaderboardTrader } from '../fomo/types';

export interface TraderScoreWeights {
  pnl: number;           // Default: 0.30
  consistency: number;   // Default: 0.20
  recentPerf: number;    // Default: 0.15
  activity: number;      // Default: 0.10
  accountAge: number;    // Default: 0.10
  verified: number;      // Default: 0.05
  volume: number;        // Default: 0.05
  holdingBehavior: number; // Default: 0.05
}

export const DEFAULT_TRADER_WEIGHTS: TraderScoreWeights = {
  pnl: 0.30,
  consistency: 0.20,
  recentPerf: 0.15,
  activity: 0.10,
  accountAge: 0.10,
  verified: 0.05,
  volume: 0.05,
  holdingBehavior: 0.05,
};

export interface TraderUniverseConfig {
  minPnlUsd: number;
  min24hPnlUsd: number;
  min7dPnlUsd: number;
  min30dPnlUsd: number;
  minVolumeUsd: number;
  minTrades: number;
  minAccountAgeDays: number;
  minFollowers: number;
  verifiedOnly: boolean;
  minQualityScore: number;
  maxTraders: number;
}

export const DEFAULT_UNIVERSE_CONFIG: TraderUniverseConfig = {
  minPnlUsd: 10000,
  min24hPnlUsd: 0,
  min7dPnlUsd: 5000,
  min30dPnlUsd: 10000,
  minVolumeUsd: 50000,
  minTrades: 10,
  minAccountAgeDays: 14,
  minFollowers: 100,
  verifiedOnly: false,
  minQualityScore: 50,
  maxTraders: 50,
};

export interface TraderScoreResult {
  score: number; // 0 - 100
  pnlScore: number;
  consistencyScore: number;
  recentScore: number;
  activityScore: number;
  accountAgeScore: number;
  verifiedScore: number;
  volumeScore: number;
  holdingScore: number;
}

export interface ScorableTrader {
  handle?: string;
  displayName?: string;
  pnlUsd?: number;
  pnl?: {
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
    all?: number;
  };
  volumeUsd?: number;
  trades?: number;
  followers?: number;
  verified?: boolean;
  accountAgeDays?: number;
  averageHoldTimeSeconds?: number;
  holdings?: number | any[];
  [key: string]: any;
}

export class TraderScorer {
  private weights: TraderScoreWeights;

  constructor(weights: Partial<TraderScoreWeights> = {}) {
    this.weights = { ...DEFAULT_TRADER_WEIGHTS, ...weights };
  }

  public setWeights(weights: Partial<TraderScoreWeights>) {
    this.weights = { ...this.weights, ...weights };
  }

  public getWeights(): TraderScoreWeights {
    return { ...this.weights };
  }

  public calculateScore(trader: ScorableTrader): TraderScoreResult {
    const pnlAll = trader.pnlUsd || trader.pnl?.all || 0;
    const pnl30d = trader.pnl?.['30d'] || pnlAll * 0.7;
    const pnl7d = trader.pnl?.['7d'] || pnlAll * 0.3;
    const pnl24h = trader.pnl?.['24h'] || 0;
    const volume = trader.volumeUsd || 0;
    const trades = trader.trades || 0;
    const accountAge = trader.accountAgeDays || 60;
    const isVerified = !!trader.verified;
    const avgHoldSeconds = trader.averageHoldTimeSeconds || 36000;

    // 1. PnL Score (0 - 100): Log scale up to $500k
    let pnlScore = 0;
    if (pnlAll > 0) {
      pnlScore = Math.min(100, Math.round((Math.log10(pnlAll + 1) / Math.log10(500000)) * 100));
    }

    // 2. Consistency Score (0 - 100): Multi-window profitability
    let consistencyScore = 20;
    if (pnlAll > 0) consistencyScore += 20;
    if (pnl30d > 0) consistencyScore += 25;
    if (pnl7d > 0) consistencyScore += 25;
    if (pnl24h >= 0) consistencyScore += 10;
    consistencyScore = Math.min(100, consistencyScore);

    // 3. Recent Performance Score (0 - 100)
    let recentScore = 30;
    if (pnl7d > 10000) recentScore += 35;
    else if (pnl7d > 1000) recentScore += 20;
    if (pnl24h > 1000) recentScore += 35;
    else if (pnl24h > 0) recentScore += 20;
    recentScore = Math.min(100, recentScore);

    // 4. Activity Score (0 - 100): Sweet spot 20 - 250 trades
    let activityScore = 0;
    if (trades >= 10 && trades <= 300) {
      activityScore = Math.min(100, trades * 0.8 + 20);
    } else if (trades > 300) {
      activityScore = 80; // High frequency penalty slight
    } else {
      activityScore = trades * 3;
    }

    // 5. Account Age Score (0 - 100): Established reputation (capped at 365 days)
    const accountAgeScore = Math.min(100, Math.round((accountAge / 365) * 100));

    // 6. Verified Score
    const verifiedScore = isVerified ? 100 : 30;

    // 7. Volume Score (0 - 100): Log scale up to $5M volume
    let volumeScore = 0;
    if (volume > 0) {
      volumeScore = Math.min(100, Math.round((Math.log10(volume + 1) / Math.log10(5000000)) * 100));
    }

    // 8. Holding Behavior Score (0 - 100): 4 hours to 72 hours hold time preferred
    let holdingScore = 50;
    const hours = avgHoldSeconds / 3600;
    if (hours >= 2 && hours <= 96) {
      holdingScore = 90;
    } else if (hours < 0.25) {
      holdingScore = 30; // Ultra high-speed bot
    } else {
      holdingScore = 70;
    }

    // Weighted composite
    const totalScore =
      pnlScore * this.weights.pnl +
      consistencyScore * this.weights.consistency +
      recentScore * this.weights.recentPerf +
      activityScore * this.weights.activity +
      accountAgeScore * this.weights.accountAge +
      verifiedScore * this.weights.verified +
      volumeScore * this.weights.volume +
      holdingScore * this.weights.holdingBehavior;

    return {
      score: Math.max(0, Math.min(100, Math.round(totalScore))),
      pnlScore,
      consistencyScore,
      recentScore,
      activityScore,
      accountAgeScore,
      verifiedScore,
      volumeScore,
      holdingScore,
    };
  }

  public passesUniverseFilter(
    trader: ScorableTrader,
    score: number,
    config: TraderUniverseConfig = DEFAULT_UNIVERSE_CONFIG
  ): boolean {
    const pnlAll = trader.pnlUsd || trader.pnl?.all || 0;
    const pnl24h = trader.pnl?.['24h'] !== undefined ? trader.pnl['24h'] : (trader.pnlUsd ? trader.pnlUsd * 0.05 : 0);
    const pnl7d = trader.pnl?.['7d'] !== undefined ? trader.pnl['7d'] : (trader.pnlUsd ? trader.pnlUsd * 0.25 : 0);
    const pnl30d = trader.pnl?.['30d'] !== undefined ? trader.pnl['30d'] : (trader.pnlUsd ? trader.pnlUsd * 0.70 : 0);
    const volume = trader.volumeUsd || 0;
    const trades = trader.trades || 0;
    const followers = trader.followers || 0;
    const accountAge = trader.accountAgeDays || 60;
    const isVerified = !!trader.verified;

    if (score < config.minQualityScore) return false;
    if (pnlAll < config.minPnlUsd) return false;
    if (config.min24hPnlUsd > 0 && pnl24h < config.min24hPnlUsd) return false;
    if (config.min7dPnlUsd > 0 && pnl7d < config.min7dPnlUsd) return false;
    if (config.min30dPnlUsd > 0 && pnl30d < config.min30dPnlUsd) return false;
    if (volume < config.minVolumeUsd) return false;
    if (trades < config.minTrades) return false;
    if (followers < config.minFollowers) return false;
    if (accountAge < config.minAccountAgeDays) return false;
    if (config.verifiedOnly && !isVerified) return false;

    return true;
  }
}

export const traderScorer = new TraderScorer();
