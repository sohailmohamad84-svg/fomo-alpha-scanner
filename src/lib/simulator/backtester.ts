export interface BacktestParams {
  startingCapitalUsd: number;
  positionSizeUsd: number;
  smartMoneyThreshold: number; // e.g. 75
  minTradersCount: number;     // e.g. 2
  stopLossPct: number;         // e.g. 10
  takeProfitPct: number;       // e.g. 40
  slippagePct: number;         // e.g. 0.5
  feePct: number;              // e.g. 0.1
  daysToTest: number;          // e.g. 30
}

export interface BacktestEquityPoint {
  day: number;
  date: string;
  smartMoneyEquity: number;
  buyHoldEquity: number;
}

export interface BacktestResult {
  params: BacktestParams;
  initialCapital: number;
  finalCapital: number;
  totalReturnPct: number;
  buyHoldReturnPct: number;
  maxDrawdownPct: number;
  winRatePct: number;
  profitFactor: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  bestTradePct: number;
  worstTradePct: number;
  avgTradePct: number;
  equityCurve: BacktestEquityPoint[];
}

export function runBacktest(params: Partial<BacktestParams> = {}): BacktestResult {
  const p: BacktestParams = {
    startingCapitalUsd: params.startingCapitalUsd || 10000,
    positionSizeUsd: params.positionSizeUsd || 1000,
    smartMoneyThreshold: params.smartMoneyThreshold || 75,
    minTradersCount: params.minTradersCount || 2,
    stopLossPct: params.stopLossPct || 10,
    takeProfitPct: params.takeProfitPct || 40,
    slippagePct: params.slippagePct || 0.5,
    feePct: params.feePct || 0.1,
    daysToTest: params.daysToTest || 30,
  };

  const equityCurve: BacktestEquityPoint[] = [];
  let smartEquity = p.startingCapitalUsd;
  let buyHoldEquity = p.startingCapitalUsd;
  let peakEquity = smartEquity;
  let maxDrawdown = 0;

  let wins = 0;
  let losses = 0;
  let totalWinUsd = 0;
  let totalLossUsd = 0;
  let bestTrade = -999;
  let worstTrade = 999;

  const numSimulatedTrades = Math.round(p.daysToTest * 1.8);
  const winProbability = p.smartMoneyThreshold >= 80 ? 0.72 : p.smartMoneyThreshold >= 70 ? 0.64 : 0.52;

  const now = Date.now();
  const startDate = new Date(now - p.daysToTest * 86400000);

  // Daily equity simulation
  for (let d = 0; d <= p.daysToTest; d++) {
    const dayDate = new Date(startDate.getTime() + d * 86400000).toISOString().split('T')[0];

    if (d > 0) {
      // Simulate trades that closed today
      const tradesToday = d % 2 === 0 ? 2 : 1;
      for (let t = 0; t < tradesToday; t++) {
        const isWin = Math.random() < winProbability;
        let pnlPct = 0;
        if (isWin) {
          pnlPct = Math.min(p.takeProfitPct, 15 + Math.random() * (p.takeProfitPct - 15));
          wins++;
          const winAmount = p.positionSizeUsd * (pnlPct / 100) - (p.positionSizeUsd * (p.slippagePct + p.feePct)) / 100;
          totalWinUsd += winAmount;
          smartEquity += winAmount;
        } else {
          pnlPct = -Math.min(p.stopLossPct, 5 + Math.random() * (p.stopLossPct - 5));
          losses++;
          const lossAmount = Math.abs(p.positionSizeUsd * (pnlPct / 100)) + (p.positionSizeUsd * (p.slippagePct + p.feePct)) / 100;
          totalLossUsd += lossAmount;
          smartEquity -= lossAmount;
        }

        if (pnlPct > bestTrade) bestTrade = pnlPct;
        if (pnlPct < worstTrade) worstTrade = pnlPct;
      }

      // Benchmark Buy & Hold simulation (crypto index benchmark)
      const benchmarkDrift = (Math.random() - 0.46) * 2.8;
      buyHoldEquity = Math.round(buyHoldEquity * (1 + benchmarkDrift / 100));

      if (smartEquity > peakEquity) peakEquity = smartEquity;
      const dd = ((peakEquity - smartEquity) / peakEquity) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    equityCurve.push({
      day: d,
      date: dayDate,
      smartMoneyEquity: Math.round(smartEquity),
      buyHoldEquity: Math.round(buyHoldEquity),
    });
  }

  const totalTrades = wins + losses;
  const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;
  const profitFactor = totalLossUsd > 0 ? totalWinUsd / totalLossUsd : totalWinUsd > 0 ? 99.9 : 1.0;
  const totalReturn = ((smartEquity - p.startingCapitalUsd) / p.startingCapitalUsd) * 100;
  const buyHoldReturn = ((buyHoldEquity - p.startingCapitalUsd) / p.startingCapitalUsd) * 100;

  return {
    params: p,
    initialCapital: p.startingCapitalUsd,
    finalCapital: Math.round(smartEquity),
    totalReturnPct: Math.round(totalReturn * 10) / 10,
    buyHoldReturnPct: Math.round(buyHoldReturn * 10) / 10,
    maxDrawdownPct: Math.round(maxDrawdown * 10) / 10,
    winRatePct: Math.round(winRate * 10) / 10,
    profitFactor: Math.round(profitFactor * 100) / 100,
    totalTrades,
    winningTrades: wins,
    losingTrades: losses,
    bestTradePct: Math.round(bestTrade * 10) / 10,
    worstTradePct: Math.round(worstTrade * 10) / 10,
    avgTradePct: Math.round((totalReturn / totalTrades) * 10) / 10,
    equityCurve,
  };
}
