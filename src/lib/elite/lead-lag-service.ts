// Lead-Lag Trader Analysis & Network Service
// Discovers directional relationships between elite traders (Trader A buys -> Trader B confirms)
// Computes LeadScore, FollowScore, and network adjacency graph

import { LeadLagPair } from '../types/elite';

export interface TraderSequenceTrade {
  handle: string;
  tokenAddress: string;
  side: string;
  priceUsd: number;
  timestamp: number;
  pnl24hAfterPct?: number;
}

export class LeadLagService {
  // Directed pairs cache: key = `${leader}::${follower}`
  private pairStats: Map<string, LeadLagPair> = new Map();

  constructor() {}

  /**
   * Analyzes an array of historical trades across all tokens to mine directional lead-lag pairs
   */
  public mineLeadLagSequences(trades: TraderSequenceTrade[]): LeadLagPair[] {
    const buys = trades
      .filter((t) => t.side.toUpperCase() === 'BUY')
      .sort((a, b) => a.timestamp - b.timestamp);

    // Group buys by token
    const tokenGroups: Map<string, TraderSequenceTrade[]> = new Map();
    for (const b of buys) {
      const group = tokenGroups.get(b.tokenAddress) || [];
      group.push(b);
      tokenGroups.set(b.tokenAddress, group);
    }

    const pairDeltas: Map<string, { deltasMin: number[]; wins: number; total: number }> = new Map();

    // Inspect each token's chronological buy cascade
    for (const [, tokenBuys] of tokenGroups.entries()) {
      for (let i = 0; i < tokenBuys.length; i++) {
        for (let j = i + 1; j < tokenBuys.length; j++) {
          const leader = tokenBuys[i];
          const follower = tokenBuys[j];

          // Cannot pair trader with themselves
          if (leader.handle.toLowerCase() === follower.handle.toLowerCase()) continue;

          const deltaMin = (follower.timestamp - leader.timestamp) / (1000 * 60);

          // Only consider follow actions within 1 min to 180 mins (3 hours)
          if (deltaMin >= 1 && deltaMin <= 180) {
            const key = `${leader.handle.toLowerCase()}::${follower.handle.toLowerCase()}`;
            const stats = pairDeltas.get(key) || { deltasMin: [], wins: 0, total: 0 };
            stats.deltasMin.push(deltaMin);
            stats.total++;
            if ((follower.pnl24hAfterPct ?? 0) > 0 || (leader.pnl24hAfterPct ?? 0) > 0) {
              stats.wins++;
            }
            pairDeltas.set(key, stats);
          }
        }
      }
    }

    const results: LeadLagPair[] = [];
    for (const [key, stats] of pairDeltas.entries()) {
      const [leaderHandle, followerHandle] = key.split('::');
      const avgLeadLagMinutes =
        stats.deltasMin.reduce((sum, d) => sum + d, 0) / stats.deltasMin.length;
      const successRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 50;

      const pair: LeadLagPair = {
        leaderHandle,
        followerHandle,
        confirmationCount: stats.total,
        avgLeadLagMinutes: Math.round(avgLeadLagMinutes * 10) / 10,
        successRate: Math.round(successRate * 10) / 10,
        correlation: Math.min(1.0, Math.round((stats.total / 10) * 100) / 100),
      };

      this.pairStats.set(key, pair);
      results.push(pair);
    }

    return results.sort((a, b) => b.confirmationCount - a.confirmationCount);
  }

  /**
   * Computes individual trader LeadScore and FollowScore (0 - 100)
   */
  public calculateTraderNetworkScores(
    handle: string,
    allPairs?: LeadLagPair[]
  ): {
    leadScore: number;
    followScore: number;
    confirmedFollowersCount: number;
    leadersFollowedCount: number;
  } {
    const pairs = allPairs || Array.from(this.pairStats.values());
    const lowerHandle = handle.toLowerCase();

    const asLeader = pairs.filter((p) => p.leaderHandle.toLowerCase() === lowerHandle);
    const asFollower = pairs.filter((p) => p.followerHandle.toLowerCase() === lowerHandle);

    const totalLeaderConfirmations = asLeader.reduce((sum, p) => sum + p.confirmationCount, 0);
    const totalFollowConfirmations = asFollower.reduce((sum, p) => sum + p.confirmationCount, 0);

    // LeadScore rewards having many followers confirming after you with high success rate
    let leadScore = 40; // baseline
    if (asLeader.length > 0) {
      const avgWinRate = asLeader.reduce((sum, p) => sum + p.successRate, 0) / asLeader.length;
      leadScore = Math.min(100, Math.round(totalLeaderConfirmations * 12 + avgWinRate * 0.40));
    }

    // FollowScore measures consistency in picking up confirmed leader signals
    let followScore = 40; // baseline
    if (asFollower.length > 0) {
      followScore = Math.min(100, Math.round(totalFollowConfirmations * 15));
    }

    return {
      leadScore: Math.min(100, Math.max(10, leadScore)),
      followScore: Math.min(100, Math.max(10, followScore)),
      confirmedFollowersCount: asLeader.length,
      leadersFollowedCount: asFollower.length,
    };
  }

  /**
   * Generates graph format (nodes and edges) for UI visualization
   */
  public getNetworkGraph(minConfirmations: number = 2): {
    nodes: Array<{ id: string; role: 'LEADER' | 'FOLLOWER' | 'HUB'; score: number }>;
    edges: Array<{ source: string; target: string; weight: number; label: string }>;
  } {
    const pairs = Array.from(this.pairStats.values()).filter(
      (p) => p.confirmationCount >= minConfirmations
    );

    const nodeIds = new Set<string>();
    for (const p of pairs) {
      nodeIds.add(p.leaderHandle);
      nodeIds.add(p.followerHandle);
    }

    const nodes = Array.from(nodeIds).map((id) => {
      const scores = this.calculateTraderNetworkScores(id, pairs);
      let role: 'LEADER' | 'FOLLOWER' | 'HUB' = 'FOLLOWER';
      if (scores.leadScore >= 70 && scores.followScore >= 70) role = 'HUB';
      else if (scores.leadScore >= 65) role = 'LEADER';

      return {
        id,
        role,
        score: scores.leadScore,
      };
    });

    const edges = pairs.map((p) => ({
      source: p.leaderHandle,
      target: p.followerHandle,
      weight: p.confirmationCount,
      label: `${p.confirmationCount}x (${p.avgLeadLagMinutes}m)`,
    }));

    return { nodes, edges };
  }
}

export const leadLagService = new LeadLagService();
