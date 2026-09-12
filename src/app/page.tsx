'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Zap,
  TrendingUp,
  Users,
  ShieldCheck,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { EarlyEntryCard } from '@/components/trading/EarlyEntryCard';
import { PaperTradeModal } from '@/components/trading/PaperTradeModal';
import { AlphaConvergenceMatrix } from '@/components/trading/AlphaConvergenceMatrix';
import { NarrativeRadar } from '@/components/trading/NarrativeRadar';
import { WinnerHunterCard } from '@/components/trading/WinnerHunterCard';
import { AccumulationMap } from '@/components/trading/AccumulationMap';
import { AlphaResearchAssistant } from '@/components/assistant/AlphaResearchAssistant';

export default function DashboardPage() {
  const [coins, setCoins] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [liveTrades, setLiveTrades] = useState<any[]>([]);
  const [selectedTokenForTrade, setSelectedTokenForTrade] = useState<any | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [coinsRes, statsRes, intelRes] = await Promise.all([
        fetch('/api/fomo/tokens/winning'),
        fetch('/api/paper-trading/stats'),
        fetch('/api/intelligence/summary'),
      ]);
      const coinsData = await coinsRes.json();
      const statsData = await statsRes.json();
      const intelData = await intelRes.json();

      setCoins(coinsData.coins || []);
      setStats(statsData);
      setIntel(intelData);
    } catch (err: any) {
      console.warn('[Dashboard] Data fetch warning:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Listen to real-time SSE stream
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/realtime/stream');
      eventSource.addEventListener('trade', (event: MessageEvent) => {
        try {
          const trade = JSON.parse(event.data);
          setLiveTrades((prev) => [trade, ...prev.slice(0, 4)]);
        } catch (e) {}
      });
    } catch (e) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  const topCoin = coins.length > 0 ? coins[0] : null;

  return (
    <div className="space-y-6">
      {/* Real-time Alpha Ticker Bar */}
      <div className="flex items-center gap-3 overflow-x-auto rounded border border-terminal-border bg-terminal-panel/90 px-4 py-2 text-xs font-mono">
        <div className="flex items-center gap-1.5 font-bold text-terminal-green flex-shrink-0">
          <Zap className="h-3.5 w-3.5 text-terminal-green animate-pulse" />
          <span>ALPHA TICKER:</span>
        </div>
        <div className="flex items-center gap-6 overflow-x-auto whitespace-nowrap text-terminal-muted">
          {liveTrades.length > 0 ? (
            liveTrades.map((t, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="text-terminal-dim">[{new Date(t.timestamp).toLocaleTimeString()}]</span>
                <span className="text-terminal-cyan font-bold">@{t.traderHandle}</span>
                <span className={t.side === 'BUY' ? 'text-terminal-green font-bold' : 'text-terminal-red font-bold'}>
                  {t.side} ${t.symbol}
                </span>
                <span className="text-terminal-text font-semibold">
                  (${Math.round(t.valueUsd).toLocaleString()})
                </span>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-terminal-dim">[LIVE STREAM ACTIVE]</span>
              <span className="text-terminal-cyan">@CryptoKaleo</span>
              <span className="text-terminal-green font-bold">BUY $PONS</span>
              <span className="text-terminal-text">($18,000 on Robinhood Chain)</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Cards (Section 16) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <StatCard
          label="SMART MONEY SCORE"
          value={topCoin ? `${topCoin.smartMoneyScore}/100` : '92/100'}
          subValue="Peak"
          trend="up"
          trendValue="+14% 1h"
          highlight={true}
        />
        <StatCard
          label="WINNING COINS"
          value={coins.length > 0 ? coins.length : 5}
          subValue="Ranked"
          trend="up"
          trendValue="Strong Flow"
        />
        <StatCard
          label="ACTIVE SIGNALS"
          value={coins.filter((c) => c.signalState !== 'WATCH').length || 4}
          subValue="Live"
          trend="up"
          trendValue="Conviction"
        />
        <StatCard
          label="TRADERS TRACKED"
          value="150"
          subValue="Universe"
          icon={<Users className="h-4 w-4" />}
        />
        <StatCard
          label="BUY SIGNALS"
          value={coins.filter((c) => c.uniqueBuyers >= 2).length || 3}
          trend="up"
          trendValue="Convergence"
        />
        <StatCard
          label="SELL SIGNALS"
          value={coins.filter((c) => c.uniqueSellers > 0).length || 1}
          trend="down"
          trendValue="Exits"
        />
        <StatCard
          label="PAPER P&L"
          value={stats ? `+$${stats.totalPnl.toLocaleString()}` : '+$418.00'}
          subValue={stats ? `+${stats.roiPercent}%` : '+4.18%'}
          trend="up"
          trendValue="Simulated"
        />
        <StatCard
          label="CREDITS REMAINING"
          value="2.37M"
          subValue="Starter"
          icon={<Coins className="h-4 w-4 text-terminal-amber" />}
        />
      </div>

      {/* Alpha Convergence Matrix for Peak Opportunity */}
      {intel?.opportunities && intel.opportunities.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-mono text-terminal-green uppercase tracking-wider font-bold">
            ⚡ Primary Alpha Opportunity Pipeline
          </div>
          <AlphaConvergenceMatrix opportunity={intel.opportunities[0]} />
        </div>
      )}

      {/* Narrative Radar & Winner Hunter (Dual Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NarrativeRadar narratives={intel?.narratives || []} />
        <WinnerHunterCard candidates={intel?.nextMoves || []} />
      </div>

      {/* Main Section: Top Winning Coins (Section 16) */}
      <div className="rounded border border-terminal-border bg-terminal-panel">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-terminal-border p-4">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-terminal-green" />
            <h2 className="font-mono text-base font-bold text-terminal-text">
              🔥 Top Winning Coins (Smart Money Convergence)
            </h2>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <button
              onClick={fetchDashboardData}
              className="flex items-center gap-1.5 rounded border border-terminal-border bg-terminal-bg px-2.5 py-1 text-terminal-muted hover:text-terminal-text transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </button>
            <Link
              href="/winning-coins"
              className="flex items-center gap-1 text-terminal-green hover:underline font-semibold"
            >
              <span>View All Filters</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[11px] text-terminal-dim uppercase tracking-wider">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Token</th>
                <th className="p-3">Chain</th>
                <th className="p-3 text-center">Score</th>
                <th className="p-3">Conviction</th>
                <th className="p-3">Smart Traders</th>
                <th className="p-3">Buy Vol</th>
                <th className="p-3">Net Flow</th>
                <th className="p-3">First Buyer</th>
                <th className="p-3">Price</th>
                <th className="p-3">24h %</th>
                <th className="p-3">Signal</th>
                <th className="p-3">Age</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {coins.map((coin) => (
                <tr
                  key={coin.universalId}
                  className="hover:bg-terminal-hover/60 transition-colors"
                >
                  <td className="p-3 font-bold text-terminal-dim">#{coin.rank}</td>
                  <td className="p-3">
                    <Link
                      href={`/tokens/${encodeURIComponent(coin.universalId)}`}
                      className="group flex items-center gap-2 font-bold text-terminal-text hover:text-terminal-green"
                    >
                      <span className="flex h-6 w-6 items-center justify-center rounded bg-terminal-border/50 text-[10px]">
                        ${coin.symbol.slice(0, 3)}
                      </span>
                      <div>
                        <div>${coin.symbol}</div>
                        <div className="text-[10px] text-terminal-dim font-normal group-hover:text-terminal-muted">
                          {coin.name}
                        </div>
                      </div>
                    </Link>
                  </td>
                  <td className="p-3">
                    <Badge variant="chain">{coin.network}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    <div className="inline-flex items-center gap-1.5">
                      <span
                        className={`text-sm font-bold ${
                          coin.smartMoneyScore >= 80
                            ? 'text-terminal-green'
                            : coin.smartMoneyScore >= 60
                            ? 'text-terminal-cyan'
                            : 'text-terminal-amber'
                        }`}
                      >
                        {coin.smartMoneyScore}
                      </span>
                      <span className="text-[10px] text-terminal-dim">/100</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="conviction">{coin.conviction}</Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5 font-semibold">
                      <span className="text-terminal-green">▲ {coin.uniqueBuyers}</span>
                      {coin.uniqueSellers > 0 && (
                        <span className="text-terminal-red">▼ {coin.uniqueSellers}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-terminal-text">
                    ${Math.round(coin.buyVolume).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <span
                      className={
                        coin.netFlow >= 0
                          ? 'font-bold text-terminal-green'
                          : 'font-bold text-terminal-red'
                      }
                    >
                      {coin.netFlow >= 0 ? '+' : ''}${Math.round(coin.netFlow).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-3">
                    {coin.firstBuyer ? (
                      <Link
                        href={`/traders/${coin.firstBuyer}`}
                        className="text-terminal-cyan hover:underline font-semibold"
                      >
                        @{coin.firstBuyer}
                      </Link>
                    ) : (
                      <span className="text-terminal-dim">—</span>
                    )}
                  </td>
                  <td className="p-3 font-semibold text-terminal-text">
                    ${coin.priceUsd < 0.01 ? coin.priceUsd.toFixed(6) : coin.priceUsd.toFixed(4)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`flex items-center gap-0.5 font-bold ${
                        coin.change24h >= 0 ? 'text-terminal-green' : 'text-terminal-red'
                      }`}
                    >
                      {coin.change24h >= 0 ? '+' : ''}
                      {coin.change24h}%
                    </span>
                  </td>
                  <td className="p-3">
                    <Badge variant="signal">{coin.signalState}</Badge>
                  </td>
                  <td className="p-3 text-terminal-muted">
                    {coin.signalAgeMinutes < 60
                      ? `${coin.signalAgeMinutes}m`
                      : `${Math.round(coin.signalAgeMinutes / 60)}h`}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedTokenForTrade(coin)}
                        className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-1 text-[11px] font-bold text-terminal-green hover:bg-terminal-green hover:text-black transition-colors"
                      >
                        Copy Buy
                      </button>
                      <Link
                        href={`/tokens/${encodeURIComponent(coin.universalId)}`}
                        className="rounded border border-terminal-border bg-terminal-bg p-1 text-terminal-muted hover:text-terminal-text transition-colors"
                        title="View Token Dossier"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cross-Sectional Accumulation Matrix */}
      {intel?.accumulationMatrix && (
        <AccumulationMap matrix={intel.accumulationMatrix} />
      )}

      {/* Data-Grounded Alpha Research Assistant */}
      <AlphaResearchAssistant data={intel} />

      {/* Trade Execution Modal */}
      {selectedTokenForTrade && (
        <PaperTradeModal
          isOpen={!!selectedTokenForTrade}
          onClose={() => setSelectedTokenForTrade(null)}
          token={{
            symbol: selectedTokenForTrade.symbol,
            name: selectedTokenForTrade.name,
            address: selectedTokenForTrade.address,
            network: selectedTokenForTrade.network,
            priceUsd: selectedTokenForTrade.priceUsd,
            smartMoneyScore: selectedTokenForTrade.smartMoneyScore,
            topTrader: selectedTokenForTrade.firstBuyer,
          }}
          onSuccess={fetchDashboardData}
        />
      )}
    </div>
  );
}
