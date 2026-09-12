import { TraderRegime } from '../types/intelligence';

export interface RegimeEvaluationInput {
  tradesCount: number;
  pnl24h: number;
  pnl7d: number;
  pnl30d: number;
  pnlAll: number;
  volumeUsd: number;
  avgHoldTimeSeconds: number;
  accountAgeDays: number;
  winRate?: number;
  maxDrawdownPct?: number;
}

export function evaluateTraderRegime(input: RegimeEvaluationInput): {
  regime: TraderRegime;
  secondaryRegime?: TraderRegime;
  description: string;
} {
  if (input.tradesCount < 5) {
    return {
      regime: 'INSUFFICIENT_DATA',
      description: 'Fewer than 5 recorded trades. Statistical profile accumulating.',
    };
  }

  // Check timeframe style first
  const isScalper = input.avgHoldTimeSeconds > 0 && input.avgHoldTimeSeconds < 1800; // < 30m
  const isLongHold = input.avgHoldTimeSeconds >= 86400; // > 24h

  // Check performance momentum
  const isHot = input.pnl24h > 10000 || (input.pnlAll > 0 && input.pnl24h / input.pnlAll > 0.15);
  const isCold = input.pnl24h < -5000 && input.pnl7d < 0;
  const isRecovering = input.pnl24h > 5000 && input.pnl7d < -5000;
  const isConsistent =
    input.pnl24h >= 0 &&
    input.pnl7d > 0 &&
    input.pnl30d > 0 &&
    (input.winRate ?? 60) >= 60;

  // Check account age
  if (input.accountAgeDays < 45 && input.pnlAll > 15000) {
    return {
      regime: 'NEW_AND_PROMISING',
      secondaryRegime: isScalper ? 'SCALPER' : 'SWING',
      description: 'Fresh account with exceptional early returns and discovery alpha.',
    };
  }

  if (isRecovering) {
    return {
      regime: 'RECOVERING',
      secondaryRegime: isScalper ? 'SCALPER' : 'SWING',
      description: 'Rebounding strongly into green PnL after recent drawdown.',
    };
  }

  if (isHot) {
    return {
      regime: 'HOT',
      secondaryRegime: isConsistent ? 'CONSISTENT' : 'HIGH_VOLATILITY',
      description: 'Peak performance regime: heavy accumulation and profitable momentum.',
    };
  }

  if (isConsistent) {
    return {
      regime: 'CONSISTENT',
      secondaryRegime: isLongHold ? 'LONG_HOLD' : 'SWING',
      description: 'Steady profit curve with disciplined risk management across all timeframes.',
    };
  }

  if (isCold) {
    return {
      regime: 'COLD',
      secondaryRegime: 'HIGH_VOLATILITY',
      description: 'Current performance drawdown. Exercise caution on immediate copy signals.',
    };
  }

  if (isScalper) {
    return {
      regime: 'SCALPER',
      description: 'Ultra-fast intraday turnover (< 30 min average holding duration).',
    };
  }

  if (isLongHold) {
    return {
      regime: 'LONG_HOLD',
      description: 'Conviction accumulation with multi-day to multi-week holding horizons.',
    };
  }

  return {
    regime: 'SWING',
    description: 'Standard swing positioning (2h to 24h average duration).',
  };
}
