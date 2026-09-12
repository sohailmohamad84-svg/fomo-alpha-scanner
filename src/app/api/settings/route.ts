import { NextRequest, NextResponse } from 'next/server';
import { traderScorer, DEFAULT_TRADER_WEIGHTS, DEFAULT_UNIVERSE_CONFIG } from '@/lib/scoring/trader-scorer';
import { smartMoneyEngine, DEFAULT_SCORING_WEIGHTS } from '@/lib/scoring/smart-money-engine';
import { paperTradingEngine, DEFAULT_PAPER_CONFIG } from '@/lib/simulator/paper-trading';
import { telegramDispatcher } from '@/lib/alerts/telegram';
import { fomoClient } from '@/lib/fomo/client';

export const dynamic = 'force-dynamic';

// In-memory runtime settings cache
let currentSettings = {
  fomoApiKey: process.env.FOMO_API_KEY ? '••••••••••••••••' : '',
  traderWeights: traderScorer.getWeights(),
  universeConfig: DEFAULT_UNIVERSE_CONFIG,
  scoringWeights: smartMoneyEngine.getWeights(),
  paperConfig: paperTradingEngine.getConfig(),
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    botTokenConfigured: !!process.env.TELEGRAM_BOT_TOKEN,
    chatIdConfigured: !!process.env.TELEGRAM_CHAT_ID,
  },
  executionMode: process.env.EXECUTION_MODE || 'PAPER',
};

export async function GET() {
  return NextResponse.json({
    settings: {
      ...currentSettings,
      traderWeights: traderScorer.getWeights(),
      scoringWeights: smartMoneyEngine.getWeights(),
      paperConfig: paperTradingEngine.getConfig(),
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.fomoApiKey !== undefined && body.fomoApiKey !== '••••••••••••••••') {
      fomoClient.setApiKey(body.fomoApiKey);
      currentSettings.fomoApiKey = body.fomoApiKey ? '••••••••••••••••' : '';
    }

    if (body.traderWeights) {
      traderScorer.setWeights(body.traderWeights);
      currentSettings.traderWeights = traderScorer.getWeights();
    }

    if (body.scoringWeights) {
      smartMoneyEngine.setWeights(body.scoringWeights);
      currentSettings.scoringWeights = smartMoneyEngine.getWeights();
    }

    if (body.paperConfig) {
      paperTradingEngine.setConfig(body.paperConfig);
      currentSettings.paperConfig = paperTradingEngine.getConfig();
    }

    if (body.telegram) {
      telegramDispatcher.updateConfig(
        body.telegram.botToken || '',
        body.telegram.chatId || '',
        !!body.telegram.enabled
      );
      currentSettings.telegram = {
        enabled: !!body.telegram.enabled,
        botTokenConfigured: !!body.telegram.botToken,
        chatIdConfigured: !!body.telegram.chatId,
      };
    }

    if (body.executionMode) {
      currentSettings.executionMode = body.executionMode;
    }

    return NextResponse.json({
      success: true,
      settings: currentSettings,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
