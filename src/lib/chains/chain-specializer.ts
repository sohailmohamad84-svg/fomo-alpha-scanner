import { ChainAlphaStats } from '../types/intelligence';

export interface TraderChainProfile {
  handle: string;
  preferredChain: string;
  bestChain: string;
  worstChain: string;
  chainStats: Record<string, {
    traderScore: number;
    copySignalScore: number;
    winRate: number;
    tradesCount: number;
    pnlUsd: number;
  }>;
}

export class ChainSpecializer {
  private chainStats: Map<string, ChainAlphaStats> = new Map([
    [
      'robinhood',
      {
        chainId: '4663',
        chainName: 'Robinhood Chain',
        activityScore: 92,
        volume24hUsd: 14250000,
        activeTradersCount: 248,
        eliteTradersActive: 42,
        convergenceSignalsCount: 16,
        isDominant: true,
      },
    ],
    [
      'solana',
      {
        chainId: 'solana-mainnet',
        chainName: 'Solana',
        activityScore: 84,
        volume24hUsd: 28600000,
        activeTradersCount: 420,
        eliteTradersActive: 38,
        convergenceSignalsCount: 12,
        isDominant: false,
      },
    ],
    [
      'base',
      {
        chainId: '8453',
        chainName: 'Base',
        activityScore: 68,
        volume24hUsd: 6800000,
        activeTradersCount: 120,
        eliteTradersActive: 14,
        convergenceSignalsCount: 5,
        isDominant: false,
      },
    ],
    [
      'ethereum',
      {
        chainId: '1',
        chainName: 'Ethereum',
        activityScore: 45,
        volume24hUsd: 8200000,
        activeTradersCount: 65,
        eliteTradersActive: 8,
        convergenceSignalsCount: 2,
        isDominant: false,
      },
    ],
  ]);

  public getChainStats(chainName: string): ChainAlphaStats | undefined {
    return this.chainStats.get(chainName.toLowerCase());
  }

  public getAllChains(): ChainAlphaStats[] {
    // Dynamically evaluate which chain is dominant
    const all = Array.from(this.chainStats.values()).sort(
      (a, b) => b.activityScore - a.activityScore
    );
    return all.map((c, idx) => ({ ...c, isDominant: idx === 0 }));
  }

  public getDominantChain(): ChainAlphaStats {
    return this.getAllChains()[0];
  }

  /**
   * Computes chain-specific scores for a trader to avoid applying global performance blindly
   */
  public evaluateTraderByChain(
    handle: string,
    globalScore: number,
    tradesByChain: Record<string, any> = {}
  ): TraderChainProfile {
    const chainStats: Record<string, any> = {};
    let bestChain = 'robinhood';
    let worstChain = 'ethereum';
    let highestScore = -1;
    let lowestScore = 999;
    let preferredChain = 'robinhood';
    let maxTrades = -1;

    const chains = ['robinhood', 'solana', 'base', 'ethereum'];

    for (const ch of chains) {
      const trades = Array.isArray(tradesByChain[ch]) ? tradesByChain[ch] : [];
      const count = trades.length;
      if (count > maxTrades) {
        maxTrades = count;
        preferredChain = ch;
      }

      // Calculate chain win rate & PnL
      const wins = trades.filter((t) => (t.realizedPnlUsd || 0) > 0).length;
      const winRate = count > 0 ? Math.round((wins / count) * 100) : 60;
      const pnlUsd = trades.reduce((acc, t) => acc + (t.realizedPnlUsd || 0), 0);

      // Chain-specific score delta based on performance in that chain
      const chainScoreDelta = count > 0 ? (winRate - 50) * 0.4 : 0;
      const traderScore = Math.min(99, Math.max(20, Math.round(globalScore + chainScoreDelta)));
      const copySignalScore = Math.min(99, Math.max(15, Math.round(traderScore * 0.95)));

      chainStats[ch] = {
        traderScore,
        copySignalScore,
        winRate,
        tradesCount: count,
        pnlUsd: Math.round(pnlUsd),
      };

      if (traderScore > highestScore) {
        highestScore = traderScore;
        bestChain = ch;
      }
      if (traderScore < lowestScore) {
        lowestScore = traderScore;
        worstChain = ch;
      }
    }

    return {
      handle,
      preferredChain,
      bestChain,
      worstChain,
      chainStats,
    };
  }
}

export const chainSpecializer = new ChainSpecializer();
