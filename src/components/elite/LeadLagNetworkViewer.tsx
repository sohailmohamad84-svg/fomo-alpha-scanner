'use client';

import React, { useState, useEffect } from 'react';
import { LeadLagPair } from '@/lib/types/elite';

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
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-purple-400 animate-pulse" />
            <h3 className="text-lg font-bold text-white tracking-wide">
              LEAD-LAG TRADER NETWORK
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded">
              PAIRWISE DIRECTED GRAPH
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Empirically discovered directional relationships: Who enters first, who confirms, and how many minutes later.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 text-sm">
          Mining directional transaction sequences...
        </div>
      ) : pairs.length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-sm">
          No confirmed pairwise sequences in current window.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {pairs.map((p, idx) => (
            <div
              key={`${p.leaderHandle}-${p.followerHandle}-${idx}`}
              className="bg-slate-800/50 border border-slate-700/60 rounded-lg p-3.5 flex flex-col justify-between hover:border-purple-500/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                {/* Flow: Leader -> Follower */}
                <div className="flex items-center gap-2">
                  <div className="px-2 py-1 bg-purple-500/15 border border-purple-500/30 rounded text-xs font-bold text-purple-300 font-mono">
                    @{p.leaderHandle}
                    <span className="ml-1 text-[9px] text-purple-400 uppercase font-sans font-normal">(Leader)</span>
                  </div>
                  <span className="text-slate-500 font-bold">➔</span>
                  <div className="px-2 py-1 bg-blue-500/15 border border-blue-500/30 rounded text-xs font-bold text-blue-300 font-mono">
                    @{p.followerHandle}
                    <span className="ml-1 text-[9px] text-blue-400 uppercase font-sans font-normal">(Confirmer)</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-bold text-emerald-400">{p.successRate}% Win Rate</div>
                  <div className="text-[10px] text-slate-400">{p.confirmationCount} Confirmations</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/50 text-[11px] text-slate-400">
                <span>Avg Lag Delay:</span>
                <span className="font-mono text-slate-200 font-medium">{p.avgLeadLagMinutes} minutes</span>
                <span>Signal Edge:</span>
                <span className="font-mono text-purple-300 font-medium">+{Math.round(p.correlation * 100)}% Lead Alpha</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
