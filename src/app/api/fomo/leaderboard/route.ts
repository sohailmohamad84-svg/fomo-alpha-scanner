import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { traderScorer } from '@/lib/scoring/trader-scorer';
import { TimeWindow } from '@/lib/fomo/types';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const window = (searchParams.get('window') || '24h') as TimeWindow;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const minScore = parseInt(searchParams.get('minScore') || '0', 10);

    const leaderboard = await fomoClient.getLeaderboard(window, limit);

    // Compute quality scores for each trader
    const enrichedTraders = leaderboard.traders.map((trader) => {
      const scoreResult = traderScorer.calculateScore(trader);
      return {
        ...trader,
        qualityScore: scoreResult.score,
        scoreBreakdown: scoreResult,
      };
    });

    // Filter by minScore if requested
    const filtered = enrichedTraders.filter((t) => t.qualityScore >= minScore);

    return NextResponse.json({
      window: leaderboard.window,
      count: filtered.length,
      traders: filtered,
      source: leaderboard.source,
      creditsRemaining: fomoClient.credits.remainingCredits,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
