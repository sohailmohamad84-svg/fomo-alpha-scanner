import { NextRequest, NextResponse } from 'next/server';
import { strategyEvaluationService } from '@/lib/elite/strategy-evaluation-service';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const horizon = searchParams.get('horizon') || '30d';

    const comparison = strategyEvaluationService.getEmpiricalBacktestComparison(horizon);

    return NextResponse.json({
      success: true,
      data: comparison,
      timestamp: Date.now(),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate backtest comparison' },
      { status: 500 }
    );
  }
}
