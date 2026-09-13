// Consensus Breakout, Decay & Distribution Service
// Detects rapid accumulation acceleration (Breakouts), momentum decay over time,
// and smart-money distribution (suppressing buy signals when elite traders exit)

export interface DistributionAnalysisInput {
  tokenAddress: string;
  symbol: string;
  eliteSellVolumeUsd: number;
  eliteBuyVolumeUsd: number;
  eliteSellersCount: number;
  eliteBuyersCount: number;
  retailVolumeUsd?: number;
  hoursSinceLastEliteBuy: number;
  hoursSinceLastEliteSell: number;
}

export class DistributionService {
  constructor() {}

  /**
   * Calculates Consensus Growth Rate & Breakout status
   * Breakout occurs when elite buyers surge (e.g. from 1 to 3+ within 1 hour)
   */
  public detectConsensusBreakout(
    buyerCountPriorWindow: number,
    buyerCountCurrentWindow: number,
    timeWindowMinutes: number
  ): {
    isBreakout: boolean;
    growthRatePct: number;
    velocityScore: number;
  } {
    const prior = Math.max(1, buyerCountPriorWindow);
    const growthRatePct = ((buyerCountCurrentWindow - prior) / prior) * 100;

    const isBreakout =
      buyerCountCurrentWindow >= 3 &&
      buyerCountCurrentWindow >= prior * 2 &&
      timeWindowMinutes <= 120;

    const velocityScore = Math.min(100, Math.max(0, buyerCountCurrentWindow * 25));

    return {
      isBreakout,
      growthRatePct: Math.round(growthRatePct),
      velocityScore,
    };
  }

  /**
   * Calculates half-life decay multiplier based on hours elapsed since last smart buy
   * Exponential decay: e^(-0.05 * hours)
   */
  public calculateDecayMultiplier(hoursSinceLastBuy: number): number {
    if (hoursSinceLastBuy <= 1) return 1.0;
    if (hoursSinceLastBuy > 72) return 0.10;
    const decay = Math.exp(-0.04 * hoursSinceLastBuy);
    return Math.min(1.0, Math.max(0.10, Math.round(decay * 100) / 100));
  }

  /**
   * Computes DistributionScore (0 - 100) and determines if BUY signals must be suppressed
   */
  public evaluateDistribution(input: DistributionAnalysisInput): {
    distributionScore: number;
    shouldSuppressBuy: boolean;
    exitWarning: boolean;
    explanation: string;
  } {
    const totalEliteVol = input.eliteBuyVolumeUsd + input.eliteSellVolumeUsd;
    const netEliteFlowUsd = input.eliteBuyVolumeUsd - input.eliteSellVolumeUsd;

    let score = 0;

    // 1. Sell volume ratio
    if (totalEliteVol > 0) {
      const sellRatio = input.eliteSellVolumeUsd / totalEliteVol;
      score += sellRatio * 50; // up to 50 pts
    }

    // 2. Elite sellers count
    score += Math.min(30, input.eliteSellersCount * 15);

    // 3. Recency of selling
    if (input.hoursSinceLastEliteSell <= 2 && input.eliteSellersCount > 0) {
      score += 20;
    }

    // 4. Stale buying penalty (no elite buys in > 24h while selling is fresh)
    if (input.hoursSinceLastEliteBuy > 24 && input.eliteSellersCount > 0) {
      score += 15;
    }

    const distributionScore = Math.min(100, Math.max(0, Math.round(score)));

    // Buy signals are strictly suppressed if distributionScore >= 60 or net flow is severely negative
    const shouldSuppressBuy = distributionScore >= 60 || (netEliteFlowUsd < -20000 && input.eliteSellersCount >= 2);
    const exitWarning = distributionScore >= 50;

    let explanation = 'No significant distribution detected.';
    if (shouldSuppressBuy) {
      explanation = `CRITICAL: Heavy elite distribution detected (${input.eliteSellersCount} elite sellers, $${Math.round(input.eliteSellVolumeUsd).toLocaleString()} sold). All buy signals suppressed.`;
    } else if (exitWarning) {
      explanation = `WARNING: Smart money is actively trimming positions (${input.eliteSellersCount} sellers). Exercise caution.`;
    }

    return {
      distributionScore,
      shouldSuppressBuy,
      exitWarning,
      explanation,
    };
  }
}

export const distributionService = new DistributionService();
