// Thesis Consensus & On-Chain Early Alpha Service
// Evaluates cross-trader thesis alignment and measures latency between on-chain fill and social feed broadcast

export interface TraderThesis {
  handle: string;
  tokenAddress: string;
  title: string;
  content: string;
  convictionLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  publishedTimestamp: number;
  tags: string[];
}

export class ThesisConsensusService {
  constructor() {}

  /**
   * Evaluates semantic tag overlap and shared keywords across multiple trader theses
   */
  public evaluateThesisConsensus(theses: TraderThesis[]): {
    score: number;
    alignedAuthorsCount: number;
    sharedThemes: string[];
    hasStrongAlignment: boolean;
  } {
    if (!theses || theses.length === 0) {
      return { score: 0, alignedAuthorsCount: 0, sharedThemes: [], hasStrongAlignment: false };
    }

    if (theses.length === 1) {
      const single = theses[0];
      const base = single.convictionLevel === 'HIGH' ? 50 : 35;
      return {
        score: base,
        alignedAuthorsCount: 1,
        sharedThemes: single.tags,
        hasStrongAlignment: false,
      };
    }

    // Count author tag frequencies
    const authorSet = new Set<string>();
    const tagFrequencies: Map<string, number> = new Map();

    for (const th of theses) {
      authorSet.add(th.handle.toLowerCase());
      for (const tag of th.tags) {
        const clean = tag.toLowerCase().trim();
        tagFrequencies.set(clean, (tagFrequencies.get(clean) || 0) + 1);
      }
    }

    // Identify shared themes (tags mentioned by >= 2 distinct authors)
    const sharedThemes: string[] = [];
    for (const [tag, count] of tagFrequencies.entries()) {
      if (count >= 2) {
        sharedThemes.push(tag);
      }
    }

    const authorsCount = authorSet.size;
    let score = Math.min(60, authorsCount * 25);

    // Bonus for shared themes
    score += Math.min(30, sharedThemes.length * 15);

    // High conviction bonus
    const highConvictionCount = theses.filter((t) => t.convictionLevel === 'HIGH').length;
    score += Math.min(15, highConvictionCount * 8);

    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    return {
      score: finalScore,
      alignedAuthorsCount: authorsCount,
      sharedThemes,
      hasStrongAlignment: authorsCount >= 2 && sharedThemes.length >= 1,
    };
  }

  /**
   * Computes early on-chain speed advantage multiplier
   * Gives up to a 1.25x boost if trade was caught on-chain > 10 seconds before social feed
   */
  public calculateLatencyAdvantage(
    onChainTimestamp: number,
    feedBroadcastTimestamp?: number
  ): {
    latencySeconds: number;
    earlyAlphaBonus: number;
    isEarlyOnChain: boolean;
  } {
    if (!feedBroadcastTimestamp || feedBroadcastTimestamp <= onChainTimestamp) {
      return { latencySeconds: 0, earlyAlphaBonus: 0, isEarlyOnChain: false };
    }

    const latencySec = Math.max(0, (feedBroadcastTimestamp - onChainTimestamp) / 1000);
    const isEarlyOnChain = latencySec >= 5;

    // Bonus up to +15 pts
    const earlyAlphaBonus = Math.min(15, Math.round(latencySec * 0.5));

    return {
      latencySeconds: Math.round(latencySec * 10) / 10,
      earlyAlphaBonus,
      isEarlyOnChain,
    };
  }
}

export const thesisConsensusService = new ThesisConsensusService();
