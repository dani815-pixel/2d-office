import { COIN_IDS, type ArchiveItem, type MarketSnapshot, type TradingTeamState } from "../types";

const MARKET_KEY = "crypto-ai-office.market.v1";
const ARCHIVE_KEY = "crypto-ai-office.archive.v1";
const TRADING_KEY = "crypto-ai-office.trading.v1";

export function readMarketCache(): MarketSnapshot | null {
  try {
    const value = JSON.parse(localStorage.getItem(MARKET_KEY) || "null") as MarketSnapshot | null;
    if (!value || !Array.isArray(value.coins) || value.coins.length !== 5 || !value.timestamp) return null;
    if (value.coins.some((coin, index) => coin.id !== COIN_IDS[index] || !Number.isFinite(coin.price) || !Number.isFinite(coin.change24h) || !Number.isFinite(coin.volume24h) || !Number.isFinite(coin.marketCap) || !Number.isFinite(coin.high24h) || !Number.isFinite(coin.low24h))) return null;
    return { ...value, status: "STALE" };
  } catch {
    return null;
  }
}

export function saveMarketCache(snapshot: MarketSnapshot): void {
  try {
    localStorage.setItem(MARKET_KEY, JSON.stringify(snapshot));
  } catch {
    // A disabled or full storage area should not block the workspace.
  }
}

export function readArchive(): ArchiveItem[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is ArchiveItem => {
      if (!item || typeof item.meetingId !== "string" || typeof item.date !== "string") return false;
      const brief = item.brief;
      const market = item.marketSnapshot;
      const report = item.report;
      return !!brief && typeof brief.marketSummary === "string" && Array.isArray(brief.coins) && brief.coins.length === 5
        && brief.coins.every((coin: { id: string; technical: unknown; news: unknown; risks: unknown }) =>
          !!coin && COIN_IDS.includes(coin.id as typeof COIN_IDS[number])
          && Array.isArray(coin.technical) && Array.isArray(coin.news) && Array.isArray(coin.risks))
        && Array.isArray(brief.risks) && Array.isArray(brief.sources) && Array.isArray(brief.globalFactors)
        && !!market && Array.isArray(market.coins) && market.coins.length === 5
        && !!report && Array.isArray(report.watchlist) && typeof report.createdAt === "string" && typeof report.id === "string";
    }).slice(0, 20);
  } catch {
    return [];
  }
}

export function saveArchive(items: ArchiveItem[]): boolean {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify(items.slice(0, 20)));
    return true;
  } catch {
    // Reports remain available in memory for this session.
    return false;
  }
}

export function readTradingState(): TradingTeamState | null {
  try {
    const value = JSON.parse(localStorage.getItem(TRADING_KEY) || "null") as TradingTeamState | null;
    if (!value || typeof value.sessionId !== "string" || !Number.isFinite(value.balance) || !Array.isArray(value.positions) || !Array.isArray(value.trades)) return null;
    return { ...value, requests: Array.isArray(value.requests) ? value.requests : [], profiles: Array.isArray(value.profiles) ? value.profiles : [], settings: value.settings || {}, memories: value.memories || {}, activities: value.activities || {}, scenarios: Array.isArray(value.scenarios) ? value.scenarios : [], reviews: Array.isArray(value.reviews) ? value.reviews : [] };
  } catch {
    return null;
  }
}

export function resetAppData(): void {
  try {
    localStorage.removeItem(ARCHIVE_KEY);
    localStorage.removeItem(TRADING_KEY);
  } catch {
    // A disabled storage area should not block in-memory reset.
  }
}

export function saveTradingState(state: TradingTeamState): boolean {
  try {
    localStorage.setItem(TRADING_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
