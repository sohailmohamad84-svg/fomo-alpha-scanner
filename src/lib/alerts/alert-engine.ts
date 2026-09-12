export interface AlertItem {
  id: string;
  type:
    | 'NEW_HIGH_CONVICTION_COIN'
    | 'MULTIPLE_SMART_TRADERS_BUY'
    | 'TOP_TRADER_BUYS'
    | 'SMART_MONEY_ACCUMULATION'
    | 'SMART_MONEY_SELLING'
    | 'SIGNAL_SCORE_SPIKE'
    | 'SIGNAL_SCORE_COLLAPSE'
    | 'TRADER_ENTERS_POSITION'
    | 'TRADER_EXITS_POSITION';
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'SUCCESS';
  title: string;
  message: string;
  tokenAddress?: string;
  network?: string;
  traderHandle?: string;
  score?: number;
  isRead: boolean;
  createdAt: Date;
}

export class AlertEngine {
  private alerts: AlertItem[] = [];

  constructor() {
    this.seedInitialAlerts();
  }

  private seedInitialAlerts() {
    this.alerts = [
      {
        id: 'al_1',
        type: 'SMART_MONEY_ACCUMULATION',
        severity: 'SUCCESS',
        title: '🔥 Smart Money Accumulation: $PONS',
        message: '4 top traders (@CryptoKaleo, @ansem, @theveeman, @murad) accumulated $65.5K within 18 minutes on Robinhood Chain.',
        tokenAddress: '0x39dbed3a2bd333467115de45665cc57f813c4571',
        network: 'robinhood',
        score: 92,
        isRead: false,
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
      },
      {
        id: 'al_2',
        type: 'TOP_TRADER_BUYS',
        severity: 'INFO',
        title: '⭐ Top Trader Buy: @ansem bought $SOLAI',
        message: '@ansem entered $SOLAI ($13.2K size) on Solana. Trader Quality Score: 88/100.',
        tokenAddress: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
        network: 'solana',
        traderHandle: 'ansem',
        score: 78,
        isRead: false,
        createdAt: new Date(Date.now() - 22 * 60 * 1000),
      },
      {
        id: 'al_3',
        type: 'SMART_MONEY_SELLING',
        severity: 'WARNING',
        title: '⚠ Exit Warning: Smart Money Offloading $VORTEX',
        message: 'Tracked traders begun closing positions on $VORTEX on BSC. Net smart money flow turned negative.',
        tokenAddress: '0x55bc328c6346294b2f15e839e5ec44ab217133',
        network: 'bsc',
        score: 34,
        isRead: true,
        createdAt: new Date(Date.now() - 50 * 60 * 1000),
      },
    ];
  }

  public getAlerts(limit: number = 50): AlertItem[] {
    return [...this.alerts]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  public createAlert(params: Omit<AlertItem, 'id' | 'isRead' | 'createdAt'>): AlertItem {
    const alert: AlertItem = {
      ...params,
      id: `al_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      isRead: false,
      createdAt: new Date(),
    };
    this.alerts.unshift(alert);
    if (this.alerts.length > 200) {
      this.alerts.pop();
    }
    return alert;
  }

  public markAsRead(id: string): boolean {
    const found = this.alerts.find((a) => a.id === id);
    if (found) {
      found.isRead = true;
      return true;
    }
    return false;
  }

  public markAllAsRead() {
    this.alerts.forEach((a) => (a.isRead = true));
  }
}

export const alertEngine = new AlertEngine();
