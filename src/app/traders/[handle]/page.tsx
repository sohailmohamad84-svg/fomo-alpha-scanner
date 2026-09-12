'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Users,
  CheckCircle,
  Copy,
  ExternalLink,
  Wallet,
  Clock,
  Flame,
  Award,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  Coins,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';

export default function TraderDetailPage() {
  const params = useParams();
  const handle = (params?.handle as string) || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    if (!handle) return;
    fetch(`/api/fomo/traders/${encodeURIComponent(handle)}`)
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[TraderDetail] Fetch warning:', err.message);
        setLoading(false);
      });
  }, [handle]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-sm text-terminal-muted">
        Loading trader dossier for @{handle}...
      </div>
    );
  }

  const trader = data?.trader || {};
  const trades = data?.trades || [];
  const balances = data?.balances || [];
  const spotlight = data?.spotlight?.bestTrades || [];

  return (
    <div className="space-y-6">
      {/* Top Dossier Header */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-terminal-green/40 bg-zinc-900 text-lg font-bold font-mono text-terminal-green">
              {trader.handle?.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-xl font-bold text-terminal-text">
                  @{trader.handle}
                </h1>
                {trader.verified && (
                  <span className="flex items-center gap-1 rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-[10px] font-mono font-bold text-terminal-green">
                    <CheckCircle className="h-3 w-3" />
                    VERIFIED TRADER
                  </span>
                )}
                <span className="rounded border border-terminal-border bg-terminal-bg px-2 py-0.5 text-[10px] font-mono text-terminal-muted">
                  Rank #{trader.rank || 1}
                </span>
              </div>
              <div className="text-xs font-mono text-terminal-muted mt-1">
                {trader.displayName} {trader.clan && `· Clan: ${trader.clan.name}`} · Account Age: {trader.accountAgeDays || 394} days
              </div>
            </div>
          </div>

          {/* Quality Score Hero Pill */}
          <div className="flex items-center gap-3 rounded border border-terminal-green/40 bg-terminal-bg p-3">
            <div>
              <div className="text-[10px] font-mono text-terminal-dim uppercase">Trader Quality Score</div>
              <div className="text-2xl font-mono font-bold text-terminal-green">
                {trader.qualityScore} <span className="text-xs text-terminal-muted">/ 100</span>
              </div>
            </div>
            <div className="h-10 w-10 flex items-center justify-center rounded bg-terminal-green/10 text-terminal-green">
              <Award className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Bio */}
        {trader.description && (
          <p className="mt-4 text-xs font-mono text-terminal-muted border-t border-terminal-border pt-3">
            &ldquo;{trader.description}&rdquo;
          </p>
        )}

        {/* Wallets Banner (Section 18 requirement) */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-terminal-border font-mono text-xs">
          <div className="flex items-center justify-between rounded border border-terminal-border bg-terminal-bg p-2.5">
            <div className="flex items-center gap-2 truncate">
              <Wallet className="h-4 w-4 text-purple-400 flex-shrink-0" />
              <span className="text-purple-400 font-bold">Solana Wallet:</span>
              <span className="text-terminal-text truncate">
                {trader.wallets?.solana || '5AhfPStn66hRYoNNDfJHSDgCH7fBbwMQZUECRrhTo62F'}
              </span>
            </div>
            <button
              onClick={() =>
                copyToClipboard(
                  trader.wallets?.solana || '5AhfPStn66hRYoNNDfJHSDgCH7fBbwMQZUECRrhTo62F',
                  'sol'
                )
              }
              className="ml-2 text-terminal-dim hover:text-terminal-text"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center justify-between rounded border border-terminal-border bg-terminal-bg p-2.5">
            <div className="flex items-center gap-2 truncate">
              <Wallet className="h-4 w-4 text-blue-400 flex-shrink-0" />
              <span className="text-blue-400 font-bold">EVM Wallet:</span>
              <span className="text-terminal-text truncate">
                {trader.wallets?.evm || '0x7b4d16237683fe1765e727eadf99c6f02adf0b59'}
              </span>
            </div>
            <button
              onClick={() =>
                copyToClipboard(
                  trader.wallets?.evm || '0x7b4d16237683fe1765e727eadf99c6f02adf0b59',
                  'evm'
                )
              }
              className="ml-2 text-terminal-dim hover:text-terminal-text"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* PnL & Volume Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="24H PNL"
          value={`+$${(trader.pnl?.['24h'] || 14200).toLocaleString()}`}
          trend="up"
          trendValue="Daily"
        />
        <StatCard
          label="7D PNL"
          value={`+$${(trader.pnl?.['7d'] || 68400).toLocaleString()}`}
          trend="up"
          trendValue="Weekly"
        />
        <StatCard
          label="30D PNL"
          value={`+$${(trader.pnl?.['30d'] || 192000).toLocaleString()}`}
          trend="up"
          trendValue="Monthly"
        />
        <StatCard
          label="ALL-TIME PNL"
          value={`+$${(trader.pnlUsd || 284120).toLocaleString()}`}
          trend="up"
          trendValue="Lifetime"
          highlight={true}
        />
        <StatCard
          label="TOTAL VOLUME"
          value={`$${(trader.volumeUsd || 1450200).toLocaleString()}`}
          subValue={`${trader.trades || 114} trades`}
        />
        <StatCard
          label="AVG HOLD TIME"
          value={`${Math.round((trader.averageHoldTimeSeconds || 48200) / 3600)}h`}
          subValue="Hold Duration"
          icon={<Clock className="h-4 w-4 text-terminal-muted" />}
        />
      </div>

      {/* Balances / Live Holdings (Section 18) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Coins className="h-4 w-4 text-terminal-green" />
          <h2 className="font-mono text-sm font-bold text-terminal-text uppercase tracking-wider">
            Current Multi-Chain Holdings ({balances.length} positions)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[10px] text-terminal-dim uppercase">
              <tr>
                <th className="p-2.5">Token</th>
                <th className="p-2.5">Chain</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5">Price</th>
                <th className="p-2.5">Position Value</th>
                <th className="p-2.5">24h Move</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {balances.map((pos: any, idx: number) => (
                <tr key={idx} className="hover:bg-terminal-hover/60">
                  <td className="p-2.5 font-bold text-terminal-text">
                    ${pos.token.symbol}
                  </td>
                  <td className="p-2.5">
                    <Badge variant="chain">{pos.chain}</Badge>
                  </td>
                  <td className="p-2.5 text-terminal-muted">{pos.amount.toLocaleString()}</td>
                  <td className="p-2.5 text-terminal-muted">${pos.priceUsd}</td>
                  <td className="p-2.5 font-bold text-terminal-text">
                    ${Math.round(pos.valueUsd).toLocaleString()}
                  </td>
                  <td className="p-2.5">
                    <span className={pos.change24h >= 0 ? 'text-terminal-green font-bold' : 'text-terminal-red font-bold'}>
                      {pos.change24h >= 0 ? '+' : ''}{pos.change24h}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOMO Spotlight Best Trades (Section 18) */}
      {spotlight.length > 0 && (
        <div className="rounded border border-terminal-border bg-terminal-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <Award className="h-4 w-4 text-terminal-amber" />
            <h2 className="font-mono text-sm font-bold text-terminal-text uppercase tracking-wider">
              FOMO Spotlight Best Trades & Written Theses
            </h2>
          </div>
          <div className="space-y-3 font-mono text-xs">
            {spotlight.map((trade: any, idx: number) => (
              <div key={idx} className="rounded border border-terminal-border bg-terminal-bg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-terminal-text">${trade.token.symbol}</span>
                    <Badge variant="chain">{trade.chain}</Badge>
                    <span className="text-terminal-green font-bold">
                      +${Math.round(trade.realizedPnlUsd).toLocaleString()} Realized PnL
                    </span>
                  </div>
                  <span className="text-[10px] text-terminal-dim">Likes: {trade.thesisLikes || 142}</span>
                </div>
                {trade.thesis && (
                  <p className="text-terminal-muted text-[11px] italic bg-terminal-panel/60 p-2 rounded border border-terminal-border/60">
                    &ldquo;{trade.thesis}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
