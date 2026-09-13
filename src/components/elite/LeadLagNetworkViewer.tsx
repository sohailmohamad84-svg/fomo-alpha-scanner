'use client';

import React, { useState, useEffect } from 'react';
import { LeadLagPair } from '@/lib/types/elite';
import { Network, ArrowRight, TrendingUp, Clock, ShieldCheck } from 'lucide-react';

export const LeadLagNetworkViewer: React.FC = () => {
  const [pairs, setPairs] = useState<LeadLagPair[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchNetwork();
  }, []);

  const fetchNetwork = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/elite/lead-lag');
      const data = await res.json();
      if (data.success) {
        setPairs(data.pairs || []);
      }
    } catch (e) {
      console.error('Failed to fetch lead-lag data', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel font-mono text-terminal-text shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-terminal-border p-4 bg-terminal-bg/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
            <Network className="h-4 w-4 text-purple-400" />
            <h3 className="font-mono text-sm font-bold tracking-wider text-terminal-text uppercase">
              LEAD-LAG TRADER NETWORK
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 rounded">
              DIRECTED SEQUENCE ALPHA
            </span>
          </div>
          <p className="text-xs text-terminal-dim mt-1">
            Empirically discovered directional trader flows: Who enters first, who confirms, and average lag minutes.
          </p>
        </div>
        <div className="text-xs text-terminal-dim font-bold">
          {pairs.length} Verified Pairs Active
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {loading ? (
          <div className="py-12 text-center text-terminal-dim text-xs flex flex-col items-center justify-center gap-2">
            <div className="h-5 w-5 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
            <span>Mining directional transaction sequences across elite wallets...</span>
          </div>
        ) : pairs.length === 0 ? (
          <div className="py-8 text-center text-terminal-dim text-xs">
            No confirmed pairwise sequences detected in current window.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pairs.map((p, idx) => (
              <div
                key={`${p.leaderHandle}-${p.followerHandle}-${idx}`}
                className="rounded border border-terminal-border bg-terminal-bg/70 p-3.5 hover:border-purple-500/50 transition-all duration-150 flex flex-col justify-between gap-3"
              >
                {/* Top Row: Flow Sequence */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Leader Pill */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-purple-500/15 border border-purple-500/30 text-xs font-bold text-purple-300">
                      <span>@{p.leaderHandle}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-purple-500/30 text-purple-200 rounded font-normal">
                        LEAD
                      </span>
                    </div>

                    <ArrowRight className="h-3.5 w-3.5 text-terminal-dim flex-shrink-0" />

                    {/* Follower Pill */}
                    <div className="flex items-center gap-1 px-2.5 py-1 rounded bg-cyan-500/15 border border-cyan-500/30 text-xs font-bold text-cyan-300">
                      <span>@{p.followerHandle}</span>
                      <span className="text-[9px] px-1 py-0.2 bg-cyan-500/30 text-cyan-200 rounded font-normal">
                        CONFIRM
                      </span>
                    </div>
                  </div>

                  {/* Win Badge */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="px-2 py-0.5 rounded bg-terminal-green/20 border border-terminal-green/40 text-xs font-bold text-terminal-green">
                      {p.successRate}% Win
                    </span>
                    <span className="text-[11px] text-terminal-dim">
                      {p.confirmationCount}x
                    </span>
                  </div>
                </div>

                {/* Bottom Row: Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-terminal-border/60 text-[11px] bg-terminal-panel/40 p-2 rounded">
                  <div>
                    <div className="text-[9px] text-terminal-dim uppercase font-normal">Avg Lag Delay</div>
                    <div className="font-bold text-terminal-text flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-terminal-cyan" />
                      <span>{p.avgLeadLagMinutes}m</span>
                    </div>
                  </div>
                  <div className="text-center border-x border-terminal-border/60">
                    <div className="text-[9px] text-terminal-dim uppercase font-normal">Correlation</div>
                    <div className="font-bold text-terminal-cyan mt-0.5">
                      {(p.correlation * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[9px] text-terminal-dim uppercase font-normal">Signal Alpha</div>
                    <div className="font-bold text-purple-300 mt-0.5">
                      +{Math.round(p.correlation * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
