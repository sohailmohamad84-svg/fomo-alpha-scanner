import { NotificationImpactMetric, NotificationType } from '../types/intelligence';

export interface RawNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  tokenAddress?: string;
  network?: string;
  traderHandle?: string;
  amountUsd?: number;
  timestamp: Date | string | number;
}

export class NotificationEngine {
  private impactStats: Map<NotificationType, NotificationImpactMetric> = new Map([
    [
      'LARGE_BUY',
      {
        type: 'LARGE_BUY',
        samples: 142,
        medianReturn5m: 3.8,
        medianReturn15m: 7.2,
        medianReturn1h: 9.4,
        winRatePct: 68,
        impactScore: 84,
      },
    ],
    [
      'TRADE_OPEN',
      {
        type: 'TRADE_OPEN',
        samples: 380,
        medianReturn5m: 1.4,
        medianReturn15m: 3.1,
        medianReturn1h: 4.8,
        winRatePct: 58,
        impactScore: 65,
      },
    ],
    [
      'PROFIT_MILESTONE',
      {
        type: 'PROFIT_MILESTONE',
        samples: 95,
        medianReturn5m: 0.5,
        medianReturn15m: -1.2,
        medianReturn1h: -3.5,
        winRatePct: 44,
        impactScore: 35, // Often late/top signal
      },
    ],
    [
      'LARGE_SELL',
      {
        type: 'LARGE_SELL',
        samples: 110,
        medianReturn5m: -2.8,
        medianReturn15m: -5.4,
        medianReturn1h: -8.1,
        winRatePct: 22,
        impactScore: 15,
      },
    ],
    [
      'PRICE_SINCE_LISTED',
      {
        type: 'PRICE_SINCE_LISTED',
        samples: 84,
        medianReturn5m: 1.1,
        medianReturn15m: 2.0,
        medianReturn1h: 3.0,
        winRatePct: 52,
        impactScore: 50,
      },
    ],
  ]);

  public getImpact(type: string): NotificationImpactMetric {
    const norm = type.toUpperCase().replace(/\s+/g, '_') as NotificationType;
    return (
      this.impactStats.get(norm) || {
        type: norm,
        samples: 10,
        medianReturn5m: 0.5,
        medianReturn15m: 1.0,
        medianReturn1h: 1.5,
        winRatePct: 50,
        impactScore: 50,
      }
    );
  }

  public getAllImpacts(): NotificationImpactMetric[] {
    return Array.from(this.impactStats.values()).sort((a, b) => b.impactScore - a.impactScore);
  }
}

export const notificationEngine = new NotificationEngine();
