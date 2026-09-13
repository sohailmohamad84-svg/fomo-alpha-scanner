'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Activity, ShieldCheck, Zap, Search, Coins, RefreshCw } from 'lucide-react';

export function TerminalHeader() {
  const [utcTime, setUtcTime] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [credits, setCredits] = useState<number | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const router = useRouter();

  const fetchCredits = async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      const data = await res.json();
      if (typeof data?.credits?.remaining === 'number') {
        setCredits(data.credits.remaining);
      }
    } catch {}
  };

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchCredits();
    // Poll every 10 seconds to keep synced with FOMO API
    const interval = setInterval(fetchCredits, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.trim();
    if (q.startsWith('@') || !q.includes('0x') && q.length < 20) {
      router.push(`/traders/${q.replace(/^@/, '')}`);
    } else {
      router.push(`/tokens/${encodeURIComponent(q)}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-terminal-border bg-terminal-panel/95 backdrop-blur px-4 py-2.5">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 text-inherit no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded border border-terminal-green/50 bg-terminal-green/10 text-terminal-green font-mono font-bold text-sm">
              α
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-bold tracking-wider text-terminal-text">
                  FOMO <span className="text-terminal-green">ALPHA</span> SCANNER
                </span>
                <span className="rounded bg-terminal-green/15 border border-terminal-green/30 px-1.5 py-0.2 text-[10px] font-mono font-bold text-terminal-green">
                  v2.0 PRO
                </span>
              </div>
              <p className="text-[11px] font-mono text-terminal-muted hidden md:block">
                &ldquo;Follow the smartest money, not the crowd.&rdquo;
              </p>
            </div>
          </Link>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-terminal-dim" />
          <input
            type="text"
            placeholder="Search @trader, $ticker or contract..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded border border-terminal-border bg-terminal-bg pl-8 pr-3 py-1.5 text-xs font-mono text-terminal-text placeholder:text-terminal-dim focus:border-terminal-green/50 focus:outline-none"
          />
        </form>

        {/* Live System Status & Telemetry */}
        <div className="flex items-center gap-3 text-xs font-mono">
          {/* Credits Meter */}
          <div className="hidden lg:flex items-center gap-1">
            <Link
              href="/api-health"
              className="flex items-center gap-1.5 rounded-l border border-terminal-border bg-terminal-bg px-2.5 py-1 text-terminal-muted hover:border-terminal-muted/60 transition-colors"
            >
              <Coins className="h-3.5 w-3.5 text-terminal-amber" />
              <span>Credits:</span>
              <span className="font-bold text-terminal-text">
                {credits !== null ? credits.toLocaleString() : 'Syncing...'}
              </span>
            </Link>
            <button
              onClick={async (e) => {
                e.preventDefault();
                setIsSyncing(true);
                await fetchCredits();
                setTimeout(() => setIsSyncing(false), 600);
              }}
              title="Sync credits with FOMO API"
              className="flex items-center justify-center p-1 rounded-r border-t border-b border-r border-terminal-border bg-terminal-bg text-terminal-dim hover:text-terminal-text hover:border-terminal-muted/60 transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${isSyncing ? 'animate-spin text-terminal-green' : ''}`} />
            </button>
          </div>

          {/* Stream Status */}
          <div className="flex items-center gap-1.5 rounded border border-terminal-border bg-terminal-bg px-2 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terminal-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-terminal-green"></span>
            </span>
            <span className="text-[11px] text-terminal-green font-semibold">FEED LIVE</span>
          </div>

          {/* Mode Badge */}
          <div className="hidden sm:flex items-center gap-1 rounded border border-blue-800/60 bg-blue-950/60 px-2 py-1 text-[11px] font-bold text-blue-400">
            <ShieldCheck className="h-3 w-3" />
            <span>PAPER MODE</span>
          </div>

          {/* UTC Clock */}
          <div className="text-[11px] text-terminal-muted font-mono font-medium">
            {utcTime || '00:00:00 UTC'}
          </div>
        </div>
      </div>
    </header>
  );
}
