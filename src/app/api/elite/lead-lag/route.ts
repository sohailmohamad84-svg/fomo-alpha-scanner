import { NextRequest, NextResponse } from 'next/server';
import { leadLagService, TraderSequenceTrade } from '@/lib/elite/lead-lag-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const t0 = Date.now() - 48 * 3600 * 1000;

    // Seed realistic trade sequences across multiple tokens
    const sampleSequenceTrades: TraderSequenceTrade[] = [
      // CASHCAT: Chubbi230 bought first, theveeman confirmed 24 mins later
      {
        handle: 'Chubbi230',
        tokenAddress: '7u3r9p7xU5qA7RKn8J9Y9g4b1a4t5d6e7f8g9h0i',
        side: 'BUY',
        priceUsd: 0.00084,
        timestamp: t0 + 10 * 3600 * 1000,
        pnl24hAfterPct: 42,
      },
      {
        handle: 'theveeman',
        tokenAddress: '7u3r9p7xU5qA7RKn8J9Y9g4b1a4t5d6e7f8g9h0i',
        side: 'BUY',
        priceUsd: 0.00086,
        timestamp: t0 + 10 * 3600 * 1000 + 24 * 60 * 1000,
        pnl24hAfterPct: 35,
      },
      // SOLAI: Chubbi230 bought first, theveeman confirmed 38 mins later
      {
        handle: 'Chubbi230',
        tokenAddress: 'So11111111111111111111111111111111111111112',
        side: 'BUY',
        priceUsd: 0.011,
        timestamp: t0 + 20 * 3600 * 1000,
        pnl24hAfterPct: 80,
      },
      {
        handle: 'theveeman',
        tokenAddress: 'So11111111111111111111111111111111111111112',
        side: 'BUY',
        priceUsd: 0.0125,
        timestamp: t0 + 20 * 3600 * 1000 + 38 * 60 * 1000,
        pnl24hAfterPct: 65,
      },
      // PONS: ogle bought first, unipcs confirmed 15 mins later, AvgJoesCrypto confirmed 45 mins later
      {
        handle: 'ogle',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        side: 'BUY',
        priceUsd: 0.008,
        timestamp: t0 + 5 * 3600 * 1000,
        pnl24hAfterPct: 150,
      },
      {
        handle: 'unipcs',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        side: 'BUY',
        priceUsd: 0.009,
        timestamp: t0 + 5 * 3600 * 1000 + 15 * 60 * 1000,
        pnl24hAfterPct: 120,
      },
      {
        handle: 'AvgJoesCrypto',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        side: 'BUY',
        priceUsd: 0.012,
        timestamp: t0 + 5 * 3600 * 1000 + 45 * 60 * 1000,
        pnl24hAfterPct: 90,
      },
    ];

    const pairs = leadLagService.mineLeadLagSequences(sampleSequenceTrades);
    const graph = leadLagService.getNetworkGraph(1);

    return NextResponse.json({
      success: true,
      totalPairs: pairs.length,
      pairs,
      graph,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to mine lead-lag sequences' },
      { status: 500 }
    );
  }
}
