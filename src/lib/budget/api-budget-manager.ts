// Adaptive API Budget Manager
// Enforces credit economics, priority enrichment queues, and ROI-based API querying

export type EnrichmentPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'SKIP';

export interface EnrichmentDecision {
  endpoint: string;
  targetId: string;
  costCredits: number;
  expectedValue: number; // 0 - 100
  priority: EnrichmentPriority;
  allowed: boolean;
  reason: string;
}

export interface BudgetConfig {
  monthlyLimitCredits: number;
  dailySafeTargetCredits: number;
  minTraderScoreForFullProfile: number; // e.g. 70
  minBuyersForHoldersLookup: number;    // e.g. 2
  minSmartScoreForThesesLookup: number; // e.g. 65
}

export const DEFAULT_BUDGET_CONFIG: BudgetConfig = {
  monthlyLimitCredits: 250000, // Safe default for Free plan
  dailySafeTargetCredits: 8333,
  minTraderScoreForFullProfile: 65,
  minBuyersForHoldersLookup: 2,
  minSmartScoreForThesesLookup: 65,
};

export class ApiBudgetManager {
  private config: BudgetConfig;
  private creditsUsedSession: number = 0;
  private callsTracked: Array<{
    endpoint: string;
    cost: number;
    timestamp: number;
    expectedValue: number;
  }> = [];

  constructor(config: Partial<BudgetConfig> = {}) {
    this.config = { ...DEFAULT_BUDGET_CONFIG, ...config };
  }

  public setConfig(config: Partial<BudgetConfig>) {
    this.config = { ...this.config, ...config };
  }

  public getConfig(): BudgetConfig {
    return { ...this.config };
  }

  /**
   * Evaluates whether an expensive API call should be executed based on trader/token context
   */
  public evaluateTraderEnrichment(
    handle: string,
    preliminaryScore: number,
    isVerified: boolean
  ): EnrichmentDecision {
    const cost = 2500; // /v2/users/{handle} costs 2500 credits
    let expectedValue = preliminaryScore;
    if (isVerified) expectedValue += 10;

    if (preliminaryScore < this.config.minTraderScoreForFullProfile && !isVerified) {
      return {
        endpoint: `/v2/users/${handle}`,
        targetId: handle,
        costCredits: cost,
        expectedValue,
        priority: 'SKIP',
        allowed: false,
        reason: `Trader score (${preliminaryScore}) is below full enrichment threshold (${this.config.minTraderScoreForFullProfile}). Credits preserved.`,
      };
    }

    const priority: EnrichmentPriority = preliminaryScore >= 80 ? 'CRITICAL' : 'HIGH';
    return {
      endpoint: `/v2/users/${handle}`,
      targetId: handle,
      costCredits: cost,
      expectedValue,
      priority,
      allowed: true,
      reason: `High expected alpha value (${expectedValue}) qualifies for full wallet & thesis resolution.`,
    };
  }

  /**
   * Evaluates whether token holders (/token/{address}/holders) should be fetched
   */
  public evaluateHoldersEnrichment(
    tokenAddress: string,
    uniqueEliteBuyersCount: number,
    smartMoneyScore: number
  ): EnrichmentDecision {
    const cost = 250; // 250 credits

    if (uniqueEliteBuyersCount < this.config.minBuyersForHoldersLookup && smartMoneyScore < 60) {
      return {
        endpoint: `/token/${tokenAddress}/holders`,
        targetId: tokenAddress,
        costCredits: cost,
        expectedValue: smartMoneyScore,
        priority: 'SKIP',
        allowed: false,
        reason: `Only ${uniqueEliteBuyersCount} elite buyer(s) observed. Skipping holder scan until convergence occurs.`,
      };
    }

    const priority: EnrichmentPriority = uniqueEliteBuyersCount >= 3 ? 'CRITICAL' : 'MEDIUM';
    return {
      endpoint: `/token/${tokenAddress}/holders`,
      targetId: tokenAddress,
      costCredits: cost,
      expectedValue: smartMoneyScore,
      priority,
      allowed: true,
      reason: `Convergence threshold met (${uniqueEliteBuyersCount} elite buyers). Holder conviction scan approved.`,
    };
  }

  /**
   * Evaluates whether thesis lookup (/v2/thesis or /v2/users/{handle}/spotlight) is justified
   */
  public evaluateThesisEnrichment(
    tokenAddress: string,
    smartMoneyScore: number
  ): EnrichmentDecision {
    const cost = 1250; // 1250 credits

    if (smartMoneyScore < this.config.minSmartScoreForThesesLookup) {
      return {
        endpoint: `/v2/thesis/token/${tokenAddress}`,
        targetId: tokenAddress,
        costCredits: cost,
        expectedValue: smartMoneyScore,
        priority: 'SKIP',
        allowed: false,
        reason: `Smart money score (${smartMoneyScore}) below thesis threshold (${this.config.minSmartScoreForThesesLookup}).`,
      };
    }

    return {
      endpoint: `/v2/thesis/token/${tokenAddress}`,
      targetId: tokenAddress,
      costCredits: cost,
      expectedValue: smartMoneyScore,
      priority: smartMoneyScore >= 80 ? 'CRITICAL' : 'HIGH',
      allowed: true,
      reason: `High conviction signal (${smartMoneyScore}). Narrative thesis analysis approved.`,
    };
  }

  public recordEnrichment(endpoint: string, cost: number, expectedValue: number) {
    this.creditsUsedSession += cost;
    this.callsTracked.push({
      endpoint,
      cost,
      timestamp: Date.now(),
      expectedValue,
    });
    if (this.callsTracked.length > 200) this.callsTracked.shift();
  }

  public getSessionStats() {
    return {
      creditsUsedSession: this.creditsUsedSession,
      totalEnrichments: this.callsTracked.length,
      averageExpectedValue:
        this.callsTracked.length > 0
          ? Math.round(
              this.callsTracked.reduce((acc, c) => acc + c.expectedValue, 0) /
                this.callsTracked.length
            )
          : 0,
    };
  }
}

export const apiBudgetManager = new ApiBudgetManager();
