'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Flame,
  Zap,
  Users,
  Briefcase,
  Sliders,
  Activity,
  Bell,
  LineChart,
  LayoutDashboard,
} from 'lucide-react';

export function TerminalNav() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      href: '/winning-coins',
      label: 'Winning Coins',
      icon: <Flame className="h-4 w-4 text-terminal-green" />,
      badge: 'ALPHA',
      badgeColor: 'bg-terminal-green/20 text-terminal-green border-terminal-green/30',
    },
    {
      href: '/live-trades',
      label: 'Who Is Buying Now?',
      icon: <Zap className="h-4 w-4 text-terminal-cyan" />,
      badge: 'LIVE',
      badgeColor: 'bg-terminal-cyan/20 text-terminal-cyan border-terminal-cyan/30',
    },
    {
      href: '/traders',
      label: 'Smart Traders',
      icon: <Users className="h-4 w-4" />,
    },
    {
      href: '/paper-trading',
      label: 'Paper Portfolio',
      icon: <Briefcase className="h-4 w-4" />,
    },
    {
      href: '/backtest',
      label: 'Backtesting',
      icon: <LineChart className="h-4 w-4" />,
    },
    {
      href: '/alerts',
      label: 'Alerts',
      icon: <Bell className="h-4 w-4" />,
    },
    {
      href: '/settings',
      label: 'Settings',
      icon: <Sliders className="h-4 w-4" />,
    },
    {
      href: '/api-health',
      label: 'API & Credits',
      icon: <Activity className="h-4 w-4" />,
    },
  ];

  return (
    <aside className="w-56 flex-shrink-0 border-r border-terminal-border bg-terminal-panel min-h-[calc(100vh-57px)] p-3">
      <div className="mb-2 px-2 text-[10px] font-mono uppercase tracking-wider text-terminal-dim">
        Navigation
      </div>
      <nav className="space-y-1 font-mono text-xs">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded px-2.5 py-2 transition-colors ${
                isActive
                  ? 'bg-terminal-hover text-terminal-green border border-terminal-green/30 font-semibold'
                  : 'text-terminal-muted hover:bg-terminal-hover/50 hover:text-terminal-text border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`rounded border px-1 py-0.2 text-[9px] font-bold ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Terminal Mini-status box at bottom */}
      <div className="mt-8 rounded border border-terminal-border/80 bg-terminal-bg p-2.5 text-[11px] font-mono text-terminal-muted">
        <div className="flex items-center justify-between text-[10px] text-terminal-dim mb-1">
          <span>ALGORITHM</span>
          <span className="text-terminal-green">v2.4 ACTIVE</span>
        </div>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span>Min Quality:</span>
            <span className="text-terminal-text font-bold">70 / 100</span>
          </div>
          <div className="flex justify-between">
            <span>Convergence:</span>
            <span className="text-terminal-text font-bold">2+ Traders</span>
          </div>
          <div className="flex justify-between">
            <span>Decay Half-Life:</span>
            <span className="text-terminal-text font-bold">30 Mins</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
