// Master Elite Alpha Engine
// Synthesizes Fresh Accumulation, Elite Consensus, Lead-Lag confirmation, Thesis alignment,
// and applies Price Extension ("Too Late") Decay and Distribution suppression

export interface EliteAlphaInput {
  tokenAddress: string;
  symbol: string;
  currentPriceUsd: number;
  initialEliteEntryPriceUsd: number;
  freshAccumulationScore: number;  // 0 - 100
  eliteConsensusScore: number;     // 0 - 100
  leadLagConfirmationScore: number;// 0 - 100
  thesisConsensusScore: number;    // 0 - 100
  distributionScore: number;       // 0 - 100
  tokenHealthScore?: number;       // 0 - 100 (liquidity, volume)
  concentrationPenalty?: number;   // 0 - 25
}

export interface EliteAlphaResult {
  score: number;                   // 0 - 100
  baseScore: number;               // Before timing decay
  priceExtensionPct: number;
  timingMultiplier: number;        // 0.20 - 1.0
  isTooLate: boolean;
  action: 'STRONG_BUY' | 'BUY' | 'WATCH' | 'TRIM' | 'EXIT' | 'AVOID';
  confidence: number;
  whyNow: string;
  tooLateReason?: string;
  riskReasons: string[];
  suggestedStopLossPct: number;
  suggestedTakeProfitPct: number;
  breakdown: {
    accumulation: number;
    consensus: number;
    leadLag: number;
    thesis: number;
    health: number;
    concentrationPenalty: number;
    distributionPenalty: number;
  };
}

export class EliteAlphaEngine {
  constructor() {}

  /**
   * Computes price extension percentage from initial elite entry
   */
  public calculatePriceExtension(currentPrice: number, initialPrice: number): number {
    if (initialPrice <= 0 || currentPrice <= 0) return 0;
    const ext = ((currentPrice - initialPrice) / initialPrice) * 100;
    return Math.round(ext * 10) / 10;
  }

  /**
   * Calculates timing multiplier based on price extension curve
   */
  public calculateTimingMultiplier(extensionPct: number): {
    multiplier: number;
    isTooLate: boolean;
    reason?: string;
  } {
    if (extensionPct <= 10) {
      return { multiplier: 1.0, isTooLate: false };
    }
    if (extensionPct <= 20) {
      return { multiplier: 0.90, isTooLate: false };
    }
    if (extensionPct <= 35) {
      return {
        multiplier: 0.65,
        isTooLate: false,
        reason: `Price extended +${Math.round(extensionPct)}% from first smart entry. Moderate chase risk.`,
      };
    }
    if (extensionPct <= 60) {
      return {
        multiplier: 0.35,
        isTooLate: true,
        reason: `TOO LATE: Price already ran +${Math.round(extensionPct)}%. Risk-reward severely degraded.`,
      };
    }

    return {
      multiplier: 0.15,
      isTooLate: true,
      reason: `EXTREMELY LATE: Price +${Math.round(extensionPct)}% above initial entry. High risk of smart money exit dump.`,
    };
  }

  /**
   * Computes the final Master Elite Alpha Score
   */
  public computeEliteAlpha(input: EliteAlphaInput): EliteAlphaResult {
    const health = input.tokenHealthScore ?? 70;
    const concPenalty = input.concentrationPenalty ?? 0;

    // Component calculation (weighted sum)
    const accumulationComponent = input.freshAccumulationScore * 0.30;
    const consensusComponent = input.eliteConsensusScore * 0.25;
    const leadLagComponent = input.leadLagConfirmationScore * 0.20;
    const thesisComponent = input.thesisConsensusScore * 0.15;
    const healthComponent = health * 0.10;

    let baseScore =
      accumulationComponent +
      consensusComponent +
      leadLagComponent +
      thesisComponent +
      healthComponent -
      concPenalty;

    baseScore = Math.max(0, Math.min(100, baseScore));

    // Calculate extension and timing multiplier
    const priceExtensionPct = this.calculatePriceExtension(
      input.currentPriceUsd,
      input.initialEliteEntryPriceUsd
    );
    const timing = this.calculateTimingMultiplier(priceExtensionPct);

    // Apply timing multiplier
    let finalScore = baseScore * timing.multiplier;

    // Apply distribution penalty (only if distributionScore > 20)
    const distPenalty = input.distributionScore > 20 ? Math.round(input.distributionScore * 0.60) : 0;
    finalScore = Math.max(0, finalScore - distPenalty);
    finalScore = Math.min(100, Math.round(finalScore * 10) / 10);

    // Determine Action
    let action: 'STRONG_BUY' | 'BUY' | 'WATCH' | 'TRIM' | 'EXIT' | 'AVOID' = 'WATCH';
    const riskReasons: string[] = [];

    if (input.distributionScore >= 60) {
      action = 'EXIT';
      riskReasons.push('Heavy smart money distribution detected');
    } else if (input.distributionScore >= 40) {
      action = 'TRIM';
      riskReasons.push('Elite wallets actively taking profits');
    } else if (timing.isTooLate) {
      action = 'AVOID';
      riskReasons.push(timing.reason || 'Price extension exceeds safe threshold');
    } else if (finalScore >= 70 && !timing.isTooLate) {
      action = 'STRONG_BUY';
    } else if (finalScore >= 55 && !timing.isTooLate) {
      action = 'BUY';
    }

    if (concPenalty >= 15) {
      riskReasons.push('Single whale holds majority of smart money allocation');
    }

    // Suggested risk parameters
    const stopLoss = priceExtensionPct > 20 ? 8 : 12;
    const takeProfit = priceExtensionPct > 20 ? 25 : 50;

    const whyNow =
      action === 'STRONG_BUY' || action === 'BUY'
        ? `Fresh elite accumulation (${Math.round(input.freshAccumulationScore)}/100) with confirmation and low extension (+${Math.round(priceExtensionPct)}%).`
        : `Consensus is ${action.toLowerCase()} (Score: ${finalScore}/100).`;

    return {
      score: finalScore,
      baseScore: Math.round(baseScore * 10) / 10,
      priceExtensionPct,
      timingMultiplier: timing.multiplier,
      isTooLate: timing.isTooLate,
      action,
      confidence: Math.round(Math.min(95, 50 + finalScore * 0.45)),
      whyNow,
      tooLateReason: timing.reason,
      riskReasons,
      suggestedStopLossPct: stopLoss,
      suggestedTakeProfitPct: takeProfit,
      breakdown: {
        accumulation: Math.round(accumulationComponent * 10) / 10,
        consensus: Math.round(consensusComponent * 10) / 10,
        leadLag: Math.round(leadLagComponent * 10) / 10,
        thesis: Math.round(thesisComponent * 10) / 10,
        health: Math.round(healthComponent * 10) / 10,
        concentrationPenalty: concPenalty,
        distributionPenalty: distPenalty,
      },
    };
  }
}

export const eliteAlphaEngine = new EliteAlphaEngine();
