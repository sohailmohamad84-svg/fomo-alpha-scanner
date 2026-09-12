export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

export interface RiskIndicator {
  code: string;
  level: RiskLevel;
  title: string;
  description: string;
}

export interface RiskAnalysisResult {
  overallRisk: RiskLevel;
  riskScore: number; // 0 (safest) - 100 (most risky)
  indicators: RiskIndicator[];
  canExecuteLive: boolean;
  warnings: string[];
}

export function evaluateTokenRisk(params: {
  liquidityUsd?: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  isDevSelling?: boolean;
  top10HoldersPercent?: number;
  signalAgeMinutes: number;
  hasVerifiedTrader: boolean;
  totalBuyVolume: number;
  totalSellVolume: number;
}): RiskAnalysisResult {
  const indicators: RiskIndicator[] = [];
  let riskScore = 20; // baseline

  // 1. Dev Selling / Rug Risk
  if (params.isDevSelling) {
    indicators.push({
      code: 'DEV_SELLING',
      level: 'EXTREME',
      title: 'Deployer / Insider Selling',
      description: 'The token contract creator or insider has sold tokens recently.',
    });
    riskScore += 40;
  }

  // 2. Low Liquidity
  if (params.liquidityUsd !== undefined && params.liquidityUsd < 50000) {
    const level: RiskLevel = params.liquidityUsd < 15000 ? 'HIGH' : 'MEDIUM';
    indicators.push({
      code: 'LOW_LIQUIDITY',
      level,
      title: 'Low Liquidity Warning',
      description: `Pool liquidity is only $${params.liquidityUsd.toLocaleString()}, causing high slippage risks.`,
    });
    riskScore += level === 'HIGH' ? 25 : 15;
  }

  // 3. Single Trader Signal
  if (params.uniqueBuyers === 1) {
    indicators.push({
      code: 'SINGLE_TRADER_SIGNAL',
      level: 'MEDIUM',
      title: 'Single Trader Signal',
      description: 'Only 1 smart trader has entered. Convergence is unconfirmed.',
    });
    riskScore += 15;
  }

  // 4. Stale Signal
  if (params.signalAgeMinutes > 360) {
    // > 6 hours
    indicators.push({
      code: 'STALE_SIGNAL',
      level: 'MEDIUM',
      title: 'Stale Signal',
      description: `Last smart money action was ${Math.round(params.signalAgeMinutes / 60)} hours ago. Momentum may have dissipated.`,
    });
    riskScore += 15;
  }

  // 5. Heavy Smart-Money Selling
  if (params.uniqueSellers > 0 && params.totalSellVolume > params.totalBuyVolume * 0.5) {
    indicators.push({
      code: 'HEAVY_SMART_MONEY_SELLING',
      level: 'HIGH',
      title: 'Heavy Smart Money Selling',
      description: 'Tracked smart money traders are actively offloading or closing positions.',
    });
    riskScore += 25;
  }

  // 6. Conflicting Signal
  if (params.uniqueBuyers >= 2 && params.uniqueSellers >= 2) {
    indicators.push({
      code: 'CONFLICTING_SIGNAL',
      level: 'MEDIUM',
      title: 'Conflicting Signals',
      description: 'Multiple smart money traders are on opposite sides of the book (some buying, some selling).',
    });
    riskScore += 15;
  }

  // 7. Supply Concentration
  if (params.top10HoldersPercent && params.top10HoldersPercent > 50) {
    indicators.push({
      code: 'SUPPLY_CONCENTRATION',
      level: 'HIGH',
      title: 'High Supply Concentration',
      description: `Top 10 holders control ${params.top10HoldersPercent}% of total token supply.`,
    });
    riskScore += 20;
  }

  // Deduct risk if verified smart money backing
  if (params.hasVerifiedTrader && params.uniqueBuyers >= 2) {
    riskScore = Math.max(10, riskScore - 15);
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let overallRisk: RiskLevel = 'LOW';
  if (riskScore >= 75) overallRisk = 'EXTREME';
  else if (riskScore >= 55) overallRisk = 'HIGH';
  else if (riskScore >= 35) overallRisk = 'MEDIUM';

  // Live execution guard
  const canExecuteLive = overallRisk !== 'EXTREME' && !params.isDevSelling;

  return {
    overallRisk,
    riskScore,
    indicators,
    canExecuteLive,
    warnings: indicators.map((i) => `${i.title}: ${i.description}`),
  };
}
