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

export function checkExit(position: Position, price: number): Trade["closeReason"] | null {
  if (position.side === "LONG") {
    if (position.stopLoss !== undefined && price <= position.stopLoss) return "STOP_LOSS";
    if (position.takeProfit !== undefined && price >= position.takeProfit) return "TAKE_PROFIT";
  } else {
    if (position.stopLoss !== undefined && price >= position.stopLoss) return "STOP_LOSS";
    if (position.takeProfit !== undefined && price <= position.takeProfit) return "TAKE_PROFIT";
  }
  return null;
}

export function createTradeReview(trade: Trade): import("../types").TradeReview {
  const result = trade.pnl > 0 ? "WIN" : trade.pnl < 0 ? "LOSS" : "BREAKEVEN";
  const facts = [
    trade.coin + " " + trade.side,
    "진입 " + trade.entryPrice.toFixed(2) + " / 청산 " + trade.exitPrice.toFixed(2),
    "PnL " + trade.pnl.toFixed(2) + " USD",
    "청산 사유 " + trade.closeReason,
  ];
  const lesson = result === "WIN" ? "가설과 확인 조건이 실제 가격 흐름과 맞았는지 기록한다." : result === "LOSS" ? "무효화 조건과 진입 확인이 충분했는지 다시 검토한다." : "가격이 움직이지 않은 이유와 대기 조건을 기록한다.";
  return {
    tradeId: trade.id, traderId: trade.traderId, result, facts,
    interpretation: [trade.closeReason === "TAKE_PROFIT" ? "설정한 목표 조건에 도달했다." : trade.closeReason === "STOP_LOSS" ? "설정한 무효화 조건에 도달했다." : "수동으로 포지션을 종료했다."],
    possibleCauses: ["결과만으로 원인을 확정하지 않고 가격·시장 맥락을 다음 회의에서 재검토한다."],
    lessons: [lesson],
    regret: result === "LOSS" ? "진입 전에 확인해야 할 조건이 충분했는지 되돌아본다." : undefined,
    improvement: result === "LOSS" ? "다음 거래에서 확인 조건 또는 리스크 크기를 조정한다." : "현재 확인 조건을 유지하되 반복 검증한다.",
    confidence: "LOW",
    createdAt: new Date().toISOString(),
  };
}

export function updateTraderMemory(memory: import("../types").TraderMemory | undefined, trade: Trade, review: import("../types").TradeReview): import("../types").TraderMemory {
  const base = memory || { traderId: trade.traderId, totalTrades: 0, wins: 0, losses: 0, repeatedMistakes: [], provenStrengths: [], currentLessons: [], strategyChanges: [], riskChanges: [], openQuestions: [] };
  const wins = base.wins + (review.result === "WIN" ? 1 : 0);
  const losses = base.losses + (review.result === "LOSS" ? 1 : 0);
  return {
    ...base,
    totalTrades: base.totalTrades + 1, wins, losses,
    currentLessons: [review.lessons[0], ...base.currentLessons].filter(Boolean).slice(0, 5),
    strategyChanges: review.result === "LOSS" ? ["진입 확인 조건 재검토", ...base.strategyChanges].slice(0, 5) : base.strategyChanges.slice(0, 5),
    riskChanges: review.result === "LOSS" ? ["다음 거래 리스크 크기 재검토", ...base.riskChanges].slice(0, 5) : base.riskChanges.slice(0, 5),
    lastReview: review,
  };
}