'use client';

import React, { useState, useEffect } from 'react';
import { FlaskConical, Play, CheckCircle, AlertTriangle, ShieldCheck, RefreshCw, Sliders } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function ResearchLabPage() {
  const [flavor, setFlavor] = useState<string>('ALL_SIGNALS_COMBINED');
  const [delaySec, setDelaySec] = useState<number>(15);
  const [slippagePct, setSlippagePct] = useState<number>(0.5);
  const [loading, setLoading] = useState<boolean>(true);
  const [result, setResult] = useState<any>(null);

  const runExperiment = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/research/walk-forward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          strategyFlavor: flavor,
          entryDelaySeconds: delaySec,
          slippagePct,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.warn('[ResearchLab] Run error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runExperiment();
  }, [flavor, delaySec, slippagePct]);

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-terminal-green" />
            <h1 className="text-xl font-bold text-terminal-text">
              Alpha Research Lab & Walk-Forward Testing
            </h1>
            <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-[10px] font-bold text-terminal-green">
              ZERO LOOK-AHEAD BIAS
            </span>
          </div>
          <p className="text-xs text-terminal-muted mt-1">
            Empirically evaluate isolated signal families, out-of-sample edge, latency degradation, and feature attribution.
          </p>
        </div>

        <button
          onClick={() => runExperiment()}
          disabled={loading}
          className="rounded bg-terminal-green px-4 py-2 font-bold text-black hover:bg-terminal-green/90 transition-colors flex items-center gap-2 self-start"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-Run Experiment</span>
        </button>
      </div>

      {/* Control Panel: Strategy Flavor, Delay, Slippage */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-4">
        <div className="flex items-center gap-2 text-terminal-cyan font-bold uppercase text-[11px]">
          <Sliders className="h-3.5 w-3.5" />
          <span>Experiment Parameters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-terminal-dim block mb-1">Signal Strategy Family:</label>
            <select
              value={flavor}
              onChange={(e) => setFlavor(e.target.value)}
              className="w-full rounded border border-terminal-border bg-terminal-bg p-2 text-terminal-text focus:outline-none focus:border-terminal-green"
            >
              <option value="CONVERGENCE_ONLY">Strategy A: Convergence Only</option>
              <option value="CONVERGENCE_AND_THESIS">Strategy B: Convergence + Thesis</option>
              <option value="CONVERGENCE_THESIS_HOLDER">Strategy C: Convergence + Thesis + Holders</option>
              <option value="EARLY_ALPHA_ONCHAIN">Strategy D: Early Alpha (On-Chain Latency)</option>
              <option value="ALL_SIGNALS_COMBINED">Strategy E: All Signals Combined</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between text-terminal-dim mb-1">
              <span>Entry Delay (Latency):</span>
              <span className="font-bold text-terminal-amber">{delaySec}s</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={delaySec}
              onChange={(e) => setDelaySec(parseInt(e.target.value, 10))}
              className="w-full accent-terminal-amber cursor-pointer"
            />
            <span className="text-[10px] text-terminal-dim">Simulates latency between on-chain fill and entry</span>
          </div>

          <div>
            <div className="flex justify-between text-terminal-dim mb-1">
              <span>Slippage & Drag:</span>
              <span className="font-bold text-terminal-red">{slippagePct}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="5.0"
              step="0.1"
              value={slippagePct}
              onChange={(e) => setSlippagePct(parseFloat(e.target.value))}
              className="w-full accent-terminal-red cursor-pointer"
            />
            <span className="text-[10px] text-terminal-dim">Deducted on both entry and exit</span>
          </div>
        </div>
      </div>

      {result && (
        <div className="space-y-6">
          {/* 3-Way Segment Walk-Forward Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* In-Sample Train */}
            <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-2">
              <span className="text-terminal-dim text-[10px] uppercase font-bold">1. In-Sample Train (70%)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-terminal-green">+{result.inSample.returnPct}%</span>
                <span className="text-terminal-muted">{result.inSample.tradesCount} trades</span>
              </div>
              <div className="text-[11px] space-y-1 text-terminal-muted pt-2 border-t border-terminal-border/40">
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="text-terminal-text font-bold">{result.inSample.winRatePct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Factor:</span>
                  <span className="text-terminal-text font-bold">{result.inSample.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="text-terminal-red">{result.inSample.maxDrawdownPct}%</span>
                </div>
              </div>
            </div>

            {/* Validation */}
            <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-2">
              <span className="text-terminal-dim text-[10px] uppercase font-bold">2. Validation (15%)</span>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-bold text-terminal-cyan">+{result.validation.returnPct}%</span>
                <span className="text-terminal-muted">{result.validation.tradesCount} trades</span>
              </div>
              <div className="text-[11px] space-y-1 text-terminal-muted pt-2 border-t border-terminal-border/40">
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="text-terminal-text font-bold">{result.validation.winRatePct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Factor:</span>
                  <span className="text-terminal-text font-bold">{result.validation.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="text-terminal-red">{result.validation.maxDrawdownPct}%</span>
                </div>
              </div>
            </div>

            {/* Out-of-Sample Test */}
            <div className="rounded border border-terminal-green/50 bg-terminal-green/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-terminal-green text-[10px] uppercase font-bold">3. Out-Of-Sample (15% Unseen)</span>
                <span className="rounded bg-terminal-green/20 px-1.5 py-0.5 text-[9px] font-bold text-terminal-green">GOLD STANDARD</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold ${result.outOfSample.returnPct >= 0 ? 'text-terminal-green' : 'text-terminal-red'}`}>
                  {result.outOfSample.returnPct >= 0 ? '+' : ''}{result.outOfSample.returnPct}%
                </span>
                <span className="text-terminal-muted">{result.outOfSample.tradesCount} trades</span>
              </div>
              <div className="text-[11px] space-y-1 text-terminal-muted pt-2 border-t border-terminal-border/40">
                <div className="flex justify-between">
                  <span>Win Rate:</span>
                  <span className="text-terminal-text font-bold">{result.outOfSample.winRatePct}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Profit Factor:</span>
                  <span className="text-terminal-text font-bold">{result.outOfSample.profitFactor}</span>
                </div>
                <div className="flex justify-between">
                  <span>Max Drawdown:</span>
                  <span className="text-terminal-red">{result.outOfSample.maxDrawdownPct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div className="rounded border border-terminal-border bg-terminal-panel p-3.5 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-terminal-green flex-shrink-0" />
            <div>
              <div className="font-bold text-terminal-text">Empirical Verdict</div>
              <div className="text-terminal-muted text-[11px]">{result.verdict}</div>
            </div>
          </div>

          {/* Latency & Slippage Degradation Curves */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3">
              <h3 className="font-bold text-terminal-text uppercase text-[11px]">
                Latency Degradation Curve (Memecoin Speed Sensitivity)
              </h3>
              <div className="space-y-1.5">
                {result.latencyImpactCurve.map((pt: any) => (
                  <div key={pt.delaySec} className="flex items-center justify-between text-[11px]">
                    <span className="text-terminal-dim w-24">Delay: {pt.delaySec}s</span>
                    <div className="flex-1 mx-3 h-2 rounded bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-terminal-amber rounded"
                        style={{ width: `${Math.max(5, Math.min(100, (pt.returnPct / 60) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-terminal-text w-16 text-right">
                      +{pt.returnPct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3">
              <h3 className="font-bold text-terminal-text uppercase text-[11px]">
                Slippage Sensitivity Curve
              </h3>
              <div className="space-y-1.5">
                {result.slippageImpactCurve.map((pt: any) => (
                  <div key={pt.slippagePct} className="flex items-center justify-between text-[11px]">
                    <span className="text-terminal-dim w-24">Slippage: {pt.slippagePct}%</span>
                    <div className="flex-1 mx-3 h-2 rounded bg-zinc-800 overflow-hidden">
                      <div
                        className="h-full bg-terminal-red rounded"
                        style={{ width: `${Math.max(5, Math.min(100, (pt.returnPct / 60) * 100))}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-terminal-text w-16 text-right">
                      +{pt.returnPct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Feature Importance & Attribution Table */}
          <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3">
            <h3 className="font-bold text-terminal-text uppercase text-[11px]">
              Feature Attribution & Maturity Ranking
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-terminal-border/60 text-[10px] text-terminal-dim uppercase">
                    <th className="p-2">Feature / Signal Family</th>
                    <th className="p-2">Correlation with Out-of-Sample Return</th>
                    <th className="p-2">Contribution</th>
                    <th className="p-2 text-right">Maturity Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-terminal-border/40">
                  {result.featureImportance.map((f: any) => (
                    <tr key={f.feature} className="hover:bg-terminal-hover/40">
                      <td className="p-2 font-bold text-terminal-text">{f.feature}</td>
                      <td className="p-2 text-terminal-cyan">r = +{f.correlationWithReturn}</td>
                      <td className="p-2 text-terminal-green font-bold">+{f.contributionPts} pts</td>
                      <td className="p-2 text-right">
                        <span
                          className={`rounded px-2 py-0.5 text-[9px] font-bold uppercase ${
                            f.maturity === 'HIGH'
                              ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/40'
                              : 'bg-zinc-800 text-zinc-400'
                          }`}
                        >
                          {f.maturity}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
