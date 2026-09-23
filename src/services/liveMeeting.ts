import { type CoinId, type LiveMeetingSignal, type MarketSnapshot } from "../types";

const WINDOW_MS = 30_000;
const MIN_MOVE_PERCENT = 0.7;
const COOLDOWN_MS = 120_000;
const MAX_TRIGGERS = 5;
const MIN_CONFIRMATIONS = 3;
const MAX_POINTS = 31;

interface Point { time: number; prices: Record<CoinId, number>; }

export class LiveMeetingController {
  private points: Point[] = [];
  private lastTriggeredAt = 0;
  private lastTriggeredCoin: CoinId | null = null;
  private triggerCount = 0;

  reset() {
    this.points = [];
    this.lastTriggeredAt = 0;
    this.lastTriggeredCoin = null;
    this.triggerCount = 0;
  }

  observe(snapshot: MarketSnapshot, onSignal: (signal: LiveMeetingSignal) => void) {
    if (snapshot.status !== "LIVE" || this.triggerCount >= MAX_TRIGGERS) return;
    const now = Date.parse(snapshot.timestamp) || Date.now();
    const prices = Object.fromEntries(snapshot.coins.map((coin) => [coin.id, coin.price])) as Record<CoinId, number>;
    this.points.push({ time: now, prices });
    this.points = this.points.filter((point) => now - point.time <= WINDOW_MS).slice(-MAX_POINTS);
    if (now - this.lastTriggeredAt < COOLDOWN_MS || this.points.length < MIN_CONFIRMATIONS) return;

    let candidate: { coin: CoinId; move: number; confirmations: number } | null = null;
    for (const coin of snapshot.coins) {
      const base = this.points[0]?.prices[coin.id];
      if (!base || !Number.isFinite(base)) continue;
      const move = ((coin.price - base) / base) * 100;
      if (Math.abs(move) < MIN_MOVE_PERCENT) continue;

      const direction = Math.sign(move);
      const confirmations = this.points.slice(-MIN_CONFIRMATIONS).filter((point) => {
        const previous = point.prices[coin.id];
        return previous && Math.sign(((coin.price - previous) / previous) * 100) === direction;
      }).length;
      if (confirmations < MIN_CONFIRMATIONS) continue;
      if (!candidate || Math.abs(move) > Math.abs(candidate.move)) candidate = { coin: coin.id, move, confirmations };
    }
    if (!candidate) return;
    if (candidate.coin === this.lastTriggeredCoin && now - this.lastTriggeredAt < COOLDOWN_MS * 2) return;

    const direction = candidate.move >= 0 ? "UP" : "DOWN";
    const moveText = Math.abs(candidate.move).toFixed(2);
    const correlated = snapshot.coins.filter((coin) => coin.id !== candidate!.coin).filter((coin) => {
      const base = this.points[0]?.prices[coin.id];
      return base && Math.abs(((coin.price - base) / base) * 100) >= MIN_MOVE_PERCENT * 0.6 &&
        Math.sign(coin.price - base) === Math.sign(candidate!.move);
    }).length;

    const context = correlated >= 2 ? "여러 자산에서도 같은 방향의 움직임이 확인됩니다." : "현재는 개별 자산 움직임으로 보고 추가 확인하겠습니다.";
    onSignal({
      coin: candidate.coin,
      direction,
      movePercent: candidate.move,
      text: `실시간 흐름을 확인했습니다. ${candidate.coin}가 최근 30초 동안 ${moveText}% ${direction === "UP" ? "상승" : "하락"}했습니다. ${context}`,
    });
  }

  markTriggered(coin: CoinId) {
    this.lastTriggeredAt = Date.now();
    this.lastTriggeredCoin = coin;
    this.triggerCount += 1;
  }
}
