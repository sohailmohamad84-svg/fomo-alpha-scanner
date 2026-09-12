import { NextRequest, NextResponse } from 'next/server';
import { paperTradingEngine } from '@/lib/simulator/paper-trading';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const positions = paperTradingEngine.getPositions();
    return NextResponse.json({
      count: positions.length,
      positions,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'ENTER') {
      const { tokenAddress, network, symbol, priceUsd, smartMoneyScore, uniqueTraders, tradersInvolved } = body;
      const result = paperTradingEngine.evaluateSignalForEntry({
        tokenAddress,
        network: network || 'solana',
        symbol: symbol || 'TOKEN',
        priceUsd: priceUsd || 1.0,
        smartMoneyScore: smartMoneyScore || 80,
        uniqueTraders: uniqueTraders || 2,
        signalAgeMinutes: 1,
        tradersInvolved: tradersInvolved || ['Manual Trader'],
      });
      return NextResponse.json(result);
    } else if (action === 'CLOSE') {
      const { positionId, reason, exitPrice } = body;
      const closed = paperTradingEngine.closePosition(
        positionId,
        reason || 'Manual user exit',
        exitPrice
      );
      if (!closed) {
        return NextResponse.json({ error: 'Position not found or already closed' }, { status: 404 });
      }
      return NextResponse.json({ success: true, position: closed });
    }

    return NextResponse.json({ error: 'Invalid action. Use ENTER or CLOSE' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
