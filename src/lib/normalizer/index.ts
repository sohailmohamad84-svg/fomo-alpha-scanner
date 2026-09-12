import { FomoTrade, NormalizedTrade } from '../fomo/types';

export function normalizeNetwork(networkOrChainId?: string | number): string {
  if (!networkOrChainId) return 'solana';
  if (typeof networkOrChainId === 'number') {
    switch (networkOrChainId) {
      case 4663:
        return 'robinhood';
      case 1399811149:
        return 'solana';
      case 8453:
        return 'base';
      case 56:
        return 'bsc';
      case 1:
        return 'ethereum';
      case 1337:
        return 'hyperliquid';
      default:
        return `chain_${networkOrChainId}`;
    }
  }

  const str = networkOrChainId.toLowerCase().trim();
  if (str === 'sol' || str === 'solana') return 'solana';
  if (str === 'rh' || str === 'hood' || str === 'robinhood') return 'robinhood';
  if (str === 'base') return 'base';
  if (str === 'bsc' || str === 'bnb') return 'bsc';
  if (str === 'eth' || str === 'ethereum') return 'ethereum';
  if (str === 'hyperliquid' || str === 'hype' || str === 'hl') return 'hyperliquid';
  return str;
}

export function formatAddressForNetwork(address: string, network: string): string {
  if (!address) return '';
  const net = normalizeNetwork(network);
  if (net === 'solana') {
    return address.trim(); // Solana is case-sensitive base58
  }
  return address.trim().toLowerCase(); // EVM is case-insensitive hex
}

export function createUniversalTokenId(network: string, address: string): string {
  const normNet = normalizeNetwork(network).toUpperCase();
  const normAddr = formatAddressForNetwork(address, network);
  return `${normNet}:${normAddr}`;
}

export function parseUniversalTokenId(universalId: string): { network: string; address: string } {
  const parts = universalId.split(':');
  if (parts.length < 2) {
    return { network: 'solana', address: universalId };
  }
  return {
    network: parts[0].toLowerCase(),
    address: parts.slice(1).join(':'),
  };
}

export function normalizeTrade(
  raw: FomoTrade,
  traderHandle: string,
  tokenMetadata?: { symbol?: string; name?: string; network?: string }
): NormalizedTrade {
  const network = normalizeNetwork(raw.chain || raw.chainId || tokenMetadata?.network || 'solana');
  const address = formatAddressForNetwork(raw.token?.address || '', network);
  const symbol = (raw.token?.symbol || tokenMetadata?.symbol || 'UNKNOWN').toUpperCase();
  const name = tokenMetadata?.name || symbol;
  const universalId = createUniversalTokenId(network, address);

  const rawSide = (raw.side || (raw.status === 'open' ? 'buy' : 'sell')).toUpperCase();
  const side: 'BUY' | 'SELL' = rawSide === 'BUY' ? 'BUY' : 'SELL';

  let timestamp = new Date();
  if (raw.ts) {
    timestamp = typeof raw.ts === 'number' ? new Date(raw.ts) : new Date(raw.ts);
  } else if (raw.createdAt) {
    timestamp = new Date(raw.createdAt);
  }

  const priceUsd = raw.avgEntryPrice || raw.avgExitPrice || 0;
  const amount = raw.amount || 0;
  const valueUsd = raw.sizeUsd || amount * priceUsd || 0;

  return {
    tradeId: raw.tradeId || `tr_${traderHandle}_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    traderHandle: traderHandle.replace(/^@/, ''),
    tokenAddress: address,
    network,
    universalId,
    symbol,
    name,
    side,
    amount,
    priceUsd,
    valueUsd,
    realizedPnlUsd: raw.realizedPnlUsd,
    unrealizedPnlUsd: raw.unrealizedPnlUsd,
    timestamp,
    source: raw.source || 'feed',
    isDev: !!raw.isDev,
  };
}
