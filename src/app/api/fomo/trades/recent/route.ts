import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { MOCK_TRADES, MOCK_TRADERS } from '@/lib/fomo/mock-data';
import { traderScorer } from '@/lib/scoring/trader-scorer';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const scoresMap = new Map<string, number>();
    MOCK_TRADERS.forEach((t) => {
      scoresMap.set(t.handle, traderScorer.calculateScore(t).score);
    });

    const enrichedTrades = MOCK_TRADES.slice(0, limit).map((t, idx) => {
      const traderHandle = idx % 2 === 0 ? 'CryptoKaleo' : idx % 3 === 0 ? 'ansem' : 'theveeman';
      const traderScore = scoresMap.get(traderHandle) || 85;
      const isStrong = traderScore >= 80 && t.side === 'buy';

      return {
        id: t.tradeId || `trade_${idx}`,
        time: t.createdAt || new Date(Date.now() - idx * 4 * 60 * 1000).toISOString(),
        trader: traderHandle,
        traderScore,
        token: t.token.symbol,
        tokenAddress: t.token.address,
        network: t.chain || 'robinhood',
        action: (t.side || 'buy').toUpperCase(),
        amountUsd: t.sizeUsd || 10000,
        priceUsd: t.avgEntryPrice || 0.0428,
        tokenSmartMoneyScore: t.token.symbol === 'PONS' ? 92 : t.token.symbol === 'SOLAI' ? 78 : 64,
        signalStrength: isStrong ? 'VERY STRONG' : 'MODERATE',
        isNewSignalTrigger: idx === 0,
      };
    });

    return NextResponse.json({
      count: enrichedTrades.length,
      trades: enrichedTrades,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
