'use client';

import React, { useState } from 'react';
import { EliteConsensusDashboard } from './EliteConsensusDashboard';
import { LeadLagNetworkViewer } from './LeadLagNetworkViewer';
import { StrategyArena } from './StrategyArena';
import { ShieldCheck, Network, BarChart3, LayoutGrid } from 'lucide-react';

export const EliteIntelligenceHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consensus' | 'lead-lag' | 'arena' | 'all'>('consensus');

  return (
    <div className="space-y-4">
      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2 rounded border border-terminal-border bg-terminal-panel font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-terminal-green animate-pulse" />
          <span className="font-bold text-terminal-text uppercase tracking-wider">
            ELITE INTELLIGENCE SUITE
          </span>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={() => setActiveTab('consensus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-mono font-semibold ${
              activeTab === 'consensus'
                ? 'bg-terminal-green text-black shadow-sm'
                : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover border border-terminal-border'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>Consensus Matrix</span>
          </button>

          <button
            onClick={() => setActiveTab('lead-lag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-mono font-semibold ${
              activeTab === 'lead-lag'
                ? 'bg-purple-500 text-white shadow-sm'
                : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover border border-terminal-border'
            }`}
          >
            <Network className="h-3.5 w-3.5" />
            <span>Lead-Lag Network</span>
          </button>

          <button
            onClick={() => setActiveTab('arena')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-mono font-semibold ${
              activeTab === 'arena'
                ? 'bg-amber-400 text-black shadow-sm'
                : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover border border-terminal-border'
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            <span>5-Strategy Backtest</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded transition-all font-mono font-semibold ${
              activeTab === 'all'
                ? 'bg-cyan-500 text-black shadow-sm'
                : 'bg-terminal-bg text-terminal-muted hover:text-terminal-text hover:bg-terminal-hover border border-terminal-border'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>View All</span>
          </button>
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'consensus' && <EliteConsensusDashboard />}
      {activeTab === 'lead-lag' && <LeadLagNetworkViewer />}
      {activeTab === 'arena' && <StrategyArena />}
      {activeTab === 'all' && (
        <div className="space-y-6">
          <EliteConsensusDashboard />
          <LeadLagNetworkViewer />
          <StrategyArena />
        </div>
      )}
    </div>
  );
};
