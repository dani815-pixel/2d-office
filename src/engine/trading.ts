import type { CoinId, MarketSnapshot, Position, TradeSide, TradingMode } from "../types";

export const INITIAL_TRADING_BALANCE = 100_000;

export function positionPnl(position: Position, currentPrice: number): number {
  const delta = position.side === "LONG" ? currentPrice - position.entryPrice : position.entryPrice - currentPrice;
  return delta * position.quantity;
}

export function positionRoi(position: Position, currentPrice: number): number {
  const pnl = positionPnl(position, currentPrice);
  const base = position.margin || (position.entryPrice * position.quantity) / Math.max(position.leverage, 1);
  return base > 0 ? (pnl / base) * 100 : 0;
}

export function updatePositions(positions: Position[], market: MarketSnapshot): Position[] {
  return positions.map((position) => {
    const coin = market.coins.find((item) => item.id === position.coin);
    if (!coin) return position;
    return { ...position, currentPrice: coin.price, unrealizedPnl: positionPnl(position, coin.price), roi: positionRoi(position, coin.price) };
  });
}

export function canOpenPosition(mode: TradingMode, side: TradeSide, settings: { allowLong: boolean; allowShort: boolean }): boolean {
  if (side === "LONG" && !settings.allowLong) return false;
  if (side === "SHORT" && mode === "SPOT") return false;
  return side === "LONG" ? settings.allowLong : settings.allowShort;
}

export function marketPrice(market: MarketSnapshot, coin: CoinId): number | null {
  return market.coins.find((item) => item.id === coin)?.price ?? null;
}
