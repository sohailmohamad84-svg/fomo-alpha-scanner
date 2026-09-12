import { NormalizedTrade } from '../fomo/types';

export type ConvictionLevel = 'Weak' | 'Moderate' | 'Strong' | 'Very Strong' | 'Exceptional';
export type SignalState =
  | 'WATCH'
  | 'EARLY_SIGNAL'
  | 'STRONG_SIGNAL'
  | 'HIGH_CONVICTION'
  | 'EXIT_WARNING'
  | 'EXIT';

export interface SmartMoneyScoringWeights {
  highQualityBuy: number;       // +25
  multiHighQualityBuy: number;  // +20
  topRankedBuy: number;         // +15
  verifiedBuy: number;          // +10
  independentBuyers: number;    // +10
  recentPurchase: number;       // +10
  strongHistorical: number;     // +10
  holdingBonus: number;         // +5
  trendingBonus: number;        // +5
  fomoBuyersBonus: number;      // +5

  strongSellingPenalty: number; // -20
  quickExitPenalty: number;     // -15
  poorHistoryPenalty: number;   // -10
  staleSignalPenalty: number;   // -10
  lowLiquidityPenalty: number;  // -10
  singleLowQualityPenalty: number; // -10
}

export const DEFAULT_SCORING_WEIGHTS: SmartMoneyScoringWeights = {
  highQualityBuy: 25,
  multiHighQualityBuy: 20,
  topRankedBuy: 15,
  verifiedBuy: 10,
  independentBuyers: 10,
  recentPurchase: 10,
  strongHistorical: 10,
  holdingBonus: 5,
  trendingBonus: 5,
  fomoBuyersBonus: 5,

  strongSellingPenalty: 20,
  quickExitPenalty: 15,
  poorHistoryPenalty: 10,
  staleSignalPenalty: 10,
  lowLiquidityPenalty: 10,
  singleLowQualityPenalty: 10,
};

export interface TokenSignalComputation {
  smartMoneyScore: number; // 0 - 100
  conviction: ConvictionLevel;
  signalState: SignalState;
  uniqueBuyers: number;
  uniqueHighQualityBuyers: number;
  uniqueVerifiedBuyers: number;
  uniqueSellers: number;
  totalBuyVolume: number;
  totalSellVolume: number;
  weightedBuyVolume: number;
  netSmartMoneyFlow: number;
  averageTraderScore: number;
  topTraderHandle: string | null;
  topTraderScore: number;
  firstBuyerHandle: string | null;
  firstBuyTime: Date | null;
  latestBuyerHandle: string | null;
  latestBuyerTime: Date | null;
  accumulationWindowMins: number;
  signalAgeMinutes: number;
  riskWarnings: string[];
  breakdown: Record<string, number>;
}

export class SmartMoneyEngine {
  private weights: SmartMoneyScoringWeights;

  constructor(weights: Partial<SmartMoneyScoringWeights> = {}) {
    this.weights = { ...DEFAULT_SCORING_WEIGHTS, ...weights };
  }

  public setWeights(weights: Partial<SmartMoneyScoringWeights>) {
    this.weights = { ...this.weights, ...weights };
  }

  public getWeights(): SmartMoneyScoringWeights {
    return { ...this.weights };
  }

  public getRecencyDecay(minutesAgo: number): number {
    if (minutesAgo <= 5) return 1.00;
    if (minutesAgo <= 15) return 0.95;
    if (minutesAgo <= 30) return 0.90;
    if (minutesAgo <= 60) return 0.80;
    if (minutesAgo <= 180) return 0.65; // 1-3 hours
    if (minutesAgo <= 360) return 0.50; // 3-6 hours
    if (minutesAgo <= 720) return 0.35; // 6-12 hours
    if (minutesAgo <= 1440) return 0.20; // 12-24 hours
    return 0.10; // 24h+
  }

  public computeTokenSignal(
    trades: NormalizedTrade[],
    traderScores: Map<string, { score: number; rank?: number; verified?: boolean }>,
    tokenContext?: {
      isTrending?: boolean;
      fomoBuyersCount?: number;
      liquidityUsd?: number;
      isDevHolding?: boolean;
    }
  ): TokenSignalComputation {
    if (!trades || trades.length === 0) {
      return this.emptySignal();
    }

    const now = Date.now();
    const buyers = new Set<string>();
    const highQualityBuyers = new Set<string>();
    const verifiedBuyers = new Set<string>();
    const sellers = new Set<string>();

    let totalBuyVolume = 0;
    let totalSellVolume = 0;
    let weightedBuyVolume = 0;
    let sumTraderScores = 0;
    let topTraderHandle: string | null = null;
    let topTraderScore = 0;

    let earliestBuy: { handle: string; time: Date } | null = null;
    let latestBuy: { handle: string; time: Date } | null = null;

    const sortedTrades = [...trades].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const breakdown: Record<string, number> = {};
    const riskWarnings: string[] = [];

    // Analyze each trade
    for (const trade of sortedTrades) {
      const traderInfo = traderScores.get(trade.traderHandle) || { score: 50, verified: false };
      const score = traderInfo.score;
      const tradeTime = new Date(trade.timestamp);
      const minutesAgo = Math.max(0, (now - tradeTime.getTime()) / (60 * 1000));
      const decay = this.getRecencyDecay(minutesAgo);

      if (trade.side === 'BUY') {
        buyers.add(trade.traderHandle);
        totalBuyVolume += trade.valueUsd;
        weightedBuyVolume += trade.valueUsd * decay;
        sumTraderScores += score;

        if (score > topTraderScore) {
          topTraderScore = score;
          topTraderHandle = trade.traderHandle;
        }

        if (score >= 70) {
          highQualityBuyers.add(trade.traderHandle);
        }

        if (traderInfo.verified) {
          verifiedBuyers.add(trade.traderHandle);
        }

        if (!earliestBuy || tradeTime < earliestBuy.time) {
          earliestBuy = { handle: trade.traderHandle, time: tradeTime };
        }
        if (!latestBuy || tradeTime > latestBuy.time) {
          latestBuy = { handle: trade.traderHandle, time: tradeTime };
        }
      } else if (trade.side === 'SELL') {
        sellers.add(trade.traderHandle);
        totalSellVolume += trade.valueUsd;
      }
    }

    const uniqueBuyers = buyers.size;
    const uniqueHighQuality = highQualityBuyers.size;
    const uniqueVerified = verifiedBuyers.size;
    const uniqueSellers = sellers.size;
    const averageTraderScore = uniqueBuyers > 0 ? Math.round(sumTraderScores / uniqueBuyers) : 0;
    const netSmartMoneyFlow = totalBuyVolume - totalSellVolume;

    const firstBuyTime = earliestBuy ? earliestBuy.time : null;
    const latestBuyTime = latestBuy ? latestBuy.time : null;
    const accumulationWindowMins =
      earliestBuy && latestBuy
        ? Math.max(0, (latestBuy.time.getTime() - earliestBuy.time.getTime()) / (60 * 1000))
        : 0;

    const newestTrade = sortedTrades[sortedTrades.length - 1];
    const signalAgeMinutes = newestTrade
      ? Math.max(0, (now - new Date(newestTrade.timestamp).getTime()) / (60 * 1000))
      : 999;

    // --- Scoring Engine Calculation ---
    let rawScore = 0;

    // +25 = high-quality trader buys
    if (uniqueHighQuality >= 1) {
      rawScore += this.weights.highQualityBuy;
      breakdown['highQualityBuy'] = this.weights.highQualityBuy;
    }

    // +20 = multiple high-quality traders buy
    if (uniqueHighQuality >= 2) {
      rawScore += this.weights.multiHighQualityBuy;
      breakdown['multiHighQualityBuy'] = this.weights.multiHighQualityBuy;
    }

    // +15 = top-ranked trader buys (score >= 85)
    if (topTraderScore >= 85) {
      rawScore += this.weights.topRankedBuy;
      breakdown['topRankedBuy'] = this.weights.topRankedBuy;
    }

    // +10 = verified trader buys
    if (uniqueVerified >= 1) {
      rawScore += this.weights.verifiedBuy;
      breakdown['verifiedBuy'] = this.weights.verifiedBuy;
    }

    // +10 = several traders independently buy (>= 3 distinct traders)
    if (uniqueBuyers >= 3) {
      rawScore += this.weights.independentBuyers;
      breakdown['independentBuyers'] = this.weights.independentBuyers;
    }

    // +10 = recent purchase (< 15 mins)
    if (signalAgeMinutes <= 15) {
      rawScore += this.weights.recentPurchase;
      breakdown['recentPurchase'] = this.weights.recentPurchase;
    }

    // +10 = strong historical trader performance (avg score >= 75)
    if (averageTraderScore >= 75) {
      rawScore += this.weights.strongHistorical;
      breakdown['strongHistorical'] = this.weights.strongHistorical;
    }

    // +5 = continued holding / net flow positive
    if (netSmartMoneyFlow > 0 && uniqueBuyers > uniqueSellers) {
      rawScore += this.weights.holdingBonus;
      breakdown['holdingBonus'] = this.weights.holdingBonus;
    }

    // +5 = token appears on FOMO trending board
    if (tokenContext?.isTrending) {
      rawScore += this.weights.trendingBonus;
      breakdown['trendingBonus'] = this.weights.trendingBonus;
    }

    // +5 = increasing number of FOMO buyers
    if ((tokenContext?.fomoBuyersCount || 0) >= 20) {
      rawScore += this.weights.fomoBuyersBonus;
      breakdown['fomoBuyersBonus'] = this.weights.fomoBuyersBonus;
    }

    // --- Deductions & Penalties ---

    // -20 = strong selling activity
    if (uniqueSellers >= 2 || totalSellVolume > totalBuyVolume * 0.7) {
      rawScore -= this.weights.strongSellingPenalty;
      breakdown['strongSellingPenalty'] = -this.weights.strongSellingPenalty;
      riskWarnings.push('HEAVY_SMART_MONEY_SELLING');
    }

    // -10 = signal is old (> 12 hours)
    if (signalAgeMinutes > 720) {
      rawScore -= this.weights.staleSignalPenalty;
      breakdown['staleSignalPenalty'] = -this.weights.staleSignalPenalty;
      riskWarnings.push('STALE_SIGNAL');
    }

    // -10 = very low liquidity
    if (tokenContext?.liquidityUsd !== undefined && tokenContext.liquidityUsd < 25000) {
      rawScore -= this.weights.lowLiquidityPenalty;
      breakdown['lowLiquidityPenalty'] = -this.weights.lowLiquidityPenalty;
      riskWarnings.push('LOW_LIQUIDITY');
    }

    // -10 = only one low-quality trader buying
    if (uniqueBuyers === 1 && uniqueHighQuality === 0) {
      rawScore -= this.weights.singleLowQualityPenalty;
      breakdown['singleLowQualityPenalty'] = -this.weights.singleLowQualityPenalty;
      riskWarnings.push('SINGLE_TRADER_SIGNAL');
    }

    // Apply global recency decay factor to total score
    const recencyFactor = this.getRecencyDecay(signalAgeMinutes);
    const finalScore = Math.max(0, Math.min(100, Math.round(rawScore * recencyFactor)));

    // Conviction Levels
    let conviction: ConvictionLevel = 'Weak';
    if (finalScore >= 85) conviction = 'Exceptional';
    else if (finalScore >= 70) conviction = 'Very Strong';
    else if (finalScore >= 50) conviction = 'Strong';
    else if (finalScore >= 30) conviction = 'Moderate';

    // Signal States
    let signalState: SignalState = 'WATCH';
    if (uniqueSellers >= uniqueBuyers && uniqueSellers > 0) {
      signalState = 'EXIT';
    } else if (uniqueSellers > 0 && uniqueSellers >= 2) {
      signalState = 'EXIT_WARNING';
    } else if (uniqueHighQuality >= 3 && accumulationWindowMins <= 45 && finalScore >= 70) {
      signalState = 'HIGH_CONVICTION';
    } else if (uniqueHighQuality >= 2 && finalScore >= 50) {
      signalState = 'STRONG_SIGNAL';
    } else if (uniqueHighQuality >= 1 && signalAgeMinutes <= 20) {
      signalState = 'EARLY_SIGNAL';
    } else {
      signalState = 'WATCH';
    }

    return {
      smartMoneyScore: finalScore,
      conviction,
      signalState,
      uniqueBuyers,
      uniqueHighQualityBuyers: uniqueHighQuality,
      uniqueVerifiedBuyers: uniqueVerified,
      uniqueSellers,
      totalBuyVolume,
      totalSellVolume,
      weightedBuyVolume: Math.round(weightedBuyVolume),
      netSmartMoneyFlow,
      averageTraderScore,
      topTraderHandle,
      topTraderScore,
      firstBuyerHandle: earliestBuy ? earliestBuy.handle : null,
      firstBuyTime,
      latestBuyerHandle: latestBuy ? latestBuy.handle : null,
      latestBuyerTime: latestBuyTime,
      accumulationWindowMins: Math.round(accumulationWindowMins * 10) / 10,
      signalAgeMinutes: Math.round(signalAgeMinutes),
      riskWarnings,
      breakdown,
    };
  }

  private emptySignal(): TokenSignalComputation {
    return {
      smartMoneyScore: 0,
      conviction: 'Weak',
      signalState: 'WATCH',
      uniqueBuyers: 0,
      uniqueHighQualityBuyers: 0,
      uniqueVerifiedBuyers: 0,
      uniqueSellers: 0,
      totalBuyVolume: 0,
      totalSellVolume: 0,
      weightedBuyVolume: 0,
      netSmartMoneyFlow: 0,
      averageTraderScore: 0,
      topTraderHandle: null,
      topTraderScore: 0,
      firstBuyerHandle: null,
      firstBuyTime: null,
      latestBuyerHandle: null,
      latestBuyerTime: null,
      accumulationWindowMins: 0,
      signalAgeMinutes: 999,
      riskWarnings: ['INSUFFICIENT_HISTORY'],
      breakdown: {},
    };
  }
}

export const smartMoneyEngine = new SmartMoneyEngine();
