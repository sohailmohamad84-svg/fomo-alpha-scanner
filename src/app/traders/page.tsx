'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Filter, CheckCircle, ShieldCheck, Award, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function TradersPage() {
  const [traders, setTraders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [windowPeriod, setWindowPeriod] = useState<string>('24h');
  const [minQualityScore, setMinQualityScore] = useState<number>(60);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchTraders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/fomo/leaderboard?window=${windowPeriod}&minScore=${minQualityScore}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setTraders(data.traders || []);
    } catch (err: any) {
      console.warn('[Traders] Fetch warning:', err.message);
      setError(err.message || 'Failed to load traders. Click retry to reload.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraders();
  }, [windowPeriod, minQualityScore]);

  const filtered = traders.filter((t) => {
    if (verifiedOnly && !t.verified) return false;
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const matchHandle = t.handle?.toLowerCase().includes(q);
      const matchDisplay = t.displayName?.toLowerCase().includes(q);
      if (!matchHandle && !matchDisplay) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-terminal-text">
              Trader Discovery & Universe
            </h1>
            <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-xs font-mono font-bold text-terminal-green">
              QUALITY SCORED
            </span>
          </div>
          <p className="text-xs font-mono text-terminal-muted mt-1">
            FOMO leaderboard filtered by consistency, win rate, average holding time, and multi-window PnL.
          </p>
        </div>

        {/* Window Switcher (24h, 7d, 30d, All-time) */}
        <div className="flex rounded border border-terminal-border bg-terminal-panel p-1 text-xs font-mono">
          {['24h', '7d', '30d', 'all'].map((w) => (
            <button
              key={w}
              onClick={() => setWindowPeriod(w)}
              className={`rounded px-3 py-1 font-bold uppercase transition-colors ${
                windowPeriod === w
                  ? 'bg-terminal-green text-black'
                  : 'text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {w === 'all' ? 'All-Time' : w}
            </button>
          ))}
        </div>
      </div>

      {/* Universe Configuration Toolbar */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-3.5 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-terminal-muted" />
            <input
              type="text"
              placeholder="Search @handle or name..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="rounded border border-terminal-border bg-terminal-bg pl-8 pr-3 py-1.5 font-mono text-xs text-terminal-text placeholder-terminal-dim focus:border-terminal-green focus:outline-none w-48 sm:w-56"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-terminal-dim">Min Quality Score:</span>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minQualityScore}
              onChange={(e) => setMinQualityScore(parseInt(e.target.value, 10))}
              className="accent-terminal-green cursor-pointer w-24"
            />
            <span className="font-bold text-terminal-green">{minQualityScore}</span>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer text-terminal-muted hover:text-terminal-text">
            <input
              type="checkbox"
              checked={verifiedOnly}
              onChange={(e) => setVerifiedOnly(e.target.checked)}
              className="rounded border-terminal-border bg-terminal-bg text-terminal-green focus:ring-0"
            />
            <span>Verified FOMO Traders Only</span>
          </label>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-terminal-dim">
            Showing <strong>{filtered.length}</strong> traders in universe
          </span>
          <span className="rounded border border-terminal-border/80 bg-zinc-900/80 px-2 py-0.5 text-[10px] text-terminal-muted">
            Source: FOMO API /v2/leaderboard/{windowPeriod}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded border border-terminal-red/50 bg-terminal-red/10 p-3 flex items-center justify-between font-mono text-xs text-terminal-red">
          <span>⚠️ {error}</span>
          <button
            onClick={() => fetchTraders()}
            className="rounded bg-terminal-red/20 px-3 py-1 font-bold hover:bg-terminal-red/30 transition-colors flex items-center gap-1.5"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Trader Table */}
      <div className="rounded border border-terminal-border bg-terminal-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[11px] text-terminal-dim uppercase tracking-wider">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Trader</th>
                <th className="p-3 text-center">Quality Score</th>
                <th className="p-3">Window PnL</th>
                <th className="p-3">Traded Volume</th>
                <th className="p-3">Trades</th>
                <th className="p-3">Followers</th>
                <th className="p-3">Holdings</th>
                <th className="p-3">On-Chain Wallets</th>
                <th className="p-3 text-right">Dossier</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {filtered.map((trader) => (
                <tr
                  key={trader.handle}
                  className="hover:bg-terminal-hover/60 transition-colors"
                >
                  <td className="p-3 font-bold text-terminal-dim">#{trader.rank}</td>
                  <td className="p-3">
                    <Link
                      href={`/traders/${trader.handle}`}
                      className="group flex items-center gap-2 font-bold text-terminal-text hover:text-terminal-green"
                    >
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-zinc-800 text-[11px] font-bold text-terminal-cyan border border-zinc-700">
                        {trader.handle.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>@{trader.handle}</span>
                          {trader.verified && (
                            <CheckCircle className="h-3 w-3 text-terminal-green" />
                          )}
                        </div>
                        <div className="text-[10px] text-terminal-dim font-normal group-hover:text-terminal-muted">
                          {trader.displayName}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1">
                      <span
                        className={`text-sm font-bold ${
                          trader.qualityScore >= 80
                            ? 'text-terminal-green'
                            : trader.qualityScore >= 65
                            ? 'text-terminal-cyan'
                            : 'text-terminal-amber'
                        }`}
                      >
                        {trader.qualityScore}
                      </span>
                      <span className="text-[10px] text-terminal-dim">/100</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`font-bold ${
                        trader.pnlUsd >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                      }`}
                    >
                      {trader.pnlUsd >= 0 ? '+' : ''}${Math.round(trader.pnlUsd).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3 text-terminal-text">
                    ${Math.round(trader.volumeUsd).toLocaleString()}
                  </td>
                  <td className="p-3 text-terminal-muted">{trader.trades}</td>
                  <td className="p-3 text-terminal-muted">
                    {trader.followers.toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span className="rounded bg-zinc-800 px-1.5 py-0.5 text-[11px] font-semibold text-terminal-text border border-zinc-700">
                      {trader.holdings} tokens
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="space-y-0.5 text-[10px]">
                      {trader.wallets?.solana && (
                        <div className="text-purple-400">
                          SOL: {trader.wallets.solana.slice(0, 4)}...{trader.wallets.solana.slice(-4)}
                        </div>
                      )}
                      {trader.wallets?.evm && (
                        <div className="text-blue-400">
                          EVM: {trader.wallets.evm.slice(0, 4)}...{trader.wallets.evm.slice(-4)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Link
                      href={`/traders/${trader.handle}`}
                      className="rounded border border-terminal-border bg-terminal-bg px-2.5 py-1 text-[11px] font-bold text-terminal-muted hover:text-terminal-text hover:border-terminal-muted transition-colors inline-flex items-center gap-1"
                    >
                      <span>Profile</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
