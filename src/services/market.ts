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
  high_24h: number | null;
  low_24h: number | null;
}

let inFlight: Promise<MarketResult> | null = null;
let sessionSnapshot: MarketSnapshot | null = null;
let streamSocket: WebSocket | null = null;
let streamRetry: number | null = null;
let streamListeners = new Set<(snapshot: MarketSnapshot) => void>();
let streamErrorListeners = new Set<(message: string) => void>();
let streamBuffer = new Map<string, BinanceTicker>();
let streamFlushTimer: number | null = null;
let streamStaleTimer: number | null = null;
const STREAM_STALE_MS = 5000;

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
      if (!row || !Number.isFinite(row.current_price) || !Number.isFinite(row.total_volume) || !Number.isFinite(row.price_change_percentage_24h) || !Number.isFinite(row.high_24h) || !Number.isFinite(row.low_24h)) {
        throw new Error(`Missing market data for ${id}`);
      }
      return {
        id,
        symbol: id,
        price: row.current_price,
        change24h: Number(row.price_change_percentage_24h),
        volume24h: row.total_volume,
        marketCap: Number.isFinite(row.market_cap) ? Number(row.market_cap) : 0,
        high24h: Number(row.high_24h),
        low24h: Number(row.low_24h),
      };
    });

    return { timestamp: new Date().toISOString(), status: "LIVE", coins };
  } finally {
    window.clearTimeout(timeout);
  }
}

interface BinanceTicker {
  s: string;
  c: string;
  P: string;
  q: string;
  h: string;
  l: string;
}

const BINANCE_SYMBOLS = COIN_IDS.map((id) => `${COIN_META[id].providerId === "binancecoin" ? "BNB" : id}USDT`.toLowerCase());

function applyBinanceTicker(ticker: BinanceTicker) {
  if (!sessionSnapshot || sessionSnapshot.status === "MOCK") return;
  streamBuffer.set(ticker.s.toLowerCase(), ticker);
}

function scheduleStreamStale() {
  if (streamStaleTimer !== null) window.clearTimeout(streamStaleTimer);
  streamStaleTimer = window.setTimeout(() => {
    streamStaleTimer = null;
    if (!sessionSnapshot || streamListeners.size === 0 || sessionSnapshot.status !== "LIVE") return;
    sessionSnapshot = { ...sessionSnapshot, status: "STALE" };
    streamListeners.forEach((listener) => listener(sessionSnapshot!));
  }, STREAM_STALE_MS);
}

function flushBinanceStream() {
  if (!sessionSnapshot || streamBuffer.size === 0) return;
  const buffered = [...streamBuffer.values()];
  streamBuffer.clear();
  let next = sessionSnapshot;
  buffered.forEach((ticker) => {
    const id = COIN_IDS.find((coinId) => `${coinId === "BNB" ? "bnb" : coinId.toLowerCase()}usdt` === ticker.s.toLowerCase());
    if (!id) return;
    const values = [ticker.c, ticker.P, ticker.q, ticker.h, ticker.l].map(Number);
    if (!values.every(Number.isFinite)) return;
    const [price, change24h, volume24h, high24h, low24h] = values;
    next = { ...next, coins: next.coins.map((coin) => coin.id === id ? { ...coin, price, change24h, volume24h, high24h, low24h } : coin) };
  });
  sessionSnapshot = { ...next, timestamp: new Date().toISOString(), status: "LIVE" };
  scheduleStreamStale();
  streamListeners.forEach((listener) => listener(sessionSnapshot!));
}

function startStreamFlush() {
  if (streamFlushTimer !== null) return;
  streamFlushTimer = window.setInterval(flushBinanceStream, 1000);
}

function stopStreamFlush() {
  if (streamFlushTimer !== null) window.clearInterval(streamFlushTimer);
  if (streamStaleTimer !== null) window.clearTimeout(streamStaleTimer);
  streamFlushTimer = null;
  streamStaleTimer = null;
  streamBuffer.clear();
}

function connectBinanceStream() {
  if (streamSocket || typeof WebSocket === "undefined") return;
  const streams = BINANCE_SYMBOLS.map((symbol) => `${symbol}@ticker`).join("/");
  streamSocket = new WebSocket(`wss://stream.binance.com:9443/stream?streams=${streams}`);
  streamSocket.onopen = () => {
    scheduleStreamStale();
  };
  streamSocket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data) as { data?: BinanceTicker };
      if (payload.data?.s) applyBinanceTicker(payload.data);
    } catch {
      streamErrorListeners.forEach((listener) => listener("Binance 실시간 데이터 형식을 읽을 수 없습니다."));
    }
  };
  streamSocket.onerror = () => {
    streamErrorListeners.forEach((listener) => listener("Binance WebSocket 연결 오류"));
  };
  streamSocket.onclose = () => {
    streamSocket = null;
    if (streamListeners.size === 0) return;
    if (streamRetry !== null) window.clearTimeout(streamRetry);
    streamRetry = window.setTimeout(() => {
      streamRetry = null;
      connectBinanceStream();
    }, 3000);
  };
}

export function subscribeMarketStream(
  onSnapshot: (snapshot: MarketSnapshot) => void,
  onError?: (message: string) => void,
) {
  streamListeners.add(onSnapshot);
  if (onError) streamErrorListeners.add(onError);
  startStreamFlush();
  connectBinanceStream();

  return () => {
    streamListeners.delete(onSnapshot);
    if (onError) streamErrorListeners.delete(onError);
    if (streamListeners.size === 0) {
      if (streamRetry !== null) window.clearTimeout(streamRetry);
      streamRetry = null;
      streamSocket?.close();
      streamSocket = null;
      stopStreamFlush();
    }
  };
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