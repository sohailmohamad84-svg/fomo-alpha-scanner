import { DualStreamMetrics } from '../types/intelligence';

export interface StreamEventRecord {
  id: string;
  source: 'onchain' | 'feed';
  tokenAddress: string;
  network: string;
  txHash?: string;
  traderHandle?: string;
  valueUsd?: number;
  timestamp: Date;
}

export class DualStreamManager {
  private onChainEvents = new Map<string, StreamEventRecord>(); // key: network:tokenAddress:trader
  private latencySamples: number[] = []; // measured seconds difference

  public registerOnChainEvent(event: Omit<StreamEventRecord, 'source'>) {
    const key = `${event.network}:${event.tokenAddress}:${event.traderHandle || 'anon'}`.toLowerCase();
    this.onChainEvents.set(key, { ...event, source: 'onchain' });

    // Prune cache after 1000 items
    if (this.onChainEvents.size > 1000) {
      const firstKey = this.onChainEvents.keys().next().value;
      if (firstKey) this.onChainEvents.delete(firstKey);
    }
  }

  public registerFeedEvent(event: Omit<StreamEventRecord, 'source'>): DualStreamMetrics {
    const key = `${event.network}:${event.tokenAddress}:${event.traderHandle || 'anon'}`.toLowerCase();
    const onChainMatch = this.onChainEvents.get(key);

    const feedTime = event.timestamp ? new Date(event.timestamp) : new Date();

    if (onChainMatch) {
      const diffMs = feedTime.getTime() - onChainMatch.timestamp.getTime();
      const diffSec = Math.max(0, parseFloat((diffMs / 1000).toFixed(1)));
      this.latencySamples.push(diffSec);
      if (this.latencySamples.length > 100) this.latencySamples.shift();

      return {
        tokenAddress: event.tokenAddress,
        network: event.network,
        onChainTimestamp: onChainMatch.timestamp,
        feedTimestamp: feedTime,
        latencyDifferenceMs: diffMs,
        observedLatencySec: diffSec,
        crowdDeltaSec: diffSec,
        isEarlyAlpha: diffSec >= 3.0,
        confidence: Math.min(100, 60 + Math.round(diffSec * 2)),
      };
    }

    // Default proxy when on-chain counterpart was not indexed
    const avgObserved = this.getAverageLatencySec();
    return {
      tokenAddress: event.tokenAddress,
      network: event.network,
      onChainTimestamp: null,
      feedTimestamp: feedTime,
      latencyDifferenceMs: null,
      observedLatencySec: avgObserved,
      crowdDeltaSec: avgObserved,
      isEarlyAlpha: false,
      confidence: 50,
    };
  }

  public getAverageLatencySec(): number {
    if (this.latencySamples.length === 0) return 14.8; // Default empirical baseline
    return parseFloat(
      (this.latencySamples.reduce((a, b) => a + b, 0) / this.latencySamples.length).toFixed(1)
    );
  }

  public getStatus() {
    return {
      trackedOnChainCount: this.onChainEvents.size,
      samplesCount: this.latencySamples.length,
      averageLatencySec: this.getAverageLatencySec(),
    };
  }
}

export const dualStreamManager = new DualStreamManager();
