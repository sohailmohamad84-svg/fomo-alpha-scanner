import { HolderConvictionMetrics, SmartMoneyHolder } from '../types/intelligence';

export interface RawHolderInput {
  address: string;
  traderHandle?: string;
  balance: number;
  valueUsd?: number;
  holdingDurationHours?: number;
  previousBalance?: number;
  entryTimestamp?: Date | string | number;
}

export class HolderEngine {
  public evaluateTokenHolders(
    tokenAddress: string,
    network: string,
    holders: RawHolderInput[],
    traderScores: Map<string, { score: number; copyScore?: number; verified?: boolean }>
  ): {
    metrics: HolderConvictionMetrics;
    smartHolders: SmartMoneyHolder[];
  } {
    const smartHolders: SmartMoneyHolder[] = [];
    let holdersIncreasing = 0;
    let holdersReducing = 0;
    let holdersExited = 0;

    for (const h of holders) {
      if (!h.traderHandle) continue;
      const traderInfo = traderScores.get(h.traderHandle);
      const traderScore = traderInfo?.score || 50;
      const copyScore = traderInfo?.copyScore || 50;

      const isElite = traderScore >= 70;
      const isQualified = traderScore >= 55;

      // Detect balance changes
      let status: 'increasing' | 'holding' | 'reducing' | 'exited' = 'holding';
      if (h.previousBalance !== undefined) {
        if (h.balance <= 0) {
          status = 'exited';
          holdersExited++;
        } else if (h.balance > h.previousBalance * 1.05) {
          status = 'increasing';
          holdersIncreasing++;
        } else if (h.balance < h.previousBalance * 0.95) {
          status = 'reducing';
          holdersReducing++;
        }
      }

      const valueUsd = h.valueUsd || h.balance * 0.05;
      smartHolders.push({
        traderHandle: h.traderHandle,
        traderScore,
        copySignalScore: copyScore,
        positionSizeTokens: h.balance,
        valueUsd,
        holdingDurationHours: h.holdingDurationHours || 24,
        isElite,
        isQualified,
        status,
        entryTimestamp: h.entryTimestamp ? new Date(h.entryTimestamp) : new Date(Date.now() - 86400000),
        lastUpdated: new Date(),
      });
    }

    const eliteHoldersCount = smartHolders.filter((h) => h.isElite && h.status !== 'exited').length;
    const qualifiedHoldersCount = smartHolders.filter((h) => h.isQualified && h.status !== 'exited').length;
    const totalSmartHoldersCount = smartHolders.filter((h) => h.status !== 'exited').length;

    const weightedHolderValueUsd = smartHolders
      .filter((h) => h.status !== 'exited')
      .reduce((acc, h) => acc + h.valueUsd * (h.traderScore / 100), 0);

    // SmartMoneyHolderScore: 0 to 100
    const smartMoneyHolderScore = Math.min(
      100,
      Math.round(
        eliteHoldersCount * 22 +
        qualifiedHoldersCount * 12 +
        Math.min(25, (weightedHolderValueUsd / 50000) * 25)
      )
    );

    // Accumulation vs Distribution Scoring
    const accumulationBase = holdersIncreasing * 25 + eliteHoldersCount * 10;
    const distributionBase = holdersReducing * 30 + holdersExited * 45;

    const accumulationScore = Math.min(100, Math.max(0, accumulationBase - Math.round(distributionBase * 0.5)));
    const distributionScore = Math.min(100, Math.max(0, distributionBase - Math.round(accumulationBase * 0.3)));

    const isAccumulating = accumulationScore > distributionScore && accumulationScore >= 35;
    const isDistributing = distributionScore >= 40;

    // Holder Conviction Score (penalized heavily if distributing)
    const holderConvictionScore = Math.max(
      0,
      Math.min(
        100,
        Math.round(smartMoneyHolderScore * 0.7 + accumulationScore * 0.4 - distributionScore * 0.5)
      )
    );

    return {
      metrics: {
        tokenAddress,
        network,
        eliteHoldersCount,
        qualifiedHoldersCount,
        totalSmartHoldersCount,
        weightedHolderValueUsd: Math.round(weightedHolderValueUsd),
        smartMoneyHolderScore,
        holderConvictionScore,
        accumulationScore,
        distributionScore,
        isAccumulating,
        isDistributing,
        holdersIncreasing,
        holdersReducing,
        holdersExited,
      },
      smartHolders,
    };
  }
}

export const holderEngine = new HolderEngine();
