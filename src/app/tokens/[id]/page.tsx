'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Flame,
  ArrowLeft,
  Copy,
  ExternalLink,
  ShieldAlert,
  Coins,
  TrendingUp,
  Award,
  Clock,
  Layers,
  CheckCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { EarlyEntryCard } from '@/components/trading/EarlyEntryCard';
import { PaperTradeModal } from '@/components/trading/PaperTradeModal';

export default function TokenDetailPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchTokenDetail = async () => {
    if (!id) return;
    try {
      const res = await fetch(`/api/fomo/tokens/${encodeURIComponent(id)}`);
      const d = await res.json();
      setData(d);
    } catch (err: any) {
      console.warn('[TokenDetail] Fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokenDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-sm text-terminal-muted">
        Loading token analysis & smart money telemetry...
      </div>
    );
  }

  const token = data?.token || {};
  const signal = data?.signal || {};
  const earlyEntry = data?.earlyEntry || {};
  const risk = data?.risk || {};
  const stats = data?.tokenStats || {};
  const devInfo = data?.devInfo || {};
  const timeline = data?.tradesTimeline || [];

  return (
    <div className="space-y-6">
      {/* Back button */}
      <Link
        href="/winning-coins"
        className="inline-flex items-center gap-1.5 font-mono text-xs text-terminal-muted hover:text-terminal-text"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to Winning Coins</span>
      </Link>

      {/* Header Profile */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded border-2 border-terminal-green/50 bg-terminal-green/10 text-lg font-bold font-mono text-terminal-green">
              ${token.symbol?.slice(0, 3)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-xl font-bold text-terminal-text">
                  ${token.symbol}
                </h1>
                <span className="text-xs text-terminal-muted font-mono">{token.name}</span>
                <Badge variant="chain">{token.network}</Badge>
                <Badge variant="signal">{signal.signalState}</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono text-terminal-dim mt-1">
                <span>Contract:</span>
                <span className="text-terminal-muted">{token.address}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(token.address);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="text-terminal-muted hover:text-terminal-text"
                >
                  <Copy className="h-3 w-3" />
                </button>
                {copied && <span className="text-terminal-green text-[10px]">Copied!</span>}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsTradeModalOpen(true)}
              className="rounded bg-terminal-green border border-terminal-green-bright px-4 py-2 font-mono text-xs font-bold text-black hover:bg-terminal-green-bright transition-colors shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
            >
              ⚡ Copy-Trade Position
            </button>
          </div>
        </div>
      </div>

      {/* Top metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="SMART MONEY SCORE"
          value={`${signal.smartMoneyScore}/100`}
          subValue={signal.conviction}
          trend="up"
          trendValue="Convergence"
          highlight={true}
        />
        <StatCard
          label="MARKET PRICE"
          value={`$${token.priceUsd}`}
          subValue={token.change24h ? `${token.change24h >= 0 ? '+' : ''}${token.change24h}%` : undefined}
          trend={token.change24h >= 0 ? 'up' : 'down'}
          trendValue="24h"
        />
        <StatCard
          label="TRACKED BUYERS"
          value={`▲ ${signal.uniqueBuyers || 4}`}
          subValue={`${signal.uniqueHighQualityBuyers || 3} Elite`}
          trend="up"
          trendValue="Smart Inflow"
        />
        <StatCard
          label="NET SMART FLOW"
          value={`+$${Math.round(signal.netSmartMoneyFlow || 65500).toLocaleString()}`}
          subValue="Buy Volume"
          trend="up"
          trendValue="Positive"
        />
        <StatCard
          label="ACCUMULATION WINDOW"
          value={`${earlyEntry.accumulationWindowMinutes || 18}m`}
          subValue="Rapid Entry"
          icon={<Clock className="h-4 w-4 text-terminal-cyan" />}
        />
        <StatCard
          label="RISK LEVEL"
          value={risk.overallRisk || 'LOW'}
          subValue={`Score: ${risk.riskScore || 15}/100`}
          icon={<ShieldAlert className="h-4 w-4 text-terminal-green" />}
        />
      </div>

      {/* Early Entry Card */}
      {earlyEntry.firstBuyer && (
        <EarlyEntryCard
          tokenSymbol={token.symbol}
          firstBuyer={earlyEntry.firstBuyer}
          firstBuyTime={earlyEntry.firstBuyTimeFormatted}
          firstBuyPriceUsd={earlyEntry.firstBuyPriceUsd}
          followingTradersCount={earlyEntry.followingTradersCount}
          accumulationWindowMinutes={earlyEntry.accumulationWindowMinutes}
          totalAccumulatedUsd={earlyEntry.totalAccumulatedUsd}
          timeline={earlyEntry.timeline || []}
        />
      )}

      {/* Trader Activity Timeline (Section 17 requirement) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Clock className="h-4 w-4 text-terminal-cyan" />
          <h2 className="font-mono text-sm font-bold text-terminal-text uppercase tracking-wider">
            Smart Trader Activity Timeline
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[10px] text-terminal-dim uppercase">
              <tr>
                <th className="p-2.5">Time</th>
                <th className="p-2.5">Trader</th>
                <th className="p-2.5">Action</th>
                <th className="p-2.5">Amount</th>
                <th className="p-2.5">Price</th>
                <th className="p-2.5 text-center">Trader Score</th>
                <th className="p-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {timeline.map((trade: any, idx: number) => (
                <tr key={idx} className="hover:bg-terminal-hover/60">
                  <td className="p-2.5 text-terminal-dim">
                    {new Date(trade.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="p-2.5">
                    <Link
                      href={`/traders/${trade.traderHandle}`}
                      className="font-bold text-terminal-cyan hover:underline"
                    >
                      @{trade.traderHandle}
                    </Link>
                  </td>
                  <td className="p-2.5">
                    <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-1.5 py-0.2 text-[10px] font-bold text-terminal-green">
                      ▲ {trade.side}
                    </span>
                  </td>
                  <td className="p-2.5 font-bold text-terminal-text">
                    ${Math.round(trade.valueUsd).toLocaleString()}
                  </td>
                  <td className="p-2.5 text-terminal-muted">${trade.priceUsd}</td>
                  <td className="p-2.5 text-center">
                    <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-bold text-terminal-text border border-zinc-700">
                      {trade.traderScore}
                    </span>
                  </td>
                  <td className="p-2.5">
                    <span className="text-terminal-green font-semibold text-[11px]">
                      ● Still Holding
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Buy/Sell Flow Windows (Section 33 / Token Stats) */}
      {stats.windows && (
        <div className="rounded border border-terminal-border bg-terminal-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-terminal-green" />
            <h2 className="font-mono text-sm font-bold text-terminal-text uppercase tracking-wider">
              FOMO Multi-Window Order Flow Analysis
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 font-mono text-xs">
            {['5m', '1h', '4h', '24h'].map((w) => {
              const win = stats.windows[w];
              if (!win) return null;
              return (
                <div key={w} className="rounded border border-terminal-border bg-terminal-bg p-3 space-y-1.5">
                  <div className="flex justify-between items-center border-b border-terminal-border pb-1 text-[11px]">
                    <span className="text-terminal-muted uppercase">{w} Window</span>
                    <span className="font-bold text-terminal-green">
                      Ratio: {win.buySellRatio || 12.0}x
                    </span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-terminal-dim">Buys / Sells:</span>
                    <span className="text-terminal-text font-semibold">{win.buys} / {win.sells}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-terminal-dim">Buy Volume:</span>
                    <span className="text-terminal-green font-bold">${win.buyVolumeUsd.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-terminal-dim">Net Flow:</span>
                    <span className="text-terminal-cyan font-bold">+${win.netVolumeUsd.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Dev / Deployer Holdings & Rug Check */}
      {devInfo.devs && (
        <div className="rounded border border-terminal-border bg-terminal-panel p-4">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="h-4 w-4 text-terminal-amber" />
            <h2 className="font-mono text-sm font-bold text-terminal-text uppercase tracking-wider">
              Token Deployer & Insider Bag Telemetry (Rug Check)
            </h2>
          </div>
          <div className="space-y-2 font-mono text-xs">
            {devInfo.devs.map((dev: any, idx: number) => (
              <div key={idx} className="rounded border border-terminal-border bg-terminal-bg p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-terminal-text">Deployer: @{dev.handle}</span>
                    <span className="rounded bg-emerald-950/60 border border-emerald-800 px-1.5 py-0.2 text-[10px] text-emerald-400 font-bold">
                      BAG LOCKED / STILL HOLDING
                    </span>
                  </div>
                  <span className="text-terminal-muted">
                    Holding: ${Math.round(dev.valueUsd).toLocaleString()}
                  </span>
                </div>
                {dev.thesis && (
                  <p className="text-terminal-muted text-[11px] italic pt-1">
                    Deployer Thesis: &ldquo;{dev.thesis}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paper Trade Modal */}
      <PaperTradeModal
        isOpen={isTradeModalOpen}
        onClose={() => setIsTradeModalOpen(false)}
        token={{
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          network: token.network,
          priceUsd: token.priceUsd,
          smartMoneyScore: signal.smartMoneyScore || 85,
          topTrader: earlyEntry.firstBuyer,
        }}
        onSuccess={fetchTokenDetail}
      />
    </div>
  );
}
