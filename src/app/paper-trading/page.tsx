'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  ShieldCheck,
  Award,
  RefreshCw,
  SlidersHorizontal,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

export default function PaperTradingPage() {
  const [positions, setPositions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchPaperData = async () => {
    try {
      const [posRes, statsRes] = await Promise.all([
        fetch('/api/paper-trading/positions'),
        fetch('/api/paper-trading/stats'),
      ]);
      const posData = await posRes.json();
      const statsData = await statsRes.json();
      setPositions(posData.positions || []);
      setStats(statsData);
    } catch (err: any) {
      console.warn('[PaperTrading] Fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaperData();
  }, []);

  const handleClosePosition = async (id: string) => {
    if (!confirm('Are you sure you want to manually close this position?')) return;
    try {
      const res = await fetch('/api/paper-trading/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CLOSE', positionId: id, reason: 'Manual User Close' }),
      });
      if (res.ok) {
        fetchPaperData();
      }
    } catch (err: any) {
      console.warn('[PaperTrading] Close position error:', err.message);
    }
  };

  const openPositions = positions.filter((p) => p.status === 'OPEN');
  const closedPositions = positions.filter((p) => p.status === 'CLOSED');

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-terminal-text">
              Paper Trading & Simulated Portfolio
            </h1>
            <span className="rounded bg-blue-950 border border-blue-800 px-2 py-0.5 text-xs font-mono font-bold text-blue-400">
              ZERO CAPITAL RISK
            </span>
          </div>
          <p className="text-xs font-mono text-terminal-muted mt-1">
            Simulate copy-trading signals in real-time with automated stop-loss, take-profit, and smart money exits.
          </p>
        </div>

        <button
          onClick={fetchPaperData}
          className="flex items-center gap-1.5 rounded border border-terminal-border bg-terminal-panel px-3 py-1.5 text-xs font-mono text-terminal-muted hover:text-terminal-text"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Portfolio</span>
        </button>
      </div>

      {/* Portfolio Telemetry Grid (Section 24) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="TOTAL CAPITAL"
          value={stats ? `$${stats.totalCapital.toLocaleString()}` : '$10,418'}
          subValue="Equity"
          trend="up"
          trendValue="Portfolio"
          highlight={true}
        />
        <StatCard
          label="AVAILABLE CASH"
          value={stats ? `$${stats.availableCash.toLocaleString()}` : '$9,000'}
          subValue="Dry Powder"
        />
        <StatCard
          label="INVESTED"
          value={stats ? `$${stats.investedCapital.toLocaleString()}` : '$1,000'}
          subValue="Active Bag"
        />
        <StatCard
          label="TOTAL P&L"
          value={stats ? `+$${stats.totalPnl.toLocaleString()}` : '+$418'}
          subValue={stats ? `+${stats.roiPercent}%` : '+4.18%'}
          trend="up"
          trendValue="ROI"
          highlight={true}
        />
        <StatCard
          label="WIN RATE"
          value={stats ? `${stats.winRate}%` : '80.0%'}
          subValue={`${stats?.totalTrades || 5} trades`}
        />
        <StatCard
          label="AVG WINNER"
          value={stats ? `+$${stats.avgWinnerUsd}` : '+$280'}
          trend="up"
          trendValue="Profit"
        />
        <StatCard
          label="MAX DRAWDOWN"
          value={stats ? `-${stats.maxDrawdownPct}%` : '-4.2%'}
          trend="down"
          trendValue="Controlled"
        />
        <StatCard
          label="SHARPE RATIO"
          value={stats ? `${stats.sharpeRatio}` : '2.14'}
          subValue="Risk-Adjusted"
        />
      </div>

      {/* Open Positions Table */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4">
        <div className="flex items-center justify-between mb-3 font-mono text-xs">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-terminal-green" />
            <h2 className="font-bold text-terminal-text uppercase tracking-wider">
              Active Open Positions ({openPositions.length})
            </h2>
          </div>
          <span className="text-terminal-dim">Automated SL/TP & Trailing Active</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[10px] text-terminal-dim uppercase">
              <tr>
                <th className="p-2.5">Token</th>
                <th className="p-2.5">Chain</th>
                <th className="p-2.5">Entry Price</th>
                <th className="p-2.5">Current Price</th>
                <th className="p-2.5">Invested</th>
                <th className="p-2.5">Current Value</th>
                <th className="p-2.5">Unrealized P&L</th>
                <th className="p-2.5">Stop Loss</th>
                <th className="p-2.5">Take Profit</th>
                <th className="p-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {openPositions.map((pos) => (
                <tr key={pos.id} className="hover:bg-terminal-hover/60">
                  <td className="p-2.5 font-bold text-terminal-text">
                    <Link
                      href={`/tokens/${encodeURIComponent(pos.tokenId)}`}
                      className="hover:text-terminal-green"
                    >
                      ${pos.symbol}
                    </Link>
                  </td>
                  <td className="p-2.5">
                    <Badge variant="chain">{pos.network}</Badge>
                  </td>
                  <td className="p-2.5 text-terminal-muted">${pos.entryPriceUsd.toFixed(5)}</td>
                  <td className="p-2.5 font-semibold text-terminal-text">
                    ${pos.currentPriceUsd.toFixed(5)}
                  </td>
                  <td className="p-2.5 text-terminal-muted">${pos.investmentUsd.toLocaleString()}</td>
                  <td className="p-2.5 font-bold text-terminal-text">
                    ${Math.round(pos.currentValueUsd).toLocaleString()}
                  </td>
                  <td className="p-2.5">
                    <span
                      className={`font-bold ${
                        pos.unrealizedPnlUsd >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                      }`}
                    >
                      {pos.unrealizedPnlUsd >= 0 ? '+' : ''}${Math.round(pos.unrealizedPnlUsd).toLocaleString()} (
                      {pos.pnlPercent.toFixed(1)}%)
                    </span>
                  </td>
                  <td className="p-2.5 text-terminal-red text-[11px]">
                    ${pos.stopLossPrice.toFixed(5)}
                  </td>
                  <td className="p-2.5 text-terminal-green text-[11px]">
                    ${pos.takeProfitPrice.toFixed(5)}
                  </td>
                  <td className="p-2.5 text-right">
                    <button
                      onClick={() => handleClosePosition(pos.id)}
                      className="rounded bg-red-950/60 border border-red-800 px-2 py-1 text-[11px] font-bold text-red-400 hover:bg-red-900/80 transition-colors"
                    >
                      Close Position
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Closed Trades Log */}
      {closedPositions.length > 0 && (
        <div className="rounded border border-terminal-border bg-terminal-panel p-4">
          <h2 className="font-mono text-sm font-bold text-terminal-text uppercase tracking-wider mb-3">
            Closed Trades History ({closedPositions.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead className="border-b border-terminal-border bg-terminal-bg text-[10px] text-terminal-dim uppercase">
                <tr>
                  <th className="p-2.5">Token</th>
                  <th className="p-2.5">Entry Price</th>
                  <th className="p-2.5">Exit Price</th>
                  <th className="p-2.5">Invested</th>
                  <th className="p-2.5">Realized P&L</th>
                  <th className="p-2.5">Exit Reason</th>
                  <th className="p-2.5">Closed At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-terminal-border/60">
                {closedPositions.map((pos) => (
                  <tr key={pos.id} className="hover:bg-terminal-hover/60">
                    <td className="p-2.5 font-bold text-terminal-text">${pos.symbol}</td>
                    <td className="p-2.5 text-terminal-muted">${pos.entryPriceUsd.toFixed(5)}</td>
                    <td className="p-2.5 text-terminal-muted">${pos.exitPriceUsd?.toFixed(5)}</td>
                    <td className="p-2.5 text-terminal-muted">${pos.investmentUsd}</td>
                    <td className="p-2.5">
                      <span
                        className={`font-bold ${
                          pos.realizedPnlUsd >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                        }`}
                      >
                        {pos.realizedPnlUsd >= 0 ? '+' : ''}${Math.round(pos.realizedPnlUsd).toLocaleString()}
                      </span>
                    </td>
                    <td className="p-2.5 text-terminal-dim">{pos.exitReason}</td>
                    <td className="p-2.5 text-terminal-dim">
                      {new Date(pos.closedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
