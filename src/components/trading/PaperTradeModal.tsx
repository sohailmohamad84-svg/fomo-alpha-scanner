'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface PaperTradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: {
    symbol: string;
    name: string;
    address: string;
    network: string;
    priceUsd: number;
    smartMoneyScore: number;
    topTrader?: string;
  };
  onSuccess?: () => void;
}

export function PaperTradeModal({ isOpen, onClose, token, onSuccess }: PaperTradeModalProps) {
  const [positionSize, setPositionSize] = useState<number>(1000);
  const [stopLossPct, setStopLossPct] = useState<number>(10);
  const [takeProfitPct, setTakeProfitPct] = useState<number>(40);
  const [loading, setLoading] = useState<boolean>(false);
  const [mode, setMode] = useState<'PAPER' | 'LIVE_APPROVAL'>('PAPER');
  const [liveApproved, setLiveApproved] = useState<boolean>(false);

  if (!isOpen) return null;

  const slippageEstimate = (positionSize * 0.005).toFixed(2);
  const feeEstimate = (positionSize * 0.001 + 0.5).toFixed(2);
  const estimatedTokens = (positionSize / token.priceUsd).toLocaleString(undefined, { maximumFractionDigits: 2 });
  const stopLossPrice = (token.priceUsd * (1 - stopLossPct / 100)).toFixed(6);
  const takeProfitPrice = (token.priceUsd * (1 + takeProfitPct / 100)).toFixed(6);

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/paper-trading/positions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ENTER',
          tokenAddress: token.address,
          network: token.network,
          symbol: token.symbol,
          priceUsd: token.priceUsd,
          smartMoneyScore: token.smartMoneyScore,
          uniqueTraders: 3,
          tradersInvolved: [token.topTrader || 'Smart Money'],
        }),
      });
      const data = await res.json();
      if (data.entered) {
        alert(`Success! Position simulated for $${token.symbol} at $${token.priceUsd}`);
        if (onSuccess) onSuccess();
        onClose();
      } else {
        alert(`Could not enter: ${data.reason}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-mono">
      <div className="w-full max-w-lg rounded border border-terminal-border bg-terminal-panel shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-terminal-dim hover:text-terminal-text"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-terminal-border pb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded border border-terminal-green/40 bg-terminal-green/10 text-terminal-green font-bold">
            ${token.symbol}
          </div>
          <div>
            <h2 className="text-base font-bold text-terminal-text">
              Trade Execution: ${token.symbol}
            </h2>
            <p className="text-xs text-terminal-muted">
              {token.network.toUpperCase()} · Contract: {token.address.slice(0, 8)}...{token.address.slice(-6)}
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mt-4 flex rounded border border-terminal-border bg-terminal-bg p-1 text-xs">
          <button
            onClick={() => setMode('PAPER')}
            className={`flex-1 rounded py-1.5 font-bold transition-colors ${
              mode === 'PAPER'
                ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/40'
                : 'text-terminal-muted hover:text-terminal-text'
            }`}
          >
            PAPER SIMULATION (SAFE)
          </button>
          <button
            onClick={() => setMode('LIVE_APPROVAL')}
            className={`flex-1 rounded py-1.5 font-bold transition-colors ${
              mode === 'LIVE_APPROVAL'
                ? 'bg-red-950/60 text-red-400 border border-red-700'
                : 'text-terminal-muted hover:text-terminal-text'
            }`}
          >
            APPROVE LIVE EXECUTION
          </button>
        </div>

        {/* Trade Details Summary */}
        <div className="mt-4 space-y-2.5 text-xs rounded border border-terminal-border bg-terminal-bg p-3.5">
          <div className="flex justify-between">
            <span className="text-terminal-muted">Current Market Price:</span>
            <span className="text-terminal-text font-bold">${token.priceUsd}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Smart Money Score:</span>
            <span className="text-terminal-green font-bold">{token.smartMoneyScore} / 100</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Top Responsible Trader:</span>
            <span className="text-terminal-cyan font-bold">@{token.topTrader || 'CryptoKaleo'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Est. Slippage (0.5%):</span>
            <span className="text-terminal-text">${slippageEstimate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Estimated Fees & Gas:</span>
            <span className="text-terminal-text">${feeEstimate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-terminal-muted">Estimated Token Fill:</span>
            <span className="text-terminal-text font-bold">~{estimatedTokens} {token.symbol}</span>
          </div>
        </div>

        {/* Inputs */}
        <div className="mt-4 space-y-3 text-xs">
          <div>
            <label className="block text-terminal-muted mb-1">
              Position Size (USD):
            </label>
            <input
              type="number"
              value={positionSize}
              onChange={(e) => setPositionSize(Math.max(10, parseFloat(e.target.value) || 0))}
              className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-2 text-terminal-text focus:border-terminal-green/50 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-terminal-muted mb-1">Stop Loss (%):</label>
              <input
                type="number"
                value={stopLossPct}
                onChange={(e) => setStopLossPct(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-1.5 text-terminal-text focus:outline-none"
              />
              <span className="text-[10px] text-terminal-dim mt-0.5 block">
                Trigger: ${stopLossPrice}
              </span>
            </div>
            <div>
              <label className="block text-terminal-muted mb-1">Take Profit (%):</label>
              <input
                type="number"
                value={takeProfitPct}
                onChange={(e) => setTakeProfitPct(parseFloat(e.target.value) || 0)}
                className="w-full rounded border border-terminal-border bg-terminal-bg px-3 py-1.5 text-terminal-text focus:outline-none"
              />
              <span className="text-[10px] text-terminal-dim mt-0.5 block">
                Trigger: ${takeProfitPrice}
              </span>
            </div>
          </div>
        </div>

        {/* Live Approval Warning if in Live Mode */}
        {mode === 'LIVE_APPROVAL' && (
          <div className="mt-4 rounded border border-red-700/60 bg-red-950/40 p-3 text-xs text-red-300 space-y-2">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <AlertTriangle className="h-4 w-4" />
              <span>LIVE CAPITAL RISK WARNING</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Following top traders does NOT guarantee profits. Volatile meme coins may experience sudden dev exits, sandwich attacks, or liquidity drainage.
            </p>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={liveApproved}
                onChange={(e) => setLiveApproved(e.target.checked)}
                className="rounded border-red-700 bg-red-950 text-red-500 focus:ring-0"
              />
              <span className="text-[11px] font-bold">I acknowledge the risks and authorize trade staging.</span>
            </label>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded border border-terminal-border bg-terminal-bg py-2.5 text-xs text-terminal-muted hover:text-terminal-text font-bold"
          >
            Cancel
          </button>
          <button
            onClick={handleExecute}
            disabled={loading || (mode === 'LIVE_APPROVAL' && !liveApproved)}
            className={`flex-1 rounded py-2.5 text-xs font-bold transition-all ${
              mode === 'PAPER'
                ? 'bg-terminal-green text-black hover:bg-terminal-green-bright shadow-[0_0_15px_-3px_rgba(34,197,94,0.3)]'
                : liveApproved
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {loading ? 'Executing...' : mode === 'PAPER' ? 'Simulate Paper Buy' : 'Approve Live Order'}
          </button>
        </div>
      </div>
    </div>
  );
}
