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
      'ogle',
      {
        traderHandle: 'ogle',
        discoveryScore: 98,
        historical10xCount: 16,
        historical100xCount: 5,
        avgReturnOfWinnersPct: 1450,
        currentActiveBuys: [
          {
            tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
            symbol: 'PONS',
            network: 'robinhood',
            valueUsd: 7127702,
            timestamp: new Date(Date.now() - 25 * 60000),
            hasThesis: true,
          },
        ],
      },
    ],
    [
      'unipcs',
      {
        traderHandle: 'unipcs',
        discoveryScore: 96,
        historical10xCount: 14,
        historical100xCount: 4,
        avgReturnOfWinnersPct: 1250,
        currentActiveBuys: [
          {
            tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
            symbol: 'PONS',
            network: 'robinhood',
            valueUsd: 7127476,
            timestamp: new Date(Date.now() - 15 * 60000),
            hasThesis: true,
          },
        ],
      },
    ],
    [
      'AvgJoesCrypto',
      {
        traderHandle: 'AvgJoesCrypto',
        discoveryScore: 94,
        historical10xCount: 11,
        historical100xCount: 3,
        avgReturnOfWinnersPct: 890,
        currentActiveBuys: [
          {
            tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
            symbol: 'PONS',
            network: 'robinhood',
            valueUsd: 2738054,
            timestamp: new Date(Date.now() - 10 * 60000),
            hasThesis: true,
          },
          {
            tokenAddress: '0x020bfc650a365f8bb26819deaabf3e21291018b4',
            symbol: 'CASHCAT',
            network: 'robinhood',
            valueUsd: 25000,
            timestamp: new Date(Date.now() - 10 * 60000),
            hasThesis: false,
          },
        ],
      },
    ],
    [
      'Chubbi230',
      {
        traderHandle: 'Chubbi230',
        discoveryScore: 92,
        historical10xCount: 9,
        historical100xCount: 2,
        avgReturnOfWinnersPct: 780,
        currentActiveBuys: [
          {
            tokenAddress: '0x020bfc650a365f8bb26819deaabf3e21291018b4',
            symbol: 'CASHCAT',
            network: 'robinhood',
            valueUsd: 180000,
            timestamp: new Date(Date.now() - 18 * 60000),
            hasThesis: true,
          },
        ],
      },
    ],
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
            tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pHMM1',
            symbol: 'HMM',
            network: 'solana',
            valueUsd: 19820,
            timestamp: new Date(Date.now() - 6 * 3600000),
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
            tokenAddress: '0x020bfc650a365f8bb26819deaabf3e21291018b4',
            symbol: 'CASHCAT',
            network: 'robinhood',
            valueUsd: 35000,
            timestamp: new Date(Date.now() - 22 * 60000),
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
