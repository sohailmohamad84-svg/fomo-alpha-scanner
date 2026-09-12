const test = require('node:test');
const assert = require('node:assert');

const { PaperTradingEngine, DEFAULT_PAPER_CONFIG } = require('../src/lib/simulator/paper-trading');

test('Paper Trading Engine: Evaluates signal entry with strict risk rules', () => {
  const engine = new PaperTradingEngine();

  // Test qualifying signal
  const validEntry = engine.evaluateSignalForEntry({
    tokenAddress: '0x1234567890abcdef',
    network: 'solana',
    symbol: 'ALPHA',
    priceUsd: 1.0,
    smartMoneyScore: 85,
    uniqueTraders: 3,
    signalAgeMinutes: 5,
    tradersInvolved: ['TraderA', 'TraderB', 'TraderC'],
  });

  assert.strictEqual(validEntry.entered, true, 'Valid high-conviction signal must trigger paper entry');
  assert.ok(validEntry.position, 'Position object must be generated');
  assert.strictEqual(validEntry.position.symbol, 'ALPHA');
  assert.ok(validEntry.position.stopLossPrice < 1.0, 'Stop loss must be below entry price');
  assert.ok(validEntry.position.takeProfitPrice > 1.0, 'Take profit must be above entry price');

  // Test low score rejection
  const rejectedEntry = engine.evaluateSignalForEntry({
    tokenAddress: '0x9999999999999999',
    network: 'solana',
    symbol: 'POOR',
    priceUsd: 0.5,
    smartMoneyScore: 40, // below 75 threshold
    uniqueTraders: 1,
    signalAgeMinutes: 2,
    tradersInvolved: ['TraderX'],
  });

  assert.strictEqual(rejectedEntry.entered, false, 'Low score signal must be rejected');
});

test('Paper Trading Engine: Executes Stop Loss when price drops below threshold', () => {
  const engine = new PaperTradingEngine({ stopLossPct: 10 });

  const entry = engine.evaluateSignalForEntry({
    tokenAddress: '0xdrop111111111111',
    network: 'solana',
    symbol: 'DUMP',
    priceUsd: 10.0,
    smartMoneyScore: 88,
    uniqueTraders: 3,
    signalAgeMinutes: 2,
    tradersInvolved: ['TraderA', 'TraderB'],
  });

  assert.strictEqual(entry.entered, true);

  // Price drops 15% (past 10% stop loss)
  const updateResult = engine.updatePrice('0xdrop111111111111', 8.5);

  assert.strictEqual(updateResult.closedPositions.length, 1, 'Position must be automatically closed on stop loss');
  assert.ok(updateResult.closedPositions[0].exitReason.includes('Stop Loss Hit'));
  assert.strictEqual(updateResult.closedPositions[0].status, 'CLOSED');
});

test('Paper Trading Engine: Executes Take Profit when price reaches target', () => {
  const engine = new PaperTradingEngine({ takeProfitPct: 30 });

  const entry = engine.evaluateSignalForEntry({
    tokenAddress: '0xpump222222222222',
    network: 'solana',
    symbol: 'PUMP',
    priceUsd: 5.0,
    smartMoneyScore: 90,
    uniqueTraders: 3,
    signalAgeMinutes: 3,
    tradersInvolved: ['TraderA', 'TraderB', 'TraderC'],
  });

  assert.strictEqual(entry.entered, true);

  // Price surges 40% (past 30% take profit)
  const updateResult = engine.updatePrice('0xpump222222222222', 7.5);

  assert.strictEqual(updateResult.closedPositions.length, 1, 'Position must be automatically closed on take profit');
  assert.ok(updateResult.closedPositions[0].exitReason.includes('Take Profit Hit'));
  assert.ok(updateResult.closedPositions[0].realizedPnlUsd > 0, 'Realized PnL must be positive');
});

test('Paper Trading Engine: Calculates portfolio metrics accurately', () => {
  const engine = new PaperTradingEngine();
  const stats = engine.getStats();

  assert.ok(stats.totalCapital > 0, 'Total capital must be > 0');
  assert.ok(stats.availableCash > 0, 'Available cash must be > 0');
  assert.strictEqual(typeof stats.winRate, 'number');
  assert.strictEqual(typeof stats.roiPercent, 'number');
});
