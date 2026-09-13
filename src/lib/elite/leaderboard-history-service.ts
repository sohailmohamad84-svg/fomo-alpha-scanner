// Leaderboard History & Persistence Service
// Tracks trader rank history over time across 24h, 7d, and 30d snapshots
// Computes rank volatility, persistence scores, and flags one-hit wonders

import { LeaderboardRankRecord, TraderPersistenceMetrics } from '../types/elite';
import { prisma } from '../db';

export class LeaderboardHistoryService {
  // In-memory cache of trader rank records by handle
  private historyCache: Map<string, LeaderboardRankRecord[]> = new Map();

  constructor() {}

  /**
   * Records a snapshot entry for a trader
   */
  public recordRank(
    handle: string,
    record: LeaderboardRankRecord
  ): void {
    const existing = this.historyCache.get(handle) || [];
    existing.push(record);
    // Keep last 100 entries per trader in cache
    if (existing.length > 100) {
      existing.shift();
    }
    this.historyCache.set(handle, existing);
  }

  /**
   * Ingests a full leaderboard snapshot array
   */
  public ingestLeaderboardSnapshot(
    window: '24h' | '7d' | '30d',
    traders: Array<{ handle: string; rank: number; pnlUsd?: number; qualityScore?: number }>,
    epoch: string = new Date().toISOString()
  ): void {
    for (const t of traders) {
      this.recordRank(t.handle, {
        epoch,
        window,
        rank: t.rank,
        pnlUsd: t.pnlUsd || 0,
        qualityScore: t.qualityScore || 50,
      });
    }
  }

  /**
   * Calculates persistence metrics for a specific trader
   */
  public getTraderPersistence(handle: string): TraderPersistenceMetrics {
    const records = this.historyCache.get(handle) || [];

    if (records.length === 0) {
      return {
        handle,
        snapshotsCount: 0,
        top10Appearances: 0,
        top25Appearances: 0,
        top50Appearances: 0,
        averageRank: 50,
        rankStandardDeviation: 0,
        persistenceScore: 40, // default neutral for unrecorded
        isOneHitWonder: false,
      };
    }

    let top10 = 0;
    let top25 = 0;
    let top50 = 0;
    let rankSum = 0;
    const ranks: number[] = [];

    let has24hTop10 = false;
    let has7dTop25 = false;
    let has30dTop50 = false;

    for (const r of records) {
      ranks.push(r.rank);
      rankSum += r.rank;
      if (r.rank <= 10) top10++;
      if (r.rank <= 25) top25++;
      if (r.rank <= 50) top50++;

      if (r.window === '24h' && r.rank <= 10) has24hTop10 = true;
      if (r.window === '7d' && r.rank <= 25) has7dTop25 = true;
      if (r.window === '30d' && r.rank <= 50) has30dTop50 = true;
    }

    const n = records.length;
    const avgRank = rankSum / n;

    // Standard deviation of ranks
    const variance = ranks.reduce((sum, r) => sum + Math.pow(r - avgRank, 2), 0) / n;
    const rankStdDev = Math.sqrt(variance);

    // One-hit wonder detection: highly ranked on 24h, but absent or lowly ranked on 7d & 30d
    const isOneHitWonder = has24hTop10 && !has7dTop25 && !has30dTop50 && n <= 3;

    // Persistence calculation (0 - 100):
    // 1. Appearance frequency: top 25 appearances ratio
    const appearanceRatio = (top25 / n) * 40; // max 40
    // 2. Average rank quality: 1st rank gets 40, 50th rank gets 0
    const rankQuality = Math.max(0, (50 - avgRank) / 50) * 40; // max 40
    // 3. Low volatility stability bonus (low std dev is good): max 20
    const stabilityBonus = Math.max(0, (20 - rankStdDev) / 20) * 20; // max 20

    let persistenceScore = appearanceRatio + rankQuality + stabilityBonus;

    // Penalize one hit wonder
    if (isOneHitWonder) {
      persistenceScore *= 0.50;
    }

    return {
      handle,
      snapshotsCount: n,
      top10Appearances: top10,
      top25Appearances: top25,
      top50Appearances: top50,
      averageRank: Math.round(avgRank * 10) / 10,
      rankStandardDeviation: Math.round(rankStdDev * 10) / 10,
      persistenceScore: Math.min(100, Math.max(10, Math.round(persistenceScore * 10) / 10)),
      isOneHitWonder,
    };
  }

  /**
   * Seeds historical snapshots from current multi-window leaderboard data
   */
  public seedFromMultiWindow(
    leaderboard24h: Array<{ handle: string }>,
    leaderboard7d: Array<{ handle: string }>,
    leaderboard30d: Array<{ handle: string }>
  ): void {
    const epoch = new Date().toISOString();
    this.ingestLeaderboardSnapshot('24h', leaderboard24h.map((t, idx) => ({ handle: t.handle, rank: idx + 1 })), epoch);
    this.ingestLeaderboardSnapshot('7d', leaderboard7d.map((t, idx) => ({ handle: t.handle, rank: idx + 1 })), epoch);
    this.ingestLeaderboardSnapshot('30d', leaderboard30d.map((t, idx) => ({ handle: t.handle, rank: idx + 1 })), epoch);
  }
}

export const leaderboardHistoryService = new LeaderboardHistoryService();
