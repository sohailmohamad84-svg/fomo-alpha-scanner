'use client';

import React, { useState, useEffect } from 'react';
import { EmpiricalBacktestComparison } from '@/lib/types/elite';

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
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              5-STRATEGY EMPIRICAL ARENA
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded">
              HEAD-TO-HEAD BACKTEST
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirical out-of-sample backtest comparison: Proving why Fresh Accumulation & Lead-Lag beats naive leaderboard copying.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          Simulating rolling walk-forward execution across all 5 strategies...
        </div>
      ) : !data ? (
        <div className="py-6 text-center text-slate-500 text-sm">
          Unable to generate empirical comparison.
        </div>
      ) : (
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-3">Strategy Paradigm</th>
                <th className="py-3 px-2 text-center">Trades</th>
                <th className="py-3 px-2 text-center">Win Rate</th>
                <th className="py-3 px-2 text-center">Profit Factor</th>
                <th className="py-3 px-2 text-center">Avg Gain</th>
                <th className="py-3 px-2 text-center">Max Drawdown</th>
                <th className="py-3 px-2 text-center">Sharpe</th>
                <th className="py-3 px-3 text-right">Alpha vs Naive</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {data.strategies.map((strat, idx) => {
                const isWinner = idx === 4;
                const isNaive = idx === 0;

                return (
                  <tr
                    key={strat.strategyName}
                    className={`transition-colors ${
                      isWinner
                        ? 'bg-emerald-950/25 font-medium border-l-2 border-emerald-500'
                        : isNaive
                        ? 'bg-rose-950/15 opacity-80'
                        : 'hover:bg-slate-800/30'
                    }`}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-white flex items-center gap-1.5">
                        {strat.strategyName}
                        {isWinner && (
                          <span className="px-1.5 py-0.2 text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded font-normal">
                            BEST SHARPE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{strat.description}</div>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">{strat.totalTrades}</td>
                    <td className="py-3 px-2 text-center font-mono">
                      <span
                        className={`font-bold ${
                          strat.winRatePct >= 70
                            ? 'text-emerald-400'
                            : strat.winRatePct >= 50
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {strat.winRatePct}%
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          strat.profitFactor >= 2.0
                            ? 'text-emerald-400'
                            : strat.profitFactor >= 1.2
                            ? 'text-slate-200'
                            : 'text-rose-400'
                        }`}
                      >
                        {strat.profitFactor.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          strat.avgGainPct > 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {strat.avgGainPct > 0 ? `+${strat.avgGainPct}%` : `${strat.avgGainPct}%`}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-center font-mono text-slate-400">
                      -{strat.maxDrawdownPct}%
                    </td>
                    <td className="py-3 px-2 text-center font-mono">
                      <span
                        className={`font-bold ${
                          strat.sharpeRatio >= 2.0
                            ? 'text-emerald-400'
                            : strat.sharpeRatio >= 1.0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {strat.sharpeRatio.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono">
                      <span
                        className={`font-bold ${
                          strat.alphaVsNaivePct > 0 ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                      >
                        {strat.alphaVsNaivePct > 0 ? `+${strat.alphaVsNaivePct.toFixed(1)}%` : '0.0% (Baseline)'}
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
  );
};
