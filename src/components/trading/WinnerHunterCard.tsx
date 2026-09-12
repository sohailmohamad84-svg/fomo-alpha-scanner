'use client';

import React from 'react';
import Link from 'next/link';
import { Target, Award, Sparkles, ArrowRight } from 'lucide-react';

interface Props {
  candidates: any[];
}

export function WinnerHunterCard({ candidates }: Props) {
  if (!candidates || candidates.length === 0) return null;

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel p-4 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-terminal-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-terminal-green" />
          <h2 className="text-sm font-bold text-terminal-text uppercase tracking-wider">
            Winner-Finders: Next Moves
          </h2>
          <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-[9px] font-bold text-terminal-green">
            PROVEN 10X–100X DISCOVERERS
          </span>
        </div>
        <span className="text-[10px] text-terminal-dim">
          What are historically proven early discoverers buying right now?
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {candidates.map((cand) => (
          <div
            key={`${cand.network}:${cand.tokenAddress}`}
            className="rounded border border-terminal-border/60 bg-terminal-bg p-3 space-y-2 hover:border-terminal-green/40 transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-terminal-text text-sm">${cand.symbol}</span>
                <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[9px] text-terminal-dim uppercase">
                  {cand.network}
                </span>
              </div>
              <div className="text-right">
                <span className="text-terminal-green font-bold text-sm">
                  {cand.candidateScore}
                </span>
                <span className="text-[9px] text-terminal-dim">/100</span>
              </div>
            </div>

            <div className="space-y-1 text-[11px] text-terminal-muted border-t border-terminal-border/40 pt-2">
              <div className="flex items-center justify-between">
                <span>Winner Finders:</span>
                <span className="text-terminal-text font-bold">
                  {cand.winnerFinders.join(', ')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Avg Discovery Score:</span>
                <span className="text-terminal-cyan font-bold">
                  {cand.avgDiscoveryScore}/100
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Accumulated:</span>
                <span className="text-terminal-green font-bold">
                  ${Math.round(cand.totalAccumulatedUsd || 0).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between text-[10px]">
              <span className="text-terminal-dim">
                {cand.thesesCount > 0 ? `✓ ${cand.thesesCount} Theses Published` : 'Flow accumulation'}
              </span>
              <Link
                href={`/tokens/${cand.network}:${cand.tokenAddress}`}
                className="text-terminal-green hover:underline flex items-center gap-0.5"
              >
                <span>View Candidate</span>
                <ArrowRight className="h-2.5 w-2.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
