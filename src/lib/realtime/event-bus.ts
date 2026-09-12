import { EventEmitter } from 'events';
import { NormalizedTrade } from '../fomo/types';

export interface RealtimeMessage {
  type: 'trade' | 'signal_update' | 'alert' | 'status' | 'paper_trade';
  data: any;
  timestamp: number;
}

class AppEventBus extends EventEmitter {
  public broadcast(type: RealtimeMessage['type'], data: any) {
    const message: RealtimeMessage = {
      type,
      data,
      timestamp: Date.now(),
    };
    this.emit('realtime_event', message);
  }

  public onRealtimeEvent(listener: (msg: RealtimeMessage) => void) {
    this.on('realtime_event', listener);
  }

  public offRealtimeEvent(listener: (msg: RealtimeMessage) => void) {
    this.off('realtime_event', listener);
  }
}

// Global Singleton Event Bus
declare global {
  var __appEventBus: AppEventBus | undefined;
}

export const eventBus = global.__appEventBus || new AppEventBus();
if (process.env.NODE_ENV !== 'production') {
  global.__appEventBus = eventBus;
}
