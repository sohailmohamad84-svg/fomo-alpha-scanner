'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowRight, Zap, TrendingUp, Users, BookOpen } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Props {
  opportunity: any;
}

export function AlphaConvergenceMatrix({ opportunity }: Props) {
  if (!opportunity) return null;

  const {
    symbol,
    network,
    tokenAddress,
    alphaScore,
    dataConfidencePct,
    riskScore,
    signalCategory,
    lifecyclePhase,
    explanation,
    components,
  } = opportunity;

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel p-4 font-mono text-xs space-y-4">
      {/* Header with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-terminal-border/60 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-terminal-text">${symbol}</span>
          <span className="rounded bg-zinc-800 px-2 py-0.5 text-[10px] text-terminal-dim uppercase">
            {network}
          </span>
          <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-[10px] font-bold text-terminal-green">
            {signalCategory}
          </span>
          <span className="rounded bg-purple-950/40 border border-purple-500/40 px-2 py-0.5 text-[10px] font-bold text-purple-400">
            {lifecyclePhase}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-[11px]">
            <span className="text-terminal-dim">Data Confidence: </span>
            <span className="font-bold text-terminal-cyan">{dataConfidencePct}%</span>
          </div>
          <div className="text-right">
            <span className="text-lg font-bold text-terminal-green">{alphaScore}</span>
            <span className="text-terminal-dim text-[10px]">/100</span>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Box 1: WHO (Traders & DNA) */}
        <div className="rounded border border-terminal-border/60 bg-terminal-bg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-terminal-cyan text-[11px] font-bold uppercase">
            <Users className="h-3.5 w-3.5" />
            <span>1. Who is Buying?</span>
          </div>
          <div className="text-terminal-text font-bold text-[11px]">
            {explanation.who?.join(', ') || 'Smart Money Pool'}
          </div>
          <p className="text-[11px] text-terminal-muted">
            {explanation.howMany} buyers (${Math.round(explanation.howMuchUsd || 0).toLocaleString()} inflow).
          </p>
        </div>

        {/* Box 2: WHY (Theses & Narrative) */}
        <div className="rounded border border-terminal-border/60 bg-terminal-bg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-purple-400 text-[11px] font-bold uppercase">
            <BookOpen className="h-3.5 w-3.5" />
            <span>2. Why are they buying?</span>
          </div>
          <p className="text-[11px] text-terminal-text line-clamp-2">
            {explanation.why}
          </p>
        </div>

        {/* Box 3: HOW EARLY (Dual-Stream Latency) */}
        <div className="rounded border border-terminal-border/60 bg-terminal-bg p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-terminal-amber text-[11px] font-bold uppercase">
            <Zap className="h-3.5 w-3.5" />
            <span>3. How Early?</span>
          </div>
          <p className="text-[11px] text-terminal-text">
            {explanation.howEarly}
          </p>
          <div className="text-[10px] text-terminal-muted">
            {explanation.tooLateAnalysis?.verdict}
          </div>
        </div>
      </div>

      {/* Component Factor Breakdown */}
      <div className="rounded border border-terminal-border/40 bg-zinc-950 p-2.5">
        <div className="text-[10px] text-terminal-dim uppercase tracking-wider mb-2 font-bold">
          Factor Attribution Breakdown
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 text-[11px]">
          <div>
            <span className="text-terminal-dim block">Trader DNA:</span>
            <span className="font-bold text-terminal-green">+{components.traderQualityContribution}</span>
          </div>
          <div>
            <span className="text-terminal-dim block">Convergence:</span>
            <span className="font-bold text-terminal-green">+{components.convergenceContribution}</span>
          </div>
          <div>
            <span className="text-terminal-dim block">Narrative:</span>
            <span className="font-bold text-purple-400">+{components.narrativeContribution}</span>
          </div>
          <div>
            <span className="text-terminal-dim block">Holders:</span>
            <span className="font-bold text-terminal-cyan">+{components.holderConvictionContribution}</span>
          </div>
          <div>
            <span className="text-terminal-dim block">Early Alpha:</span>
            <span className="font-bold text-terminal-amber">+{components.earlyEntryContribution}</span>
          </div>
          <div>
            <span className="text-terminal-dim block">Risk Drag:</span>
            <span className="font-bold text-terminal-red">-{components.riskPenalty}</span>
          </div>
        </div>
      </div>

      {/* Why Now & Link */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="text-[11px] text-terminal-muted">
          <strong className="text-terminal-text">Why Now?</strong> {explanation.whyNow}
        </div>
        <Link
          href={`/tokens/${network}:${tokenAddress}`}
          className="rounded border border-terminal-border bg-terminal-bg px-3 py-1 text-[11px] font-bold text-terminal-green hover:bg-terminal-hover transition-colors flex items-center gap-1"
        >
          <span>Deep Intelligence</span>
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
