import type { CoinId, MarketSnapshot, Position, Trade, TradeSide, TradingMode, TraderSettings } from "../types";

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

export function canOpenPosition(mode: TradingMode, side: TradeSide, settings: Pick<TraderSettings, "allowLong" | "allowShort">): boolean {
  if (side === "LONG" && !settings.allowLong) return false;
  if (side === "SHORT" && mode === "SPOT") return false;
  return side === "LONG" ? settings.allowLong : settings.allowShort;
}

export function marketPrice(market: MarketSnapshot, coin: CoinId): number | null {
  return market.coins.find((item) => item.id === coin)?.price ?? null;
}

export function requiredMargin(mode: TradingMode, price: number, quantity: number, leverage: number): number {
  const notional = price * quantity;
  return mode === "SPOT" ? notional : notional / Math.max(leverage, 1);
}

export function openSimulatedPosition(balance: number, market: MarketSnapshot, coin: CoinId, mode: TradingMode, side: TradeSide, quantity: number, leverage: number, traderId: string, settings: Pick<TraderSettings, "allowLong" | "allowShort" | "stopLossPercent" | "takeProfitPercent">): { balance: number; position?: Position; error?: string } {
  const price = marketPrice(market, coin);
  if (!price || quantity <= 0) return { balance, error: "유효한 현재 가격과 수량이 필요합니다." };
  if (!canOpenPosition(mode, side, settings)) return { balance, error: "현재 트레이더 설정에서 허용되지 않는 포지션입니다." };
  const margin = requiredMargin(mode, price, quantity, leverage);
  if (margin > balance) return { balance, error: "가상 계좌 잔액이 부족합니다." };
  const stopLoss = settings.stopLossPercent ? price * (side === "LONG" ? 1 - settings.stopLossPercent / 100 : 1 + settings.stopLossPercent / 100) : undefined;
  const takeProfit = settings.takeProfitPercent ? price * (side === "LONG" ? 1 + settings.takeProfitPercent / 100 : 1 - settings.takeProfitPercent / 100) : undefined;
  const position: Position = { id: "pos-" + Date.now() + "-" + coin, coin, mode, side, quantity, entryPrice: price, currentPrice: price, leverage: Math.max(leverage, 1), margin, stopLoss, takeProfit, unrealizedPnl: 0, roi: 0, openedAt: new Date().toISOString(), traderId };
  return { balance: balance - margin, position };
}

export function closeSimulatedPosition(position: Position, exitPrice: number, reason: Trade["closeReason"] = "MANUAL"): { balanceDelta: number; trade: Trade } {
  const pnl = positionPnl(position, exitPrice);
  return { balanceDelta: (position.margin || 0) + pnl, trade: { id: "trade-" + Date.now() + "-" + position.coin, coin: position.coin, mode: position.mode, side: position.side, quantity: position.quantity, leverage: position.leverage, entryPrice: position.entryPrice, exitPrice, pnl, roi: position.margin ? (pnl / position.margin) * 100 : 0, openedAt: position.openedAt, closedAt: new Date().toISOString(), closeReason: reason, traderId: position.traderId, scenarioId: position.scenarioId } };
}