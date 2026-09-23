import { type CoinId, type LiveMeetingSignal, type MarketSnapshot } from "../types";

const WINDOW_MS = 30_000;
const MIN_MOVE_PERCENT = 0.7;
const COOLDOWN_MS = 120_000;
const MAX_TRIGGERS = 5;

interface Point { time: number; prices: Record<CoinId, number>; }

export class LiveMeetingController {
  private points: Point[] = [];
  private lastTriggeredAt = 0;
  private triggerCount = 0;

  reset() {
    this.points = [];
    this.lastTriggeredAt = 0;
    this.triggerCount = 0;
  }

  observe(snapshot: MarketSnapshot, onSignal: (signal: LiveMeetingSignal) => void) {
    if (snapshot.status !== "LIVE" || this.triggerCount >= MAX_TRIGGERS) return;
    const now = Date.parse(snapshot.timestamp) || Date.now();
    const prices = Object.fromEntries(snapshot.coins.map((coin) => [coin.id, coin.price])) as Record<CoinId, number>;
    this.points.push({ time: now, prices });
    this.points = this.points.filter((point) => now - point.time <= WINDOW_MS);
    if (now - this.lastTriggeredAt < COOLDOWN_MS) return;

    let candidate: { coin: CoinId; move: number } | null = null;
    for (const coin of snapshot.coins) {
      const base = this.points[0]?.prices[coin.id];
      if (!base || !Number.isFinite(base)) continue;
      const move = ((coin.price - base) / base) * 100;
      if (Math.abs(move) < MIN_MOVE_PERCENT) continue;
      if (!candidate || Math.abs(move) > Math.abs(candidate.move)) candidate = { coin: coin.id, move };
    }
    if (!candidate) return;

    const direction = candidate.move >= 0 ? "UP" : "DOWN";
    const moveText = Math.abs(candidate.move).toFixed(2);
    onSignal({
      coin: candidate.coin,
      direction,
      movePercent: candidate.move,
      text: `실시간 흐름을 확인했습니다. ${candidate.coin}가 최근 30초 동안 ${moveText}% ${direction === "UP" ? "상승" : "하락"}했습니다. 일시적 움직임인지 추가 확인하겠습니다.`,
    });
  }

  markTriggered(_coin: CoinId) {
    this.lastTriggeredAt = Date.now();
    this.triggerCount += 1;
  }
}
