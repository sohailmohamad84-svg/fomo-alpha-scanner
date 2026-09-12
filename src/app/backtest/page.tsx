'use client';

import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  Play,
  TrendingUp,
  Sliders,
  Award,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';

export default function BacktestPage() {
  const [startingCapital, setStartingCapital] = useState<number>(10000);
  const [scoreThreshold, setScoreThreshold] = useState<number>(75);
  const [minTraders, setMinTraders] = useState<number>(2);
  const [stopLoss, setStopLoss] = useState<number>(10);
  const [takeProfit, setTakeProfit] = useState<number>(40);
  const [days, setDays] = useState<number>(30);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/backtest/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startingCapitalUsd: startingCapital,
          smartMoneyThreshold: scoreThreshold,
          minTradersCount: minTraders,
          stopLossPct: stopLoss,
          takeProfitPct: takeProfit,
          daysToTest: days,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      console.warn('[Backtest] Run warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Run on mount if no result
  React.useEffect(() => {
    runSimulation();
  }, []);

  const curve = result?.equityCurve || [];
  const maxVal = Math.max(...curve.map((c: any) => Math.max(c.smartMoneyEquity, c.buyHoldEquity)), 12000);
  const minVal = Math.min(...curve.map((c: any) => Math.min(c.smartMoneyEquity, c.buyHoldEquity)), 8000);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-terminal-text">
              Smart Money Strategy Backtester
            </h1>
            <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-xs font-mono font-bold text-terminal-green">
              HISTORICAL SIMULATOR
            </span>
          </div>
          <p className="text-xs font-mono text-terminal-muted mt-1">
            Validate convergence thresholds and exit parameters against historical FOMO smart trader fills.
          </p>
        </div>

        <button
          onClick={runSimulation}
          disabled={loading}
          className="flex items-center gap-2 rounded bg-terminal-green px-4 py-2 font-mono text-xs font-bold text-black hover:bg-terminal-green-bright transition-colors shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
        >
          <Play className="h-3.5 w-3.5 fill-black" />
          <span>{loading ? 'Simulating...' : 'Run Backtest'}</span>
        </button>
      </div>

      {/* Parameter Control Panel */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 font-mono text-xs space-y-4">
        <div className="flex items-center gap-2 text-terminal-dim uppercase font-bold text-[11px]">
          <Sliders className="h-3.5 w-3.5 text-terminal-green" />
          <span>Backtesting Parameters</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-terminal-muted mb-1 text-[11px]">Starting Capital ($):</label>
            <input
              type="number"
              value={startingCapital}
              onChange={(e) => setStartingCapital(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-terminal-muted mb-1 text-[11px]">Min Score Threshold:</label>
            <input
              type="number"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-terminal-muted mb-1 text-[11px]">Min Traders Count:</label>
            <input
              type="number"
              value={minTraders}
              onChange={(e) => setMinTraders(parseInt(e.target.value, 10) || 0)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-terminal-muted mb-1 text-[11px]">Stop Loss (%):</label>
            <input
              type="number"
              value={stopLoss}
              onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-terminal-muted mb-1 text-[11px]">Take Profit (%):</label>
            <input
              type="number"
              value={takeProfit}
              onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-terminal-muted mb-1 text-[11px]">Test Duration:</label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value, 10))}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:outline-none"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days</option>
              <option value={60}>60 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Performance Summary KPI Cards (Section 25) */}
      {result && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <StatCard
            label="FINAL EQUITY"
            value={`$${result.finalCapital.toLocaleString()}`}
            subValue={`+$${result.finalCapital - result.initialCapital}`}
            trend="up"
            trendValue={`+${result.totalReturnPct}%`}
            highlight={true}
          />
          <StatCard
            label="SMART RETURN"
            value={`+${result.totalReturnPct}%`}
            subValue="Alpha Strategy"
            trend="up"
            trendValue="Outperformed"
          />
          <StatCard
            label="BUY & HOLD"
            value={`${result.buyHoldReturnPct >= 0 ? '+' : ''}${result.buyHoldReturnPct}%`}
            subValue="Benchmark"
            trend={result.buyHoldReturnPct >= 0 ? 'up' : 'down'}
            trendValue="Index"
          />
          <StatCard
            label="WIN RATE"
            value={`${result.winRatePct}%`}
            subValue={`${result.winningTrades}W / ${result.losingTrades}L`}
            trend="up"
            trendValue="Precision"
          />
          <StatCard
            label="PROFIT FACTOR"
            value={`${result.profitFactor}`}
            subValue="Gross Win/Loss"
            highlight={result.profitFactor >= 2.0}
          />
          <StatCard
            label="MAX DRAWDOWN"
            value={`-${result.maxDrawdownPct}%`}
            subValue="Peak to Trough"
            trend="down"
            trendValue="Controlled"
          />
          <StatCard
            label="BEST TRADE"
            value={`+${result.bestTradePct}%`}
            subValue="Take Profit"
            trend="up"
            trendValue="Peak Gain"
          />
          <StatCard
            label="TOTAL TRADES"
            value={result.totalTrades}
            subValue="Executed"
          />
        </div>
      )}

      {/* Interactive Equity Curve Chart */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-5 space-y-4">
        <div className="flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <LineChartIcon className="h-4 w-4 text-terminal-green" />
            <span className="font-bold text-terminal-text uppercase tracking-wider">
              Equity Curve: Smart Money Strategy vs Buy & Hold Benchmark
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-terminal-green"></span>
              <span className="text-terminal-text font-bold">Smart Money Strategy</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-terminal-dim"></span>
              <span className="text-terminal-muted">Buy & Hold Index</span>
            </div>
          </div>
        </div>

        {/* SVG Equity Line Chart */}
        <div className="h-64 w-full pt-4">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 800 200">
            {/* Grid Lines */}
            <line x1="0" y1="40" x2="800" y2="40" stroke="#1d2e23" strokeDasharray="3 3" />
            <line x1="0" y1="100" x2="800" y2="100" stroke="#1d2e23" strokeDasharray="3 3" />
            <line x1="0" y1="160" x2="800" y2="160" stroke="#1d2e23" strokeDasharray="3 3" />

            {/* Benchmark Path */}
            {curve.length > 1 && (
              <polyline
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 4"
                points={curve
                  .map((pt: any, idx: number) => {
                    const x = (idx / (curve.length - 1)) * 800;
                    const y = 180 - ((pt.buyHoldEquity - minVal) / (maxVal - minVal || 1)) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}

            {/* Strategy Path */}
            {curve.length > 1 && (
              <polyline
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                points={curve
                  .map((pt: any, idx: number) => {
                    const x = (idx / (curve.length - 1)) * 800;
                    const y = 180 - ((pt.smartMoneyEquity - minVal) / (maxVal - minVal || 1)) * 160;
                    return `${x},${y}`;
                  })
                  .join(' ')}
              />
            )}
          </svg>
        </div>

        <div className="flex justify-between text-[11px] font-mono text-terminal-dim border-t border-terminal-border pt-2">
          <span>Day 0 (Start)</span>
          <span>Day {Math.round(days / 2)}</span>
          <span>Day {days} (Present)</span>
        </div>
      </div>
    </div>
  );
}
