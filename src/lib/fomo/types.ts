// Types accurately mapped to FOMO OpenAPI 3.1 Specification

export type TimeWindow = '24h' | '7d' | '30d' | 'all';

export type ChainName = 'solana' | 'robinhood' | 'base' | 'bsc' | 'ethereum' | 'hyperliquid' | string;

export interface FomoWallets {
  solana?: string | null;
  evm?: string | null;
  status?: string;
}

export interface FomoLeaderboardTrader {
  rank: number;
  handle: string;
  displayName: string;
  pnlUsd: number;
  volumeUsd: number;
  trades: number;
  followers: number;
  holdings: number;
  wallets: FomoWallets;
  topTokens?: string[];
  verified: boolean;
}

export interface FomoLeaderboardResponse {
  window: TimeWindow;
  source: string;
  capturedAt: string;
  count: number;
  traders: FomoLeaderboardTrader[];
}

export interface FomoTokenRef {
  name: string;
  symbol: string;
  address: string;
}

export interface FomoTokenBoardItem {
  rank: number;
  image?: string;
  token: FomoTokenRef;
  holders: number;
  network: string;
  priceUsd: number;
  change24h: number;
  marketCapUsd: number;
  volume24hUsd: number;
  fomoBuyers: number;
}

export interface FomoTokenBoardResponse {
  board: string;
  capturedAt: string;
  count: number;
  tokens: FomoTokenBoardItem[];
  available?: boolean;
}

export interface FomoTraderProfile {
  handle: string;
  displayName: string;
  verified: boolean;
  wallets: FomoWallets;
  pnlUsd: number;
  pnl: {
    '24h'?: number;
    '7d'?: number;
    '30d'?: number;
    all?: number;
  };
  volumeUsd: number;
  trades: number;
  followers: number;
  following?: number;
  fomoCreatedAt?: string;
  accountAgeDays?: number;
  averageHoldTimeSeconds?: number;
  holdings?: any[];
  topTokens?: string[];
  clan?: {
    id?: string;
    name?: string;
    icon?: string;
    role?: string;
  } | null;
  description?: string;
  profilePictureLink?: string;
}

export interface FomoTrade {
  tradeId?: string;
  token: {
    symbol: string;
    address: string;
  };
  side?: 'buy' | 'sell';
  status?: 'open' | 'closed';
  amount?: number;
  sizeUsd?: number;
  avgEntryPrice?: number;
  avgExitPrice?: number;
  realizedPnlUsd?: number;
  unrealizedPnlUsd?: number;
  chainId?: number;
  chain?: string;
  ts?: number | string;
  createdAt?: string;
  closedAt?: string | null;
  source?: string; // 'captured' | 'feed'
  isDev?: boolean;
}

export interface FomoTradesResponse {
  key?: string;
  kind?: string;
  count: number;
  trades: FomoTrade[];
  available?: boolean;
  closedTotalOnFomo?: number;
  partial?: boolean;
}

export interface FomoBalanceItem {
  token: {
    symbol: string;
    address: string;
    networkId?: number;
  };
  chain: string;
  amount: number;
  priceUsd: number;
  valueUsd: number;
  change24h: number;
}

export interface FomoBalancesResponse {
  holdings: FomoBalanceItem[];
  totalValueUsd: number;
  byChain?: Record<string, { holdings: number; valueUsd: number }>;
  available?: boolean;
}

export interface FomoFollowPerson {
  handle: string;
  displayName: string;
  userId?: string;
  avatar?: string;
  verified: boolean;
  clan?: any;
  bio?: string;
  followers: number;
  following: number;
  trades: number;
  swapCount?: number;
  volumeUsd: number;
  pnl24h: number;
  twitter?: string;
  private?: boolean;
  createdAt?: string;
  accountAgeDays?: number;
}

export interface FomoFollowResponse {
  handle: string;
  count: number;
  following?: FomoFollowPerson[];
  followers?: FomoFollowPerson[];
  truncated?: boolean;
  complete?: boolean;
  sourceCapped?: boolean;
}

export interface FomoSpotlightTrade {
  tradeId: string;
  token: { symbol: string; address: string };
  chain: string;
  avgEntryPrice: number;
  avgExitPrice?: number;
  realizedPnlUsd?: number;
  unrealizedPnlUsd?: number;
  thesis?: string;
  thesisLikes?: number;
  openedAt: string;
  closedAt?: string | null;
}

export interface FomoSpotlightResponse {
  handle: string;
  userId?: string;
  bestTrades: FomoSpotlightTrade[];
  bestTheses: FomoSpotlightTrade[];
}

export interface FomoTokenHolder {
  handle: string;
  amount: number;
  valueUsd: number;
  priceUsd: number;
}

export interface FomoTokenHoldersResponse {
  holders: FomoTokenHolder[];
  available?: boolean;
}

export interface FomoTokenStatsWindow {
  buys: number;
  sells: number;
  uniqueBuyers: number;
  uniqueSellers: number;
  buyVolumeUsd: number;
  sellVolumeUsd: number;
  netVolumeUsd: number;
  buySellRatio: number | null;
}

export interface FomoTokenStatsResponse {
  token: string;
  networkId?: number;
  chain: string;
  holders: number;
  top10HoldersPercent: number;
  windows: {
    '5m': FomoTokenStatsWindow;
    '1h': FomoTokenStatsWindow;
    '4h': FomoTokenStatsWindow;
    '24h': FomoTokenStatsWindow;
  };
}

export interface FomoTokenDevItem {
  handle: string;
  wallet?: FomoWallets | string;
  isDev: boolean;
  amount: number;
  valueUsd: number;
  costBasisUsd: number;
  realizedPnlUsd: number;
  unrealizedPnlUsd: number;
  averageEntryPrice: number;
  averageHoldTimeSeconds?: number;
  tradeId?: string;
  thesis?: string;
}

export interface FomoTokenDevsResponse {
  token: string;
  networkId?: number;
  chain: string;
  count: number;
  devs: FomoTokenDevItem[];
  note?: string;
}

export interface FomoWsAlertMessage {
  type: 'welcome' | 'alert' | 'subscribed' | 'unsubscribed';
  realtime?: boolean;
  delaySeconds?: number;
  alertType?: 'buy' | 'sell' | 'thesis' | 'whale' | 'price' | 'trade' | 'perp' | string;
  source?: 'feed' | 'push';
  trader?: string;
  token?: string;
  tokenAddress?: string;
  chainId?: number;
  chain?: string;
  usdValue?: number;
  amount?: number;
  price?: number;
  text?: string;
  ts?: number;
  id?: string;
}

export interface FomoMeResponse {
  tier?: string;
  plan?: string;
  credits?: {
    monthly: number;
    usedThisMonth: number;
    prepaid: number;
    remaining: number;
  };
  expiresAt?: string;
  streams?: {
    appFeed?: boolean;
    onChain?: boolean;
  };
}

export interface NormalizedTrade {
  tradeId: string;
  traderHandle: string;
  tokenAddress: string;
  network: string;
  universalId: string;
  symbol: string;
  name: string;
  side: 'BUY' | 'SELL';
  amount: number;
  priceUsd: number;
  valueUsd: number;
  realizedPnlUsd?: number;
  unrealizedPnlUsd?: number;
  timestamp: Date;
  source: string;
  isDev: boolean;
}
