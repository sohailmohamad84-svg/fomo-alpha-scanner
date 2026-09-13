// 7-State Consensus Lifecycle Machine
// Evaluates the exact stage of a token's smart-money cycle:
// EARLY_CONSENSUS -> FRESH_ACCUMULATION -> ACCELERATING -> MATURE_CONSENSUS -> CROWDED -> DISTRIBUTION -> BROKEN

import { ConsensusLifecycleState } from '../types/elite';

export interface LifecycleEvaluationInput {
  eliteHoldersCount: number;
  freshAccumulatorsCount: number;
  reducersCount: number;
  priceExtensionPct: number;
  priceDropFromPeakPct: number;
  leadLagConfirmations: number;
  hoursSinceLastEliteBuy: number;
  retailVolumeRatio: number; // retail volume vs smart money volume
  netSmartMoneyFlowUsd: number;
}

export interface LifecycleEvaluationResult {
  state: ConsensusLifecycleState;
  confidencePct: number;
  description: string;
  tradingGuidance: string;
  isActionableBuy: boolean;
  isExitRisk: boolean;
}

export class ConsensusStateMachine {
  constructor() {}

  /**
   * Deterministically classifies a token into one of 7 lifecycle states
   */
  public evaluateState(input: LifecycleEvaluationInput): LifecycleEvaluationResult {
    // 1. BROKEN: Heavy drawdown from peak or mass exit
    if (input.priceDropFromPeakPct >= 30 || (input.reducersCount >= 3 && input.eliteHoldersCount === 0)) {
      return {
        state: 'BROKEN',
        confidencePct: 90,
        description: `Consensus structure broken. Price collapsed -${Math.round(input.priceDropFromPeakPct)}% or smart money completely exited.`,
        tradingGuidance: 'AVOID / EXIT: Thesis invalidated. Do not attempt knife-catching.',
        isActionableBuy: false,
        isExitRisk: true,
      };
    }

    // 2. DISTRIBUTION: Elite wallets actively exiting/trimming
    if (
      (input.reducersCount >= 2 && input.reducersCount >= input.freshAccumulatorsCount) ||
      input.netSmartMoneyFlowUsd < -15000
    ) {
      return {
        state: 'DISTRIBUTION',
        confidencePct: 85,
        description: `Smart money is actively distributing into liquidity (${input.reducersCount} sellers, net flow $${Math.round(input.netSmartMoneyFlowUsd).toLocaleString()}).`,
        tradingGuidance: 'EXIT WARNING: Trimming or full exit recommended. High dump risk.',
        isActionableBuy: false,
        isExitRisk: true,
      };
    }

    // 3. CROWDED: Retail volume high, but smart money stopped adding
    if (input.retailVolumeRatio > 10 && input.freshAccumulatorsCount === 0 && input.priceExtensionPct > 50) {
      return {
        state: 'CROWDED',
        confidencePct: 80,
        description: 'Trade is crowded with retail attention while elite wallets have stopped accumulating.',
        tradingGuidance: 'HOLD / TIGHTEN STOPS: Late stage. High probability of chop or imminent distribution.',
        isActionableBuy: false,
        isExitRisk: true,
      };
    }

    // 4. ACCELERATING: Rapid confirmation & breakout velocity
    if (input.freshAccumulatorsCount >= 3 || (input.freshAccumulatorsCount >= 2 && input.leadLagConfirmations >= 2)) {
      return {
        state: 'ACCELERATING',
        confidencePct: 92,
        description: `High accumulation velocity! ${input.freshAccumulatorsCount} elite traders entered recently with lead-lag confirmations.`,
        tradingGuidance: 'STRONG BUY: Prime expansion phase. High conviction momentum.',
        isActionableBuy: true,
        isExitRisk: false,
      };
    }

    // 5. FRESH ACCUMULATION: 2-3 elite wallets entering today with low price run
    if (input.freshAccumulatorsCount >= 2 && input.priceExtensionPct <= 25) {
      return {
        state: 'FRESH_ACCUMULATION',
        confidencePct: 88,
        description: `Fresh smart-money accumulation underway (${input.freshAccumulatorsCount} wallets entering today, price extended only +${Math.round(input.priceExtensionPct)}%).`,
        tradingGuidance: 'BUY: Optimal risk-reward entry window before public breakout.',
        isActionableBuy: true,
        isExitRisk: false,
      };
    }

    // 6. MATURE CONSENSUS: Established holding base, significant run-up
    if (input.eliteHoldersCount >= 3 && input.priceExtensionPct > 35) {
      return {
        state: 'MATURE_CONSENSUS',
        confidencePct: 82,
        description: `Established consensus with ${input.eliteHoldersCount} elite holders. Price has run +${Math.round(input.priceExtensionPct)}% from first entry.`,
        tradingGuidance: 'HOLD / SCALP ONLY: Strong baseline, but upside is partially priced in. Avoid chasing large sizes.',
        isActionableBuy: false,
        isExitRisk: false,
      };
    }

    // 7. EARLY CONSENSUS: 1-2 elite leaders detected early
    return {
      state: 'EARLY_CONSENSUS',
      confidencePct: 75,
      description: `Early smart money presence detected (${input.eliteHoldersCount} elite wallet). Awaiting group confirmation.`,
      tradingGuidance: 'WATCH / STARTER: High upside potential with exploratory sizing.',
      isActionableBuy: true,
      isExitRisk: false,
    };
  }
}

export const consensusStateMachine = new ConsensusStateMachine();
