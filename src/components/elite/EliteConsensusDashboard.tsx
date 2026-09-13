'use client';

import React, { useState, useEffect } from 'react';
import {
  ConsensusLifecycleState,
  TokenConsensusSummary,
} from '@/lib/types/elite';

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

  const getLifecycleColor = (state: ConsensusLifecycleState) => {
    switch (state) {
      case 'FRESH_ACCUMULATION':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      case 'ACCELERATING':
        return 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30';
      case 'EARLY_CONSENSUS':
        return 'bg-purple-500/15 text-purple-400 border-purple-500/30';
      case 'MATURE_CONSENSUS':
        return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
      case 'CROWDED':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'DISTRIBUTION':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'BROKEN':
        return 'bg-red-900/30 text-red-500 border-red-700/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              ELITE CONSENSUS & ACCUMULATION MATRIX
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
              SOLID V4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Distinguishing <span className="text-emerald-400 font-semibold">Fresh Accumulation</span> vs.{' '}
            <span className="text-blue-400 font-semibold">Mature Consensus</span> vs.{' '}
            <span className="text-rose-400 font-semibold">Distribution Traps</span> (Concentration & Extension Penalized)
          </p>
        </div>

        {/* State Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {['all', 'FRESH_ACCUMULATION', 'ACCELERATING', 'MATURE_CONSENSUS', 'DISTRIBUTION'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedState(st)}
              className={`px-2.5 py-1 text-xs rounded-md transition-all font-medium border ${
                selectedState === st
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500/50 shadow-sm'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700/50 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {st === 'all' ? 'All Lifecycle' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Tokens */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-500 text-sm">
          <div className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2" />
          Analyzing on-chain elite positions & concentration...
        </div>
      ) : summaries.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          No tokens match the selected lifecycle criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {summaries.map((s) => (
            <div
              key={s.tokenAddress}
              className="bg-slate-800/40 border border-slate-700/60 hover:border-slate-600 rounded-lg p-4 transition-all duration-200 hover:shadow-lg flex flex-col justify-between"
            >
              <div>
                {/* Token Title & Lifecycle Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-white">${s.symbol}</span>
                      <span className="text-xs text-slate-400 uppercase font-mono px-1.5 py-0.5 bg-slate-800 rounded">
                        {s.network}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-300 mt-0.5">
                      ${s.currentPriceUsd < 0.01 ? s.currentPriceUsd.toFixed(6) : s.currentPriceUsd.toFixed(4)}
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 text-[11px] font-bold tracking-wide rounded-full border ${getLifecycleColor(
                      s.lifecycleState
                    )}`}
                  >
                    {s.lifecycleState.replace('_', ' ')}
                  </span>
                </div>

                {/* Score Gauges */}
                <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-900/60 rounded-md border border-slate-800/80">
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Consensus</div>
                    <div className="text-sm font-bold text-blue-400">{Math.round(s.eliteConsensusScore)}/100</div>
                  </div>
                  <div className="text-center border-x border-slate-800">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Accumulation</div>
                    <div className="text-sm font-bold text-emerald-400">{Math.round(s.freshAccumulationScore)}/100</div>
                  </div>
                  <div className="text-center">
                    <div className="text-[10px] text-slate-400 uppercase font-medium">Alpha V4</div>
                    <div className="text-sm font-bold text-amber-400">{Math.round(s.masterEliteAlphaScore)}/100</div>
                  </div>
                </div>

                {/* Concentration (HHI) & Price Extension */}
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Capital Concentration:</span>
                    <span
                      className={`font-mono font-semibold ${
                        s.herfindahlIndex > 0.60
                          ? 'text-rose-400'
                          : s.herfindahlIndex > 0.35
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {s.herfindahlIndex > 0.60 ? 'HIGH (Whale Trap)' : s.herfindahlIndex > 0.35 ? 'MODERATE' : 'DISTRIBUTED'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Price Extension:</span>
                    <span
                      className={`font-mono font-semibold ${
                        s.isTooLate
                          ? 'text-rose-400'
                          : s.priceExtensionPct > 20
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      +{s.priceExtensionPct}% {s.isTooLate && '(TOO LATE)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Elite Holders Breakdown:</span>
                    <span className="font-mono text-slate-300">
                      <span className="text-emerald-400 font-semibold">{s.freshAccumulatorsCount} New</span> •{' '}
                      <span className="text-blue-400 font-semibold">{s.eliteHoldersCount} Total</span> •{' '}
                      <span className="text-rose-400 font-semibold">{s.reducersCount} Exit</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Leader Sequence Tag */}
              {s.firstLeaderHandle && (
                <div className="mt-3 pt-2.5 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Lead Trader:</span>
                  <span className="font-medium text-purple-300 font-mono">
                    @{s.firstLeaderHandle} {s.confirmingFollowers.length > 0 && `-> +${s.confirmingFollowers.length} followers`}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
