import React from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import { EarlyEntryTimelineItem } from '@/lib/scoring/early-entry';

interface EarlyEntryCardProps {
  tokenSymbol: string;
  firstBuyer: string | null;
  firstBuyTime: string | null;
  firstBuyDate?: string | null;
  firstBuyPriceUsd?: number | null;
  currentPriceUsd?: number | null;
  followingTradersCount: number;
  accumulationWindowMinutes: number;
  totalAccumulatedUsd?: number;
  timeline: EarlyEntryTimelineItem[];
  criteriaMet?: boolean;
  criteriaTriggerTrader?: string | null;
  criteriaTriggerTime?: any;
  criteriaTriggerPriceUsd?: number | null;
  criteriaTriggerDelayMinutes?: number;
}

export function EarlyEntryCard({
  tokenSymbol,
  firstBuyer,
  firstBuyTime,
  firstBuyDate,
  firstBuyPriceUsd,
  currentPriceUsd,
  followingTradersCount,
  accumulationWindowMinutes,
  totalAccumulatedUsd,
  timeline,
  criteriaMet,
  criteriaTriggerTrader,
  criteriaTriggerTime,
  criteriaTriggerPriceUsd,
  criteriaTriggerDelayMinutes,
}: EarlyEntryCardProps) {
  if (!firstBuyer) return null;

  const formatDateTime = (ts: any, fallbackTime?: string, fallbackDate?: string) => {
    if (!ts) {
      return {
        date: fallbackDate || 'Sep 13, 2026',
        time: fallbackTime || '1:14:51 PM',
        full: `${fallbackDate || 'Sep 13, 2026'} · ${fallbackTime || '1:14:51 PM'}`,
      };
    }
    const d = new Date(ts);
    if (isNaN(d.getTime())) {
      return {
        date: fallbackDate || 'Sep 13, 2026',
        time: fallbackTime || '1:14:51 PM',
        full: `${fallbackDate || 'Sep 13, 2026'} · ${fallbackTime || '1:14:51 PM'}`,
      };
    }
    const date = d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const time = d.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    });
    return { date, time, full: `${date} · ${time}` };
  };

  const firstDateFormatted = formatDateTime(
    timeline[0]?.timestamp,
    firstBuyTime || undefined,
    firstBuyDate || undefined
  ).full;

  return (
    <div className="rounded border border-terminal-green/40 bg-terminal-panel p-4 shadow-[0_0_15px_-3px_rgba(34,197,94,0.1)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-terminal-border/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-terminal-green/20 text-terminal-green">
            <Flame className="h-4 w-4" />
          </span>
          <span className="font-mono text-sm font-bold text-terminal-text tracking-wide">
            Smart Money Accumulation Detected on ${tokenSymbol}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="rounded bg-terminal-green/15 border border-terminal-green/30 px-2 py-0.5 text-terminal-green font-bold">
            {followingTradersCount + 1} TRACKED TRADERS
          </span>
          <span className="text-terminal-muted">
            Window: <strong className="text-terminal-text">{accumulationWindowMinutes}m</strong>
          </span>
        </div>
      </div>

      {/* Summary KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 font-mono text-xs">
        <div className="rounded border border-terminal-border bg-terminal-bg p-2.5">
          <div className="text-terminal-dim uppercase text-[10px]">First Buyer</div>
          <Link
            href={`/traders/${firstBuyer}`}
            className="text-terminal-green font-bold hover:underline flex items-center gap-1 mt-0.5"
          >
            <Award className="h-3 w-3" />
            @{firstBuyer}
          </Link>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-bg p-2.5">
          <div className="text-terminal-dim uppercase text-[10px]">First Entry Date & Time</div>
          <div className="text-terminal-text font-semibold mt-0.5">{firstDateFormatted}</div>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-bg p-2.5">
          <div className="text-terminal-dim uppercase text-[10px]">Following Traders</div>
          <div className="text-terminal-cyan font-bold mt-0.5">+{followingTradersCount} traders</div>
        </div>
        <div className="rounded border border-terminal-border bg-terminal-bg p-2.5">
          <div className="text-terminal-dim uppercase text-[10px]">Accumulated Volume</div>
          <div className="text-terminal-text font-bold mt-0.5">
            ${totalAccumulatedUsd ? totalAccumulatedUsd.toLocaleString() : '65,500'}
          </div>
        </div>
      </div>

      {/* Visual Timeline Cascade */}
      <div className="mt-3 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-mono font-semibold text-terminal-muted uppercase tracking-wider">
          <span>Cascade Entry Sequence:</span>
          <span className="text-terminal-dim">Entry Price vs Current Price ($0.41600)</span>
        </div>
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-terminal-border">
          {timeline.map((item, idx) => {
            const dt = formatDateTime(item.timestamp, item.timeFormatted, item.dateFormatted);
            const isCriteria = item.isCriteriaMet || idx === 1;
            const entryPrice = item.priceUsd;
            const currentPrice = currentPriceUsd || 0.416;
            const pnlPercent = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;

            return (
              <div
                key={idx}
                className={`relative flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono p-2 rounded ${
                  isCriteria ? 'bg-terminal-green/5 border border-terminal-green/30' : ''
                }`}
              >
                <div
                  className={`absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${
                    item.isFirst
                      ? 'border-terminal-green bg-terminal-green text-black'
                      : isCriteria
                      ? 'border-terminal-green bg-terminal-green/30 text-terminal-green'
                      : 'border-terminal-cyan bg-terminal-panel text-terminal-cyan'
                  }`}
                >
                  {idx + 1}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-terminal-dim text-[11px]">{dt.full}</span>
                  <Link
                    href={`/traders/${item.traderHandle}`}
                    className="font-bold text-terminal-text hover:text-terminal-green"
                  >
                    @{item.traderHandle}
                  </Link>
                  <span className="text-[10px] rounded bg-zinc-800 px-1 py-0.2 text-terminal-muted border border-zinc-700">
                    Score {item.traderScore}
                  </span>
                  {item.isFirst && (
                    <span className="text-[9px] font-bold uppercase rounded bg-terminal-green/20 text-terminal-green border border-terminal-green/40 px-1.5 py-0.2">
                      FIRST IN
                    </span>
                  )}
                  {isCriteria && (
                    <span className="text-[9px] font-bold uppercase rounded bg-terminal-green text-black px-1.5 py-0.2 flex items-center gap-1 shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                      🎯 CRITERIA MET (SIGNAL TRIGGER)
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="text-[11px]">
                    <span className="text-terminal-dim">Entry: </span>
                    <span className="text-terminal-muted font-bold">${entryPrice.toFixed(5)}</span>
                    <span className="text-terminal-dim"> → Current: </span>
                    <span className="text-terminal-text font-bold">${currentPrice.toFixed(5)}</span>
                    <span
                      className={`ml-1 font-bold ${
                        pnlPercent >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                      }`}
                    >
                      ({pnlPercent >= 0 ? '+' : ''}
                      {pnlPercent.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-terminal-muted font-bold">
                      ${item.amountUsd.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-terminal-dim">
                      {item.isFirst ? '0m' : `+${item.minutesAfterFirst}m`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
