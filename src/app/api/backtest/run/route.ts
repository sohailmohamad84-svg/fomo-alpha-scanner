import { NextRequest, NextResponse } from 'next/server';
import { runBacktest, BacktestParams } from '@/lib/simulator/backtester';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body: Partial<BacktestParams> = await req.json();
    const result = runBacktest(body);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
