import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export function StatCard({
  label,
  value,
  subValue,
  trend,
  trendValue,
  icon,
  highlight = false,
}: StatCardProps) {
  return (
    <div
      className={`relative overflow-hidden rounded border bg-terminal-panel p-4 transition-all duration-200 hover:border-terminal-border/80 ${
        highlight
          ? 'border-terminal-green/50 shadow-[0_0_15px_-3px_rgba(34,197,94,0.15)]'
          : 'border-terminal-border'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono font-medium tracking-wider text-terminal-muted uppercase">
          {label}
        </span>
        {icon && <div className="text-terminal-muted">{icon}</div>}
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <div className="text-2xl font-mono font-bold tracking-tight text-terminal-text">
          {value}
        </div>
        {subValue && (
          <span className="text-xs font-mono text-terminal-muted">{subValue}</span>
        )}
      </div>

      {trendValue && (
        <div className="mt-2 flex items-center gap-1.5 text-xs font-mono">
          <span
            className={`font-semibold ${
              trend === 'up'
                ? 'text-terminal-green'
                : trend === 'down'
                ? 'text-terminal-red'
                : 'text-terminal-muted'
            }`}
          >
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '●'} {trendValue}
          </span>
        </div>
      )}
    </div>
  );
}
