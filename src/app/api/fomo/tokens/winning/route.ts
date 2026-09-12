import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { smartMoneyEngine } from '@/lib/scoring/smart-money-engine';
import { traderScorer } from '@/lib/scoring/trader-scorer';
import { normalizeTrade, createUniversalTokenId } from '@/lib/normalizer';
import { detectEarlyEntry } from '@/lib/scoring/early-entry';
import { evaluateTokenRisk } from '@/lib/risk/risk-engine';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chainFilter = searchParams.get('chain')?.toLowerCase();
    const minScore = parseInt(searchParams.get('minScore') || '0', 10);
    const minTraders = parseInt(searchParams.get('minTraders') || '1', 10);
    const timeWindow = searchParams.get('timeWindow') || '24h'; // 5m, 15m, 30m, 1h, 4h, 24h

    // 1. Fetch leaderboard to get top traders and their scores
    const leaderboard = await fomoClient.getLeaderboard('24h', 50);
    const traderScores = new Map<string, { score: number; rank: number; verified: boolean }>();
    const simpleScores = new Map<string, number>();

    leaderboard.traders.forEach((t) => {
      const score = traderScorer.calculateScore(t).score;
      traderScores.set(t.handle, { score, rank: t.rank, verified: t.verified });
      simpleScores.set(t.handle, score);
    });

    // 2. Fetch trending and most held token boards
    const [trendingBoard, tradesRes] = await Promise.all([
      fomoClient.getTrendingTokens(50),
      fomoClient.getTraderTrades('CryptoKaleo', { limit: 100 }),
    ]);

    // Group trades by universal token identifier: NETWORK:ADDRESS
    const tokenTradesMap = new Map<string, any[]>();
    const tokenMetaMap = new Map<string, any>();

    // Index tokens from trending board
    trendingBoard.tokens.forEach((item) => {
      const uId = createUniversalTokenId(item.network, item.token.address);
      tokenMetaMap.set(uId, {
        symbol: item.token.symbol,
        name: item.token.name,
        address: item.token.address,
        network: item.network,
        priceUsd: item.priceUsd,
        change24h: item.change24h,
        marketCapUsd: item.marketCapUsd,
        volume24hUsd: item.volume24hUsd,
        fomoBuyers: item.fomoBuyers,
        isTrending: true,
        rank: item.rank,
      });
      if (!tokenTradesMap.has(uId)) {
        tokenTradesMap.set(uId, []);
      }
    });

    // Map each trade into its token bucket
    tradesRes.trades.forEach((tradeRaw) => {
      const norm = normalizeTrade(tradeRaw, 'CryptoKaleo');
      const uId = norm.universalId;
      if (!tokenTradesMap.has(uId)) {
        tokenTradesMap.set(uId, []);
      }
      tokenTradesMap.get(uId)!.push(norm);

      if (!tokenMetaMap.has(uId)) {
        tokenMetaMap.set(uId, {
          symbol: norm.symbol,
          name: norm.name,
          address: norm.tokenAddress,
          network: norm.network,
          priceUsd: norm.priceUsd,
          change24h: 12.5,
          marketCapUsd: 15000000,
          volume24hUsd: 2500000,
          fomoBuyers: 15,
          isTrending: false,
        });
      }
    });

    // Compute convergence scores for each token
    const winningCoins = [];

    for (const [uId, rawTrades] of tokenTradesMap.entries()) {
      const meta = tokenMetaMap.get(uId);
      if (!meta) continue;

      if (chainFilter && chainFilter !== 'all' && meta.network !== chainFilter) {
        continue;
      }

      // Filter trades by time window if specified
      let maxAgeMinutes = 1440;
      if (timeWindow === '5m') maxAgeMinutes = 5;
      else if (timeWindow === '15m') maxAgeMinutes = 15;
      else if (timeWindow === '30m') maxAgeMinutes = 30;
      else if (timeWindow === '1h') maxAgeMinutes = 60;
      else if (timeWindow === '4h') maxAgeMinutes = 240;

      const now = Date.now();
      const windowTrades = rawTrades.filter((t) => {
        const ageMin = (now - new Date(t.timestamp).getTime()) / (60 * 1000);
        return ageMin <= maxAgeMinutes;
      });

      // Compute signal
      const signal = smartMoneyEngine.computeTokenSignal(
        windowTrades.length > 0 ? windowTrades : rawTrades,
        traderScores,
        {
          isTrending: meta.isTrending,
          fomoBuyersCount: meta.fomoBuyers,
        }
      );

      // Detect early entry cascade
      const earlyEntry = detectEarlyEntry(rawTrades, simpleScores);

      // Risk analysis
      const risk = evaluateTokenRisk({
        uniqueBuyers: signal.uniqueBuyers,
        uniqueSellers: signal.uniqueSellers,
        signalAgeMinutes: signal.signalAgeMinutes,
        hasVerifiedTrader: signal.uniqueVerifiedBuyers > 0,
        totalBuyVolume: signal.totalBuyVolume,
        totalSellVolume: signal.totalSellVolume,
      });

      if (signal.smartMoneyScore < minScore) continue;
      if (signal.uniqueBuyers < minTraders) continue;

      winningCoins.push({
        universalId: uId,
        address: meta.address,
        network: meta.network,
        symbol: meta.symbol,
        name: meta.name,
        priceUsd: meta.priceUsd,
        change24h: meta.change24h,
        marketCapUsd: meta.marketCapUsd,
        volume24hUsd: meta.volume24hUsd,
        smartMoneyScore: signal.smartMoneyScore,
        conviction: signal.conviction,
        signalState: signal.signalState,
        uniqueBuyers: signal.uniqueBuyers,
        uniqueSellers: signal.uniqueSellers,
        buyVolume: signal.totalBuyVolume,
        sellVolume: signal.totalSellVolume,
        netFlow: signal.netSmartMoneyFlow,
        averageTraderScore: signal.averageTraderScore,
        topTraderHandle: signal.topTraderHandle,
        topTraderScore: signal.topTraderScore,
        firstBuyer: earlyEntry.firstBuyer,
        firstBuyTime: earlyEntry.firstBuyTimeFormatted,
        latestBuyer: signal.latestBuyerHandle,
        accumulationWindowMinutes: earlyEntry.accumulationWindowMinutes,
        followingTradersCount: earlyEntry.followingTradersCount,
        hasAccumulation: earlyEntry.hasAccumulation,
        signalAgeMinutes: signal.signalAgeMinutes,
        riskLevel: risk.overallRisk,
        riskScore: risk.riskScore,
        riskWarnings: risk.warnings,
      });
    }

    // Default sort by smartMoneyScore descending
    winningCoins.sort((a, b) => b.smartMoneyScore - a.smartMoneyScore);

    // Assign ranks
    const rankedCoins = winningCoins.map((coin, index) => ({
      rank: index + 1,
      ...coin,
    }));

    return NextResponse.json({
      count: rankedCoins.length,
      coins: rankedCoins,
      filtersApplied: {
        chain: chainFilter || 'all',
        minScore,
        minTraders,
        timeWindow,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
