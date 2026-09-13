// Elite Consensus Intelligence Upgrade Types
// SOLID-compliant domain models for Elite Core, Consensus, Lead-Lag, and Multi-Strategy Intelligence

export type EliteClassification =
  | 'ELITE_CORE'    // Score >= 80, Conf >= 70, persistent in top tiers
  | 'ELITE'         // Score >= 70, Conf >= 50
  | 'RISING'        // Young account (<30d) with high win rate & PnL
  | 'WATCH'         // Score 50 - 69
  | 'UNPROVEN';     // Low volume, high volatility churn, or insufficient trades

export type TraderHoldingState =
  | 'NOT_HELD'      // Balance is 0 and no recent trades
  | 'NEW_ENTRY'     // 0 prior balance -> new buy within analysis window
  | 'ACCUMULATING'  // Existing balance -> added >= 15% to position
  | 'HOLDING'       // Balance delta within +/- 5%
  | 'REDUCING'      // Balance decreased by 15% - 75%
  | 'EXITED';       // Balance reduced by > 75% or 0

export type ConsensusLifecycleState =
  | 'EARLY_CONSENSUS'      // 1-2 Elite Leaders buying, low public awareness
  | 'FRESH_ACCUMULATION'   // 2-4 Elite Core entering/adding today, low price extension
  | 'ACCELERATING'         // High velocity breakout, Lead-Lag confirmations firing
  | 'MATURE_CONSENSUS'     // High breadth of holders, price extended, holding steady
  | 'CROWDED'              // Retail social hype high, smart money stopped adding
  | 'DISTRIBUTION'         // Elite Core wallets actively trimming / net negative flow
  | 'BROKEN';              // Stop-loss threshold hit or > 70% of smart capital exited

export type StrategyFamily =
  | 'STRATEGY_A_CONSENSUS'     // Breadth of Elite holders
  | 'STRATEGY_B_ACCUMULATION'  // Fresh entries & position additions today
  | 'STRATEGY_C_LEAD_LAG'      // Leader entry confirmed by follow wallets
  | 'STRATEGY_D_DISTRIBUTION'  // Exit warnings & short bias
  | 'STRATEGY_E_THESIS';       // Cross-trader thesis & narrative alignment

export interface EliteTraderScore {
  handle: string;
  displayName: string;
  eliteScore: number;          // 0 - 100
  eliteConfidence: number;     // 0 - 100
  classification: EliteClassification;
  persistenceScore: number;    // 0 - 100 (historical rank stability)
  leadScore: number;           // 0 - 100 (propensity to lead moves)
  followScore: number;         // 0 - 100 (propensity to confirm leaders)
  discoveryScore: number;      // 0 - 100 (early discovery on 10x-100x wins)
  pnl30d: number;
  pnl7d: number;
  pnl24h: number;
  pnlAll: number;
  consistencyScore: number;
  winRate: number;
  accountAgeDays: number;
  tradeCount: number;
  primaryChain: string;
  verified: boolean;
  consecutiveSnapshotsInTop: number;
}

export interface LeaderboardRankRecord {
  epoch: string;               // ISO date or timestamp string
  window: '24h' | '7d' | '30d';
  rank: number;
  pnlUsd: number;
  qualityScore: number;
}

export interface TraderPersistenceMetrics {
  handle: string;
  snapshotsCount: number;
  top10Appearances: number;
  top25Appearances: number;
  top50Appearances: number;
  averageRank: number;
  rankStandardDeviation: number; // Low = high persistence, high = rank churn
  persistenceScore: number;      // 0 - 100
  isOneHitWonder: boolean;
}

export interface LeadLagPair {
  leaderHandle: string;
  followerHandle: string;
  confirmationCount: number;     // How many times follower bought after leader
  avgLeadLagMinutes: number;    // Average time delta between leader & follower
  successRate: number;          // % of times this pair produced profitable outcome
  correlation: number;          // Correlation coefficient (-1 to +1)
}

export interface TokenConsensusMatrixEntry {
  tokenAddress: string;
  network: string;
  symbol: string;
  traderHandle: string;
  state: TraderHoldingState;
  entryPriceUsd: number;
  currentPriceUsd: number;
  positionValueUsd: number;
  allocationPct: number;        // % of this trader's portfolio
  firstBuyTimestamp: number;
  latestBuyTimestamp: number;
  pnlPct: number;
}

export interface TokenConsensusSummary {
  tokenAddress: string;
  network: string;
  symbol: string;
  name: string;
  currentPriceUsd: number;
  lifecycleState: ConsensusLifecycleState;
  
  // Consensus Breadth & Concentration
  eliteHoldersCount: number;     // Total elite holding
  freshAccumulatorsCount: number;// Elite newly entering / adding today
  reducersCount: number;         // Elite reducing / exiting
  totalEliteCapitalUsd: number;
  herfindahlIndex: number;       // 0 - 1 (1 = 1 whale owns 100%, 0 = distributed)
  concentrationPenalty: number;  // 0 - 30 (deducted if HHI > 0.50)
  
  // Velocity & Scores
  eliteConsensusScore: number;   // 0 - 100
  freshAccumulationScore: number;// 0 - 100
  distributionScore: number;     // 0 - 100
  leadLagConfirmationScore: number; // 0 - 100
  thesisConsensusScore: number;  // 0 - 100
  masterEliteAlphaScore: number; // 0 - 100
  
  // Price Timing & Extension
  initialEliteEntryPriceUsd: number;
  priceExtensionPct: number;     // Current price vs initial entry price
  timingMultiplier: number;      // 0.20 to 1.0 (decayed if extended > 35%)
  isTooLate: boolean;
  
  // Lead Sequence
  firstLeaderHandle?: string;
  confirmingFollowers: string[];
  consensusGrowthRate24h: number; // % increase in elite holders over 24h
}

export interface StrategySignalResult {
  strategy: StrategyFamily;
  tokenAddress: string;
  symbol: string;
  action: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'REDUCE' | 'EXIT' | 'AVOID';
  score: number;
  confidence: number;
  rationale: string;
  entryPriceUsd: number;
  suggestedStopLossPct: number;
  suggestedTakeProfitPct: number;
  timestamp: number;
}

export interface EmpiricalBacktestComparison {
  timeHorizon: string;
  strategies: {
    strategyName: string;
    description: string;
    totalTrades: number;
    winRatePct: number;
    profitFactor: number;
    avgGainPct: number;
    maxDrawdownPct: number;
    sharpeRatio: number;
    alphaVsNaivePct: number;     // Outperformance over naive leaderboard copy
  }[];
}
