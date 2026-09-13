import test from 'node:test';
import assert from 'node:assert/strict';

import { eliteCoreService } from '../src/lib/elite/elite-core-service.js';
import { leaderboardHistoryService } from '../src/lib/elite/leaderboard-history-service.js';
import { portfolioConsensusService } from '../src/lib/elite/portfolio-consensus-service.js';
import { accumulationService } from '../src/lib/elite/accumulation-service.js';
import { distributionService } from '../src/lib/elite/distribution-service.js';
import { leadLagService } from '../src/lib/elite/lead-lag-service.js';
import { consensusStateMachine } from '../src/lib/elite/consensus-state-machine.js';
import { thesisConsensusService } from '../src/lib/elite/thesis-consensus-service.js';
import { eliteAlphaEngine } from '../src/lib/elite/elite-alpha-engine.js';
import { strategyEvaluationService } from '../src/lib/elite/strategy-evaluation-service.js';
import { winnerFinderService } from '../src/lib/elite/winner-finder-service.js';

test('Elite Core Service: Correctly scores and classifies elite traders and rising talent', () => {
  // Test veteran high performer
  const veteran = eliteCoreService.evaluateTrader(
    {
      handle: 'whale_alpha',
      pnl30d: 450000,
      pnl7d: 120000,
      pnl24h: 35000,
      pnlAll: 1200000,
      tradesCount: 85,
      accountAgeDays: 120,
      consistencyScore: 88,
      winRate: 0.72,
    },
    85 // persistence score
  );

  assert.ok(veteran.eliteScore >= 75, `Expected high elite score, got ${veteran.eliteScore}`);
  assert.ok(veteran.eliteConfidence >= 70, `Expected high confidence, got ${veteran.eliteConfidence}`);
  assert.equal(veteran.classification, 'ELITE_CORE');

  // Test young account with strong performance -> classified as RISING
  const rising = eliteCoreService.evaluateTrader(
    {
      handle: 'young_gun',
      pnl30d: 45000,
      pnl7d: 25000,
      pnl24h: 8000,
      pnlAll: 45000,
      tradesCount: 30,
      accountAgeDays: 14,
      consistencyScore: 80,
      winRate: 0.75,
    },
    50
  );

  assert.equal(rising.classification, 'RISING', 'Young profitable trader should be classified as RISING');
});

test('Leaderboard Persistence: Tracks rank stability and penalizes one-hit wonders', () => {
  // Simulate stable top trader
  for (let i = 1; i <= 5; i++) {
    leaderboardHistoryService.recordRank('stable_king', {
      epoch: `2026-09-0${i}`,
      window: '7d',
      rank: 3 + (i % 2),
      pnlUsd: 100000,
      qualityScore: 90,
    });
  }

  const stableMetrics = leaderboardHistoryService.getTraderPersistence('stable_king');
  assert.ok(stableMetrics.persistenceScore >= 75, `Expected high persistence, got ${stableMetrics.persistenceScore}`);
  assert.equal(stableMetrics.isOneHitWonder, false);

  // Simulate one-hit wonder: #2 on 24h once, never seen on 7d or 30d
  leaderboardHistoryService.recordRank('lucky_ape', {
    epoch: '2026-09-10',
    window: '24h',
    rank: 2,
    pnlUsd: 50000,
    qualityScore: 60,
  });

  const apeMetrics = leaderboardHistoryService.getTraderPersistence('lucky_ape');
  assert.equal(apeMetrics.isOneHitWonder, true, 'Trader appearing only on 24h top 10 should be one-hit wonder');
  assert.ok(apeMetrics.persistenceScore < stableMetrics.persistenceScore);
});

test('Portfolio Consensus: Computes Herfindahl index and penalizes whale concentration', () => {
  // Case 1: Distributed across 4 equal holders ($25k each)
  const distributedPositions = [
    { valueUsd: 25000 },
    { valueUsd: 25000 },
    { valueUsd: 25000 },
    { valueUsd: 25000 },
  ];
  const hhiDistributed = portfolioConsensusService.calculateHerfindahlIndex(distributedPositions);
  const penaltyDistributed = portfolioConsensusService.calculateConcentrationPenalty(hhiDistributed, 4);

  assert.ok(hhiDistributed <= 0.30, `Expected low HHI, got ${hhiDistributed}`);
  assert.equal(penaltyDistributed, 0, 'No penalty for distributed holders');

  // Case 2: 1 whale owns 95% ($95k vs 3 wallets owning $1.6k each)
  const whaleDominated = [
    { valueUsd: 95000 },
    { valueUsd: 1600 },
    { valueUsd: 1700 },
    { valueUsd: 1700 },
  ];
  const hhiWhale = portfolioConsensusService.calculateHerfindahlIndex(whaleDominated);
  const penaltyWhale = portfolioConsensusService.calculateConcentrationPenalty(hhiWhale, 4);

  assert.ok(hhiWhale >= 0.85, `Expected high HHI for whale dominance, got ${hhiWhale}`);
  assert.ok(penaltyWhale >= 20, `Expected >= 20 penalty for whale trap, got ${penaltyWhale}`);

  // Test Jaccard overlap
  const overlap = portfolioConsensusService.calculateJaccardOverlap(
    ['sol', 'bonk', 'wif', 'jup'],
    ['bonk', 'wif', 'ray']
  );
  assert.equal(overlap.sharedTokenCount, 2);
  assert.equal(overlap.sharedTokens.includes('bonk'), true);
  assert.ok(overlap.jaccardIndex > 0.35 && overlap.jaccardIndex < 0.45);
});

test('Accumulation Service: Classifies holding velocity and detects position building', () => {
  // New entry
  const newState = accumulationService.classifyHoldingState(0, 5000, 'BUY');
  assert.equal(newState, 'NEW_ENTRY');

  // Adding to position (+50%)
  const addState = accumulationService.classifyHoldingState(10000, 15000, 'BUY');
  assert.equal(addState, 'ACCUMULATING');

  // Trimming position (-40%)
  const reduceState = accumulationService.classifyHoldingState(10000, 6000, 'SELL');
  assert.equal(reduceState, 'REDUCING');

  // Exited position
  const exitState = accumulationService.classifyHoldingState(10000, 0, 'SELL');
  assert.equal(exitState, 'EXITED');

  // Position Building Detection: $2,000 starter buy followed by $8,000 conviction buy 20 mins later
  const seq = accumulationService.detectPositionBuilding([
    {
      handle: 'smart_whale',
      tokenAddress: 'token123',
      side: 'BUY',
      valueUsd: 2000,
      timestamp: 1700000000000,
    },
    {
      handle: 'smart_whale',
      tokenAddress: 'token123',
      side: 'BUY',
      valueUsd: 8000,
      timestamp: 1700000000000 + 20 * 60 * 1000,
    },
  ]);

  assert.ok(seq !== null, 'Position building pattern should be detected');
  assert.equal(seq?.sizeMultiplier, 4);
  assert.equal(seq?.timeDeltaMinutes, 20);
});

test('Distribution Service: Detects breakout velocity and suppresses BUY on heavy exit', () => {
  // Breakout detection
  const breakout = distributionService.detectConsensusBreakout(1, 4, 45);
  assert.equal(breakout.isBreakout, true, 'Expected breakout when buyers jump 1 -> 4 within 45 mins');

  // Heavy exit evaluation
  const distResult = distributionService.evaluateDistribution({
    tokenAddress: 'token_dump',
    symbol: 'DUMP',
    eliteBuyVolumeUsd: 5000,
    eliteSellVolumeUsd: 85000,
    eliteBuyersCount: 1,
    eliteSellersCount: 3,
    hoursSinceLastEliteBuy: 30,
    hoursSinceLastEliteSell: 0.5,
  });

  assert.ok(distResult.distributionScore >= 60, `Expected high distribution score, got ${distResult.distributionScore}`);
  assert.equal(distResult.shouldSuppressBuy, true, 'Buy signals must be suppressed on heavy distribution');
  assert.equal(distResult.exitWarning, true);
});

test('Lead-Lag Service: Discovers directional sequences and computes trader lead scores', () => {
  const t0 = 1700000000000;
  const mockTrades = [
    // Token A: AlphaLeader buys first, FollowerOne confirms 15 mins later
    { handle: 'AlphaLeader', tokenAddress: 'tokA', side: 'BUY', priceUsd: 1.0, timestamp: t0, pnl24hAfterPct: 45 },
    { handle: 'FollowerOne', tokenAddress: 'tokA', side: 'BUY', priceUsd: 1.1, timestamp: t0 + 15 * 60 * 1000, pnl24hAfterPct: 30 },
    // Token B: AlphaLeader buys first, FollowerOne confirms 25 mins later
    { handle: 'AlphaLeader', tokenAddress: 'tokB', side: 'BUY', priceUsd: 0.5, timestamp: t0 + 100000, pnl24hAfterPct: 60 },
    { handle: 'FollowerOne', tokenAddress: 'tokB', side: 'BUY', priceUsd: 0.55, timestamp: t0 + 100000 + 25 * 60 * 1000, pnl24hAfterPct: 40 },
  ];

  const pairs = leadLagService.mineLeadLagSequences(mockTrades);
  assert.equal(pairs.length, 1);
  assert.equal(pairs[0].leaderHandle, 'alphaleader');
  assert.equal(pairs[0].followerHandle, 'followerone');
  assert.equal(pairs[0].confirmationCount, 2);

  const leaderScores = leadLagService.calculateTraderNetworkScores('AlphaLeader', pairs);
  assert.ok(leaderScores.leadScore >= 60, `Expected high lead score, got ${leaderScores.leadScore}`);

  const network = leadLagService.getNetworkGraph(1);
  assert.ok(network.nodes.length >= 2);
  assert.ok(network.edges.length >= 1);
});

test('Consensus State Machine: Accurately maps 7 lifecycle states', () => {
  // 1. Fresh accumulation
  const fresh = consensusStateMachine.evaluateState({
    eliteHoldersCount: 2,
    freshAccumulatorsCount: 2,
    reducersCount: 0,
    priceExtensionPct: 12,
    priceDropFromPeakPct: 2,
    leadLagConfirmations: 1,
    hoursSinceLastEliteBuy: 1,
    retailVolumeRatio: 2,
    netSmartMoneyFlowUsd: 40000,
  });
  assert.equal(fresh.state, 'FRESH_ACCUMULATION');
  assert.equal(fresh.isActionableBuy, true);

  // 2. Accelerating
  const accel = consensusStateMachine.evaluateState({
    eliteHoldersCount: 4,
    freshAccumulatorsCount: 3,
    reducersCount: 0,
    priceExtensionPct: 22,
    priceDropFromPeakPct: 1,
    leadLagConfirmations: 3,
    hoursSinceLastEliteBuy: 0.5,
    retailVolumeRatio: 4,
    netSmartMoneyFlowUsd: 95000,
  });
  assert.equal(accel.state, 'ACCELERATING');

  // 3. Distribution
  const dist = consensusStateMachine.evaluateState({
    eliteHoldersCount: 2,
    freshAccumulatorsCount: 0,
    reducersCount: 3,
    priceExtensionPct: 80,
    priceDropFromPeakPct: 15,
    leadLagConfirmations: 0,
    hoursSinceLastEliteBuy: 48,
    retailVolumeRatio: 12,
    netSmartMoneyFlowUsd: -65000,
  });
  assert.equal(dist.state, 'DISTRIBUTION');
  assert.equal(dist.isExitRisk, true);
  assert.equal(dist.isActionableBuy, false);
});

test('Thesis Consensus: Evaluates author alignment and shared narrative themes', () => {
  const result = thesisConsensusService.evaluateThesisConsensus([
    {
      handle: 'trader1',
      tokenAddress: 'token_ai',
      title: 'Decentralized Compute',
      content: 'Strong GPU demand on-chain',
      convictionLevel: 'HIGH',
      publishedTimestamp: Date.now() - 3600000,
      tags: ['ai', 'gpu', 'solana'],
    },
    {
      handle: 'trader2',
      tokenAddress: 'token_ai',
      title: 'AI Infra Scaling',
      content: 'Node revenue expanding',
      convictionLevel: 'HIGH',
      publishedTimestamp: Date.now() - 1800000,
      tags: ['ai', 'infra', 'depin'],
    },
  ]);

  assert.equal(result.alignedAuthorsCount, 2);
  assert.ok(result.sharedThemes.includes('ai'));
  assert.equal(result.hasStrongAlignment, true);
  assert.ok(result.score >= 70);
});

test('Elite Alpha Engine: Penalizes late price extensions and applies timing decay', () => {
  // Case 1: Early entry (extension +8%)
  const earlySignal = eliteAlphaEngine.computeEliteAlpha({
    tokenAddress: 'tok1',
    symbol: 'EARLY',
    currentPriceUsd: 1.08,
    initialEliteEntryPriceUsd: 1.0,
    freshAccumulationScore: 85,
    eliteConsensusScore: 80,
    leadLagConfirmationScore: 80,
    thesisConsensusScore: 75,
    distributionScore: 10,
  });

  assert.equal(earlySignal.isTooLate, false);
  assert.equal(earlySignal.action, 'STRONG_BUY');
  assert.ok(earlySignal.score >= 70);

  // Case 2: Too late (extension +65%)
  const lateSignal = eliteAlphaEngine.computeEliteAlpha({
    tokenAddress: 'tok2',
    symbol: 'LATE',
    currentPriceUsd: 1.65,
    initialEliteEntryPriceUsd: 1.0,
    freshAccumulationScore: 85,
    eliteConsensusScore: 80,
    leadLagConfirmationScore: 80,
    thesisConsensusScore: 75,
    distributionScore: 10,
  });

  assert.equal(lateSignal.isTooLate, true);
  assert.equal(lateSignal.action, 'AVOID');
  assert.ok(lateSignal.timingMultiplier <= 0.40);
  assert.ok(lateSignal.score < earlySignal.score);
});

test('Strategy Evaluation & Head-to-Head Backtest: Benchmarks 5 distinct strategies', () => {
  const backtest = strategyEvaluationService.getEmpiricalBacktestComparison('30d');
  assert.equal(backtest.strategies.length, 5);

  const naive = backtest.strategies[0];
  const freshLead = backtest.strategies[4];

  assert.ok(naive.winRatePct < 50, 'Naive leaderboard copy should have low win rate');
  assert.ok(freshLead.winRatePct > 75, 'Fresh Accumulation + Lead Trader should have high empirical win rate');
  assert.ok(freshLead.profitFactor > naive.profitFactor * 3);
  assert.ok(freshLead.alphaVsNaivePct > 50);
});

test('Winner Finder Service: Identifies early discoverers and next moves', () => {
  const finders = winnerFinderService.getTopWinnerFinders();
  assert.ok(finders.length >= 3);
  assert.ok(finders.some((f) => f.handle === 'Chubbi230'));
  assert.ok(finders.some((f) => f.handle === 'theveeman'));

  const chubbi = finders.find((f) => f.handle === 'Chubbi230');
  assert.ok(chubbi && chubbi.discoveryScore >= 90);
  assert.ok(chubbi && chubbi.currentActiveAccumulation.length > 0);
  assert.equal(chubbi?.currentActiveAccumulation[0].symbol, 'CASHCAT');
});
