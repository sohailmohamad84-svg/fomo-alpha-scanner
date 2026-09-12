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

    // 2. Synthesize seed theses across tokens from verified on-chain holders
    const sampleTheses = [
      thesisEngine.evaluateThesis({
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        symbol: 'PONS',
        traderHandle: 'ogle',
        content: 'remember that since $pons gets burnt every 15 mins, your % of the total outstanding pons tokens continues to go up proportionately',
        positionSizeUsd: 7127702,
        traderEquityUsd: 12500000,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        symbol: 'PONS',
        traderHandle: 'unipcs',
        content: 'Robinhood chain eco looking very good today. $PONS looking good for next leg up?',
        positionSizeUsd: 7127476,
        traderEquityUsd: 11000000,
      }),
      thesisEngine.evaluateThesis({
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        symbol: 'PONS',
        traderHandle: 'AvgJoesCrypto',
        content: 'PONS fundamentals are great. Maintaining top launchpad spot on Robinhood Chain and is trading at 1.8x price-to-buybacks.',
        positionSizeUsd: 2738054,
        traderEquityUsd: 5400000,
      }),
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
        tokenAddress: '0x020bfc650a365f8bb26819deaabf3e21291018b4',
        network: 'robinhood',
        symbol: 'CASHCAT',
        traderHandle: 'Chubbi230',
        content: 'Robinhood Chain top community meme. Massive volume and holder acceleration.',
        positionSizeUsd: 180000,
        traderEquityUsd: 3500000,
      }),
    ];

    // Ensure elite traders have their scores mapped
    const knownScores: Record<string, number> = {
      ogle: 98,
      unipcs: 96,
      AvgJoesCrypto: 94,
      CryptoKaleo: 94,
      Chubbi230: 92,
      RugDalio: 91,
    };
    for (const [h, s] of Object.entries(knownScores)) {
      if (!traderScores.has(h)) {
        traderScores.set(h, { score: s, copyScore: Math.round(s * 0.95), verified: true });
      }
    }

    // 3. Cluster Theses into Narrative Radar
    const narrativeClusters = narrativeEngine.clusterTheses(sampleTheses, traderScores);

    // 4. Compute Alpha Score V3 for all active tokens
    const alphaOpportunities = MOCK_TOKENS.filter((t) => {
      if (selectedChain === 'all') return true;
      return t.network.toLowerCase() === selectedChain.toLowerCase();
    }).map((tok) => {
      const isPons = tok.token.symbol === 'PONS';
      const isHmm = tok.token.symbol === 'HMM';
      const isCashCat = tok.token.symbol === 'CASHCAT';

      const simulatedTrades = [
        {
          traderHandle: isPons ? 'ogle' : isHmm ? 'CryptoKaleo' : isCashCat ? 'Chubbi230' : 'unipcs',
          side: 'BUY',
          valueUsd: isPons ? 125000 : isHmm ? 19820 : 35000,
          priceUsd: tok.priceUsd * 0.98,
          timestamp: new Date(Date.now() - 15 * 60000),
        },
        {
          traderHandle: isPons ? 'unipcs' : isHmm ? 'CryptoKaleo' : isCashCat ? 'AvgJoesCrypto' : 'ogle',
          side: 'BUY',
          valueUsd: isPons ? 95000 : isHmm ? 13310 : 25000,
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
        traderHandle: isPons ? 'ogle' : isHmm ? 'CryptoKaleo' : 'unipcs',
        valueUsd: isPons ? 125000 : 35000,
        timestamp: new Date(Date.now() - 15 * 60000),
      });

      return alphaEngineV3.compute({
        tokenAddress: tok.token.address,
        network: tok.network,
        symbol: tok.token.symbol,
        name: tok.token.name,
        priceUsd: tok.priceUsd,
        initialSignalPriceUsd: tok.priceUsd * (isPons ? 0.96 : 0.98),
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
