import { NextResponse } from 'next/server';
import { paperTradingEngine } from '@/lib/simulator/paper-trading';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = paperTradingEngine.getStats();
    return NextResponse.json(stats);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
