import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { traderScorer } from '@/lib/scoring/trader-scorer';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const cleanHandle = handle.replace(/^@/, '');

    const [profile, tradesRes, balancesRes, spotlightRes] = await Promise.all([
      fomoClient.getTrader(cleanHandle),
      fomoClient.getTraderTrades(cleanHandle, { limit: 25 }),
      fomoClient.getTraderBalances(cleanHandle),
      fomoClient.getTraderSpotlight(cleanHandle),
    ]);

    const scoreResult = traderScorer.calculateScore(profile);

    return NextResponse.json({
      trader: {
        ...profile,
        qualityScore: scoreResult.score,
        scoreBreakdown: scoreResult,
      },
      trades: tradesRes.trades || [],
      balances: balancesRes.holdings || [],
      totalValueUsd: balancesRes.totalValueUsd || 0,
      byChain: balancesRes.byChain || {},
      spotlight: spotlightRes,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
