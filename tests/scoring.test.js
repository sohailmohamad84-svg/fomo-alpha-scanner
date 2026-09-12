const test = require('node:test');
const assert = require('node:assert');

const { TraderScorer, DEFAULT_TRADER_WEIGHTS } = require('../src/lib/scoring/trader-scorer');
const { SmartMoneyEngine } = require('../src/lib/scoring/smart-money-engine');
const { detectEarlyEntry } = require('../src/lib/scoring/early-entry');
const { normalizeTrade, createUniversalTokenId } = require('../src/lib/normalizer');

test('Trader Quality Scoring: Evaluates elite traders accurately', () => {
  const scorer = new TraderScorer();

  const eliteTrader = {
    handle: 'CryptoKaleo',
    displayName: 'K A L E O',
    pnlUsd: 250000,
    volumeUsd: 1500000,
    trades: 95,
    followers: 24000,
    verified: true,
    accountAgeDays: 360,
    averageHoldTimeSeconds: 48000,
    pnl: { '24h': 12000, '7d': 55000, '30d': 180000, all: 250000 },
  };

  const noviceTrader = {
    handle: 'NoviceBot',
    displayName: 'Novice',
    pnlUsd: 50,
    volumeUsd: 1200,
    trades: 4,
    followers: 10,
    verified: false,
    accountAgeDays: 3,
    averageHoldTimeSeconds: 300,
    pnl: { '24h': 0, '7d': 50, '30d': 50, all: 50 },
  };

  const eliteResult = scorer.calculateScore(eliteTrader);
  const noviceResult = scorer.calculateScore(noviceTrader);

  assert.ok(eliteResult.score >= 75, `Elite score must be >= 75, got ${eliteResult.score}`);
  assert.ok(noviceResult.score < 50, `Novice score must be < 50, got ${noviceResult.score}`);
  assert.ok(eliteResult.score > noviceResult.score, 'Elite trader must outscore novice trader');
});

test('Trader Universe Filter: Passes qualified traders and filters underperformers', () => {
  const scorer = new TraderScorer();
  const elite = {
    handle: 'ProTrader',
    pnlUsd: 150000,
    volumeUsd: 800000,
    trades: 50,
    followers: 5000,
    accountAgeDays: 180,
    verified: true,
  };
  const underperformer = {
    handle: 'LowVol',
    pnlUsd: 500,
    volumeUsd: 2000,
    trades: 2,
    followers: 12,
    accountAgeDays: 5,
    verified: false,
  };

  const passesElite = scorer.passesUniverseFilter(elite, 82);
  const passesUnder = scorer.passesUniverseFilter(underperformer, 35);

  assert.strictEqual(passesElite, true, 'Elite trader must pass universe filter');
  assert.strictEqual(passesUnder, false, 'Underperforming trader must fail universe filter');
});

test('Universal Token ID: Normalizes network and contract address', () => {
  const solToken = createUniversalTokenId('solana', 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
  const evmToken = createUniversalTokenId('robinhood', '0x39DBED3A8C6346294B2F15E839E5EC44AB217111');

  assert.strictEqual(solToken, 'SOLANA:DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263');
  assert.strictEqual(evmToken, 'ROBINHOOD:0x39dbed3a8c6346294b2f15e839e5ec44ab217111');
});

test('Smart Money Convergence: Detects multi-trader accumulation and early entry', () => {
  const engine = new SmartMoneyEngine();
  const now = Date.now();

  const traderScores = new Map([
    ['TraderA', { score: 92, verified: true }],
    ['TraderB', { score: 88, verified: true }],
    ['TraderC', { score: 85, verified: false }],
  ]);

  const rawTrades = [
    {
      tradeId: 't1',
      traderHandle: 'TraderA',
      tokenAddress: '0x39dbed3a8c6346294b2f15e839e5ec44ab217111',
      network: 'robinhood',
      symbol: 'PONS',
      name: 'Pons',
      side: 'BUY',
      amount: 100000,
      priceUsd: 0.041,
      valueUsd: 15000,
      timestamp: new Date(now - 14 * 60 * 1000), // 14m ago
    },
    {
      tradeId: 't2',
      traderHandle: 'TraderB',
      tokenAddress: '0x39dbed3a8c6346294b2f15e839e5ec44ab217111',
      network: 'robinhood',
      symbol: 'PONS',
      name: 'Pons',
      side: 'BUY',
      amount: 120000,
      priceUsd: 0.042,
      valueUsd: 20000,
      timestamp: new Date(now - 8 * 60 * 1000), // 8m ago
    },
    {
      tradeId: 't3',
      traderHandle: 'TraderC',
      tokenAddress: '0x39dbed3a8c6346294b2f15e839e5ec44ab217111',
      network: 'robinhood',
      symbol: 'PONS',
      name: 'Pons',
      side: 'BUY',
      amount: 80000,
      priceUsd: 0.043,
      valueUsd: 12000,
      timestamp: new Date(now - 2 * 60 * 1000), // 2m ago
    },
  ];

  const signal = engine.computeTokenSignal(rawTrades, traderScores, { isTrending: true, fomoBuyersCount: 35 });

  assert.ok(signal.smartMoneyScore >= 70, `Convergence score should be >= 70, got ${signal.smartMoneyScore}`);
  assert.strictEqual(signal.uniqueBuyers, 3);
  assert.strictEqual(signal.signalState, 'HIGH_CONVICTION');

  // Test Early Entry Detection
  const simpleScores = new Map([['TraderA', 92], ['TraderB', 88], ['TraderC', 85]]);
  const earlyEntry = detectEarlyEntry(rawTrades, simpleScores);

  assert.strictEqual(earlyEntry.hasAccumulation, true);
  assert.strictEqual(earlyEntry.firstBuyer, 'TraderA');
  assert.strictEqual(earlyEntry.followingTradersCount, 2);
  assert.strictEqual(earlyEntry.accumulationWindowMinutes, 12);
});

test('Smart Money Engine: Deducts points and triggers warning on heavy selling', () => {
  const engine = new SmartMoneyEngine();
  const now = Date.now();

  const traderScores = new Map([
    ['DumpingTrader', { score: 65, verified: false }],
    ['Seller2', { score: 70, verified: false }],
  ]);

  const sellTrades = [
    {
      tradeId: 's1',
      traderHandle: 'DumpingTrader',
      tokenAddress: '0x55bc328c6346294b2f15e839e5ec44ab217133',
      network: 'bsc',
      symbol: 'VORTEX',
      name: 'Vortex',
      side: 'SELL',
      amount: 50000,
      priceUsd: 0.88,
      valueUsd: 44000,
      timestamp: new Date(now - 5 * 60 * 1000),
    },
    {
      tradeId: 's2',
      traderHandle: 'Seller2',
      tokenAddress: '0x55bc328c6346294b2f15e839e5ec44ab217133',
      network: 'bsc',
      symbol: 'VORTEX',
      name: 'Vortex',
      side: 'SELL',
      amount: 30000,
      priceUsd: 0.87,
      valueUsd: 26100,
      timestamp: new Date(now - 2 * 60 * 1000),
    },
  ];

  const signal = engine.computeTokenSignal(sellTrades, traderScores);

  assert.ok(signal.riskWarnings.includes('HEAVY_SMART_MONEY_SELLING'), 'Must flag HEAVY_SMART_MONEY_SELLING');
  assert.strictEqual(signal.signalState, 'EXIT');
});
