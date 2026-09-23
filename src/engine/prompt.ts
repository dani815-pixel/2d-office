import type { ArchiveItem, MarketSnapshot } from "../types";
import { localISODate } from "../utils/format";

export const PROMPT_BUDGET = {
  maxChars: 12000,
  maxNews: 3,
  maxSources: 8,
  maxPreviousSummary: 800,
} as const;

export function buildDailyPrompt(market: MarketSnapshot, previous?: ArchiveItem): string {
  const compact = {
    d: localISODate(),
    t: market.timestamp,
    st: market.status,
    c: Object.fromEntries(market.coins.map((coin) => [
      coin.id,
      [Number(coin.price.toFixed(5)), Number(coin.change24h.toFixed(2)), Math.round(coin.volume24h / 1_000_000)],
    ])),
    ...(previous ? {
      prev: {
        s: previous.meetingSummary.slice(0, PROMPT_BUDGET.maxPreviousSummary),
        r: previous.brief.risks.slice(0, 3),
        w: previous.report.watchlist,
      },
    } : {}),
  };

  const prompt = `You are a cautious crypto market researcher. Research BTC, ETH, BNB, XRP and SOL for today. Respond in Korean. Separate verified facts from interpretation. Never give guaranteed returns or direct buy/sell instructions.

INPUT (compact): ${JSON.stringify(compact)}
d=date, t=snapshot time (UTC), st=data status, c={coin:[USD price, 24h change %, 24h volume USD millions]}. prev is only a short prior-meeting summary/risks/watchlist, not evidence.
${market.status !== "LIVE" ? `IMPORTANT: st=${market.status}. These prices are ${market.status === "MOCK" ? "fixed demo examples, NOT live prices" : "not confirmed live"}. Verify current prices independently; do not present input prices as current facts.` : "Use the snapshot as the price/volume reference, not as a prediction."}

Research tasks:
1. Briefly assess the overall market, macro/liquidity context, and cross-coin relationships.
2. For EACH of the five coins, give a short thesis, up to 3 technical observations, up to ${PROMPT_BUDGET.maxNews} relevant news items (title, source, short summary only), one bull scenario, one bear scenario, and up to 3 risks.
3. Identify near-term factors worth watching. Cite up to ${PROMPT_BUDGET.maxSources} reliable source names or URLs. If you cannot browse or verify recent news, leave news/sources empty and say so. Never invent sources.

Return JSON only, without code fences or commentary, in this exact shape:
{"date":"YYYY-MM-DD","marketSummary":"max 2 sentences","coins":[{"id":"BTC","summary":"max 2 sentences","technical":["..."],"news":["title | source | short summary"],"bullScenario":"one sentence","bearScenario":"one sentence","risks":["..."]}],"globalFactors":["..."],"events":["..."],"risks":["..."],"correlations":["..."],"sources":["..."]}
Include all five coin IDs exactly once. Keep arrays concise. Do not repeat the input data or these instructions.`;

  return prompt.slice(0, PROMPT_BUDGET.maxChars);
}