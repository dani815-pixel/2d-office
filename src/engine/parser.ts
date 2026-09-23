import { COIN_IDS, type CoinBrief, type CoinId, type CryptoMarketBrief } from "../types";
import { localISODate } from "../utils/format";

export interface ParseResult {
  format: "JSON" | "MARKDOWN" | "TEXT";
  brief?: CryptoMarketBrief;
  errors: string[];
  warnings: string[];
}

type LooseObject = Record<string, unknown>;
const isObject = (value: unknown): value is LooseObject => typeof value === "object" && value !== null && !Array.isArray(value);

function stringValue(value: unknown, max = 500): string {
  return typeof value === "string" ? value.trim().replace(/\s+/g, " ").slice(0, max) : "";
}

function cleanSourceText(value: unknown, max = 240): string {
  return stringValue(value, max)
    .replace(/https?:\/\/\S+/gi, "")
    .replace(/\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/【[^】]*】/g, "")
    .replace(/\s+/g, " ")
    .replace(/[|•·]\s*$/, "")
    .trim();
}

function listValue(value: unknown, max = 3): string[] {
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(/\n|;/) : [];
  return items.map((item) => {
    if (isObject(item)) return [item.title, item.source, item.summary].map((part) => cleanSourceText(part, 180)).filter(Boolean).join(" | ");
    return cleanSourceText(item, 240).replace(/^(?:[-*]\s*|\d+[.)]\s*)/, "");
  }).filter(Boolean).slice(0, max);
}

function coinId(value: unknown): CoinId | undefined {
  const upper = stringValue(value, 60).toUpperCase();
  const match = COIN_IDS.find((id) => upper === id || upper.includes(`(${id})`) || upper.startsWith(`${id} (`) || upper.startsWith(`${id} - `) || upper.startsWith(`${id}: `));
  if (match) return match;
  const names: Record<string, CoinId> = { BITCOIN: "BTC", ETHEREUM: "ETH", BINANCECOIN: "BNB", RIPPLE: "XRP", SOLANA: "SOL" };
  return names[upper];
}

function parseStructuredText(raw: string): LooseObject {
  const draft: LooseObject = { coins: [], marketSummary: "", risks: [], globalFactors: [], events: [], sources: [], correlations: [] };
  const coins = draft.coins as LooseObject[];
  let current: LooseObject | null = null;
  let field = "marketSummary";

  const setHeading = (heading: string, topLevel = false): boolean => {
    const normalized = heading.replace(/[:*]/g, "").trim();
    const id = coinId(normalized);
    if (id) {
      current = coins.find((coin) => coin.id === id) || { id, summary: "", technical: [], news: [], risks: [] };
      if (!coins.includes(current)) coins.push(current);
      field = "summary";
      return true;
    }
    if (/^(technical|technicals|기술|기술적)/i.test(normalized) && current) field = "technical";
    else if (/^(news|뉴스)/i.test(normalized) && current) field = "news";
    else if (/^(bull|강세|상승)/i.test(normalized) && current) field = "bullScenario";
    else if (/^(bear|약세|하락)/i.test(normalized) && current) field = "bearScenario";
    else if (/^(summary|요약)/i.test(normalized) && current) field = "summary";
    else if (/^(risk|리스크|위험)/i.test(normalized)) { if (topLevel) current = null; field = "risks"; }
    else if (/^(global|macro|거시|시장 요인)/i.test(normalized)) { current = null; field = "globalFactors"; }
    else if (/^(event|일정|이벤트)/i.test(normalized)) { current = null; field = "events"; }
    else if (/^(correlation|상관)/i.test(normalized)) { current = null; field = "correlations"; }
    else if (/^(source|출처|참고)/i.test(normalized)) { current = null; field = "sources"; }
    else if (/^(market|overall|시장|전체)/i.test(normalized)) { current = null; field = "marketSummary"; }
    else return false;
    return true;
  };

  for (const rawLine of raw.split("\n")) {
    let line = rawLine.trim();
    if (!line || /^```/.test(line)) continue;
    line = line.replace(/^\*\*(.+?)\*\*:\s*/, "$1: ");
    const heading = line.match(/^#{1,6}\s+(.+)$/);
    if (heading) { setHeading(heading[1], heading[0].match(/^#+/)![0].length <= 2); continue; }
    const boldHeading = line.match(/^\*\*(.+?)\*\*:?\s*$/);
    if (boldHeading) { setHeading(boldHeading[1]); continue; }

    const inlineCoin = line.match(/^(?:[-*]\s*)?(BTC|ETH|BNB|XRP|SOL)\s*[:\-]\s*(.+)$/i);
    if (inlineCoin) {
      setHeading(inlineCoin[1]);
      line = inlineCoin[2];
    } else {
      const inlineField = line.match(/^(Market Summary|시장 요약|Summary|요약|Technical|기술적 분석|News|뉴스|Bull Scenario|강세 시나리오|Bear Scenario|약세 시나리오|Risks?|리스크|Sources?|출처|Date|날짜)\s*:\s*(.+)$/i);
      if (inlineField) {
        if (/^(date|날짜)$/i.test(inlineField[1])) { draft.date = inlineField[2].trim(); continue; }
        setHeading(inlineField[1], /^(risks?|리스크)$/i.test(inlineField[1]));
        line = inlineField[2];
      }
    }

    line = line.replace(/^(?:[-*]\s*|\d+[.)]\s*)/, "").trim();
    if (!line) continue;
    const target = current && ["summary", "technical", "news", "bullScenario", "bearScenario", "risks"].includes(field) ? current : draft;
    if (["technical", "news", "risks", "globalFactors", "events", "sources", "correlations"].includes(field)) {
      if (!Array.isArray(target[field])) target[field] = [];
      (target[field] as string[]).push(line);
    } else {
      target[field] = `${target[field] || ""} ${line}`.trim();
    }
  }
  return draft;
}

export function parseResearch(raw: string): ParseResult {
  const input = raw.trim();
  if (!input) return { format: "TEXT", errors: ["분석 결과를 먼저 붙여넣어 주세요."], warnings: [] };

  let format: ParseResult["format"] = /^\s*#|\*\*/m.test(input) ? "MARKDOWN" : "TEXT";
  let data: unknown;
  const fence = input.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const jsonText = fence?.[1]?.trim() || input;
  const looksJson = jsonText.startsWith("{") || jsonText.startsWith("[");
  let embeddedJson: unknown;
  if (!looksJson) {
    const start = input.indexOf("{");
    const end = input.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try { embeddedJson = JSON.parse(input.slice(start, end + 1)); } catch { /* Text fallback handles non-JSON braces. */ }
    }
  }

  if (looksJson) {
    format = "JSON";
    try {
      data = JSON.parse(jsonText);
    } catch {
      return { format, errors: ["JSON 형식이 올바르지 않습니다. 쉼표와 따옴표를 확인해 주세요."], warnings: [] };
    }
  } else if (isObject(embeddedJson)) {
    format = "JSON";
    data = embeddedJson;
  } else {
    data = parseStructuredText(input);
  }

  if (!isObject(data)) return { format, errors: ["최상위 결과는 JSON 객체여야 합니다."], warnings: [] };
  const errors: string[] = [];
  const warnings: string[] = [];
  const marketSummary = stringValue(data.marketSummary ?? data.market_summary ?? data.summary, 800);
  if (!marketSummary) errors.push("시장 전체 요약(Market Summary)이 필요합니다.");

  const today = localISODate();
  const date = stringValue(data.date, 30);
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(`${date}T00:00:00Z`));
  if (!validDate) warnings.push("유효한 날짜가 없어 오늘 날짜를 사용합니다.");

  const rawCoins: LooseObject[] = Array.isArray(data.coins)
    ? data.coins.filter(isObject)
    : isObject(data.coins)
      ? Object.entries(data.coins).map(([id, value]) => ({ ...(isObject(value) ? value : { summary: value }), id }))
      : [];
  const recognized = new Map<CoinId, CoinBrief>();
  for (const coin of rawCoins) {
    const id = coinId(coin.id ?? coin.symbol ?? coin.name);
    if (!id || recognized.has(id)) continue;
    recognized.set(id, {
      id,
      summary: stringValue(coin.summary ?? coin.analysis, 320),
      technical: listValue(coin.technical),
      news: listValue(coin.news),
      bullScenario: stringValue(coin.bullScenario ?? coin.bull_scenario, 240),
      bearScenario: stringValue(coin.bearScenario ?? coin.bear_scenario, 240),
      risks: listValue(coin.risks),
    });
  }
  if (![...recognized.values()].some((coin) => coin.summary || coin.technical.length)) {
    errors.push("BTC, ETH, BNB, XRP, SOL 중 하나 이상의 코인 분석이 필요합니다.");
  }

  const coins = COIN_IDS.map((id) => {
    const found = recognized.get(id);
    if (found) {
      if (!found.summary) warnings.push(`${id}: 요약이 비어 있습니다.`);
      return found;
    }
    warnings.push(`${id}: 분석이 없어 빈 항목으로 표시합니다.`);
    return { id, summary: "제공된 분석이 없습니다. 별도 확인이 필요합니다.", technical: [], news: [], bullScenario: "", bearScenario: "", risks: [] };
  });
  const risks = listValue(data.risks, 8);
  const rawStory = isObject(data.story) ? data.story : undefined;
  const story = rawStory ? {
    mode: stringValue(rawStory.mode, 40),
    title: stringValue(rawStory.title, 80),
    openingHook: stringValue(rawStory.openingHook, 240),
    centralQuestion: stringValue(rawStory.centralQuestion, 240),
    debateTopics: listValue(rawStory.debateTopics, 3),
    turningPoint: stringValue(rawStory.turningPoint, 240),
    surprise: stringValue(rawStory.surprise, 240),
    endingQuestion: stringValue(rawStory.endingQuestion, 240),
    watchItems: listValue(rawStory.watchItems, 5),
    changes: listValue(rawStory.changes, 4),
  } : undefined;
  if (!risks.length) warnings.push("시장 전체 리스크가 제공되지 않았습니다.");

  const events = listValue(data.events, 8).map((event) => ({ title: event, summary: event }));
  const brief: CryptoMarketBrief = {
    date: validDate ? date : today,
    marketSummary,
    coins,
    globalFactors: listValue(data.globalFactors ?? data.global_factors, 8),
    events,
    risks,
    correlations: listValue(data.correlations, 8),
    sources: listValue(data.sources, 8).map((source) => cleanSourceText(source, 240)).filter(Boolean),
    story,
  };
  return { format, brief: errors.length ? undefined : brief, errors, warnings };
}