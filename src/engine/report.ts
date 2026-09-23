import { COIN_IDS, type ArchiveItem, type CoinId, type CryptoMarketBrief, type MarketSnapshot, type MeetingReport } from "../types";
import { changeText, priceUSD } from "../utils/format";

export function createReport(brief: CryptoMarketBrief, market: MarketSnapshot): { report: MeetingReport; summary: string } {
  const watchlist = [...COIN_IDS]
    .sort((a, b) => Math.abs(market.coins.find((coin) => coin.id === b)?.change24h || 0) - Math.abs(market.coins.find((coin) => coin.id === a)?.change24h || 0))
    .slice(0, 3) as CoinId[];
  const crossMarket = [brief.globalFactors?.[0], brief.correlations?.[0]].filter(Boolean).join(" ") || "자산 간 상대 강도와 거시 흐름의 동시 확인이 필요합니다.";
  const conclusion = `변동폭 기준 관찰: ${watchlist.join(", ")}. ${brief.risks[0] || "시장 불확실성을 확인하세요."}`;
  return {
    report: {
      id: globalThis.crypto?.randomUUID?.() || `meeting-${Date.now()}`,
      date: brief.date,
      createdAt: new Date().toISOString(),
      crossMarket,
      watchlist,
      conclusion,
    },
    summary: `${brief.marketSummary} 주요 리스크: ${brief.risks.slice(0, 2).join("; ") || "추가 확인 필요"}. 관찰: ${watchlist.join(", ")}.`.slice(0, 800),
  };
}

export function reportToText(item: ArchiveItem): string {
  const { brief, marketSnapshot: market, report, meetingSummary } = item;
  const lines = [
    "DAILY MEETING REPORT", `Date: ${report.date}`, `Market data: ${market.status} / ${market.timestamp}`,
    "", "MARKET OVERVIEW", brief.marketSummary, "",
  ];
  for (const coin of brief.coins) {
    const fact = market.coins.find((row) => row.id === coin.id);
    lines.push(coin.id);
    if (fact) lines.push(`FACT: ${priceUSD(fact.price)} | 24h ${changeText(fact.change24h)} | volume $${Math.round(fact.volume24h / 1_000_000)}M`);
    lines.push(`INTERPRETATION: ${coin.summary}`, `Technical: ${coin.technical.join("; ") || "Not provided"}`);
    lines.push(`Bull: ${coin.bullScenario || "Not provided"}`, `Bear: ${coin.bearScenario || "Not provided"}`);
    lines.push(`Coin risks: ${coin.risks.join("; ") || "Not provided"}`);
    if (coin.news.length) lines.push(`News: ${coin.news.join("; ")}`);
    lines.push("");
  }
  lines.push("CROSS MARKET", report.crossMarket, "", "RISKS", ...brief.risks.map((risk) => `- ${risk}`));
  lines.push("", "WATCHLIST (by absolute 24h change, not a trade signal)", report.watchlist.join(", ") || "None");
  lines.push("", "CONCLUSION", report.conclusion, "", "MEETING SUMMARY", meetingSummary, "", "SOURCES", ...brief.sources.map((source) => `- ${source}`));
  lines.push("", "For research and scenario planning only. Not financial advice.");
  return lines.join("\n");
}