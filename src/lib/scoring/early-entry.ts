import { NormalizedTrade } from '../fomo/types';

export interface EarlyEntryTimelineItem {
  traderHandle: string;
  traderScore: number;
  amountUsd: number;
  priceUsd: number;
  timestamp: Date;
  timeFormatted: string;
  dateFormatted: string;
  minutesAfterFirst: number;
  isFirst: boolean;
  isCriteriaMet?: boolean;
}

export interface EarlyEntryDetectionResult {
  hasAccumulation: boolean;
  firstBuyer: string | null;
  firstBuyTime: Date | null;
  firstBuyTimeFormatted: string | null;
  firstBuyDateFormatted: string | null;
  firstBuyPriceUsd: number | null;
  followingTradersCount: number;
  accumulationWindowMinutes: number;
  totalAccumulatedUsd: number;
  averageFollowerDelayMinutes: number;
  timeline: EarlyEntryTimelineItem[];
  bannerText: string;
  criteriaMet: boolean;
  criteriaTriggerTrader: string | null;
  criteriaTriggerTime: Date | null;
  criteriaTriggerPriceUsd: number | null;
  criteriaTriggerDelayMinutes: number;
}

export function detectEarlyEntry(
  trades: NormalizedTrade[],
  traderScores: Map<string, number>
): EarlyEntryDetectionResult {
  const buyTrades = trades
    .filter((t) => t.side === 'BUY')
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  if (buyTrades.length === 0) {
    return {
      hasAccumulation: false,
      firstBuyer: null,
      firstBuyTime: null,
      firstBuyTimeFormatted: null,
      firstBuyDateFormatted: null,
      firstBuyPriceUsd: null,
      followingTradersCount: 0,
      accumulationWindowMinutes: 0,
      totalAccumulatedUsd: 0,
      averageFollowerDelayMinutes: 0,
      timeline: [],
      bannerText: 'No buy accumulation detected',
      criteriaMet: false,
      criteriaTriggerTrader: null,
      criteriaTriggerTime: null,
      criteriaTriggerPriceUsd: null,
      criteriaTriggerDelayMinutes: 0,
    };
  }

  // Deduplicate buyers keeping their earliest buy
  const uniqueBuyerMap = new Map<string, NormalizedTrade>();
  for (const t of buyTrades) {
    if (!uniqueBuyerMap.has(t.traderHandle)) {
      uniqueBuyerMap.set(t.traderHandle, t);
    }
  }

  const chronologicalBuys = Array.from(uniqueBuyerMap.values()).sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  const firstTrade = chronologicalBuys[0];
  const firstBuyTime = new Date(firstTrade.timestamp);
  const firstBuyer = firstTrade.traderHandle;
  const firstBuyPriceUsd = firstTrade.priceUsd;

  let totalUsd = 0;
  let totalDelayMinutes = 0;

  const timeline: EarlyEntryTimelineItem[] = chronologicalBuys.map((t, index) => {
    const tTime = new Date(t.timestamp);
    const delay = Math.max(0, Math.round((tTime.getTime() - firstBuyTime.getTime()) / (60 * 1000)));
    totalUsd += t.valueUsd;
    if (index > 0) {
      totalDelayMinutes += delay;
    }

    return {
      traderHandle: t.traderHandle,
      traderScore: traderScores.get(t.traderHandle) || 50,
      amountUsd: Math.round(t.valueUsd),
      priceUsd: t.priceUsd,
      timestamp: tTime,
      timeFormatted: tTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      dateFormatted: tTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }),
      minutesAfterFirst: delay,
      isFirst: index === 0,
      isCriteriaMet: index === 1, // Second trader entry fulfills 2+ trader convergence criteria!
    };
  });

  const followingCount = chronologicalBuys.length - 1;
  const lastTrade = chronologicalBuys[chronologicalBuys.length - 1];
  const accumulationWindow = Math.max(
    0,
    Math.round((new Date(lastTrade.timestamp).getTime() - firstBuyTime.getTime()) / (60 * 1000))
  );

  const avgDelay = followingCount > 0 ? Math.round(totalDelayMinutes / followingCount) : 0;

  // Signal qualifies as concentrated accumulation if >= 2 following traders inside a 60 min window
  const hasAccumulation = followingCount >= 1 && accumulationWindow <= 60;

  const banner = hasAccumulation
    ? `🔥 Smart Money Accumulation Detected: First Buyer @${firstBuyer} followed by ${followingCount} smart traders within ${accumulationWindow}m!`
    : followingCount >= 1
    ? `Multiple buyers detected across ${accumulationWindow}m window`
    : `Single initial entry by @${firstBuyer}`;

  // Criteria Trigger Info (2+ smart traders, triggered on 2nd buyer)
  const criteriaTriggerTrade = chronologicalBuys.length >= 2 ? chronologicalBuys[1] : null;
  const criteriaMet = !!criteriaTriggerTrade;
  const criteriaTriggerTrader = criteriaTriggerTrade ? criteriaTriggerTrade.traderHandle : null;
  const criteriaTriggerTime = criteriaTriggerTrade ? new Date(criteriaTriggerTrade.timestamp) : null;
  const criteriaTriggerPriceUsd = criteriaTriggerTrade ? criteriaTriggerTrade.priceUsd : null;
  const criteriaTriggerDelayMinutes = criteriaTriggerTrade && firstBuyTime
    ? Math.max(0, Math.round((new Date(criteriaTriggerTrade.timestamp).getTime() - firstBuyTime.getTime()) / (60 * 1000)))
    : 0;

  return {
    hasAccumulation,
    firstBuyer,
    firstBuyTime,
    firstBuyTimeFormatted: firstBuyTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    }),
    firstBuyDateFormatted: firstBuyTime.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    firstBuyPriceUsd,
    followingTradersCount: followingCount,
    accumulationWindowMinutes: accumulationWindow,
    totalAccumulatedUsd: totalUsd,
    averageFollowerDelayMinutes: avgDelay,
    timeline,
    bannerText: banner,
    criteriaMet,
    criteriaTriggerTrader,
    criteriaTriggerTime,
    criteriaTriggerPriceUsd,
    criteriaTriggerDelayMinutes,
  };
}
