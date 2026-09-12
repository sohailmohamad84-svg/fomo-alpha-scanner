import { PrismaClient } from '@prisma/client';
import { MOCK_TRADERS, MOCK_TOKENS, MOCK_TRADES } from '../src/lib/fomo/mock-data';
import { traderScorer } from '../src/lib/scoring/trader-scorer';
import { smartMoneyEngine } from '../src/lib/scoring/smart-money-engine';
import { normalizeTrade, createUniversalTokenId } from '../src/lib/normalizer';
import { detectEarlyEntry } from '../src/lib/scoring/early-entry';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting FOMO Alpha Scanner Database Seeding...');

  // Clear existing demo records
  await prisma.simulationTrade.deleteMany();
  await prisma.portfolioSimulation.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.trade.deleteMany();
  await prisma.position.deleteMany();
  await prisma.tokenSignalEvent.deleteMany();
  await prisma.tokenSignal.deleteMany();
  await prisma.token.deleteMany();
  await prisma.traderSnapshot.deleteMany();
  await prisma.traderScore.deleteMany();
  await prisma.trader.deleteMany();

  console.log('  Cleaned old tables.');

  // 1. Seed Traders
  const traderRecordMap = new Map<string, any>();
  const traderScoreMap = new Map<string, { score: number; rank: number; verified: boolean }>();
  const simpleScoreMap = new Map<string, number>();

  for (const t of MOCK_TRADERS) {
    const scoreResult = traderScorer.calculateScore(t);
    traderScoreMap.set(t.handle, { score: scoreResult.score, rank: t.rank, verified: t.verified });
    simpleScoreMap.set(t.handle, scoreResult.score);

    const record = await prisma.trader.create({
      data: {
        handle: t.handle,
        displayName: t.displayName,
        verified: t.verified,
        solanaWallet: t.wallets.solana || null,
        evmWallet: t.wallets.evm || null,
        pnl24h: Math.round(t.pnlUsd * 0.05),
        pnl7d: Math.round(t.pnlUsd * 0.25),
        pnl30d: Math.round(t.pnlUsd * 0.7),
        pnlAll: t.pnlUsd,
        volumeUsd: t.volumeUsd,
        tradesCount: t.trades,
        followersCount: t.followers,
        holdingsCount: t.holdings,
        accountAgeDays: 360,
        qualityScore: scoreResult.score,
      },
    });

    traderRecordMap.set(t.handle, record);

    await prisma.traderScore.create({
      data: {
        traderId: record.id,
        traderHandle: record.handle,
        score: scoreResult.score,
        pnlScore: scoreResult.pnlScore,
        consistencyScore: scoreResult.consistencyScore,
        recencyScore: scoreResult.recentScore,
        activityScore: scoreResult.activityScore,
        accountAgeScore: scoreResult.accountAgeScore,
        verifiedBonus: scoreResult.verifiedScore,
        volumeScore: scoreResult.volumeScore,
        holdingScore: scoreResult.holdingScore,
        weightsUsed: JSON.stringify(traderScorer.getWeights()),
      },
    });
  }
  console.log(`  Seeded ${MOCK_TRADERS.length} traders with quality scores.`);

  // 2. Seed Tokens
  const tokenRecordMap = new Map<string, any>();
  for (const tok of MOCK_TOKENS) {
    const uId = createUniversalTokenId(tok.network, tok.token.address);
    const tokenRecord = await prisma.token.create({
      data: {
        universalId: uId,
        address: tok.token.address,
        network: tok.network,
        symbol: tok.token.symbol,
        name: tok.token.name,
        priceUsd: tok.priceUsd,
        change24h: tok.change24h,
        marketCapUsd: tok.marketCapUsd,
        volume24hUsd: tok.volume24hUsd,
        holdersCount: tok.holders,
        fomoBuyersCount: tok.fomoBuyers,
        fomoRank: tok.rank,
        isTrending: true,
      },
    });
    tokenRecordMap.set(uId, tokenRecord);
  }
  console.log(`  Seeded ${MOCK_TOKENS.length} tokens.`);

  // 3. Seed Trades & Calculate Signals
  const tradesForTokens = new Map<string, any[]>();

  for (const rawTrade of MOCK_TRADES) {
    const traderHandle = rawTrade.tradeId?.includes('pons')
      ? rawTrade.tradeId === 'tr_pons_1'
        ? 'CryptoKaleo'
        : rawTrade.tradeId === 'tr_pons_2'
        ? 'ansem'
        : rawTrade.tradeId === 'tr_pons_3'
        ? 'theveeman'
        : 'murad'
      : rawTrade.tradeId?.includes('solai')
      ? rawTrade.tradeId === 'tr_solai_1'
        ? 'CryptoKaleo'
        : 'ansem'
      : 'gigachad_trader';

    const norm = normalizeTrade(rawTrade, traderHandle);
    const traderRec = traderRecordMap.get(traderHandle) || Array.from(traderRecordMap.values())[0];
    const tokenRec = tokenRecordMap.get(norm.universalId) || Array.from(tokenRecordMap.values())[0];

    await prisma.trade.create({
      data: {
        tradeId: norm.tradeId,
        traderId: traderRec.id,
        traderHandle: norm.traderHandle,
        tokenId: tokenRec.id,
        tokenAddress: norm.tokenAddress,
        network: norm.network,
        side: norm.side,
        amount: norm.amount,
        priceUsd: norm.priceUsd,
        valueUsd: norm.valueUsd,
        realizedPnlUsd: norm.realizedPnlUsd,
        unrealizedPnlUsd: norm.unrealizedPnlUsd,
        timestamp: norm.timestamp,
        source: norm.source,
      },
    });

    if (!tradesForTokens.has(tokenRec.id)) {
      tradesForTokens.set(tokenRec.id, []);
    }
    tradesForTokens.get(tokenRec.id)!.push(norm);
  }
  console.log(`  Seeded ${MOCK_TRADES.length} trades.`);

  // 4. Compute and seed TokenSignals
  for (const [tokenId, tokenTrades] of tradesForTokens.entries()) {
    const tokenRec = Array.from(tokenRecordMap.values()).find((t) => t.id === tokenId);
    if (!tokenRec) continue;

    const signal = smartMoneyEngine.computeTokenSignal(tokenTrades, traderScoreMap, {
      isTrending: tokenRec.isTrending,
      fomoBuyersCount: tokenRec.fomoBuyersCount,
    });

    const earlyEntry = detectEarlyEntry(tokenTrades, simpleScoreMap);

    const signalRecord = await prisma.tokenSignal.create({
      data: {
        tokenId: tokenRec.id,
        tokenAddress: tokenRec.address,
        network: tokenRec.network,
        smartMoneyScore: signal.smartMoneyScore,
        conviction: signal.conviction,
        signalState: signal.signalState,
        uniqueBuyers: signal.uniqueBuyers,
        uniqueHighQuality: signal.uniqueHighQualityBuyers,
        uniqueVerified: signal.uniqueVerifiedBuyers,
        uniqueSellers: signal.uniqueSellers,
        totalBuyVolume: signal.totalBuyVolume,
        totalSellVolume: signal.totalSellVolume,
        netSmartMoneyFlow: signal.netSmartMoneyFlow,
        averageTraderScore: signal.averageTraderScore,
        topTraderHandle: signal.topTraderHandle,
        topTraderScore: signal.topTraderScore,
        firstBuyerHandle: earlyEntry.firstBuyer,
        firstBuyerTime: earlyEntry.firstBuyTime,
        latestBuyerHandle: signal.latestBuyerHandle,
        latestBuyerTime: signal.latestBuyerTime,
        accumulationWindowMin: earlyEntry.accumulationWindowMinutes,
        signalAgeMinutes: signal.signalAgeMinutes,
        riskWarning: JSON.stringify(signal.riskWarnings),
        scoreBreakdown: JSON.stringify(signal.breakdown),
      },
    });

    await prisma.tokenSignalEvent.create({
      data: {
        signalId: signalRecord.id,
        previousScore: 0,
        newScore: signal.smartMoneyScore,
        previousState: 'WATCH',
        newState: signal.signalState,
        triggerReason: `Initial convergence calculation: ${signal.uniqueBuyers} buyers detected`,
      },
    });
  }
  console.log('  Calculated and seeded TokenSignals.');

  // 5. Seed Paper Portfolio & Simulated Positions
  const defaultSim = await prisma.portfolioSimulation.create({
    data: {
      name: 'Alpha High Conviction Paper Portfolio',
      initialCapitalUsd: 10000,
      currentCapitalUsd: 10418,
      availableCashUsd: 9000,
      investedUsd: 1000,
      realizedPnlUsd: 0,
      unrealizedPnlUsd: 418,
      totalPnlUsd: 418,
      roiPercent: 4.18,
      winRate: 80.0,
      totalTrades: 5,
      winningTrades: 4,
      losingTrades: 1,
      maxDrawdown: 4.2,
      sharpeRatio: 2.14,
      activePositions: 1,
    },
  });

  const ponsToken = Array.from(tokenRecordMap.values()).find((t) => t.symbol === 'PONS');
  if (ponsToken) {
    await prisma.simulationTrade.create({
      data: {
        simulationId: defaultSim.id,
        tokenId: ponsToken.id,
        tokenAddress: ponsToken.address,
        network: ponsToken.network,
        symbol: ponsToken.symbol,
        side: 'BUY',
        status: 'OPEN',
        entryPriceUsd: 0.038,
        quantity: 26315.79,
        investmentUsd: 1000,
        currentValueUsd: 1418,
        unrealizedPnlUsd: 418,
        stopLossPrice: 0.0342,
        takeProfitPrice: 0.0532,
        trailingStopPrice: 0.0394,
        highestPriceUsd: 0.0428,
        entrySignalScore: 92,
        entryReason: 'Smart Money Convergence: 4 top traders accumulated within 18 minutes',
        tradersInvolved: JSON.stringify(['CryptoKaleo', 'ansem', 'theveeman', 'murad']),
      },
    });
  }
  console.log('  Seeded Paper Trading Portfolio and Positions.');

  // 6. Seed Alerts
  await prisma.alert.createMany({
    data: [
      {
        type: 'SMART_MONEY_ACCUMULATION',
        severity: 'SUCCESS',
        title: '🔥 Smart Money Accumulation: $PONS',
        message: '4 top traders (@CryptoKaleo, @ansem, @theveeman, @murad) accumulated $65.5K within 18 minutes on Robinhood Chain.',
        tokenAddress: '0x39dbed3a8c6346294b2f15e839e5ec44ab217111',
        network: 'robinhood',
        score: 92,
        isRead: false,
      },
      {
        type: 'TOP_TRADER_BUYS',
        severity: 'INFO',
        title: '⭐ Top Trader Buy: @ansem bought $SOLAI',
        message: '@ansem entered $SOLAI ($13.2K size) on Solana. Trader Quality Score: 88/100.',
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        network: 'solana',
        traderHandle: 'ansem',
        score: 78,
        isRead: false,
      },
      {
        type: 'SMART_MONEY_SELLING',
        severity: 'WARNING',
        title: '⚠ Exit Warning: Smart Money Offloading $VORTEX',
        message: 'Tracked traders begun closing positions on $VORTEX on BSC. Net smart money flow turned negative.',
        tokenAddress: '0x55bc328c6346294b2f15e839e5ec44ab217133',
        network: 'bsc',
        score: 34,
        isRead: true,
      },
    ],
  });
  console.log('  Seeded Alpha Alerts.');

  console.log('✅ Database Seeding Completed Successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
