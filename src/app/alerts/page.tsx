'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell, Flame, ShieldAlert, CheckCircle2, Award, Zap, Check, ExternalLink } from 'lucide-react';
import { alertEngine, AlertItem } from '@/lib/alerts/alert-engine';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const fetchAlerts = () => {
    setAlerts(alertEngine.getAlerts(100));
  };

  useEffect(() => {
    fetchAlerts();

    // SSE listener for new incoming live alerts
    const es = new EventSource('/api/realtime/stream');
    es.addEventListener('alert', (e) => {
      try {
        const al = JSON.parse(e.data);
        setAlerts((prev) => [al, ...prev]);
      } catch (err) {}
    });

    return () => es.close();
  }, []);

  const handleMarkAllAsRead = () => {
    alertEngine.markAllAsRead();
    fetchAlerts();
  };

  const filtered = alerts.filter((a) => {
    if (filter === 'unread') return !a.isRead;
    if (filter === 'high') return a.type === 'SMART_MONEY_ACCUMULATION' || a.type === 'NEW_HIGH_CONVICTION_COIN';
    if (filter === 'exit') return a.type === 'SMART_MONEY_SELLING';
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-terminal-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-mono text-xl font-bold text-terminal-text">
              Real-Time Alpha Alerts
            </h1>
            <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-2 py-0.5 text-xs font-mono font-bold text-terminal-green">
              FEED ACTIVE
            </span>
          </div>
          <p className="text-xs font-mono text-terminal-muted mt-1">
            Notifications triggered by multi-trader accumulation, high-conviction signals, and smart money exits.
          </p>
        </div>

        <button
          onClick={handleMarkAllAsRead}
          className="flex items-center gap-1.5 rounded border border-terminal-border bg-terminal-panel px-3 py-1.5 text-xs font-mono text-terminal-muted hover:text-terminal-text self-start sm:self-auto"
        >
          <Check className="h-3.5 w-3.5 text-terminal-green" />
          <span>Mark All Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 font-mono text-xs">
        {[
          { key: 'all', label: 'All Alerts' },
          { key: 'unread', label: 'Unread Only' },
          { key: 'high', label: 'High Conviction / Accumulation' },
          { key: 'exit', label: 'Exit & Dump Warnings' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`rounded px-3 py-1.5 border transition-colors ${
              filter === tab.key
                ? 'border-terminal-green bg-terminal-green/20 text-terminal-green font-bold'
                : 'border-terminal-border bg-terminal-panel text-terminal-muted hover:text-terminal-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Alert Feed */}
      <div className="space-y-3 font-mono">
        {filtered.length === 0 ? (
          <div className="rounded border border-terminal-border bg-terminal-panel p-8 text-center text-xs text-terminal-muted">
            No alerts matching current filter.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`rounded border p-4 transition-all ${
                !item.isRead
                  ? 'border-terminal-green/40 bg-terminal-panel shadow-[0_0_15px_-3px_rgba(34,197,94,0.08)]'
                  : 'border-terminal-border bg-terminal-panel/60 opacity-80'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded ${
                      item.severity === 'CRITICAL' || item.type === 'SMART_MONEY_SELLING'
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : item.type === 'SMART_MONEY_ACCUMULATION' || item.type === 'NEW_HIGH_CONVICTION_COIN'
                        ? 'bg-terminal-green/20 text-terminal-green border border-terminal-green/40'
                        : 'bg-zinc-800 text-terminal-cyan border border-zinc-700'
                    }`}
                  >
                    {item.type === 'SMART_MONEY_ACCUMULATION' ? (
                      <Flame className="h-4 w-4" />
                    ) : item.type === 'SMART_MONEY_SELLING' ? (
                      <ShieldAlert className="h-4 w-4" />
                    ) : (
                      <Zap className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-terminal-text">{item.title}</span>
                      {item.score && (
                        <span className="rounded bg-terminal-green/20 border border-terminal-green/40 px-1.5 py-0.2 text-[10px] font-bold text-terminal-green">
                          Score: {item.score}/100
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-terminal-muted mt-1 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>

                <div className="text-right text-[11px] text-terminal-dim flex-shrink-0">
                  <div>{new Date(item.createdAt).toLocaleTimeString()}</div>
                  {item.tokenAddress && (
                    <Link
                      href={`/tokens/${encodeURIComponent(item.tokenAddress)}`}
                      className="inline-flex items-center gap-1 text-terminal-green hover:underline mt-1"
                    >
                      <span>Analyze</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
