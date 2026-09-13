'use client';

import React, { useState, useEffect } from 'react';
import {
  ConsensusLifecycleState,
  TokenConsensusSummary,
} from '@/lib/types/elite';
import { ShieldCheck, Flame, AlertTriangle, ArrowUpRight, TrendingUp, Users } from 'lucide-react';
import Link from 'next/link';

export const EliteConsensusDashboard: React.FC = () => {
  const [summaries, setSummaries] = useState<TokenConsensusSummary[]>([]);
  const [selectedState, setSelectedState] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchSummaries();
  }, [selectedState]);

  const fetchSummaries = async () => {
    try {
      setLoading(true);
      const url = selectedState === 'all'
        ? '/api/elite/consensus'
        : `/api/elite/consensus?state=${selectedState}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setSummaries(data.summaries || []);
      }
    } catch (e) {
      console.error('Failed to load consensus summaries', e);
    } finally {
      setLoading(false);
    }
  };

  const getLifecycleBadge = (state: ConsensusLifecycleState) => {
    switch (state) {
      case 'FRESH_ACCUMULATION':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'ACCELERATING':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40';
      case 'EARLY_CONSENSUS':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
      case 'MATURE_CONSENSUS':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
      case 'CROWDED':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      case 'DISTRIBUTION':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'BROKEN':
        return 'bg-red-900/30 text-red-500 border-red-700/50';
      default:
        return 'bg-zinc-800 text-zinc-300 border-zinc-700';
    }
  };

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel font-mono text-terminal-text shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 border-b border-terminal-border p-4 bg-terminal-bg/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="h-4 w-4 text-terminal-green" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-terminal-text uppercase">
              ELITE CONSENSUS & ACCUMULATION MATRIX
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40 rounded">
              SOLID V4
            </span>
          </div>
          <p className="text-xs text-terminal-dim mt-1">
            Distinguishing <span className="text-terminal-green font-bold">Fresh Accumulation</span> vs.{' '}
            <span className="text-terminal-cyan font-bold">Mature Consensus</span> vs.{' '}
            <span className="text-terminal-red font-bold">Distribution Traps</span> (Herfindahl Concentration & Price Extension Penalized)
          </p>
        </div>

        {/* State Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'FRESH_ACCUMULATION', 'ACCELERATING', 'MATURE_CONSENSUS', 'DISTRIBUTION'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-2.5 py-1 text-xs rounded transition-all font-mono border ${
                selectedState === st
                  ? 'bg-terminal-green/20 text-terminal-green border-terminal-green/50 font-bold'
                  : 'bg-terminal-bg text-terminal-muted border-terminal-border hover:text-terminal-text hover:bg-terminal-hover'
              }`}
            >
              {st === 'all' ? 'All Lifecycle' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tokens */}
      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center text-terminal-dim text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-5 w-5 border-2 border-terminal-green border-t-transparent rounded-full animate-spin" />
            <span>Analyzing on-chain elite positions & concentration...</span>
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-8 text-center text-terminal-dim text-xs">
            No tokens match the selected lifecycle criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {summaries.map((s) => (
              <div
                key={s.tokenAddress}
                className="rounded border border-terminal-border bg-terminal-bg/70 p-4 hover:border-terminal-border/80 transition-all duration-150 flex flex-col justify-between gap-3"
              >
                <div>
                  {/* Token Title & Lifecycle Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-terminal-text">${s.symbol}</span>
                        <span className="text-[10px] text-terminal-dim uppercase font-mono px-1.5 py-0.2 bg-terminal-panel rounded border border-terminal-border">
                          {s.network}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-terminal-muted mt-0.5">
                        ${s.currentPriceUsd < 0.01 ? s.currentPriceUsd.toFixed(6) : s.currentPriceUsd.toFixed(4)}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold tracking-wide rounded border ${getLifecycleBadge(
                        s.lifecycleState
                      )}`}
                    >
                      {s.lifecycleState.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Score Gauges */}
                  <div className="grid grid-cols-3 gap-2 my-3 p-2 bg-terminal-panel rounded border border-terminal-border/60">
                    <div className="text-center">
                      <div className="text-[9px] text-terminal-dim uppercase font-normal">Consensus</div>
                      <div className="text-xs font-bold text-terminal-cyan mt-0.5">{Math.round(s.eliteConsensusScore)}/100</div>
                    </div>
                    <div className="text-center border-x border-terminal-border/60">
                      <div className="text-[9px] text-terminal-dim uppercase font-normal">Accumulation</div>
                      <div className="text-xs font-bold text-terminal-green mt-0.5">{Math.round(s.freshAccumulationScore)}/100</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[9px] text-terminal-dim uppercase font-normal">Alpha V4</div>
                      <div className="text-xs font-bold text-terminal-amber mt-0.5">{Math.round(s.masterEliteAlphaScore)}/100</div>
                    </div>
                  </div>

                  {/* Concentration (HHI) & Price Extension */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-terminal-dim">Concentration:</span>
                      <span
                        className={`font-mono font-bold ${
                          s.herfindahlIndex > 0.60
                            ? 'text-terminal-red'
                            : s.herfindahlIndex > 0.35
                            ? 'text-terminal-amber'
                            : 'text-terminal-green'
                        }`}
                      >
                        {s.herfindahlIndex > 0.60 ? 'WHALE TRAP (High)' : s.herfindahlIndex > 0.35 ? 'MODERATE' : 'DISTRIBUTED'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-dim">Price Extension:</span>
                      <span
                        className={`font-mono font-bold ${
                          s.isTooLate
                            ? 'text-terminal-red'
                            : s.priceExtensionPct > 20
                            ? 'text-terminal-amber'
                            : 'text-terminal-green'
                        }`}
                      >
                        +{s.priceExtensionPct}% {s.isTooLate && '(TOO LATE)'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-terminal-dim">Elite Position Action:</span>
                      <span className="font-mono text-terminal-text text-[11px]">
                        <span className="text-terminal-green font-bold">+{s.freshAccumulatorsCount} New</span> •{' '}
                        <span className="text-terminal-cyan font-bold">{s.eliteHoldersCount} Hold</span> •{' '}
                        <span className="text-terminal-red font-bold">-{s.reducersCount} Exit</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Leader Sequence Tag */}
                {s.firstLeaderHandle && (
                  <div className="pt-2 border-t border-terminal-border/50 flex items-center justify-between text-[11px] text-terminal-dim">
                    <span>Lead Trader:</span>
                    <span className="font-bold text-purple-300 font-mono">
                      @{s.firstLeaderHandle} {s.confirmingFollowers.length > 0 && `➔ +${s.confirmingFollowers.length}`}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
