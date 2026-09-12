const test = require('node:test');
const assert = require('node:assert');

const { traderDNAService } = require('../src/lib/dna/trader-dna');
const { evaluateTraderRegime } = require('../src/lib/dna/trader-regime');
const { evaluateAccountMaturity } = require('../src/lib/dna/account-maturity');
const { copySignalScorer } = require('../src/lib/scoring/copy-signal-scorer');
const { thesisEngine } = require('../src/lib/thesis/thesis-engine');
const { narrativeEngine } = require('../src/lib/narrative/narrative-engine');
const { holderEngine } = require('../src/lib/holders/holder-engine');
const { dualStreamManager } = require('../src/lib/realtime/dual-stream');
const { positionBuildingDetector } = require('../src/lib/scoring/position-building');
const { notificationEngine } = require('../src/lib/notifications/notification-engine');
const { winnerHunterEngine } = require('../src/lib/winner-hunter/winner-hunter');
const { chainSpecializer } = require('../src/lib/chains/chain-specializer');
const { alphaEngineV3 } = require('../src/lib/scoring/alpha-v3');
const { walkForwardBacktester } = require('../src/lib/research/walk-forward-backtester');
const { apiBudgetManager } = require('../src/lib/budget/api-budget-manager');

// Scenario 86: Thesis Convergence
test('Scenario 86: Thesis Convergence produces High Narrative and High Alpha', () => {
  const traderScores = new Map([
    ['CryptoKaleo', { score: 92, copyScore: 88, verified: true }],
    ['ansem', { score: 95, copyScore: 92, verified: true }],
    ['murad', { score: 90, copyScore: 86, verified: false }],
  ]);

  const theses = [
    thesisEngine.evaluateThesis({
      tokenAddress: '0x1111',
      network: 'robinhood',
      symbol: 'ALPHA',
      traderHandle: 'CryptoKaleo',
      content: 'Robinhood Chain gaming ecosystem token with accelerating on-chain volume.',
      positionSizeUsd: 25000,
      traderEquityUsd: 200000,
    }),
    thesisEngine.evaluateThesis({
      tokenAddress: '0x1111',
      network: 'robinhood',
      symbol: 'ALPHA',
      traderHandle: 'ansem',
      content: 'Gaming ecosystem on Robinhood Chain is breaking out. First mover positioning.',
      positionSizeUsd: 30000,
      traderEquityUsd: 250000,
    }),
    thesisEngine.evaluateThesis({
      tokenAddress: '0x1111',
      network: 'robinhood',
      symbol: 'ALPHA',
      traderHandle: 'murad',
      content: 'Robinhood gaming arcade token. High conviction entry.',
      positionSizeUsd: 20000,
      traderEquityUsd: 150000,
    }),
  ];

  const clusters = narrativeEngine.clusterTheses(theses, traderScores);
  assert.ok(clusters.length > 0, 'Narrative cluster generated');
  assert.ok(clusters[0].narrativeScore >= 70, 'Narrative score is HIGH');
  assert.strictEqual(clusters[0].eliteTraderCount, 3, 'All 3 elite traders clustered');

  const alphaResult = alphaEngineV3.compute({
    tokenAddress: '0x1111',
    network: 'robinhood',
    symbol: 'ALPHA',
    name: 'Alpha Token',
    priceUsd: 0.05,
    trades: [
      { traderHandle: 'CryptoKaleo', side: 'BUY', valueUsd: 25000, priceUsd: 0.05, timestamp: new Date() },
      { traderHandle: 'ansem', side: 'BUY', valueUsd: 30000, priceUsd: 0.05, timestamp: new Date() },
      { traderHandle: 'murad', side: 'BUY', valueUsd: 20000, priceUsd: 0.05, timestamp: new Date() },
    ],
    traderScores,
    narrativeCluster: clusters[0],
  });

  assert.ok(alphaResult.alphaScore >= 75, 'Alpha Score reaches Strong Buy / Early Alpha');
  assert.strictEqual(alphaResult.signalCategory, 'STRONG_BUY');
});

// Scenario 87: Empty Thesis
test('Scenario 87: Empty thesis still yields strong convergence without over-penalization', () => {
  const traderScores = new Map([
    ['CryptoKaleo', { score: 90, copyScore: 85, verified: true }],
    ['ansem', { score: 92, copyScore: 88, verified: true }],
  ]);

  const alphaResult = alphaEngineV3.compute({
    tokenAddress: '0x2222',
    network: 'solana',
    symbol: 'QUIET',
    name: 'Quiet Token',
    priceUsd: 1.0,
    trades: [
      { traderHandle: 'CryptoKaleo', side: 'BUY', valueUsd: 15000, priceUsd: 1.0, timestamp: new Date() },
      { traderHandle: 'ansem', side: 'BUY', valueUsd: 20000, priceUsd: 1.0, timestamp: new Date() },
    ],
    traderScores,
    narrativeCluster: null, // No thesis
  });

  assert.ok(alphaResult.alphaScore >= 60, 'Maintains solid score based on pure convergence flow');
  assert.ok(alphaResult.components.convergenceContribution >= 10, 'Convergence points awarded');
  assert.ok(alphaResult.explanation.why.includes('without published narrative'));
});

// Scenario 88: Late Entry
test('Scenario 88: Extended price movement triggers LATE classification and chase penalty', () => {
  const traderScores = new Map([['ansem', { score: 90, copyScore: 85, verified: true }]]);

  const alphaResult = alphaEngineV3.compute({
    tokenAddress: '0x3333',
    network: 'robinhood',
    symbol: 'PUMPED',
    name: 'Pumped Token',
    initialSignalPriceUsd: 0.02,
    priceUsd: 0.035, // +75% increase
    trades: [{ traderHandle: 'ansem', side: 'BUY', valueUsd: 10000, priceUsd: 0.035, timestamp: new Date() }],
    traderScores,
  });

  assert.strictEqual(alphaResult.signalCategory, 'LATE', 'Classified as LATE due to price extension');
  assert.ok(alphaResult.explanation.tooLateAnalysis.isLate, 'Too late analysis flagged as true');
});

// Scenario 89: Smart-Money Distribution
test('Scenario 89: Heavy smart-money selling triggers Distribution and Exit Warning', () => {
  const traderScores = new Map([
    ['CryptoKaleo', { score: 88, copyScore: 85, verified: true }],
    ['ansem', { score: 90, copyScore: 86, verified: true }],
  ]);

  const holderEval = holderEngine.evaluateTokenHolders(
    '0x4444',
    'robinhood',
    [
      { address: 'w1', traderHandle: 'CryptoKaleo', balance: 0, previousBalance: 50000, valueUsd: 0 },
      { address: 'w2', traderHandle: 'ansem', balance: 5000, previousBalance: 50000, valueUsd: 500 },
    ],
    traderScores
  );

  assert.ok(holderEval.metrics.distributionScore >= 40, 'Distribution score elevated');
  assert.ok(holderEval.metrics.isDistributing, 'Flagged as distributing');

  const alphaResult = alphaEngineV3.compute({
    tokenAddress: '0x4444',
    network: 'robinhood',
    symbol: 'DUMP',
    name: 'Dump Token',
    priceUsd: 0.01,
    trades: [
      { traderHandle: 'CryptoKaleo', side: 'SELL', valueUsd: 40000, priceUsd: 0.01, timestamp: new Date() },
      { traderHandle: 'ansem', side: 'SELL', valueUsd: 35000, priceUsd: 0.01, timestamp: new Date() },
    ],
    traderScores,
    holderMetrics: holderEval.metrics,
  });

  assert.strictEqual(alphaResult.signalCategory, 'EXIT_WARNING', 'Signal category is EXIT_WARNING');
  assert.strictEqual(alphaResult.explanation.whoIsExiting.exitSeverity, 'MAJOR');
});

// Scenario 90: Young Winner (Rising Talent)
test('Scenario 90: Young account with excellent performance classified as Rising Talent', () => {
  const maturity = evaluateAccountMaturity({
    accountAgeDays: 32,
    tradesCount: 14,
    pnlAll: 28500,
    volumeUsd: 145000,
  });

  assert.strictEqual(maturity.maturity, 'Rising Talent', 'Recognized as Rising Talent');
  assert.ok(maturity.score >= 80, 'Score is high despite youth');
});

// Scenario 91: False Whale
test('Scenario 91: Isolated low-quality whale buy does not produce strong convergence', () => {
  const traderScores = new Map([['random_whale', { score: 42, copyScore: 40, verified: false }]]);

  const alphaResult = alphaEngineV3.compute({
    tokenAddress: '0x5555',
    network: 'ethereum',
    symbol: 'WHALE',
    name: 'Whale Token',
    priceUsd: 1.0,
    trades: [{ traderHandle: 'random_whale', side: 'BUY', valueUsd: 500000, priceUsd: 1.0, timestamp: new Date() }],
    traderScores,
  });

  assert.ok(alphaResult.alphaScore < 60, 'Alpha score is below BUY threshold');
  assert.notStrictEqual(alphaResult.signalCategory, 'STRONG_BUY');
});

// Scenario 92: Position Building
test('Scenario 92: Starter buy followed by larger conviction buy triggers Position Building', () => {
  const result = positionBuildingDetector.analyzeTraderBuys([
    {
      tokenAddress: '0x6666',
      network: 'robinhood',
      symbol: 'ACCUM',
      traderHandle: 'CryptoKaleo',
      valueUsd: 1500,
      timestamp: new Date(Date.now() - 30 * 60000),
    },
    {
      tokenAddress: '0x6666',
      network: 'robinhood',
      symbol: 'ACCUM',
      traderHandle: 'CryptoKaleo',
      valueUsd: 22000,
      timestamp: new Date(Date.now() - 10 * 60000),
      hasThesis: true,
    },
  ]);

  assert.ok(result !== null, 'Position building detected');
  assert.ok(result.positionBuildingScore >= 70, 'Building score elevated');
  assert.strictEqual(result.stage, 'FULL_CONVICTION');
});

// Scenario 94: Stream Delay
test('Scenario 94: Dual-Stream measures empirical CrowdDelta between on-chain and feed', () => {
  const now = Date.now();
  dualStreamManager.registerOnChainEvent({
    id: 'tx_1',
    tokenAddress: '0x7777',
    network: 'robinhood',
    traderHandle: 'ansem',
    valueUsd: 10000,
    timestamp: new Date(now - 15000), // 15 seconds earlier
  });

  const feedMetrics = dualStreamManager.registerFeedEvent({
    id: 'feed_1',
    tokenAddress: '0x7777',
    network: 'robinhood',
    traderHandle: 'ansem',
    valueUsd: 10000,
    timestamp: new Date(now),
  });

  assert.ok(feedMetrics.observedLatencySec >= 14 && feedMetrics.observedLatencySec <= 16, 'CrowdDelta measured at ~15s');
  assert.strictEqual(feedMetrics.isEarlyAlpha, true, 'Early alpha flag active');
});

// Walk-Forward Backtester
test('Walk-Forward Backtester executes 3-way segment validation without look-ahead bias', () => {
  const experiment = walkForwardBacktester.runExperiment({
    strategyFlavor: 'CONVERGENCE_THESIS_HOLDER',
    entryDelaySeconds: 15,
    slippagePct: 0.5,
  });

  assert.ok(experiment.inSample.returnPct > 0, 'In-sample return positive');
  assert.ok(experiment.outOfSample.tradesCount > 0, 'Out-of-sample trades evaluated');
  assert.ok(experiment.latencyImpactCurve.length === 5, 'Latency curve computed across delays');
  assert.ok(experiment.featureImportance.length >= 5, 'Feature attribution ranked');
});

// Adaptive API Budgeting
test('Adaptive API Budgeting preserves credits on low quality traders and approves high conviction', () => {
  const lowQualityDecision = apiBudgetManager.evaluateTraderEnrichment('low_trader', 45, false);
  assert.strictEqual(lowQualityDecision.allowed, false, 'Low quality trader profile fetch skipped');

  const eliteDecision = apiBudgetManager.evaluateTraderEnrichment('elite_trader', 88, true);
  assert.strictEqual(eliteDecision.allowed, true, 'Elite trader profile fetch approved');
});
