// Domain Interfaces & Unified Intelligence Contracts
// Conforms to SOLID architecture principles

import { NormalizedTrade, TimeWindow } from '../fomo/types';

// --- SOLID PROVIDER & REPOSITORY INTERFACES ---

export interface IFomoDataProvider {
  getLeaderboard(window: TimeWindow, limit?: number): Promise<any>;
  getTraderProfile(handle: string): Promise<any>;
  getTraderTrades(handle: string, options?: { limit?: number; offset?: number }): Promise<any>;
  getTokenHolders(address: string, options?: { limit?: number; network?: string }): Promise<any>;
  getTokenStats(address: string, network?: string): Promise<any>;
  getTheses(options?: { tokenAddress?: string; handle?: string; limit?: number }): Promise<any>;
  getNotifications(options?: { limit?: number }): Promise<any>;
}

export interface IRealtimeTradeProvider {
  subscribeFeed(callback: (event: any) => void): void;
  subscribeOnChain(callback: (event: any) => void): void;
  unsubscribeAll(): void;
  getStatus(): { feed: string; onChain: string; lastPingMs: number };
}

export interface IScoringStrategy<TInput, TOutput> {
  calculate(input: TInput): TOutput;
  getVersion(): string;
}

export interface IRiskStrategy<TInput, TOutput> {
  evaluateRisk(input: TInput): TOutput;
}

// --- TRADER DNA & REGIME TYPES ---

export type TraderRegime =
  | 'HOT'
  | 'COLD'
  | 'RECOVERING'
  | 'CONSISTENT'
  | 'HIGH_VOLATILITY'
  | 'SCALPER'
  | 'SWING'
  | 'LONG_HOLD'
  | 'NEW_AND_PROMISING'
  | 'INSUFFICIENT_DATA';

export type AccountMaturity =
  | 'Veteran'
  | 'Rising Talent'
  | 'Unproven'
  | 'Suspicious';

export interface TraderDNA {
  handle: string;
  traderScore: number;
  confidenceScore: number;
  copySignalScore: number;
  regime: TraderRegime;
  maturity: AccountMaturity;
  accountAgeDays: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  pnlAll: number;
  volumeUsd: number;
  tradeCount: number;
  winRate: number;
  profitFactor: number;
  averageWinUsd: number;
  averageLossUsd: number;
  expectancyUsd: number;
  maxDrawdownPct: number;
  averageHoldTimeSeconds: number;
  holdingsCount: number;
  preferredChains: string[];
  preferredTokenTypes: string[];
  typicalPositionSizeUsd: number;
  typicalEntryTiming: string; // 'Early' | 'Breakout' | 'Momentum'
  typicalExitTiming: string;  // 'Quick Scale' | 'Runner Hold'
  verified: boolean;
  wallets: { solana?: string | null; evm?: string | null };
}

export interface CopySignalPerformance {
  traderHandle: string;
  copyScore: number; // 0 - 100
  sampleSize: number;
  returnsByHorizon: {
    t1m: number;
    t5m: number;
    t15m: number;
    t30m: number;
    t1h: number;
    t4h: number;
    t24h: number;
  };
  winRateAtT15m: number;
  profitFactorAtT15m: number;
  slippageImpactPct: number;
  netExpectancyUsd: number;
}

// --- THESIS & NARRATIVE TYPES ---

export type ThesisNovelty = 'new' | 'existing' | 'recycled' | 'generic';

export interface ThesisItem {
  id: string;
  tokenAddress: string;
  network: string;
  symbol: string;
  traderHandle: string;
  content: string;
  catalyst?: string;
  horizon?: string;
  actionable: boolean;
  novelty: ThesisNovelty;
  qualityScore: number; // 0 - 100
  positionSizeUsd: number;
  traderEquityUsd: number;
  convictionRatio: number; // positionSize / traderEquity
  timestamp: Date;
}

export interface NarrativeCluster {
  id: string;
  name: string;
  theme: string;
  tokenAddresses: string[];
  symbols: string[];
  traderHandles: string[];
  eliteTraderCount: number;
  totalThesesCount: number;
  narrativeScore: number; // 0 - 100
  acceleration: 'LOW' | 'MEDIUM' | 'HIGH';
  firstDetected: Date;
  avgPriceReactionPct: number;
  topTheses: ThesisItem[];
}

// --- SMART-MONEY HOLDER & CONVICTION TYPES ---

export interface SmartMoneyHolder {
  traderHandle: string;
  traderScore: number;
  copySignalScore: number;
  positionSizeTokens: number;
  valueUsd: number;
  holdingDurationHours: number;
  isElite: boolean;
  isQualified: boolean;
  status: 'increasing' | 'holding' | 'reducing' | 'exited';
  entryTimestamp: Date;
  lastUpdated: Date;
}

export interface HolderConvictionMetrics {
  tokenAddress: string;
  network: string;
  eliteHoldersCount: number;
  qualifiedHoldersCount: number;
  totalSmartHoldersCount: number;
  weightedHolderValueUsd: number;
  smartMoneyHolderScore: number; // 0 - 100
  holderConvictionScore: number; // 0 - 100
  accumulationScore: number;     // 0 - 100
  distributionScore: number;     // 0 - 100
  isAccumulating: boolean;
  isDistributing: boolean;
  holdersIncreasing: number;
  holdersReducing: number;
  holdersExited: number;
}

// --- LIFECYCLE, EARLY ALPHA & POSITION BUILDING ---

export type TokenLifecyclePhase =
  | 'DISCOVERY'
  | 'FIRST_SMART_MONEY'
  | 'ACCUMULATION'
  | 'CONVERGENCE'
  | 'NARRATIVE_FORMATION'
  | 'CROWD_ATTENTION'
  | 'DISTRIBUTION'
  | 'EXIT';

export interface DualStreamMetrics {
  tokenAddress: string;
  network: string;
  onChainTimestamp?: Date | null;
  feedTimestamp?: Date | null;
  latencyDifferenceMs?: number | null;
  observedLatencySec?: number | null;
  crowdDeltaSec?: number | null;
  isEarlyAlpha: boolean;
  confidence: number;
}

export interface PositionBuildingEvent {
  tokenAddress: string;
  network: string;
  symbol: string;
  traderHandle: string;
  initialBuyUsd: number;
  initialBuyTime: Date;
  followUpBuysUsd: number[];
  followUpTimes: Date[];
  totalAccumulatedUsd: number;
  thesisPublished: boolean;
  positionBuildingScore: number; // 0 - 100
  stage: 'STARTER_POSITION' | 'BUILDING' | 'FULL_CONVICTION';
}

// --- NOTIFICATION & CHAIN INTELLIGENCE ---

export type NotificationType =
  | 'LARGE_BUY'
  | 'LARGE_SELL'
  | 'PRICE_SINCE_LISTED'
  | 'TRADE_OPEN'
  | 'TRADE_CLOSE'
  | 'PROFIT_MILESTONE'
  | 'FOLLOW';

export interface NotificationImpactMetric {
  type: NotificationType;
  samples: number;
  medianReturn5m: number;
  medianReturn15m: number;
  medianReturn1h: number;
  winRatePct: number;
  impactScore: number; // 0 - 100
}

export interface ChainAlphaStats {
  chainId: string;
  chainName: string;
  activityScore: number; // 0 - 100
  volume24hUsd: number;
  activeTradersCount: number;
  eliteTradersActive: number;
  convergenceSignalsCount: number;
  isDominant: boolean;
}

export interface WinnerFinderProfile {
  traderHandle: string;
  discoveryScore: number; // 0 - 100
  historical10xCount: number;
  historical100xCount: number;
  avgReturnOfWinnersPct: number;
  currentActiveBuys: Array<{
    tokenAddress: string;
    symbol: string;
    network: string;
    valueUsd: number;
    timestamp: Date;
    hasThesis: boolean;
  }>;
}

// --- UPGRADED ALPHA SCORE V3 & EXPLAINABILITY ---

export type AlphaSignalCategory =
  | 'EARLY_ALPHA'
  | 'STRONG_BUY'
  | 'BUY'
  | 'WATCH'
  | 'LATE'
  | 'DISTRIBUTION'
  | 'EXIT_WARNING'
  | 'AVOID'
  | 'NO_SIGNAL';

export interface AlphaV3SignalExplanation {
  what: string;
  who: string[];
  why: string;
  howEarly: string;
  howMany: number;
  howMuchUsd: number;
  risks: string[];
  history: {
    similarSignalsCount: number;
    positiveCount: number;
    medianReturnPct: number;
    expectancyPct: number;
  };
  whyNow: string;
  tooLateAnalysis: {
    isLate: boolean;
    priceMoveSinceSignalPct: number;
    crowdDeltaSec: number;
    verdict: string;
  };
  whoIsExiting: {
    exitingTraders: string[];
    soldUsd: number;
    exitSeverity: 'NONE' | 'PARTIAL' | 'MAJOR' | 'FULL';
  };
}

export interface AlphaScoreV3Result {
  tokenAddress: string;
  network: string;
  symbol: string;
  name: string;
  priceUsd: number;
  alphaScore: number; // 0 - 100
  dataConfidencePct: number; // 0 - 100
  riskScore: number; // 0 - 100
  signalCategory: AlphaSignalCategory;
  lifecyclePhase: TokenLifecyclePhase;
  explanation: AlphaV3SignalExplanation;
  components: {
    traderQualityContribution: number;
    copySignalContribution: number;
    convergenceContribution: number;
    smartFlowContribution: number;
    holderConvictionContribution: number;
    narrativeContribution: number;
    earlyEntryContribution: number;
    tokenQualityContribution: number;
    notificationContribution: number;
    riskPenalty: number;
  };
  signalFreshness: {
    createdAt: Date;
    lastUpdated: Date;
    ageMinutes: number;
    decayFactor: number;
    onChainTimestamp?: Date | null;
    feedTimestamp?: Date | null;
  };
  strategyVersion: string;
  scoringVersion: string;
}
