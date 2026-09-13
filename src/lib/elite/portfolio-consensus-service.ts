// Portfolio Consensus & Concentration Service
// Computes multi-trader holding matrix, Herfindahl concentration penalty, and pairwise Jaccard overlap

import {
  TokenConsensusMatrixEntry,
  TokenConsensusSummary,
  TraderHoldingState,
  ConsensusLifecycleState,
} from '../types/elite';

export interface WalletHolding {
  traderHandle: string;
  tokenAddress: string;
  network: string;
  symbol: string;
  valueUsd: number;
  entryPriceUsd: number;
  currentPriceUsd: number;
  state: TraderHoldingState;
  firstBuyTimestamp: number;
  latestBuyTimestamp: number;
}

export class PortfolioConsensusService {
  constructor() {}

  /**
   * Computes normalized Herfindahl-Hirschman Index (HHI) for capital concentration
   * Returns a value between 0.0 (perfectly distributed) and 1.0 (100% held by 1 whale)
   */
  public calculateHerfindahlIndex(positions: Array<{ valueUsd: number }>): number {
    const totalValue = positions.reduce((sum, p) => sum + Math.max(0, p.valueUsd), 0);
    if (totalValue <= 0 || positions.length === 0) return 0;
    if (positions.length === 1) return 1.0;

    let sumSquares = 0;
    for (const p of positions) {
      const share = Math.max(0, p.valueUsd) / totalValue;
      sumSquares += share * share;
    }

    return Math.min(1.0, Math.max(0, Math.round(sumSquares * 1000) / 1000));
  }

  /**
   * Calculates Concentration Penalty based on Herfindahl index (0 to 25 points penalty)
   * High penalty if a single whale controls majority of smart money position
   */
  public calculateConcentrationPenalty(hhi: number, eliteHoldersCount: number): number {
    if (eliteHoldersCount <= 1) return 20; // 1 single holder is highly concentrated/isolated
    if (hhi > 0.70) return 25; // extreme concentration: 1 whale owns > 80%
    if (hhi > 0.50) return 15; // heavy concentration
    if (hhi > 0.35) return 8;  // moderate concentration
    return 0; // well distributed among multiple independent elite wallets
  }

  /**
   * Calculates Pairwise Jaccard Overlap between two wallets' holdings:
   * J(A, B) = |Tokens_A ∩ Tokens_B| / |Tokens_A ∪ Tokens_B|
   */
  public calculateJaccardOverlap(tokensA: string[], tokensB: string[]): {
    jaccardIndex: number;
    sharedTokenCount: number;
    sharedTokens: string[];
  } {
    const setA = new Set(tokensA.map((t) => t.toLowerCase()));
    const setB = new Set(tokensB.map((t) => t.toLowerCase()));

    const shared: string[] = [];
    for (const token of setA) {
      if (setB.has(token)) {
        shared.push(token);
      }
    }

    const unionCount = new Set([...setA, ...setB]).size;
    const jaccardIndex = unionCount > 0 ? shared.length / unionCount : 0;

    return {
      jaccardIndex: Math.round(jaccardIndex * 1000) / 1000,
      sharedTokenCount: shared.length,
      sharedTokens: shared,
    };
  }

  /**
   * Calculates EliteConsensusScore (0 - 100)
   * Combines count of elite holders, quality weighting, and concentration penalty
   */
  public calculateConsensusScore(
    eliteHolders: Array<{ handle: string; eliteScore: number; valueUsd: number; state: TraderHoldingState }>,
    hhi: number
  ): {
    score: number;
    concentrationPenalty: number;
    breadthScore: number;
  } {
    const activeHolders = eliteHolders.filter(
      (h) => h.state === 'HOLDING' || h.state === 'ACCUMULATING' || h.state === 'NEW_ENTRY'
    );

    if (activeHolders.length === 0) {
      return { score: 0, concentrationPenalty: 0, breadthScore: 0 };
    }

    // Breadth score: 1 holder = 30, 2 = 60, 3 = 80, 4+ = 100
    const breadthScore = Math.min(100, activeHolders.length * 25);

    // Quality weighting: average elite score of holders
    const avgQuality =
      activeHolders.reduce((sum, h) => sum + h.eliteScore, 0) / activeHolders.length;

    // Base consensus: 50% breadth + 50% quality
    const baseScore = breadthScore * 0.50 + avgQuality * 0.50;

    // Concentration penalty
    const penalty = this.calculateConcentrationPenalty(hhi, activeHolders.length);

    const finalScore = Math.min(100, Math.max(0, Math.round((baseScore - penalty) * 10) / 10));

    return {
      score: finalScore,
      concentrationPenalty: penalty,
      breadthScore,
    };
  }

  /**
   * Summarizes consensus for a single token across all known elite holdings
   */
  public summarizeTokenConsensus(
    tokenAddress: string,
    network: string,
    symbol: string,
    name: string,
    currentPriceUsd: number,
    holdings: WalletHolding[],
    traderScores: Map<string, number> // handle -> eliteScore
  ): TokenConsensusSummary {
    const tokenHoldings = holdings.filter(
      (h) => h.tokenAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    const eliteHoldersCount = tokenHoldings.filter(
      (h) => h.state === 'HOLDING' || h.state === 'ACCUMULATING' || h.state === 'NEW_ENTRY'
    ).length;

    const freshAccumulatorsCount = tokenHoldings.filter(
      (h) => h.state === 'NEW_ENTRY' || h.state === 'ACCUMULATING'
    ).length;

    const reducersCount = tokenHoldings.filter(
      (h) => h.state === 'REDUCING' || h.state === 'EXITED'
    ).length;

    const totalEliteCapitalUsd = tokenHoldings.reduce((sum, h) => sum + h.valueUsd, 0);

    const hhi = this.calculateHerfindahlIndex(tokenHoldings);
    const penalty = this.calculateConcentrationPenalty(hhi, eliteHoldersCount);

    const scoredHolders = tokenHoldings.map((h) => ({
      handle: h.traderHandle,
      eliteScore: traderScores.get(h.traderHandle) ?? 70,
      valueUsd: h.valueUsd,
      state: h.state,
    }));

    const consensusMetrics = this.calculateConsensusScore(scoredHolders, hhi);

    // Initial elite entry price calculation
    const earliestHolding = [...tokenHoldings].sort(
      (a, b) => a.firstBuyTimestamp - b.firstBuyTimestamp
    )[0];
    const initialPrice = earliestHolding ? earliestHolding.entryPriceUsd : currentPriceUsd;

    // Price extension
    const priceExtensionPct =
      initialPrice > 0
        ? Math.round(((currentPriceUsd - initialPrice) / initialPrice) * 1000) / 10
        : 0;

    // Timing multiplier
    let timingMultiplier = 1.0;
    if (priceExtensionPct > 50) timingMultiplier = 0.20;
    else if (priceExtensionPct > 35) timingMultiplier = 0.55;
    else if (priceExtensionPct > 15) timingMultiplier = 0.85;

    const isTooLate = priceExtensionPct > 40;

    // Determine initial lifecycle
    let lifecycleState: ConsensusLifecycleState = 'EARLY_CONSENSUS';
    if (reducersCount >= 2 && reducersCount >= eliteHoldersCount) {
      lifecycleState = 'DISTRIBUTION';
    } else if (freshAccumulatorsCount >= 2 && priceExtensionPct <= 20) {
      lifecycleState = 'FRESH_ACCUMULATION';
    } else if (freshAccumulatorsCount >= 3) {
      lifecycleState = 'ACCELERATING';
    } else if (eliteHoldersCount >= 4 && priceExtensionPct > 40) {
      lifecycleState = 'MATURE_CONSENSUS';
    }

    return {
      tokenAddress,
      network,
      symbol,
      name,
      currentPriceUsd,
      lifecycleState,
      eliteHoldersCount,
      freshAccumulatorsCount,
      reducersCount,
      totalEliteCapitalUsd,
      herfindahlIndex: hhi,
      concentrationPenalty: penalty,
      eliteConsensusScore: consensusMetrics.score,
      freshAccumulationScore: Math.min(100, freshAccumulatorsCount * 35),
      distributionScore: Math.min(100, reducersCount * 40),
      leadLagConfirmationScore: 50,
      thesisConsensusScore: 50,
      masterEliteAlphaScore: Math.round(consensusMetrics.score * timingMultiplier),
      initialEliteEntryPriceUsd: initialPrice,
      priceExtensionPct,
      timingMultiplier,
      isTooLate,
      firstLeaderHandle: earliestHolding?.traderHandle,
      confirmingFollowers: tokenHoldings
        .filter((h) => h.traderHandle !== earliestHolding?.traderHandle)
        .map((h) => h.traderHandle),
      consensusGrowthRate24h: freshAccumulatorsCount > 0 ? 100 : 0,
    };
  }
}

export const portfolioConsensusService = new PortfolioConsensusService();
