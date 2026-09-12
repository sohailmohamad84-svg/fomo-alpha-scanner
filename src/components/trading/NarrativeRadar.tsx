'use client';

import React from 'react';
import { Radio, Flame, Sparkles, TrendingUp, Users } from 'lucide-react';
import { NarrativeCluster } from '@/lib/types/intelligence';

interface Props {
  narratives: NarrativeCluster[];
}

export function NarrativeRadar({ narratives }: Props) {
  if (!narratives || narratives.length === 0) {
    return (
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 text-center text-xs font-mono text-terminal-muted">
        No active narrative clusters currently forming.
      </div>
    );
  }

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel p-4 font-mono text-xs space-y-4">
      <div className="flex items-center justify-between border-b border-terminal-border/60 pb-3">
        <div className="flex items-center gap-2">
          <Radio className="h-4 w-4 text-purple-400 animate-pulse" />
          <h2 className="text-sm font-bold text-terminal-text uppercase tracking-wider">
            Narrative Radar
          </h2>
        </div>
        <span className="text-[10px] text-terminal-dim">
          Tracking semantic consensus & thesis acceleration
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {narratives.map((cluster) => (
          <div
            key={cluster.id}
            className="rounded border border-terminal-border/60 bg-terminal-bg p-3 space-y-2 hover:border-purple-500/50 transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-terminal-text text-sm">
                {cluster.name}
              </span>
              <span
                className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                  cluster.acceleration === 'HIGH'
                    ? 'bg-purple-950/80 text-purple-400 border border-purple-500/50'
                    : cluster.acceleration === 'MEDIUM'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/50'
                    : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {cluster.acceleration} Velocity
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-terminal-dim">Cluster Score:</span>
              <span className="font-bold text-purple-400 text-sm">
                {cluster.narrativeScore}/100
              </span>
            </div>

            <div className="space-y-1 text-[11px] text-terminal-muted border-t border-terminal-border/40 pt-2">
              <div className="flex items-center justify-between">
                <span>Traders Discussing:</span>
                <span className="text-terminal-text font-bold">
                  {cluster.traderHandles.length} ({cluster.eliteTraderCount} elite)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Theses Published:</span>
                <span className="text-terminal-text font-bold">
                  {cluster.totalThesesCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Associated Tokens:</span>
                <span className="text-terminal-cyan font-bold">
                  {cluster.symbols.map((s) => '$' + s).join(', ')}
                </span>
              </div>
            </div>

            {cluster.topTheses.length > 0 && (
              <div className="rounded bg-zinc-950 p-2 text-[10px] text-terminal-muted border border-zinc-900 mt-2">
                <span className="text-purple-400 font-bold block mb-0.5">
                  @{cluster.topTheses[0].traderHandle}:
                </span>
                <p className="line-clamp-2">"{cluster.topTheses[0].content}"</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
