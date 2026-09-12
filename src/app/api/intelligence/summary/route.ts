import { NextRequest, NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { traderScorer } from '@/lib/scoring/trader-scorer';
import { copySignalScorer } from '@/lib/scoring/copy-signal-scorer';
import { narrativeEngine } from '@/lib/narrative/narrative-engine';
import { thesisEngine } from '@/lib/thesis/thesis-engine';
import { winnerHunterEngine } from '@/lib/winner-hunter/winner-hunter';
import { chainSpecializer } from '@/lib/chains/chain-specializer';
import { alphaEngineV3 } from '@/lib/scoring/alpha-v3';
import { dualStreamManager } from '@/lib/realtime/dual-stream';
import { MOCK_TOKENS } from '@/lib/fomo/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const selectedChain = searchParams.get('chain') || 'all';

    // 1. Fetch live leaderboard
    const leaderboard = await fomoClient.getLeaderboard('24h', 50);

    const traderScores = new Map<string, { score: number; copyScore: number; verified: boolean }>();
    leaderboard.traders.forEach((t) => {
      const score = traderScorer.calculateScore(t).score;
      const copyPerf = copySignalScorer.evaluateTrader(t.handle, score);
      traderScores.set(t.handle, { score, copyScore: copyPerf.copyScore, verified: t.verified });
    });

    // 2. Synthesize seed theses across tokens
    const sampleTheses = [
      thesisEngine.evaluateThesis({
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pHMM1',
        network: 'solana',
        symbol: 'HMM',
        traderHandle: 'CryptoKaleo',
        content: 'whoever anyone else on here thinks they are, i am hmm to billions',
        positionSizeUsd: 19820,
        traderEquityUsd: 347092,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: '0x39dbed3a4c25b81b854930be628178e63a8e7e7a',
        network: 'robinhood',
        symbol: 'ROBIN',
        traderHandle: 'CryptoKaleo',
        content: 'Robinhood Chain flagship ecosystem meme. Huge liquidity inflow, first-mover community takeover.',
        positionSizeUsd: 35000,
        traderEquityUsd: 250000,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: '0x39dbed3a4c25b81b854930be628178e63a8e7e7a',
        network: 'robinhood',
        symbol: 'ROBIN',
        traderHandle: 'ansem',
        content: 'Accumulating ROBIN on Robinhood Chain. Sizing up after initial breakout confirmation.',
        positionSizeUsd: 42000,
        traderEquityUsd: 300000,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        network: 'solana',
        symbol: 'BONK',
        traderHandle: 'murad',
        content: 'Solana memecoin breakout. Massive liquidity depth, viral social engagement.',
        positionSizeUsd: 30000,
        traderEquityUsd: 200000,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: '0x7fe995e8b4e43b171701a5e1d743a1a1f3fa1111',
        network: 'robinhood',
        symbol: 'NEO',
        traderHandle: 'theveeman',
        content: 'Robinhood Chain AI autonomous agent narrative token. Fresh launch with high velocity.',
        positionSizeUsd: 18000,
        traderEquityUsd: 140000,
      }),
    ];

    // 3. Cluster Theses into Narrative Radar
    const narrativeClusters = narrativeEngine.clusterTheses(sampleTheses, traderScores);

    // 4. Compute Alpha Score V3 for all active tokens
    const alphaOpportunities = MOCK_TOKENS.filter((t) => {
      if (selectedChain === 'all') return true;
      return t.network.toLowerCase() === selectedChain.toLowerCase();
    }).map((tok) => {
      const isRobin = tok.token.symbol === 'ROBIN';
      const isBonk = tok.token.symbol === 'BONK';

      const simulatedTrades = [
        {
          traderHandle: isRobin ? 'CryptoKaleo' : isBonk ? 'ansem' : 'theveeman',
          side: 'BUY',
          valueUsd: isRobin ? 35000 : 20000,
          priceUsd: tok.priceUsd * 0.98,
          timestamp: new Date(Date.now() - 15 * 60000),
        },
        {
          traderHandle: isRobin ? 'ansem' : isBonk ? 'murad' : 'CryptoKaleo',
          side: 'BUY',
          valueUsd: isRobin ? 42000 : 25000,
          priceUsd: tok.priceUsd * 0.99,
          timestamp: new Date(Date.now() - 8 * 60000),
        },
      ];

      const matchingNarrative = narrativeClusters.find((n) =>
        n.tokenAddresses.includes(tok.token.address)
      );

      const dualStream = dualStreamManager.registerFeedEvent({
        id: `feed_${tok.token.address}_${Date.now()}`,
        tokenAddress: tok.token.address,
        network: tok.network,
        traderHandle: isRobin ? 'CryptoKaleo' : 'ansem',
        valueUsd: 35000,
        timestamp: new Date(Date.now() - 15 * 60000),
      });

      return alphaEngineV3.compute({
        tokenAddress: tok.token.address,
        network: tok.network,
        symbol: tok.token.symbol,
        name: tok.token.name,
        priceUsd: tok.priceUsd,
        initialSignalPriceUsd: tok.priceUsd * (isRobin ? 0.96 : 0.98),
        trades: simulatedTrades,
        traderScores,
        narrativeCluster: matchingNarrative || null,
        dualStream,
        tokenContext: {
          isTrending: true,
          fomoBuyersCount: tok.fomoBuyers,
          liquidityUsd: 250000,
        },
      });
    }).sort((a, b) => b.alphaScore - a.alphaScore);

    // 5. Aggregate Winner Hunter Next Moves
    const nextMoves = winnerHunterEngine.aggregateNextMoves();

    // 6. Chain Dominance
    const chainStats = chainSpecializer.getAllChains();
    const dominantChain = chainSpecializer.getDominantChain();

    // 7. Accumulation Matrix data (Top 5 traders x Top 5 tokens)
    const topTraders = leaderboard.traders.slice(0, 5).map((t) => t.handle);
    const topTokens = alphaOpportunities.slice(0, 5).map((t) => t.symbol);
    const matrixGrid = topTraders.map((trader) => {
      return {
        trader,
        cells: topTokens.map((sym, idx) => {
          if (idx === 0 && (trader === 'CryptoKaleo' || trader === 'ansem')) {
            return { action: 'ADD', intensity: 90 };
          }
          if (idx === 1 && trader === 'murad') {
            return { action: 'BUY', intensity: 80 };
          }
          if (idx === 4 && trader === 'theveeman') {
            return { action: 'EXIT', intensity: 65 };
          }
          return { action: 'HOLD', intensity: 40 };
        }),
      };
    });

    return NextResponse.json({
      opportunities: alphaOpportunities,
      narratives: narrativeClusters,
      nextMoves,
      chains: chainStats,
      dominantChain,
      accumulationMatrix: {
        traders: topTraders,
        tokens: topTokens,
        rows: matrixGrid,
      },
      telemetry: {
        activeTraders: leaderboard.traders.length,
        averageLatencySec: dualStreamManager.getAverageLatencySec(),
        streamStatus: 'LIVE',
        strategyVersion: alphaEngineV3.STRATEGY_VERSION,
        scoringVersion: alphaEngineV3.SCORING_VERSION,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
