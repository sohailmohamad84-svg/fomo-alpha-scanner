import { NextRequest, NextResponse } from 'next/server';
import { portfolioConsensusService, WalletHolding } from '@/lib/elite/portfolio-consensus-service';
import { consensusStateMachine } from '@/lib/elite/consensus-state-machine';
import { accumulationService } from '@/lib/elite/accumulation-service';
import { distributionService } from '@/lib/elite/distribution-service';
import { eliteAlphaEngine } from '@/lib/elite/elite-alpha-engine';
import { MOCK_TOKENS } from '@/lib/fomo/mock-data';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterState = searchParams.get('state');

    // Synthesize realistic multi-wallet holdings across key tokens
    const sampleHoldings: WalletHolding[] = [
      // CASHCAT: Fresh accumulation by 2 elite discoverers
      {
        traderHandle: 'Chubbi230',
        tokenAddress: '7u3r9p7xU5qA7RKn8J9Y9g4b1a4t5d6e7f8g9h0i',
        network: 'solana',
        symbol: 'CASHCAT',
        valueUsd: 28500,
        entryPriceUsd: 0.00084,
        currentPriceUsd: 0.00095,
        state: 'NEW_ENTRY',
        firstBuyTimestamp: Date.now() - 3 * 3600 * 1000,
        latestBuyTimestamp: Date.now() - 1 * 3600 * 1000,
      },
      {
        traderHandle: 'theveeman',
        tokenAddress: '7u3r9p7xU5qA7RKn8J9Y9g4b1a4t5d6e7f8g9h0i',
        network: 'solana',
        symbol: 'CASHCAT',
        valueUsd: 22000,
        entryPriceUsd: 0.00086,
        currentPriceUsd: 0.00095,
        state: 'NEW_ENTRY',
        firstBuyTimestamp: Date.now() - 2 * 3600 * 1000,
        latestBuyTimestamp: Date.now() - 30 * 60 * 1000,
      },
      // PONS: Mature consensus with multiple multi-million holders
      {
        traderHandle: 'ogle',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        symbol: 'PONS',
        valueUsd: 7127702,
        entryPriceUsd: 0.008,
        currentPriceUsd: 0.0245,
        state: 'HOLDING',
        firstBuyTimestamp: Date.now() - 14 * 86400 * 1000,
        latestBuyTimestamp: Date.now() - 2 * 86400 * 1000,
      },
      {
        traderHandle: 'unipcs',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        symbol: 'PONS',
        valueUsd: 7127476,
        entryPriceUsd: 0.009,
        currentPriceUsd: 0.0245,
        state: 'HOLDING',
        firstBuyTimestamp: Date.now() - 12 * 86400 * 1000,
        latestBuyTimestamp: Date.now() - 3 * 86400 * 1000,
      },
      {
        traderHandle: 'AvgJoesCrypto',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        symbol: 'PONS',
        valueUsd: 2738054,
        entryPriceUsd: 0.012,
        currentPriceUsd: 0.0245,
        state: 'HOLDING',
        firstBuyTimestamp: Date.now() - 10 * 86400 * 1000,
        latestBuyTimestamp: Date.now() - 4 * 86400 * 1000,
      },
      // BONK: Trimming / mature
      {
        traderHandle: 'DumbCrayonEater',
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pHMM1',
        network: 'solana',
        symbol: 'BONK',
        valueUsd: 85000,
        entryPriceUsd: 0.000018,
        currentPriceUsd: 0.000021,
        state: 'REDUCING',
        firstBuyTimestamp: Date.now() - 20 * 86400 * 1000,
        latestBuyTimestamp: Date.now() - 8 * 3600 * 1000,
      },
    ];

    const traderQualityMap = new Map<string, number>([
      ['Chubbi230', 92],
      ['theveeman', 89],
      ['ogle', 95],
      ['unipcs', 94],
      ['AvgJoesCrypto', 87],
      ['DumbCrayonEater', 78],
    ]);

    // Unique tokens in holdings
    const uniqueTokens = Array.from(new Set(sampleHoldings.map((h) => h.tokenAddress)));

    const summaries = uniqueTokens.map((addr) => {
      const h = sampleHoldings.find((x) => x.tokenAddress === addr)!;
      return portfolioConsensusService.summarizeTokenConsensus(
        addr,
        h.network,
        h.symbol,
        h.symbol,
        h.currentPriceUsd,
        sampleHoldings,
        traderQualityMap
      );
    });

    const filtered = filterState
      ? summaries.filter((s) => s.lifecycleState.toLowerCase() === filterState.toLowerCase())
      : summaries;

    return NextResponse.json({
      success: true,
      totalTokens: summaries.length,
      filteredCount: filtered.length,
      summaries: filtered,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to summarize consensus' },
      { status: 500 }
    );
  }
}
