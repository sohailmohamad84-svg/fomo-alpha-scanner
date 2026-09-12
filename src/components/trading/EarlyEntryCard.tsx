import React from 'react';
import Link from 'next/link';
import { Flame, Clock, ArrowRight, ShieldAlert, Award } from 'lucide-react';
import { EarlyEntryTimelineItem } from '@/lib/scoring/early-entry';

interface EarlyEntryCardProps {
  tokenSymbol: string;
  firstBuyer: string | null;
  firstBuyTime: string | null;
  firstBuyPriceUsd?: number | null;
  followingTradersCount: number;
  accumulationWindowMinutes: number;
  totalAccumulatedUsd?: number;
  timeline: EarlyEntryTimelineItem[];
}

export function EarlyEntryCard({
  tokenSymbol,
  firstBuyer,
  firstBuyTime,
  firstBuyPriceUsd,
  followingTradersCount,
  accumulationWindowMinutes,
  totalAccumulatedUsd,
  timeline,
}: EarlyEntryCardProps) {
  if (!firstBuyer) return null;

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
          <div className="text-terminal-dim uppercase text-[10px]">First Entry Time</div>
          <div className="text-terminal-text font-semibold mt-0.5">{firstBuyTime || 'N/A'}</div>
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
        <div className="text-[11px] font-mono font-semibold text-terminal-muted uppercase tracking-wider">
          Cascade Entry Sequence:
        </div>
        <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-terminal-border">
          {timeline.map((item, idx) => (
            <div key={idx} className="relative flex items-center justify-between text-xs font-mono">
              <div
                className={`absolute -left-6 flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-bold ${
                  item.isFirst
                    ? 'border-terminal-green bg-terminal-green text-black'
                    : 'border-terminal-cyan bg-terminal-panel text-terminal-cyan'
                }`}
              >
                {idx + 1}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-terminal-dim">{item.timeFormatted}</span>
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
              </div>
              <div className="flex items-center gap-3">
                <span className="text-terminal-muted">
                  ${item.amountUsd.toLocaleString()}
                </span>
                <span className="text-[10px] text-terminal-dim">
                  {item.isFirst ? '0m' : `+${item.minutesAfterFirst}m`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
