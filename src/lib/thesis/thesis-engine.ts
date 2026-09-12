import { ThesisItem, ThesisNovelty } from '../types/intelligence';

export interface RawThesisInput {
  id?: string;
  tokenAddress: string;
  network: string;
  symbol: string;
  traderHandle: string;
  content: string;
  positionSizeUsd?: number;
  traderEquityUsd?: number;
  timestamp?: Date | string | number;
}

export class ThesisEngine {
  private knownNarrativeThemes: string[] = [
    'robinhood chain',
    'gaming',
    'ai agent',
    'first mover',
    'cult meme',
    'ecosystem token',
    'dex volume',
    'cto',
    'community takeover',
    'deflationary',
  ];

  public evaluateThesis(input: RawThesisInput): ThesisItem {
    const content = input.content || '';
    const lower = content.toLowerCase();

    // 1. Evaluate Specificity & Evidence (0 - 30 pts)
    let specificityScore = 10;
    if (content.length > 80) specificityScore += 5;
    if (content.length > 200) specificityScore += 5;
    if (/\d+%|\$\d+|market cap|liquidity|holder|burn/i.test(content)) {
      specificityScore += 10;
    }

    // 2. Evaluate Catalyst (0 - 25 pts)
    let catalyst = 'Community sentiment';
    let catalystScore = 5;
    if (/launch|listing|mainnet|bridge|partnership|airdrop|upgrade|v2|announcement/i.test(content)) {
      catalyst = 'Upcoming event or protocol milestone';
      catalystScore = 25;
    } else if (/first mover|unique|novel|original/i.test(content)) {
      catalyst = 'First-mover positional edge';
      catalystScore = 20;
    }

    // 3. Time Horizon (0 - 15 pts)
    let horizon = 'Swing (1-3 days)';
    let horizonScore = 10;
    if (/scalp|quick|intraday|flip/i.test(content)) {
      horizon = 'Scalp (< 24 hours)';
      horizonScore = 12;
    } else if (/long term|hold|conviction|weeks|months|bag/i.test(content)) {
      horizon = 'Long-hold (> 1 week)';
      horizonScore = 15;
    }

    // 4. Actionability & Conviction vs Position Size (0 - 30 pts)
    const positionSizeUsd = input.positionSizeUsd || 2500;
    const traderEquityUsd = input.traderEquityUsd || 25000;
    const convictionRatio = traderEquityUsd > 0 ? positionSizeUsd / traderEquityUsd : 0.1;

    let convictionScore = 15;
    if (convictionRatio >= 0.15) convictionScore = 30; // >= 15% of portfolio
    else if (convictionRatio >= 0.08) convictionScore = 22;
    else if (convictionRatio < 0.02) convictionScore = 8; // Small flyer

    const qualityScore = Math.min(100, specificityScore + catalystScore + horizonScore + convictionScore);

    // 5. Determine Novelty
    let novelty: ThesisNovelty = 'generic';
    if (/lfg|to the moon|send it|pump it|wagmi/i.test(content) && content.length < 50) {
      novelty = 'generic';
    } else if (/first ever|brand new|first mover|unprecedented|pioneering/i.test(content)) {
      novelty = 'new';
    } else if (this.knownNarrativeThemes.some((t) => lower.includes(t))) {
      novelty = 'existing';
    } else {
      novelty = 'recycled';
    }

    const actionable = qualityScore >= 55 && novelty !== 'generic';

    return {
      id: input.id || 'th_' + Math.random().toString(36).substring(2, 9),
      tokenAddress: input.tokenAddress,
      network: input.network,
      symbol: input.symbol,
      traderHandle: input.traderHandle,
      content,
      catalyst,
      horizon,
      actionable,
      novelty,
      qualityScore,
      positionSizeUsd,
      traderEquityUsd,
      convictionRatio: parseFloat(convictionRatio.toFixed(3)),
      timestamp: input.timestamp ? new Date(input.timestamp) : new Date(),
    };
  }
}

export const thesisEngine = new ThesisEngine();
