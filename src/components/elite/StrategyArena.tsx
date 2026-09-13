'use client';

import React, { useState, useEffect } from 'react';
import { EmpiricalBacktestComparison } from '@/lib/types/elite';
import { BarChart3, Award, ArrowUpRight, TrendingUp } from 'lucide-react';

export const StrategyArena: React.FC = () => {
  const [data, setData] = useState<EmpiricalBacktestComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchBacktest();
  }, []);

  const fetchBacktest = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/elite/backtest-comparison');
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (e) {
      console.error('Failed to load strategy comparison', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel font-mono text-terminal-text shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-terminal-border p-4 bg-terminal-bg/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <BarChart3 className="h-4 w-4 text-amber-400" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-terminal-text uppercase">
              5-STRATEGY EMPIRICAL ARENA
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded">
              WALK-FORWARD BENCHMARK
            </span>
          </div>
          <p className="text-xs text-terminal-dim mt-1">
            Empirical out-of-sample backtest comparison: Fresh Accumulation & Lead-Lag vs. Naive Leaderboard Following.
          </p>
        </div>
        <div className="text-xs text-terminal-dim font-bold">
          Time Horizon: 30D Rolling
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center text-terminal-dim text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-5 w-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
            <span>Simulating rolling walk-forward execution across all 5 paradigms...</span>
          </div>
        ) : !data ? (
          <div className="py-8 text-center text-terminal-dim text-xs">
            Unable to load empirical comparison data.
          </div>
        ) : (
          <div className="overflow-x-auto rounded border border-terminal-border/80">
            <table className="w-full text-left font-mono text-xs min-w-[700px]">
              <thead className="bg-terminal-bg text-[11px] text-terminal-dim uppercase tracking-wider border-b border-terminal-border">
                <tr>
                  <th className="p-3">Strategy Paradigm</th>
                  <th className="p-3 text-center">Trades</th>
                  <th className="p-3 text-center">Win Rate</th>
                  <th className="p-3 text-center">Profit Factor</th>
                  <th className="p-3 text-center">Avg Gain</th>
                  <th className="p-3 text-center">Max Drawdown</th>
                  <th className="p-3 text-center">Sharpe</th>
                  <th className="p-3 text-right">Alpha vs Naive</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/60">
                {data.strategies.map((strat, idx) => {
                  const isTopPick = idx === 4; // Fresh Accum + Lead Trader
                  const isNaive = idx === 0;

                  return (
                    <tr
                      key={strat.strategyName}
                      className={`transition-colors ${
                        isTopPick
                          ? 'bg-emerald-950/20 font-bold border-l-2 border-terminal-green'
                          : isNaive
                          ? 'bg-rose-950/10 text-terminal-dim'
                          : 'hover:bg-terminal-hover/60'
                      }`}
                    >
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <span className={isTopPick ? 'text-terminal-green' : isNaive ? 'text-terminal-dim' : 'text-terminal-text'}>
                            {strat.strategyName}
                          </span>
                          {isTopPick && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded font-normal flex items-center gap-0.5">
                              <Award className="h-2.5 w-2.5" />
                              BEST ALPHA
                            </span>
                          )}
                          {isNaive && (
                            <span className="px-1.5 py-0.2 text-[9px] bg-rose-500/20 text-rose-400 border border-rose-500/40 rounded font-normal">
                              BASELINE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-terminal-dim font-normal mt-0.5">
                          {strat.description}
                        </div>
                      </td>
                      <td className="p-3 text-center text-terminal-muted">{strat.totalTrades}</td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-bold ${
                            strat.winRatePct >= 70
                              ? 'text-terminal-green'
                              : strat.winRatePct >= 50
                              ? 'text-terminal-amber'
                              : 'text-terminal-red'
                          }`}
                        >
                          {strat.winRatePct}%
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-semibold ${
                            strat.profitFactor >= 2.0
                              ? 'text-terminal-green'
                              : strat.profitFactor >= 1.2
                              ? 'text-terminal-text'
                              : 'text-terminal-red'
                          }`}
                        >
                          {strat.profitFactor.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-semibold ${
                            strat.avgGainPct > 0 ? 'text-terminal-green' : 'text-terminal-red'
                          }`}
                        >
                          {strat.avgGainPct > 0 ? `+${strat.avgGainPct}%` : `${strat.avgGainPct}%`}
                        </span>
                      </td>
                      <td className="p-3 text-center text-terminal-dim">
                        -{strat.maxDrawdownPct}%
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`font-bold ${
                            strat.sharpeRatio >= 2.0
                              ? 'text-terminal-green'
                              : strat.sharpeRatio >= 1.0
                              ? 'text-terminal-amber'
                              : 'text-terminal-red'
                          }`}
                        >
                          {strat.sharpeRatio.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <span
                          className={`font-bold ${
                            strat.alphaVsNaivePct > 0 ? 'text-terminal-green' : 'text-terminal-dim'
                          }`}
                        >
                          {strat.alphaVsNaivePct > 0 ? `+${strat.alphaVsNaivePct.toFixed(1)}%` : '0.0%'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
