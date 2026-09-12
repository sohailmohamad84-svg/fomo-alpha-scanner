import { TokenLifecyclePhase } from '../types/intelligence';

export interface LifecycleEvaluationInput {
  tokenAgeMinutes: number;
  uniqueBuyersCount: number;
  eliteBuyersCount: number;
  uniqueHoldersCount: number;
  thesesCount: number;
  hasNarrativeCluster: boolean;
  fomoBuyersCount: number;
  distributionScore: number;
  isDevSelling?: boolean;
  priceChangeSinceFirstSignalPct: number;
}

export function determineTokenLifecycle(input: LifecycleEvaluationInput): {
  phase: TokenLifecyclePhase;
  phaseIndex: number; // 0 to 7
  badgeColor: string;
  summary: string;
} {
  const {
    eliteBuyersCount,
    uniqueBuyersCount,
    thesesCount,
    hasNarrativeCluster,
    fomoBuyersCount,
    distributionScore,
    isDevSelling,
    priceChangeSinceFirstSignalPct,
  } = input;

  // 1. Exit phase
  if (isDevSelling || distributionScore >= 70) {
    return {
      phase: 'EXIT',
      phaseIndex: 7,
      badgeColor: 'text-red-500 bg-red-950/40 border-red-500/40',
      summary: 'Smart money is liquidating or dev wallet dump detected. Extreme exit risk.',
    };
  }

  // 2. Distribution phase
  if (distributionScore >= 45 || (eliteBuyersCount >= 2 && priceChangeSinceFirstSignalPct > 150)) {
    return {
      phase: 'DISTRIBUTION',
      phaseIndex: 6,
      badgeColor: 'text-orange-400 bg-orange-950/40 border-orange-500/40',
      summary: 'Early buyers taking profits into liquidity. Distribution underway.',
    };
  }

  // 3. Crowd Attention phase
  if (fomoBuyersCount >= 50 || priceChangeSinceFirstSignalPct >= 75) {
    return {
      phase: 'CROWD_ATTENTION',
      phaseIndex: 5,
      badgeColor: 'text-amber-400 bg-amber-950/40 border-amber-500/40',
      summary: 'Broad social awareness reaching mainstream FOMO feed. Late entry zone.',
    };
  }

  // 4. Narrative Formation phase
  if (hasNarrativeCluster && thesesCount >= 2) {
    return {
      phase: 'NARRATIVE_FORMATION',
      phaseIndex: 4,
      badgeColor: 'text-purple-400 bg-purple-950/40 border-purple-500/40',
      summary: 'Shared thesis spreading across multiple influential traders.',
    };
  }

  // 5. Convergence phase
  if (eliteBuyersCount >= 2) {
    return {
      phase: 'CONVERGENCE',
      phaseIndex: 3,
      badgeColor: 'text-terminal-green bg-terminal-green/20 border-terminal-green/40',
      summary: 'Multiple independent elite traders accumulating within narrow timeframe.',
    };
  }

  // 6. Accumulation phase
  if (uniqueBuyersCount >= 3 || eliteBuyersCount >= 1) {
    return {
      phase: 'ACCUMULATION',
      phaseIndex: 2,
      badgeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/40',
      summary: 'Smart capital quietly building initial positions.',
    };
  }

  // 7. First Smart Money phase
  if (uniqueBuyersCount >= 1) {
    return {
      phase: 'FIRST_SMART_MONEY',
      phaseIndex: 1,
      badgeColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/40',
      summary: 'Earliest known smart money entry detected on-chain.',
    };
  }

  // 8. Discovery phase
  return {
    phase: 'DISCOVERY',
    phaseIndex: 0,
    badgeColor: 'text-terminal-muted bg-terminal-panel border-terminal-border',
    summary: 'Fresh token contract surfaced before noticeable flow.',
  };
}
