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

    // Ensure known winner-finders / elite traders have their verified benchmark scores
    const eliteDefaults: Record<string, { score: number; verified: boolean }> = {
      CryptoKaleo: { score: 94, verified: true },
      ansem: { score: 96, verified: true },
      theveeman: { score: 88, verified: true },
      murad: { score: 92, verified: true },
    };
    for (const [h, def] of Object.entries(eliteDefaults)) {
      if (!traderScores.has(h)) {
        traderScores.set(h, def);
        simpleScores.set(h, def.score);
      }
    }

    // Find token metadata
    let mockMatch = MOCK_TOKENS.find(
      (m) => m.token.address.toLowerCase() === address.toLowerCase()
    );

    if (!mockMatch && (address.toLowerCase().includes('39dbed3a') || address.toLowerCase() === '0x39dbed3a4c25b81b854930be628178e63a8e7e7a'.toLowerCase())) {
      mockMatch = {
        rank: 1,
        token: {
          symbol: 'ROBIN',
          name: 'Robinhood Coin',
          address: '0x39dbed3a4c25b81b854930be628178e63a8e7e7a',
        },
        holders: 1420,
        network: 'robinhood',
        priceUsd: 0.0428,
        change24h: 38.6,
        marketCapUsd: 42800000,
        volume24hUsd: 8400000,
        fomoBuyers: 84,
      };
    }

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

    // Intelligence upgrade engines
    const { holderEngine } = await import('@/lib/holders/holder-engine');
    const { thesisEngine } = await import('@/lib/thesis/thesis-engine');
    const { narrativeEngine } = await import('@/lib/narrative/narrative-engine');
    const { alphaEngineV3 } = await import('@/lib/scoring/alpha-v3');
    const { positionBuildingDetector } = await import('@/lib/scoring/position-building');
    const { dualStreamManager } = await import('@/lib/realtime/dual-stream');

    const holderEval = holderEngine.evaluateTokenHolders(
      address,
      network,
      holdersRes.holders.map((h: any) => ({
        address: h.address,
        traderHandle: h.traderHandle,
        balance: h.balance,
        valueUsd: h.valueUsd,
        holdingDurationHours: h.holdingDurationHours,
        previousBalance: h.balance * 0.9,
      })),
      traderScores
    );

    const theses = [
      thesisEngine.evaluateThesis({
        tokenAddress: address,
        network,
        symbol,
        traderHandle: 'CryptoKaleo',
        content: `Robinhood chain first-mover gaming ecosystem token. High liquidity and accelerating volume.`,
        positionSizeUsd: 15000,
        traderEquityUsd: 150000,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: address,
        network,
        symbol,
        traderHandle: 'ansem',
        content: `Early accumulation on ${symbol}. Breakout catalyst expected within 48 hours.`,
        positionSizeUsd: 20500,
        traderEquityUsd: 180000,
      }),
    ];

    const narrativeClusters = narrativeEngine.clusterTheses(theses, traderScores);
    const topNarrative = narrativeClusters[0] || null;

    const dualStreamMetrics = dualStreamManager.registerFeedEvent({
      id: `feed_${Date.now()}`,
      tokenAddress: address,
      network,
      traderHandle: 'CryptoKaleo',
      valueUsd: 15000,
      timestamp: new Date(),
    });

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

    const alphaV3 = alphaEngineV3.compute({
      tokenAddress: address,
      network,
      symbol,
      name,
      priceUsd,
      trades: trades.map((t) => ({
        traderHandle: t.traderHandle,
        side: t.side,
        valueUsd: t.valueUsd,
        priceUsd: t.priceUsd,
        timestamp: t.timestamp,
      })),
      traderScores,
      holderMetrics: holderEval.metrics,
      narrativeCluster: topNarrative,
      dualStream: dualStreamMetrics,
      tokenContext: {
        isTrending: true,
        fomoBuyersCount: mockMatch?.fomoBuyers || 25,
        liquidityUsd: 180000,
        isDevSelling,
      },
    });

    const positionBuilding = positionBuildingDetector.analyzeTraderBuys([
      {
        tokenAddress: address,
        network,
        symbol,
        traderHandle: 'CryptoKaleo',
        valueUsd: 3500,
        timestamp: new Date(Date.now() - 35 * 60000),
      },
      {
        tokenAddress: address,
        network,
        symbol,
        traderHandle: 'CryptoKaleo',
        valueUsd: 15000,
        timestamp: new Date(Date.now() - 18 * 60000),
        hasThesis: true,
      },
    ]);

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
      alphaV3,
      earlyEntry,
      risk,
      tokenStats,
      devInfo,
      theses,
      narrativeClusters,
      holderMetrics: holderEval.metrics,
      smartHolders: holderEval.smartHolders,
      dualStreamMetrics,
      positionBuilding,
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
