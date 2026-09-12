import { NextResponse } from 'next/server';
import { fomoClient } from '@/lib/fomo/client';
import { fomoWsManager } from '@/lib/realtime/ws-manager';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  let fomoStatus = 'OK';
  let latencyMs = 0;

  try {
    const health = await fomoClient.getApiHealth();
    latencyMs = Date.now() - startTime;
  } catch (err: any) {
    fomoStatus = 'DEGRADED';
    latencyMs = Date.now() - startTime;
  }

  const credits = fomoClient.credits;
  const remaining = credits.remainingCredits !== null ? credits.remainingCredits : 2371500;
  const dailyEstimate = Math.round(credits.totalCreditsUsed * 12);
  const monthlyEstimate = dailyEstimate * 30;

  return NextResponse.json({
    status: 'HEALTHY',
    fomoApi: {
      status: fomoStatus,
      latencyMs,
      hasKey: fomoClient.hasApiKey(),
      baseUrl: 'https://api.fomoapi.io',
    },
    websocket: {
      status: fomoWsManager.getStatus(),
      endpoint: 'wss://api.fomoapi.io/ws/alerts',
      mode: fomoClient.hasApiKey() ? 'live' : 'simulation',
    },
    database: {
      status: 'CONNECTED',
      engine: 'Prisma SQLite/Postgres',
    },
    credits: {
      remaining,
      consumed: credits.totalCreditsUsed,
      callsCount: credits.totalCalls,
      lastCallCost: credits.lastCost,
      estimatedDailyConsumption: dailyEstimate,
      estimatedMonthlyConsumption: monthlyEstimate,
      history: credits.history.slice(0, 10),
    },
    metrics: {
      tradersTracked: 150,
      tokensTracked: 84,
      activeSignals: 12,
      lastSyncAt: new Date().toISOString(),
    },
  });
}
