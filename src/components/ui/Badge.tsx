import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'conviction' | 'signal' | 'chain' | 'risk' | 'default';
  value?: string;
  className?: string;
}

export function Badge({ children, variant = 'default', value, className = '' }: BadgeProps) {
  const val = (value || String(children)).toUpperCase();

  if (variant === 'conviction') {
    if (val.includes('EXCEPTIONAL')) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40 shadow-sm ${className}`}>
          ★ {children}
        </span>
      );
    }
    if (val.includes('VERY STRONG')) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 ${className}`}>
          ◆ {children}
        </span>
      );
    }
    if (val.includes('STRONG')) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-700/50 ${className}`}>
          ▲ {children}
        </span>
      );
    }
    if (val.includes('MODERATE')) {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-terminal-amber/15 text-terminal-amber border border-terminal-amber/30 ${className}`}>
          ● {children}
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-800/60 text-zinc-400 border border-zinc-700/40 ${className}`}>
        {children}
      </span>
    );
  }

  if (variant === 'signal') {
    if (val === 'HIGH_CONVICTION') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-terminal-purple/20 text-purple-300 border border-terminal-purple/50 animate-pulse ${className}`}>
          🔥 HIGH CONVICTION
        </span>
      );
    }
    if (val === 'STRONG_SIGNAL') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-terminal-green/20 text-terminal-green border border-terminal-green/40 ${className}`}>
          ⚡ STRONG SIGNAL
        </span>
      );
    }
    if (val === 'EARLY_SIGNAL') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-terminal-cyan/20 text-terminal-cyan border border-terminal-cyan/40 ${className}`}>
          ⏱ EARLY SIGNAL
        </span>
      );
    }
    if (val === 'EXIT_WARNING') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-terminal-amber/20 text-terminal-amber border border-terminal-amber/40 ${className}`}>
          ⚠ EXIT WARNING
        </span>
      );
    }
    if (val === 'EXIT') {
      return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-terminal-red/20 text-terminal-red border border-terminal-red/50 ${className}`}>
          ✕ DUMP / EXIT
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-800/80 text-zinc-400 border border-zinc-700/50 ${className}`}>
        WATCH
      </span>
    );
  }

  if (variant === 'chain') {
    const c = val.toLowerCase();
    let bg = 'bg-zinc-800 text-zinc-300 border-zinc-700';
    if (c === 'solana') bg = 'bg-purple-950/70 text-purple-300 border-purple-800/60';
    else if (c === 'robinhood') bg = 'bg-lime-950/70 text-lime-400 border-lime-800/60';
    else if (c === 'base') bg = 'bg-blue-950/70 text-blue-300 border-blue-800/60';
    else if (c === 'bsc') bg = 'bg-amber-950/70 text-amber-300 border-amber-800/60';
    else if (c === 'ethereum') bg = 'bg-indigo-950/70 text-indigo-300 border-indigo-800/60';

    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider border ${bg} ${className}`}>
        {children}
      </span>
    );
  }

  if (variant === 'risk') {
    if (val === 'EXTREME') {
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-red-950 text-red-400 border border-red-700 animate-pulse ${className}`}>
          EXTREME RISK
        </span>
      );
    }
    if (val === 'HIGH') {
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-red-950/60 text-red-400 border border-red-800/50 ${className}`}>
          HIGH RISK
        </span>
      );
    }
    if (val === 'MEDIUM') {
      return (
        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/60 text-amber-400 border border-amber-800/50 ${className}`}>
          MODERATE RISK
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/50 text-emerald-400 border border-emerald-800/40 ${className}`}>
        LOW RISK
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono bg-zinc-800 text-zinc-300 border border-zinc-700 ${className}`}>
      {children}
    </span>
  );
}
