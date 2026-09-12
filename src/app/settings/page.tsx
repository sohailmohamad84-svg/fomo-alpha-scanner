'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Key,
  Users,
  BrainCircuit,
  Briefcase,
  Send,
  Save,
  CheckCircle2,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState<string>('');
  const [traderWeights, setTraderWeights] = useState<any>({
    pnl: 0.30,
    consistency: 0.20,
    recentPerf: 0.15,
    activity: 0.10,
    accountAge: 0.10,
    verified: 0.05,
    volume: 0.05,
    holdingBehavior: 0.05,
  });
  const [scoringWeights, setScoringWeights] = useState<any>({
    highQualityBuy: 25,
    multiHighQualityBuy: 20,
    topRankedBuy: 15,
    verifiedBuy: 10,
    independentBuyers: 10,
    recentPurchase: 10,
    strongHistorical: 10,
    holdingBonus: 5,
    trendingBonus: 5,
    fomoBuyersBonus: 5,
    strongSellingPenalty: 20,
    quickExitPenalty: 15,
  });
  const [paperConfig, setPaperConfig] = useState<any>({
    initialCapitalUsd: 10000,
    maxPositionSizeUsd: 1000,
    stopLossPct: 10,
    takeProfitPct: 40,
    trailingStopPct: 8,
    slippagePct: 0.5,
  });
  const [telegram, setTelegram] = useState<any>({
    botToken: '',
    chatId: '',
    enabled: false,
  });
  const [executionMode, setExecutionMode] = useState<string>('PAPER');
  const [saving, setSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          const s = data.settings;
          if (s.fomoApiKey) setApiKey(s.fomoApiKey);
          if (s.traderWeights) setTraderWeights(s.traderWeights);
          if (s.scoringWeights) setScoringWeights(s.scoringWeights);
          if (s.paperConfig) setPaperConfig(s.paperConfig);
          if (s.telegram) setTelegram(s.telegram);
          if (s.executionMode) setExecutionMode(s.executionMode);
        }
      })
      .catch((err) => console.warn('[Settings] Load warning:', err.message));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fomoApiKey: apiKey,
          traderWeights,
          scoringWeights,
          paperConfig,
          telegram,
          executionMode,
        }),
      });
      if (res.ok) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
      }
    } catch (err: any) {
      console.warn('[Settings] Save error:', err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl font-mono text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <h1 className="text-xl font-bold text-terminal-text">
            System & Algorithm Configuration
          </h1>
          <p className="text-terminal-muted mt-1">
            Fine-tune trader scoring weights, convergence parameters, and execution rules without code changes.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded bg-terminal-green px-4 py-2 font-bold text-black hover:bg-terminal-green-bright transition-colors self-start sm:self-auto shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {savedSuccess && (
        <div className="flex items-center gap-2 rounded border border-terminal-green/50 bg-terminal-green/10 p-3 text-terminal-green">
          <CheckCircle2 className="h-4 w-4" />
          <span>Settings saved successfully! Active scoring weights and thresholds updated.</span>
        </div>
      )}

      {/* 1. FOMO API Key */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3">
        <div className="flex items-center gap-2 font-bold text-terminal-text uppercase">
          <Key className="h-4 w-4 text-terminal-green" />
          <span>FOMO API Credentials</span>
        </div>
        <p className="text-terminal-muted">
          Your key is stored server-side and never exposed to the browser. If left empty, the engine automatically operates in simulation demo mode.
        </p>
        <div>
          <label className="block text-terminal-dim mb-1">FOMO_API_KEY:</label>
          <input
            type="password"
            placeholder="Paste your FOMO API key here..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-terminal-text focus:border-terminal-green/50 focus:outline-none"
          />
        </div>
      </div>

      {/* 2. Trader Quality Score Weights (Section 4) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-4">
        <div className="flex items-center gap-2 font-bold text-terminal-text uppercase">
          <Users className="h-4 w-4 text-terminal-cyan" />
          <span>Trader Quality Score Weights (Must sum to 1.0)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-terminal-dim mb-1">PnL Performance ({(traderWeights.pnl * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.pnl}
              onChange={(e) => setTraderWeights({ ...traderWeights, pnl: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Consistency ({(traderWeights.consistency * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.consistency}
              onChange={(e) => setTraderWeights({ ...traderWeights, consistency: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Recent Perf ({(traderWeights.recentPerf * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.recentPerf}
              onChange={(e) => setTraderWeights({ ...traderWeights, recentPerf: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Activity ({(traderWeights.activity * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.activity}
              onChange={(e) => setTraderWeights({ ...traderWeights, activity: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Account Age ({(traderWeights.accountAge * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.accountAge}
              onChange={(e) => setTraderWeights({ ...traderWeights, accountAge: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Verified ({(traderWeights.verified * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.verified}
              onChange={(e) => setTraderWeights({ ...traderWeights, verified: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Volume ({(traderWeights.volume * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.volume}
              onChange={(e) => setTraderWeights({ ...traderWeights, volume: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Holding Behavior ({(traderWeights.holdingBehavior * 100).toFixed(0)}%):</label>
            <input
              type="number"
              step="0.05"
              value={traderWeights.holdingBehavior}
              onChange={(e) => setTraderWeights({ ...traderWeights, holdingBehavior: parseFloat(e.target.value) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
        </div>
      </div>

      {/* 3. Smart Money Convergence Algorithm Weights (Section 7) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-4">
        <div className="flex items-center gap-2 font-bold text-terminal-text uppercase">
          <BrainCircuit className="h-4 w-4 text-terminal-purple" />
          <span>Smart Money Convergence Scoring Engine Points</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-terminal-dim mb-1">High-Quality Trader Buys:</label>
            <input
              type="number"
              value={scoringWeights.highQualityBuy}
              onChange={(e) => setScoringWeights({ ...scoringWeights, highQualityBuy: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Multiple Quality Traders Buy:</label>
            <input
              type="number"
              value={scoringWeights.multiHighQualityBuy}
              onChange={(e) => setScoringWeights({ ...scoringWeights, multiHighQualityBuy: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Recent Purchase (&lt;15m):</label>
            <input
              type="number"
              value={scoringWeights.recentPurchase}
              onChange={(e) => setScoringWeights({ ...scoringWeights, recentPurchase: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Strong Selling Penalty (-):</label>
            <input
              type="number"
              value={scoringWeights.strongSellingPenalty}
              onChange={(e) => setScoringWeights({ ...scoringWeights, strongSellingPenalty: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-red font-bold"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Trending Token Bonus:</label>
            <input
              type="number"
              value={scoringWeights.trendingBonus}
              onChange={(e) => setScoringWeights({ ...scoringWeights, trendingBonus: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-text"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Quick Exit Penalty (-):</label>
            <input
              type="number"
              value={scoringWeights.quickExitPenalty}
              onChange={(e) => setScoringWeights({ ...scoringWeights, quickExitPenalty: parseInt(e.target.value, 10) || 0 })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-2.5 py-1.5 text-terminal-red font-bold"
            />
          </div>
        </div>
      </div>

      {/* 4. Telegram Alerts (Section 27) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-terminal-text uppercase">
            <Send className="h-4 w-4 text-blue-400" />
            <span>Telegram Bot Alpha Notifications</span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={telegram.enabled}
              onChange={(e) => setTelegram({ ...telegram, enabled: e.target.checked })}
              className="rounded border-terminal-border bg-terminal-bg text-terminal-green focus:ring-0"
            />
            <span className="text-terminal-text font-bold">Enable Telegram</span>
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-terminal-dim mb-1">Telegram Bot Token:</label>
            <input
              type="password"
              placeholder="e.g. 123456789:ABCDefghijk..."
              value={telegram.botToken}
              onChange={(e) => setTelegram({ ...telegram, botToken: e.target.value })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-terminal-text focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-terminal-dim mb-1">Telegram Chat ID / Channel:</label>
            <input
              type="text"
              placeholder="e.g. -100123456789 or @channel"
              value={telegram.chatId}
              onChange={(e) => setTelegram({ ...telegram, chatId: e.target.value })}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-terminal-text focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 5. Execution Mode (Section 29, 30) */}
      <div className="rounded border border-terminal-border bg-terminal-panel p-4 space-y-3">
        <div className="flex items-center gap-2 font-bold text-terminal-text uppercase">
          <ShieldCheck className="h-4 w-4 text-terminal-green" />
          <span>Execution Engine Safety Gate</span>
        </div>
        <p className="text-terminal-muted">
          Execution mode dictates order routing. By default, live real-money execution is strictly locked to prevent accidental deployment activations.
        </p>
        <div className="flex gap-3 pt-1">
          {['PAPER', 'MANUAL_STAGING', 'LIVE_LOCKED'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setExecutionMode(m)}
              className={`rounded border px-4 py-2 font-bold transition-colors ${
                executionMode === m
                  ? 'border-terminal-green bg-terminal-green/20 text-terminal-green'
                  : 'border-terminal-border bg-terminal-bg text-terminal-muted hover:text-terminal-text'
              }`}
            >
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
