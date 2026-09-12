export interface TelegramAlertPayload {
  tokenSymbol: string;
  tokenAddress: string;
  network: string;
  smartMoneyScore: number;
  conviction: string;
  tradersCount: number;
  topTraderHandle: string;
  topTraderScore: number;
  totalBuyVolumeUsd: number;
  firstBuyTimeFormatted: string;
  latestBuyTimeFormatted: string;
  priceUsd: number;
  change24h: number;
  reason: string;
}

export class TelegramDispatcher {
  private botToken: string;
  private chatId: string;
  private enabled: boolean;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.chatId = process.env.TELEGRAM_CHAT_ID || '';
    this.enabled = process.env.TELEGRAM_ENABLED === 'true';
  }

  public updateConfig(botToken: string, chatId: string, enabled: boolean) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.enabled = enabled;
  }

  public isConfigured(): boolean {
    return !!this.botToken && !!this.chatId;
  }

  public async sendSignalAlert(payload: TelegramAlertPayload): Promise<{ success: boolean; message?: string }> {
    if (!this.enabled || !this.isConfigured()) {
      return { success: false, message: 'Telegram dispatch is not enabled or credentials not configured' };
    }

    const text = `
🔥 *HIGH-CONVICTION SIGNAL*
*TOKEN:* $${payload.tokenSymbol} (${payload.network.toUpperCase()})
*Smart Money Score:* ${payload.smartMoneyScore}/100
*Conviction:* ${payload.conviction.toUpperCase()}
*Smart Traders Buying:* ${payload.tradersCount}
*Top Trader:* @${payload.topTraderHandle} (Score: ${payload.topTraderScore})
*Buy Volume:* $${payload.totalBuyVolumeUsd.toLocaleString()}
*First Smart Money Buy:* ${payload.firstBuyTimeFormatted}
*Latest Buy:* ${payload.latestBuyTimeFormatted}
*Price:* $${payload.priceUsd}
*24H:* ${payload.change24h >= 0 ? '+' : ''}${payload.change24h}%

*Reason:* ${payload.reason}
Contract: \`${payload.tokenAddress}\`
`.trim();

    try {
      const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: 'Markdown',
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        return { success: false, message: errorText };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  }
}

export const telegramDispatcher = new TelegramDispatcher();
