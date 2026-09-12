import { PositionBuildingEvent } from '../types/intelligence';

export interface BuyEventInput {
  tokenAddress: string;
  network: string;
  symbol: string;
  traderHandle: string;
  valueUsd: number;
  timestamp: Date | string | number;
  hasThesis?: boolean;
}

export class PositionBuildingDetector {
  /**
   * Analyzes an array of buy events for a single trader on a specific token
   */
  public analyzeTraderBuys(
    events: BuyEventInput[]
  ): PositionBuildingEvent | null {
    if (!events || events.length < 2) return null;

    // Sort chronologically
    const sorted = [...events].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const first = sorted[0];
    const initialBuyUsd = first.valueUsd;
    const followUps = sorted.slice(1);
    const followUpBuysUsd = followUps.map((e) => e.valueUsd);
    const followUpTimes = followUps.map((e) => new Date(e.timestamp));
    const totalAccumulatedUsd = sorted.reduce((acc, e) => acc + e.valueUsd, 0);

    const hasThesis = sorted.some((e) => !!e.hasThesis);
    const maxFollowUp = Math.max(...followUpBuysUsd);

    // Pattern: Starter position (< ,000) followed by a larger conviction buy (>= 2x starter)
    const isSizingUp = maxFollowUp >= initialBuyUsd * 1.8 && initialBuyUsd > 0;

    let buildingScore = 30;
    if (isSizingUp) buildingScore += 35;
    if (sorted.length >= 3) buildingScore += 15;
    if (hasThesis) buildingScore += 20;

    buildingScore = Math.min(100, buildingScore);

    let stage: 'STARTER_POSITION' | 'BUILDING' | 'FULL_CONVICTION' = 'STARTER_POSITION';
    if (buildingScore >= 80 || (sorted.length >= 3 && hasThesis)) {
      stage = 'FULL_CONVICTION';
    } else if (buildingScore >= 55 || isSizingUp) {
      stage = 'BUILDING';
    }

    return {
      tokenAddress: first.tokenAddress,
      network: first.network,
      symbol: first.symbol,
      traderHandle: first.traderHandle,
      initialBuyUsd: Math.round(initialBuyUsd),
      initialBuyTime: new Date(first.timestamp),
      followUpBuysUsd: followUpBuysUsd.map((v) => Math.round(v)),
      followUpTimes,
      totalAccumulatedUsd: Math.round(totalAccumulatedUsd),
      thesisPublished: hasThesis,
      positionBuildingScore: buildingScore,
      stage,
    };
  }
}

export const positionBuildingDetector = new PositionBuildingDetector();
