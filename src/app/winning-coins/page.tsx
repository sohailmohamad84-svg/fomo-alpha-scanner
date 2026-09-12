'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Flame,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  ExternalLink,
  ChevronDown,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PaperTradeModal } from '@/components/trading/PaperTradeModal';

export default function WinningCoinsPage() {
  const [coins, setCoins] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [minScore, setMinScore] = useState<number>(0);
  const [minTraders, setMinTraders] = useState<number>(1);
  const [timeWindow, setTimeWindow] = useState<string>('24h');
  const [selectedTokenForTrade, setSelectedTokenForTrade] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchCoins = async () => {
    setLoading(true);
    setError(null);
    try {
      const query = new URLSearchParams({
        chain: selectedChain,
        minScore: minScore.toString(),
        minTraders: minTraders.toString(),
        timeWindow,
      });
      const res = await fetch(`/api/fomo/tokens/winning?${query.toString()}`);
      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setCoins(data.coins || []);
    } catch (err: any) {
      console.warn('[WinningCoins] Fetch warning:', err.message);
      setError(err.message || 'Failed to load winning coins.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, [selectedChain, minScore, minTraders, timeWindow]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-terminal-text">
              Winning Coins Discovery
            </h1>
            <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-xs font-mono font-bold text-terminal-green">
              SMART MONEY CONVERGENCE
            </span>
          </div>
          <p className="text-xs font-mono text-terminal-muted mt-1">
            Coins aggressively accumulated by multiple verified & high-performing traders.
          </p>
        </div>

        <button
          onClick={fetchCoins}
          className="flex items-center gap-1.5 rounded border border-terminal-border bg-terminal-panel px-3 py-1.5 text-xs font-mono text-terminal-muted hover:text-terminal-text transition-colors self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Recalculate Ranks</span>
        </button>
      </div>

      {/* Filter Control Bar (Section 20 requirements) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-terminal-muted font-bold uppercase text-[11px]">
          <Filter className="h-3.5 w-3.5 text-terminal-green" />
          <span>Convergence Matrix Filters</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Chain Selector */}
          <div>
            <label className="block text-[11px] text-terminal-dim mb-1">Blockchain / Network:</label>
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:border-terminal-green/50 focus:outline-none"
            >
              <option value="all">All Chains (Multi-chain)</option>
              <option value="solana">Solana (SOL)</option>
              <option value="robinhood">Robinhood Chain (RH)</option>
              <option value="base">Base (BASE)</option>
              <option value="bsc">BNB Chain (BSC)</option>
              <option value="ethereum">Ethereum (ETH)</option>
            </select>
          </div>

          {/* Time Window Selector (5m, 15m, 30m, 1h, 4h, 24h) */}
          <div>
            <label className="block text-[11px] text-terminal-dim mb-1">Accumulation Window:</label>
            <select
              value={timeWindow}
              onChange={(e) => setTimeWindow(e.target.value)}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text focus:border-terminal-green/50 focus:outline-none"
            >
              <option value="5m">Last 5 minutes (Ultra-Fresh)</option>
              <option value="15m">Last 15 minutes (Early Momentum)</option>
              <option value="30m">Last 30 minutes</option>
              <option value="1h">Last 1 hour</option>
              <option value="4h">Last 4 hours</option>
              <option value="24h">Last 24 hours</option>
            </select>
          </div>

          {/* Min Smart Money Score */}
          <div>
            <label className="block text-[11px] text-terminal-dim mb-1">
              Minimum Score: <strong className="text-terminal-green">{minScore}/100</strong>
            </label>
            <input
              type="range"
              min="0"
              max="90"
              step="5"
              value={minScore}
              onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
              className="w-full accent-terminal-green cursor-pointer mt-1"
            />
          </div>

          {/* Min Traders Buying */}
          <div>
            <label className="block text-[11px] text-terminal-dim mb-1">
              Minimum Traders Buying: <strong className="text-terminal-cyan">{minTraders}+</strong>
            </label>
            <div className="flex gap-1.5 mt-1">
              {[1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() => setMinTraders(num)}
                  className={`flex-1 rounded border py-1 text-xs font-bold transition-colors ${
                    minTraders === num
                      ? 'border-terminal-green bg-terminal-green/20 text-terminal-green'
                      : 'border-terminal-border bg-terminal-bg text-terminal-muted hover:text-terminal-text'
                  }`}
                >
                  {num}+
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded border border-terminal-border bg-terminal-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[11px] text-terminal-dim uppercase tracking-wider">
              <tr>
                <th className="p-3">Rank</th>
                <th className="p-3">Token</th>
                <th className="p-3">Chain</th>
                <th className="p-3 text-center">Smart Score</th>
                <th className="p-3">Conviction</th>
                <th className="p-3">Tracked Buyers</th>
                <th className="p-3">Tracked Sellers</th>
                <th className="p-3">Buy Vol</th>
                <th className="p-3">Net Flow</th>
                <th className="p-3">Early Entry Cascade</th>
                <th className="p-3">Price</th>
                <th className="p-3">24h Move</th>
                <th className="p-3">Status</th>
                <th className="p-3">Signal Age</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {coins.length === 0 ? (
                <tr>
                  <td colSpan={15} className="p-8 text-center text-terminal-muted">
                    No coins match the current convergence filters. Try lowering minimum score or expanding time window.
                  </td>
                </tr>
              ) : (
                coins.map((coin) => (
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
                        <span className="flex h-7 w-7 items-center justify-center rounded bg-terminal-border/60 text-[10px]">
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
                      <div className="inline-flex items-center gap-1.5 font-bold">
                        <span
                          className={`text-sm ${
                            coin.smartMoneyScore >= 80
                              ? 'text-terminal-green'
                              : coin.smartMoneyScore >= 65
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
                    <td className="p-3 font-bold text-terminal-green">
                      ▲ {coin.uniqueBuyers} traders
                    </td>
                    <td className="p-3">
                      {coin.uniqueSellers > 0 ? (
                        <span className="font-bold text-terminal-red">▼ {coin.uniqueSellers} sellers</span>
                      ) : (
                        <span className="text-terminal-dim">0 sellers</span>
                      )}
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
                      <div className="text-[11px]">
                        {coin.firstBuyer ? (
                          <>
                            <span className="text-terminal-muted">First: </span>
                            <Link
                              href={`/traders/${coin.firstBuyer}`}
                              className="text-terminal-cyan hover:underline font-semibold"
                            >
                              @{coin.firstBuyer}
                            </Link>
                            <span className="text-terminal-dim block">
                              +{coin.followingTradersCount} followers in {coin.accumulationWindowMinutes}m
                            </span>
                          </>
                        ) : (
                          <span className="text-terminal-dim">—</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-terminal-text">
                      ${coin.priceUsd < 0.01 ? coin.priceUsd.toFixed(6) : coin.priceUsd.toFixed(4)}
                    </td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
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
                        ? `${coin.signalAgeMinutes}m ago`
                        : `${Math.round(coin.signalAgeMinutes / 60)}h ago`}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTokenForTrade(coin)}
                          className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-1 text-[11px] font-bold text-terminal-green hover:bg-terminal-green hover:text-black transition-colors"
                        >
                          Copy Trade
                        </button>
                        <Link
                          href={`/tokens/${encodeURIComponent(coin.universalId)}`}
                          className="rounded border border-terminal-border bg-terminal-bg p-1 text-terminal-muted hover:text-terminal-text transition-colors"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy Trade Modal */}
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
          onSuccess={fetchCoins}
        />
      )}
    </div>
  );
}
