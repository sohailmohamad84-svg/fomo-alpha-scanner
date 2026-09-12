import { NextRequest, NextResponse } from 'next/server';
import { walkForwardBacktester } from '@/lib/research/walk-forward-backtester';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const result = walkForwardBacktester.runExperiment(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const defaultExperiment = walkForwardBacktester.runExperiment({
    strategyFlavor: 'ALL_SIGNALS_COMBINED',
    entryDelaySeconds: 15,
    slippagePct: 0.5,
  });
  return NextResponse.json(defaultExperiment);
}
