import { WinnerFinderProfile } from '../types/intelligence';

export interface NextMoveCandidate {
  tokenAddress: string;
  symbol: string;
  network: string;
  winnerFindersCount: number;
  winnerFinders: string[];
  avgDiscoveryScore: number;
  totalAccumulatedUsd: number;
  thesesCount: number;
  firstAccumulatedAt: Date;
  candidateScore: number; // 0 - 100
}

export class WinnerHunterEngine {
  private knownWinnerFinders: Map<string, WinnerFinderProfile> = new Map([
    [
      'CryptoKaleo',
      {
        traderHandle: 'CryptoKaleo',
        discoveryScore: 94,
        historical10xCount: 11,
        historical100xCount: 3,
        avgReturnOfWinnersPct: 840,
        currentActiveBuys: [
          {
            tokenAddress: '0x39dbed3a4c25b81b854930be628178e63a8e7e7a',
            symbol: 'ROBIN',
            network: 'robinhood',
            valueUsd: 35000,
            timestamp: new Date(Date.now() - 18 * 60000),
            hasThesis: true,
          },
        ],
      },
    ],
    [
      'ansem',
      {
        traderHandle: 'ansem',
        discoveryScore: 96,
        historical10xCount: 14,
        historical100xCount: 4,
        avgReturnOfWinnersPct: 1250,
        currentActiveBuys: [
          {
            tokenAddress: '0x39dbed3a4c25b81b854930be628178e63a8e7e7a',
            symbol: 'ROBIN',
            network: 'robinhood',
            valueUsd: 42000,
            timestamp: new Date(Date.now() - 12 * 60000),
            hasThesis: true,
          },
          {
            tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
            symbol: 'BONK',
            network: 'solana',
            valueUsd: 28000,
            timestamp: new Date(Date.now() - 45 * 60000),
            hasThesis: false,
          },
        ],
      },
    ],
    [
      'murad',
      {
        traderHandle: 'murad',
        discoveryScore: 92,
        historical10xCount: 9,
        historical100xCount: 2,
        avgReturnOfWinnersPct: 780,
        currentActiveBuys: [
          {
            tokenAddress: '0x39dbed3a4c25b81b854930be628178e63a8e7e7a',
            symbol: 'ROBIN',
            network: 'robinhood',
            valueUsd: 30000,
            timestamp: new Date(Date.now() - 8 * 60000),
            hasThesis: true,
          },
        ],
      },
    ],
    [
      'theveeman',
      {
        traderHandle: 'theveeman',
        discoveryScore: 89,
        historical10xCount: 7,
        historical100xCount: 1,
        avgReturnOfWinnersPct: 620,
        currentActiveBuys: [
          {
            tokenAddress: '0x7fe995e8b4e43b171701a5e1d743a1a1f3fa1111',
            symbol: 'NEO',
            network: 'robinhood',
            valueUsd: 15000,
            timestamp: new Date(Date.now() - 30 * 60000),
            hasThesis: false,
          },
        ],
      },
    ],
  ]);

  public getProfile(handle: string): WinnerFinderProfile | undefined {
    return this.knownWinnerFinders.get(handle);
  }

  public getAllWinnerFinders(): WinnerFinderProfile[] {
    return Array.from(this.knownWinnerFinders.values()).sort(
      (a, b) => b.discoveryScore - a.discoveryScore
    );
  }

  /**
   * Identifies tokens currently being accumulated by multiple proven winner-finders ("NEXT MOVES")
   */
  public aggregateNextMoves(): NextMoveCandidate[] {
    const tokenMap = new Map<string, {
      symbol: string;
      network: string;
      finders: string[];
      scores: number[];
      values: number[];
      thesesCount: number;
      times: Date[];
    }>();

    for (const profile of this.knownWinnerFinders.values()) {
      for (const buy of profile.currentActiveBuys) {
        const key = `${buy.network}:${buy.tokenAddress}`.toLowerCase();
        if (!tokenMap.has(key)) {
          tokenMap.set(key, {
            symbol: buy.symbol,
            network: buy.network,
            finders: [],
            scores: [],
            values: [],
            thesesCount: 0,
            times: [],
          });
        }
        const entry = tokenMap.get(key)!;
        entry.finders.push(profile.traderHandle);
        entry.scores.push(profile.discoveryScore);
        entry.values.push(buy.valueUsd);
        if (buy.hasThesis) entry.thesesCount++;
        entry.times.push(buy.timestamp);
      }
    }

    const candidates: NextMoveCandidate[] = [];

    for (const [key, data] of tokenMap.entries()) {
      const parts = key.split(':');
      const network = parts[0];
      const tokenAddress = parts[1];

      const avgDiscoveryScore = Math.round(
        data.scores.reduce((a, b) => a + b, 0) / data.scores.length
      );
      const totalAccumulatedUsd = data.values.reduce((a, b) => a + b, 0);
      const firstAccumulatedAt = new Date(Math.min(...data.times.map((t) => t.getTime())));

      // Candidate Score: 0 - 100
      const candidateScore = Math.min(
        100,
        Math.round(
          data.finders.length * 30 +
          (avgDiscoveryScore * 0.3) +
          Math.min(20, (totalAccumulatedUsd / 50000) * 20) +
          data.thesesCount * 10
        )
      );

      candidates.push({
        tokenAddress,
        symbol: data.symbol,
        network,
        winnerFindersCount: data.finders.length,
        winnerFinders: data.finders,
        avgDiscoveryScore,
        totalAccumulatedUsd,
        thesesCount: data.thesesCount,
        firstAccumulatedAt,
        candidateScore,
      });
    }

    return candidates.sort((a, b) => b.candidateScore - a.candidateScore);
  }
}

export const winnerHunterEngine = new WinnerHunterEngine();
