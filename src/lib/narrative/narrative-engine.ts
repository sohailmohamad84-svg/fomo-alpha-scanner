import { NarrativeCluster, ThesisItem } from '../types/intelligence';

export interface NarrativeWeights {
  traderQuality: number;     // 0.30
  copySignalQuality: number; // 0.20
  thesisQuality: number;     // 0.20
  consensus: number;         // 0.15
  positionConviction: number;// 0.10
  freshness: number;         // 0.05
}

export const DEFAULT_NARRATIVE_WEIGHTS: NarrativeWeights = {
  traderQuality: 0.30,
  copySignalQuality: 0.20,
  thesisQuality: 0.20,
  consensus: 0.15,
  positionConviction: 0.10,
  freshness: 0.05,
};

export class NarrativeEngine {
  private weights: NarrativeWeights;
  private knownClusters: Map<string, NarrativeCluster> = new Map();

  constructor(weights: Partial<NarrativeWeights> = {}) {
    this.weights = { ...DEFAULT_NARRATIVE_WEIGHTS, ...weights };
  }

  public setWeights(weights: Partial<NarrativeWeights>) {
    this.weights = { ...this.weights, ...weights };
  }

  public getWeights(): NarrativeWeights {
    return { ...this.weights };
  }

  /**
   * Groups a list of theses into semantic narrative clusters and scores them
   */
  public clusterTheses(
    theses: ThesisItem[],
    traderScores: Map<string, { score: number; copyScore?: number }>
  ): NarrativeCluster[] {
    const clusterMap = new Map<string, ThesisItem[]>();

    // Keyword & thematic rule grouping
    for (const th of theses) {
      const lower = th.content.toLowerCase();
      let themeKey = 'General Ecosystem';

      if (lower.includes('gaming') || lower.includes('game') || lower.includes('arcade')) {
        themeKey = 'Gaming Ecosystem';
      } else if (lower.includes('robinhood') || lower.includes('rh chain') || lower.includes('4663')) {
        themeKey = 'Robinhood Chain First-Movers';
      } else if (lower.includes('ai') || lower.includes('agent') || lower.includes('autonomous')) {
        themeKey = 'Autonomous AI Agents';
      } else if (lower.includes('cult') || lower.includes('community takeover') || lower.includes('cto')) {
        themeKey = 'Community Takeover (CTO)';
      } else if (lower.includes('defi') || lower.includes('yield') || lower.includes('dex')) {
        themeKey = 'DeFi Liquidity Infra';
      } else if (lower.includes('dog') || lower.includes('cat') || lower.includes('mascot')) {
        themeKey = 'Viral Mascot Memes';
      }

      if (!clusterMap.has(themeKey)) {
        clusterMap.set(themeKey, []);
      }
      clusterMap.get(themeKey)!.push(th);
    }

    const results: NarrativeCluster[] = [];

    for (const [theme, items] of clusterMap.entries()) {
      const uniqueTokens = Array.from(new Set(items.map((i) => i.tokenAddress)));
      const uniqueSymbols = Array.from(new Set(items.map((i) => i.symbol)));
      const uniqueTraders = Array.from(new Set(items.map((i) => i.traderHandle)));

      // Count elite traders (score >= 70)
      const eliteTraders = uniqueTraders.filter((handle) => {
        const t = traderScores.get(handle);
        return (t?.score || 50) >= 70;
      });

      // Compute weighted components
      const avgTraderQuality =
        uniqueTraders.reduce((acc, h) => acc + (traderScores.get(h)?.score || 50), 0) /
        Math.max(1, uniqueTraders.length);

      const avgCopyScore =
        uniqueTraders.reduce((acc, h) => acc + (traderScores.get(h)?.copyScore || 50), 0) /
        Math.max(1, uniqueTraders.length);

      const avgThesisQuality =
        items.reduce((acc, i) => acc + i.qualityScore, 0) / Math.max(1, items.length);

      const consensus = Math.min(100, uniqueTraders.length * 20 + eliteTraders.length * 15);
      const avgConviction =
        Math.min(100, (items.reduce((acc, i) => acc + i.convictionRatio, 0) / items.length) * 500);

      // Freshness: minutes since earliest/latest
      const timestamps = items.map((i) => i.timestamp.getTime());
      const minTime = Math.min(...timestamps);
      const maxTime = Math.max(...timestamps);
      const spanMinutes = (maxTime - minTime) / 60000;
      const freshness = Math.max(20, 100 - spanMinutes * 0.5);

      const narrativeScore = Math.min(
        100,
        Math.round(
          this.weights.traderQuality * avgTraderQuality +
          this.weights.copySignalQuality * avgCopyScore +
          this.weights.thesisQuality * avgThesisQuality +
          this.weights.consensus * consensus +
          this.weights.positionConviction * avgConviction +
          this.weights.freshness * freshness
        )
      );

      const acceleration =
        uniqueTraders.length >= 4 || (eliteTraders.length >= 2 && spanMinutes <= 30)
          ? 'HIGH'
          : uniqueTraders.length >= 2
          ? 'MEDIUM'
          : 'LOW';

      results.push({
        id: 'narr_' + theme.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        name: theme,
        theme,
        tokenAddresses: uniqueTokens,
        symbols: uniqueSymbols,
        traderHandles: uniqueTraders,
        eliteTraderCount: eliteTraders.length,
        totalThesesCount: items.length,
        narrativeScore,
        acceleration,
        firstDetected: new Date(minTime),
        avgPriceReactionPct: Math.round(5 + narrativeScore * 0.15),
        topTheses: items.slice(0, 3),
      });
    }

    return results.sort((a, b) => b.narrativeScore - a.narrativeScore);
  }
}

export const narrativeEngine = new NarrativeEngine();
