import { COIN_IDS, type CoinMarket, type MarketSnapshot } from "../types";
import { COIN_META } from "../data/coins";
import { MOCK_MARKET } from "../data/demo";
import { readMarketCache, saveMarketCache } from "./storage";

export interface MarketResult {
  snapshot: MarketSnapshot;
  error?: string;
}

interface ProviderCoin {
  id: string;
  current_price: number;
  price_change_percentage_24h: number | null;
  total_volume: number;
  market_cap: number | null;
}

let inFlight: Promise<MarketResult> | null = null;
let sessionSnapshot: MarketSnapshot | null = null;

async function fetchFromCoinGecko(): Promise<MarketSnapshot> {
  const params = new URLSearchParams({
    vs_currency: "usd",
    ids: COIN_IDS.map((id) => COIN_META[id].providerId).join(","),
    sparkline: "false",
  });
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const key = import.meta.env.VITE_COINGECKO_DEMO_API_KEY;
    const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?${params}`, {
      signal: controller.signal,
      headers: key ? { "x-cg-demo-api-key": key } : undefined,
    });
    if (!response.ok) throw new Error(`CoinGecko HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!Array.isArray(data)) throw new Error("Invalid market response");

    const coins: CoinMarket[] = COIN_IDS.map((id) => {
      const row = data.find((item): item is ProviderCoin =>
        typeof item === "object" && item !== null && "id" in item && item.id === COIN_META[id].providerId,
      );
      if (!row || !Number.isFinite(row.current_price) || !Number.isFinite(row.total_volume) || !Number.isFinite(row.price_change_percentage_24h)) {
        throw new Error(`Missing market data for ${id}`);
      }
      return {
        id,
        symbol: id,
        price: row.current_price,
        change24h: Number(row.price_change_percentage_24h),
        volume24h: row.total_volume,
        marketCap: Number.isFinite(row.market_cap) ? Number(row.market_cap) : undefined,
      };
    });

    return { timestamp: new Date().toISOString(), status: "LIVE", coins };
  } finally {
    window.clearTimeout(timeout);
  }
}

export function getMarketSnapshot(force = false): Promise<MarketResult> {
  if (inFlight) return inFlight;
  if (!force && sessionSnapshot) return Promise.resolve({ snapshot: sessionSnapshot });

  inFlight = (async () => {
    try {
      const snapshot = await fetchFromCoinGecko();
      sessionSnapshot = snapshot;
      saveMarketCache(snapshot);
      return { snapshot };
    } catch (error) {
      const cached = sessionSnapshot && sessionSnapshot.status !== "MOCK"
        ? { ...sessionSnapshot, status: "STALE" as const }
        : readMarketCache();
      const snapshot = cached || { ...MOCK_MARKET, coins: MOCK_MARKET.coins.map((coin) => ({ ...coin })) };
      sessionSnapshot = snapshot;
      return {
        snapshot,
        error: `${error instanceof Error ? error.message : "Market request failed"}. ${cached ? "저장된 데이터를 표시합니다." : "예시 데이터를 표시합니다."}`,
      };
    }
  })().finally(() => { inFlight = null; });

  return inFlight;
}