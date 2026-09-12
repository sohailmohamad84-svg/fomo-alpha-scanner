import { AccountMaturity } from '../types/intelligence';

export interface MaturityInput {
  accountAgeDays: number;
  tradesCount: number;
  pnlAll: number;
  volumeUsd: number;
  followersCount?: number;
}

export function evaluateAccountMaturity(input: MaturityInput): {
  maturity: AccountMaturity;
  score: number; // 0 - 100
  reason: string;
} {
  const { accountAgeDays, tradesCount, pnlAll, volumeUsd } = input;

  // 1. Suspicious: Extreme anomalous gains with no trades history
  if (accountAgeDays <= 14 && pnlAll > 100000 && tradesCount <= 3) {
    return {
      maturity: 'Suspicious',
      score: 35,
      reason: 'Extreme anomalous PnL ($' + Math.round(pnlAll).toLocaleString() + ') on a <14 day old account with minimal trade depth.',
    };
  }

  // 2. Veteran: Established history
  if (accountAgeDays >= 120 && tradesCount >= 30) {
    const score = Math.min(100, 75 + Math.min(25, accountAgeDays / 15));
    return {
      maturity: 'Veteran',
      score,
      reason: 'Established account (' + accountAgeDays + ' days active, ' + tradesCount + ' confirmed trades).',
    };
  }

  // 3. Rising Talent: Young account with impressive real trade discovery
  if (accountAgeDays <= 60 && pnlAll >= 10000 && tradesCount >= 8) {
    return {
      maturity: 'Rising Talent',
      score: 88,
      reason: 'High-alpha early discoverer: active for ' + accountAgeDays + ' days with verifiable multi-trade profitability.',
    };
  }

  // 4. Moderate Veteran (between 60 and 120 days with good trade count)
  if (accountAgeDays >= 60 && tradesCount >= 15) {
    return {
      maturity: 'Veteran',
      score: 75,
      reason: 'Seasoned account with healthy statistical history (' + accountAgeDays + ' days).',
    };
  }

  // 5. Unproven: Young or low activity
  return {
    maturity: 'Unproven',
    score: 50,
    reason: 'Young account or limited history (' + tradesCount + ' trades over ' + accountAgeDays + ' days). Needs further data accumulation.',
  };
}
