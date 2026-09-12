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

    const { traderDNAService } = await import('@/lib/dna/trader-dna');
    const { chainSpecializer } = await import('@/lib/chains/chain-specializer');

    const dna = traderDNAService.computeDNA({
      ...profile,
      tradesHistory: tradesRes.trades || [],
    });

    const tradesByChain: Record<string, any[]> = {};
    (tradesRes.trades || []).forEach((t: any) => {
      const chain = (t.chain || 'robinhood').toLowerCase();
      if (!tradesByChain[chain]) tradesByChain[chain] = [];
      tradesByChain[chain].push(t);
    });

    const chainProfile = chainSpecializer.evaluateTraderByChain(
      cleanHandle,
      dna.traderScore,
      tradesByChain
    );

    return NextResponse.json({
      trader: {
        ...profile,
        qualityScore: dna.traderScore,
        dna,
        chainProfile,
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
