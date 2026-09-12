'use client';

import React from 'react';

interface Props {
  matrix: {
    traders: string[];
    tokens: string[];
    rows: Array<{
      trader: string;
      cells: Array<{ action: string; intensity: number }>;
    }>;
  };
}

export function AccumulationMap({ matrix }: Props) {
  if (!matrix || !matrix.rows || matrix.rows.length === 0) return null;

  return (
    <div className="rounded border border-terminal-border bg-terminal-panel p-4 font-mono text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-terminal-border/60 pb-3">
        <div>
          <h2 className="text-sm font-bold text-terminal-text uppercase tracking-wider">
            Accumulation Matrix
          </h2>
          <p className="text-[10px] text-terminal-muted">
            Cross-sectional map: Top Traders (Rows) vs Active Tokens (Columns)
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-terminal-green inline-block"></span> BUY/ADD
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-zinc-600 inline-block"></span> HOLD
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2 w-2 rounded bg-terminal-red inline-block"></span> SELL/EXIT
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-terminal-border/60 text-[10px] text-terminal-dim uppercase">
              <th className="p-2">Elite Trader</th>
              {matrix.tokens.map((tok) => (
                <th key={tok} className="p-2 text-center">
                  ${tok}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-terminal-border/40">
            {matrix.rows.map((row) => (
              <tr key={row.trader} className="hover:bg-terminal-hover/40">
                <td className="p-2 font-bold text-terminal-text">@{row.trader}</td>
                {row.cells.map((cell, idx) => {
                  let bg = 'bg-zinc-900 text-zinc-500';
                  if (cell.action === 'BUY') bg = 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40';
                  if (cell.action === 'ADD') bg = 'bg-terminal-green/20 text-terminal-green border border-terminal-green/50 font-bold';
                  if (cell.action === 'EXIT') bg = 'bg-red-950/60 text-red-400 border border-red-500/40 font-bold';
                  if (cell.action === 'SELL') bg = 'bg-orange-950/60 text-orange-400 border border-orange-500/40';

                  return (
                    <td key={idx} className="p-2 text-center">
                      <span className={`inline-block rounded px-2 py-0.5 text-[10px] ${bg}`}>
                        {cell.action}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
