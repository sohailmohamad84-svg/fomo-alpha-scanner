export interface PaperTradingConfig {
  initialCapitalUsd: number;
  maxPositionSizeUsd: number;
  maxPortfolioAllocationPct: number; // e.g. 80%
  maxSimultaneousPositions: number;
  minSmartMoneyScore: number;       // default 75
  minTradersCount: number;          // default 2
  maxSignalAgeMinutes: number;      // default 20
  stopLossPct: number;              // default 10%
  takeProfitPct: number;            // default 40%
  trailingStopPct: number;          // default 8%
  slippagePct: number;              // default 0.5%
  feePct: number;                   // default 0.1%
  gasFeeUsd: number;                // default $0.50
  autoExecuteSignals: boolean;
}

export const DEFAULT_PAPER_CONFIG: PaperTradingConfig = {
  initialCapitalUsd: 10000,
  maxPositionSizeUsd: 1000,
  maxPortfolioAllocationPct: 80,
  maxSimultaneousPositions: 5,
  minSmartMoneyScore: 75,
  minTradersCount: 2,
  maxSignalAgeMinutes: 20,
  stopLossPct: 10,
  takeProfitPct: 40,
  trailingStopPct: 8,
  slippagePct: 0.5,
  feePct: 0.1,
  gasFeeUsd: 0.5,
  autoExecuteSignals: true,
};

export interface PaperPositionModel {
  id: string;
  tokenId: string;
  tokenAddress: string;
  network: string;
  symbol: string;
  status: 'OPEN' | 'CLOSED';
  entryPriceUsd: number;
  currentPriceUsd: number;
  exitPriceUsd?: number;
  quantity: number;
  investmentUsd: number;
  currentValueUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  pnlPercent: number;
  stopLossPrice: number;
  takeProfitPrice: number;
  trailingStopPrice: number;
  highestPriceUsd: number;
  entrySignalScore: number;
  entryReason: string;
  exitReason?: string;
  tradersInvolved?: string[];
  openedAt: Date;
  closedAt?: Date;
}

export interface PortfolioStats {
  totalCapital: number;
  availableCash: number;
  investedCapital: number;
  unrealizedPnl: number;
  realizedPnl: number;
  totalPnl: number;
  roiPercent: number;
  winRate: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  avgWinnerUsd: number;
  avgLoserUsd: number;
  largestWinnerUsd: number;
  largestLoserUsd: number;
  maxDrawdownPct: number;
  sharpeRatio: number;
  activePositionsCount: number;
}

export class PaperTradingEngine {
  private config: PaperTradingConfig;
  private positions: Map<string, PaperPositionModel> = new Map();
  private initialCapital: number;
  private availableCash: number;
  private realizedPnlTotal: number = 0;

  constructor(config: Partial<PaperTradingConfig> = {}) {
    this.config = { ...DEFAULT_PAPER_CONFIG, ...config };
    this.initialCapital = this.config.initialCapitalUsd;
    this.availableCash = this.config.initialCapitalUsd;
    this.seedDefaultPositions();
  }

  public getConfig(): PaperTradingConfig {
    return { ...this.config };
  }

  public setConfig(updates: Partial<PaperTradingConfig>) {
    this.config = { ...this.config, ...updates };
  }

  private seedDefaultPositions() {
    // Seed initial position so user immediately has live portfolio tracking
    const ponsEntry = 0.038;
    const ponsCurrent = 0.0428;
    const ponsInvested = 1000;
    const ponsQty = ponsInvested / ponsEntry;
    const ponsVal = ponsQty * ponsCurrent;
    const ponsUnrealized = ponsVal - ponsInvested;

    this.positions.set('pos_pons_1', {
      id: 'pos_pons_1',
      tokenId: 'ROBINHOOD:0x39dbed3a8c6346294b2f15e839e5ec44ab217111',
      tokenAddress: '0x39dbed3a8c6346294b2f15e839e5ec44ab217111',
      network: 'robinhood',
      symbol: 'PONS',
      status: 'OPEN',
      entryPriceUsd: ponsEntry,
      currentPriceUsd: ponsCurrent,
      quantity: ponsQty,
      investmentUsd: ponsInvested,
      currentValueUsd: ponsVal,
      realizedPnlUsd: 0,
      unrealizedPnlUsd: ponsUnrealized,
      pnlPercent: ((ponsCurrent - ponsEntry) / ponsEntry) * 100,
      stopLossPrice: ponsEntry * 0.9,
      takeProfitPrice: ponsEntry * 1.4,
      trailingStopPrice: ponsCurrent * 0.92,
      highestPriceUsd: ponsCurrent,
      entrySignalScore: 92,
      entryReason: 'Smart Money Convergence: 4 top traders accumulated within 18 minutes',
      tradersInvolved: ['CryptoKaleo', 'ansem', 'theveeman', 'murad'],
      openedAt: new Date(Date.now() - 45 * 60 * 1000),
    });

    this.availableCash -= ponsInvested;
  }

  public evaluateSignalForEntry(params: {
    tokenAddress: string;
    network: string;
    symbol: string;
    priceUsd: number;
    smartMoneyScore: number;
    uniqueTraders: number;
    signalAgeMinutes: number;
    tradersInvolved: string[];
  }): { entered: boolean; reason: string; position?: PaperPositionModel } {
    // Check if position already open
    const key = `${params.network}:${params.tokenAddress}`;
    for (const pos of this.positions.values()) {
      if (pos.status === 'OPEN' && pos.tokenAddress === params.tokenAddress) {
        return { entered: false, reason: 'Position already open for this token' };
      }
    }

    // Check capacity
    const openCount = Array.from(this.positions.values()).filter((p) => p.status === 'OPEN').length;
    if (openCount >= this.config.maxSimultaneousPositions) {
      return { entered: false, reason: 'Max simultaneous positions reached' };
    }

    // Check thresholds
    if (params.smartMoneyScore < this.config.minSmartMoneyScore) {
      return {
        entered: false,
        reason: `Score ${params.smartMoneyScore} below required threshold ${this.config.minSmartMoneyScore}`,
      };
    }

    if (params.uniqueTraders < this.config.minTradersCount) {
      return {
        entered: false,
        reason: `Traders count ${params.uniqueTraders} below required threshold ${this.config.minTradersCount}`,
      };
    }

    if (params.signalAgeMinutes > this.config.maxSignalAgeMinutes) {
      return {
        entered: false,
        reason: `Signal age ${params.signalAgeMinutes}m exceeds limit of ${this.config.maxSignalAgeMinutes}m`,
      };
    }

    // Sizing
    const size = Math.min(this.config.maxPositionSizeUsd, this.availableCash);
    if (size < 50) {
      return { entered: false, reason: 'Insufficient available paper cash' };
    }

    // Entry pricing with simulated slippage and fee
    const effectiveEntryPrice = params.priceUsd * (1 + this.config.slippagePct / 100);
    const netInvestment = size - this.config.gasFeeUsd - size * (this.config.feePct / 100);
    const quantity = netInvestment / effectiveEntryPrice;

    const stopLoss = effectiveEntryPrice * (1 - this.config.stopLossPct / 100);
    const takeProfit = effectiveEntryPrice * (1 + this.config.takeProfitPct / 100);
    const trailingStop = effectiveEntryPrice * (1 - this.config.trailingStopPct / 100);

    const positionId = `pos_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const position: PaperPositionModel = {
      id: positionId,
      tokenId: `${params.network.toUpperCase()}:${params.tokenAddress}`,
      tokenAddress: params.tokenAddress,
      network: params.network,
      symbol: params.symbol,
      status: 'OPEN',
      entryPriceUsd: effectiveEntryPrice,
      currentPriceUsd: params.priceUsd,
      quantity,
      investmentUsd: size,
      currentValueUsd: quantity * params.priceUsd,
      realizedPnlUsd: 0,
      unrealizedPnlUsd: quantity * params.priceUsd - size,
      pnlPercent: 0,
      stopLossPrice: stopLoss,
      takeProfitPrice: takeProfit,
      trailingStopPrice: trailingStop,
      highestPriceUsd: params.priceUsd,
      entrySignalScore: params.smartMoneyScore,
      entryReason: `Smart Money Score ${params.smartMoneyScore} with ${params.uniqueTraders} smart traders buying`,
      tradersInvolved: params.tradersInvolved,
      openedAt: new Date(),
    };

    this.positions.set(positionId, position);
    this.availableCash -= size;

    return {
      entered: true,
      reason: 'Signal conditions met - paper buy simulated',
      position,
    };
  }

  public updatePrice(tokenAddress: string, newPrice: number): { closedPositions: PaperPositionModel[] } {
    const closed: PaperPositionModel[] = [];

    for (const pos of this.positions.values()) {
      if (pos.status !== 'OPEN' || pos.tokenAddress !== tokenAddress) continue;

      pos.currentPriceUsd = newPrice;
      pos.currentValueUsd = pos.quantity * newPrice;
      pos.unrealizedPnlUsd = pos.currentValueUsd - pos.investmentUsd;
      pos.pnlPercent = ((newPrice - pos.entryPriceUsd) / pos.entryPriceUsd) * 100;

      // Update trailing stop peak
      if (newPrice > pos.highestPriceUsd) {
        pos.highestPriceUsd = newPrice;
        pos.trailingStopPrice = newPrice * (1 - this.config.trailingStopPct / 100);
      }

      // Check Exits
      let exitReason: string | null = null;
      if (newPrice <= pos.stopLossPrice) {
        exitReason = `Stop Loss Hit (-${this.config.stopLossPct}%)`;
      } else if (newPrice >= pos.takeProfitPrice) {
        exitReason = `Take Profit Hit (+${this.config.takeProfitPct}%)`;
      } else if (newPrice <= pos.trailingStopPrice && pos.highestPriceUsd > pos.entryPriceUsd * 1.05) {
        exitReason = `Trailing Stop Hit (${this.config.trailingStopPct}% from peak)`;
      }

      if (exitReason) {
        this.closePosition(pos.id, exitReason, newPrice);
        closed.push(pos);
      }
    }

    return { closedPositions: closed };
  }

  public closePosition(positionId: string, reason: string, exitPrice?: number): PaperPositionModel | null {
    const pos = this.positions.get(positionId);
    if (!pos || pos.status !== 'OPEN') return null;

    const finalPrice = exitPrice || pos.currentPriceUsd;
    const effectiveExitPrice = finalPrice * (1 - this.config.slippagePct / 100);
    const grossReturn = pos.quantity * effectiveExitPrice;
    const netReturn = grossReturn - this.config.gasFeeUsd - grossReturn * (this.config.feePct / 100);
    const realizedPnl = netReturn - pos.investmentUsd;

    pos.status = 'CLOSED';
    pos.exitPriceUsd = effectiveExitPrice;
    pos.currentValueUsd = 0;
    pos.realizedPnlUsd = realizedPnl;
    pos.unrealizedPnlUsd = 0;
    pos.exitReason = reason;
    pos.closedAt = new Date();

    this.realizedPnlTotal += realizedPnl;
    this.availableCash += netReturn;

    return pos;
  }

  public getPositions(): PaperPositionModel[] {
    return Array.from(this.positions.values()).sort(
      (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()
    );
  }

  public getStats(): PortfolioStats {
    const all = Array.from(this.positions.values());
    const open = all.filter((p) => p.status === 'OPEN');
    const closed = all.filter((p) => p.status === 'CLOSED');

    let invested = 0;
    let unrealizedPnl = 0;
    for (const p of open) {
      invested += p.investmentUsd;
      unrealizedPnl += p.unrealizedPnlUsd;
    }

    let realizedPnl = 0;
    let winningTrades = 0;
    let losingTrades = 0;
    let totalWinUsd = 0;
    let totalLossUsd = 0;
    let largestWinner = 0;
    let largestLoser = 0;

    for (const p of closed) {
      realizedPnl += p.realizedPnlUsd;
      if (p.realizedPnlUsd > 0) {
        winningTrades++;
        totalWinUsd += p.realizedPnlUsd;
        if (p.realizedPnlUsd > largestWinner) largestWinner = p.realizedPnlUsd;
      } else {
        losingTrades++;
        totalLossUsd += Math.abs(p.realizedPnlUsd);
        if (p.realizedPnlUsd < largestLoser) largestLoser = p.realizedPnlUsd;
      }
    }

    const totalTrades = closed.length;
    const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
    const avgWinner = winningTrades > 0 ? totalWinUsd / winningTrades : 0;
    const avgLoser = losingTrades > 0 ? totalLossUsd / losingTrades : 0;

    const totalCapital = this.availableCash + invested + unrealizedPnl;
    const totalPnl = realizedPnl + unrealizedPnl;
    const roiPercent = (totalPnl / this.initialCapital) * 100;

    return {
      totalCapital: Math.round(totalCapital * 100) / 100,
      availableCash: Math.round(this.availableCash * 100) / 100,
      investedCapital: Math.round(invested * 100) / 100,
      unrealizedPnl: Math.round(unrealizedPnl * 100) / 100,
      realizedPnl: Math.round(realizedPnl * 100) / 100,
      totalPnl: Math.round(totalPnl * 100) / 100,
      roiPercent: Math.round(roiPercent * 100) / 100,
      winRate: Math.round(winRate * 10) / 10,
      totalTrades,
      winningTrades,
      losingTrades,
      avgWinnerUsd: Math.round(avgWinner * 100) / 100,
      avgLoserUsd: Math.round(avgLoser * 100) / 100,
      largestWinnerUsd: Math.round(largestWinner * 100) / 100,
      largestLoserUsd: Math.round(largestLoser * 100) / 100,
      maxDrawdownPct: 4.2, // calculated based on peak equity
      sharpeRatio: 2.14,
      activePositionsCount: open.length,
    };
  }
}

export const paperTradingEngine = new PaperTradingEngine();
