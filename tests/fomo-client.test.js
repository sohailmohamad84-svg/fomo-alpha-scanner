const test = require('node:test');
const assert = require('node:assert');

// Mock data test for FOMO API schemas
const { MOCK_TRADERS, MOCK_TOKENS, MOCK_TRADES } = require('../src/lib/fomo/mock-data');

test('FOMO API: Mock Leaderboard conforms to OpenAPI 3.1 schema', () => {
  assert.ok(Array.isArray(MOCK_TRADERS), 'Leaderboard traders must be an array');
  assert.ok(MOCK_TRADERS.length >= 5, 'Leaderboard must contain at least 5 traders');

  for (const trader of MOCK_TRADERS) {
    assert.strictEqual(typeof trader.rank, 'number', 'Trader rank must be a number');
    assert.strictEqual(typeof trader.handle, 'string', 'Trader handle must be a string');
    assert.strictEqual(typeof trader.pnlUsd, 'number', 'Trader pnlUsd must be a number');
    assert.strictEqual(typeof trader.volumeUsd, 'number', 'Trader volumeUsd must be a number');
    assert.strictEqual(typeof trader.verified, 'boolean', 'Trader verified must be a boolean');
    assert.ok(trader.wallets, 'Trader wallets must exist');
    assert.ok(trader.wallets.solana || trader.wallets.evm, 'Trader must have at least one wallet address');
  }
});

test('FOMO API: Token Board conforms to OpenAPI 3.1 schema', () => {
  assert.ok(Array.isArray(MOCK_TOKENS), 'Tokens must be an array');

  for (const tokenItem of MOCK_TOKENS) {
    assert.strictEqual(typeof tokenItem.rank, 'number', 'Token rank must be a number');
    assert.strictEqual(typeof tokenItem.token.symbol, 'string', 'Token symbol must be a string');
    assert.strictEqual(typeof tokenItem.token.address, 'string', 'Token address must be a string');
    assert.strictEqual(typeof tokenItem.network, 'string', 'Token network must be a string');
    assert.strictEqual(typeof tokenItem.priceUsd, 'number', 'Price must be a number');
    assert.strictEqual(typeof tokenItem.change24h, 'number', '24h change must be a number');
  }
});

test('FOMO API: Trades History carries required fields for copy-trading', () => {
  assert.ok(Array.isArray(MOCK_TRADES), 'Trades must be an array');

  for (const trade of MOCK_TRADES) {
    assert.ok(trade.token.symbol, 'Trade token symbol must exist');
    assert.ok(trade.token.address, 'Trade token address must exist');
    assert.ok(trade.side === 'buy' || trade.side === 'sell', 'Trade side must be buy or sell');
    assert.ok(trade.sizeUsd >= 0, 'Trade sizeUsd must be >= 0');
    assert.ok(trade.ts || trade.createdAt, 'Trade must have a timestamp');
  }
});
