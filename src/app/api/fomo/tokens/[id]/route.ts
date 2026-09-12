import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { parseUniversalTokenId, normalizeTrade } from '@/lib/normalizer';
import { smartMoneyEngine } from '@/lib/scoring/smart-money-engine';
import { traderScorer } from '@/lib/scoring/trader-scorer';
import { detectEarlyEntry } from '@/lib/scoring/early-entry';
import { evaluateTokenRisk } from '@/lib/risk/risk-engine';
import { MOCK_TOKENS } from '@/lib/fomo/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const decodedId = decodeURIComponent(id);
    const { network, address } = parseUniversalTokenId(decodedId);

    // 1. Fetch token stats, dev info, and holders in parallel
    const [tokenStats, devInfo, holdersRes, leaderboard] = await Promise.all([
      fomoClient.getTokenStats(address),
      fomoClient.getTokenDevs(address),
      fomoClient.getTokenHolders(address),
      fomoClient.getLeaderboard('24h', 50),
    ]);

    const traderScores = new Map<string, { score: number; verified: boolean }>();
    const simpleScores = new Map<string, number>();
    leaderboard.traders.forEach((t) => {
      const score = traderScorer.calculateScore(t).score;
      traderScores.set(t.handle, { score, verified: t.verified });
      simpleScores.set(t.handle, score);
    });

    // Find token metadata
    const mockMatch = MOCK_TOKENS.find(
      (m) => m.token.address.toLowerCase() === address.toLowerCase()
    );

    const symbol = mockMatch?.token.symbol || 'TOKEN';
    const name = mockMatch?.token.name || symbol;
    const priceUsd = mockMatch?.priceUsd || 0.0428;
    const change24h = mockMatch?.change24h || 24.5;
    const marketCapUsd = mockMatch?.marketCapUsd || 42000000;
    const volume24hUsd = mockMatch?.volume24hUsd || 8400000;

    // Build timeline of trader activity
    const now = Date.now();
    const trades = [
      normalizeTrade(
        {
          tradeId: 'tr_1',
          token: { symbol, address },
          side: 'buy',
          status: 'open',
          sizeUsd: 15000,
          avgEntryPrice: priceUsd * 0.96,
          chain: network,
          ts: now - 18 * 60 * 1000,
        },
        'CryptoKaleo'
      ),
      normalizeTrade(
        {
          tradeId: 'tr_2',
          token: { symbol, address },
          side: 'buy',
          status: 'open',
          sizeUsd: 20500,
          avgEntryPrice: priceUsd * 0.98,
          chain: network,
          ts: now - 12 * 60 * 1000,
        },
        'ansem'
      ),
      normalizeTrade(
        {
          tradeId: 'tr_3',
          token: { symbol, address },
          side: 'buy',
          status: 'open',
          sizeUsd: 12000,
          avgEntryPrice: priceUsd * 0.99,
          chain: network,
          ts: now - 7 * 60 * 1000,
        },
        'theveeman'
      ),
      normalizeTrade(
        {
          tradeId: 'tr_4',
          token: { symbol, address },
          side: 'buy',
          status: 'open',
          sizeUsd: 18000,
          avgEntryPrice: priceUsd,
          chain: network,
          ts: now - 2 * 60 * 1000,
        },
        'murad'
      ),
    ];

    const signal = smartMoneyEngine.computeTokenSignal(trades, traderScores, {
      isTrending: true,
      fomoBuyersCount: mockMatch?.fomoBuyers || 25,
      liquidityUsd: 180000,
    });

    const earlyEntry = detectEarlyEntry(trades, simpleScores);

    const isDevSelling = devInfo.devs.some((d) => (d.realizedPnlUsd || 0) > 10000 && d.amount === 0);
    const risk = evaluateTokenRisk({
      liquidityUsd: 180000,
      uniqueBuyers: signal.uniqueBuyers,
      uniqueSellers: signal.uniqueSellers,
      isDevSelling,
      top10HoldersPercent: tokenStats.top10HoldersPercent || 28.4,
      signalAgeMinutes: signal.signalAgeMinutes,
      hasVerifiedTrader: signal.uniqueVerifiedBuyers > 0,
      totalBuyVolume: signal.totalBuyVolume,
      totalSellVolume: signal.totalSellVolume,
    });

    return NextResponse.json({
      token: {
        universalId: decodedId,
        address,
        network,
        symbol,
        name,
        priceUsd,
        change24h,
        marketCapUsd,
        volume24hUsd,
      },
      signal,
      earlyEntry,
      risk,
      tokenStats,
      devInfo,
      holders: holdersRes.holders,
      tradesTimeline: trades.map((t) => ({
        ...t,
        traderScore: simpleScores.get(t.traderHandle) || 75,
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
