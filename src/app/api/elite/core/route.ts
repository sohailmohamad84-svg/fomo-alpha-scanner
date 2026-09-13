import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { eliteCoreService } from '@/lib/elite/elite-core-service';
import { leaderboardHistoryService } from '@/lib/elite/leaderboard-history-service';
import { leadLagService } from '@/lib/elite/lead-lag-service';
import { winnerFinderService } from '@/lib/elite/winner-finder-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const window = (searchParams.get('window') || '24h') as '24h' | '7d' | '30d';

    // Fetch multi-window leaderboards
    const [board24h, board7d, board30d] = await Promise.all([
      fomoClient.getLeaderboard('24h', 30).catch(() => ({ traders: [] })),
      fomoClient.getLeaderboard('7d', 30).catch(() => ({ traders: [] })),
      fomoClient.getLeaderboard('30d', 30).catch(() => ({ traders: [] })),
    ]);

    // Seed history
    leaderboardHistoryService.seedFromMultiWindow(
      board24h.traders,
      board7d.traders,
      board30d.traders
    );

    // Get active traders to evaluate
    const activeList =
      window === '30d' ? board30d.traders : window === '7d' ? board7d.traders : board24h.traders;

    const evaluated = activeList.map((t) => {
      const persistence = leaderboardHistoryService.getTraderPersistence(t.handle);
      const network = leadLagService.calculateTraderNetworkScores(t.handle);
      const raw = t as any;
      return eliteCoreService.evaluateTrader(
        {
          handle: t.handle,
          displayName: t.displayName,
          pnl30d: raw.pnl?.['30d'] ?? t.pnlUsd,
          pnl7d: raw.pnl?.['7d'] ?? 0,
          pnl24h: raw.pnl?.['24h'] ?? 0,
          pnlAll: raw.pnlAll ?? t.pnlUsd,
          volumeUsd: t.volumeUsd,
          tradesCount: t.trades,
          accountAgeDays: raw.accountAgeDays ?? 45,
          consistencyScore: 80,
          winRate: 0.68,
          primaryChain: t.wallets?.solana ? 'solana' : 'robinhood',
          verified: t.verified,
          consecutiveSnapshotsInTop: persistence.top25Appearances,
          leadScore: network.leadScore,
          followScore: network.followScore,
        },
        persistence.persistenceScore
      );
    });

    const eliteCore = eliteCoreService.filterEliteCore(evaluated);
    const winnerFinders = winnerFinderService.getTopWinnerFinders();

    return NextResponse.json({
      success: true,
      window,
      totalEvaluated: evaluated.length,
      eliteCoreCount: eliteCore.length,
      eliteCore,
      allEvaluated: evaluated,
      winnerFinders,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to evaluate elite core' },
      { status: 500 }
    );
  }
}
