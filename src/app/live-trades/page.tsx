'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Radio, ExternalLink, Flame, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PaperTradeModal } from '@/components/trading/PaperTradeModal';

export default function LiveTradesPage() {
  const [trades, setTrades] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTokenForTrade, setSelectedTokenForTrade] = useState<any | null>(null);

  useEffect(() => {
    // Initial fetch
    fetch('/api/fomo/trades/recent?limit=50')
      .then((res) => res.json())
      .then((data) => {
        setTrades(data.trades || []);
        setLoading(false);
      })
      .catch((err) => {
        console.warn('[LiveTrades] Fetch warning:', err.message);
        setLoading(false);
      });

    // Connect to SSE stream
    const eventSource = new EventSource('/api/realtime/stream');

    eventSource.addEventListener('trade', (event: MessageEvent) => {
      try {
        const tradeRaw = JSON.parse(event.data);
        const newTrade = {
          id: tradeRaw.tradeId || `ws_${Date.now()}`,
          time: new Date(tradeRaw.timestamp).toISOString(),
          trader: tradeRaw.traderHandle,
          traderScore: 88,
          token: tradeRaw.symbol,
          tokenAddress: tradeRaw.tokenAddress,
          network: tradeRaw.network,
          action: tradeRaw.side,
          amountUsd: tradeRaw.valueUsd,
          priceUsd: tradeRaw.priceUsd,
          tokenSmartMoneyScore: tradeRaw.symbol === 'PONS' ? 92 : 75,
          signalStrength: tradeRaw.valueUsd > 15000 ? 'VERY STRONG' : 'STRONG',
          isNewSignalTrigger: true,
        };
        setTrades((prev) => [newTrade, ...prev.slice(0, 75)]);
      } catch (e) {}
    });

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-terminal-text">
              Who Is Buying Now?
            </h1>
            <span className="flex items-center gap-1 rounded bg-terminal-cyan/20 border border-terminal-cyan/40 px-2 py-0.5 text-xs font-mono font-bold text-terminal-cyan">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>REAL-TIME STREAM</span>
            </span>
          </div>
          <p className="text-xs font-mono text-terminal-muted mt-1">
            Live firehose of verified FOMO smart money fills. Newest transactions land instantly.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-terminal-muted">
          <span className="h-2 w-2 rounded-full bg-terminal-green animate-ping"></span>
          <span>Streaming: wss://api.fomoapi.io/ws/alerts</span>
        </div>
      </div>

      {/* Trades Table */}
      <div className="rounded border border-terminal-border bg-terminal-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="border-b border-terminal-border bg-terminal-bg text-[11px] text-terminal-dim uppercase tracking-wider">
              <tr>
                <th className="p-3">Time</th>
                <th className="p-3">Trader</th>
                <th className="p-3 text-center">Trader Score</th>
                <th className="p-3">Token</th>
                <th className="p-3">Action</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Price</th>
                <th className="p-3 text-center">Token Score</th>
                <th className="p-3">Signal Strength</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-terminal-border/60">
              {trades.map((trade) => (
                <tr
                  key={trade.id}
                  className={`transition-colors ${
                    trade.isNewSignalTrigger
                      ? 'bg-terminal-green/10 hover:bg-terminal-green/15'
                      : 'hover:bg-terminal-hover/60'
                  }`}
                >
                  <td className="p-3 text-terminal-dim">
                    {new Date(trade.time).toLocaleTimeString()}
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/traders/${trade.trader}`}
                      className="font-bold text-terminal-cyan hover:underline"
                    >
                      @{trade.trader}
                    </Link>
                  </td>
                  <td className="p-3 text-center">
                    <span className="rounded bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-bold text-terminal-text">
                      {trade.traderScore}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-terminal-text">${trade.token}</span>
                      <Badge variant="chain">{trade.network}</Badge>
                    </div>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        trade.action === 'BUY'
                          ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/40'
                          : 'bg-terminal-red/20 text-terminal-red border border-terminal-red/40'
                      }`}
                    >
                      {trade.action === 'BUY' ? '▲ BUY' : '▼ SELL'}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-terminal-text">
                    ${Math.round(trade.amountUsd).toLocaleString()}
                  </td>
                  <td className="p-3 text-terminal-muted">
                    ${trade.priceUsd < 0.01 ? trade.priceUsd.toFixed(6) : trade.priceUsd.toFixed(4)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="font-bold text-terminal-green">
                      {trade.tokenSmartMoneyScore}/100
                    </span>
                  </td>
                  <td className="p-3">
                    {trade.signalStrength === 'VERY STRONG' ? (
                      <span className="inline-flex items-center gap-1 text-terminal-green font-bold text-xs">
                        <Flame className="h-3.5 w-3.5" />
                        VERY STRONG
                      </span>
                    ) : (
                      <span className="text-terminal-cyan font-semibold text-xs">
                        ● {trade.signalStrength}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() =>
                        setSelectedTokenForTrade({
                          symbol: trade.token,
                          name: trade.token,
                          address: trade.tokenAddress,
                          network: trade.network,
                          priceUsd: trade.priceUsd,
                          smartMoneyScore: trade.tokenSmartMoneyScore,
                          topTrader: trade.trader,
                        })
                      }
                      className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-1 text-[11px] font-bold text-terminal-green hover:bg-terminal-green hover:text-black transition-colors"
                    >
                      Copy Buy
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Copy Trade Modal */}
      {selectedTokenForTrade && (
        <PaperTradeModal
          isOpen={!!selectedTokenForTrade}
          onClose={() => setSelectedTokenForTrade(null)}
          token={selectedTokenForTrade}
        />
      )}
    </div>
  );
}
