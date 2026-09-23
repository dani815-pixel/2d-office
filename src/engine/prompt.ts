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
      [Number(coin.price.toFixed(5)), Number(coin.change24h.toFixed(2)), Math.round(coin.volume24h / 1_000_000), Number(coin.low24h.toFixed(5)), Number(coin.high24h.toFixed(5))],
    ])),
    ...(previous ? {
      prev: {
        s: previous.meetingSummary.slice(0, PROMPT_BUDGET.maxPreviousSummary),
        r: previous.brief.risks.slice(0, 3),
        w: previous.report.watchlist,
      },
    } : {}),
  };

  const prompt = `You are a cautious crypto market researcher and meeting-story editor. Research BTC, ETH, BNB, XRP and SOL for today. Respond in Korean. Separate verified facts from interpretation. Never give guaranteed returns or direct buy/sell instructions.

INPUT (compact): ${JSON.stringify(compact)}
d=date, t=snapshot time (UTC), st=data status, c={coin:[USD price, 24h change %, 24h volume USD millions, 24h low, 24h high]}. prev is only prior context, never evidence.
${market.status !== "LIVE" ? `IMPORTANT: st=${market.status}. These prices are ${market.status === "MOCK" ? "fixed demo examples, NOT live prices" : "not confirmed live"}. Verify current prices independently; do not present input prices as current facts.` : "Use the snapshot as factual price/volume context, not a prediction."}

RESEARCH:
1. Assess overall market, macro/liquidity context, cross-coin relationships, and the most important change today.
2. For EACH coin, provide: concise summary, up to 3 technical observations, up to ${PROMPT_BUDGET.maxNews} verified recent news items, one bull scenario, one bear scenario, and up to 3 risks.
3. Find what is genuinely different or surprising today. Prefer a concrete divergence, catalyst, contradiction, rotation, liquidity change, event, or risk over generic market commentary.
4. Build a TV-friendly meeting story from the research. The story is NOT fiction: every hook, conflict, twist, and conclusion must be grounded in the supplied data or verified research.

STORY ENGINE:
Choose ONE storyMode that best fits today's evidence. Do not rotate modes mechanically.
Allowed modes:
- "BREAKOUT_TENSION": a move is testing an important condition.
- "LEADERSHIP_SHIFT": leadership/relative strength is changing between assets.
- "DIVERGENCE": coins are behaving differently despite a shared market.
- "CATALYST_COUNTDOWN": a dated event or imminent catalyst matters.
- "RISK_ALERT": downside uncertainty or conflicting signals dominates.
- "ROTATION": capital/attention appears to be moving between sectors or coins.
- "CORRELATION_BREAK": a normally related relationship is weakening or reversing.
- "QUIET_BEFORE_MOVE": evidence is mixed and the key story is what has not resolved yet.
- "CROSSROADS": bull and bear evidence are unusually balanced.
Avoid sensationalism. If evidence is weak, use QUIET_BEFORE_MOVE or CROSSROADS.

Create:
- storyTitle: short Korean title, max 24 chars.
- openingHook: one sentence that makes the meeting start with a concrete question.
- centralQuestion: the main question the team should resolve.
- debateTopics: 2-3 concrete points where characters can disagree based on evidence.
- turningPoint: one factual development that changes the discussion.
- surprise: one non-obvious but evidence-based observation; use "없음" if none.
- endingQuestion: one unresolved question for viewers to watch after the meeting.
- watchItems: 3-5 concrete things to monitor today.
- changes: 2-4 meaningful changes versus the prior context; if no prior context, compare against recent verified market context when available, otherwise say "비교 자료 부족".

CHARACTER ANGLES:
Do not assign each character to one coin. Give the meeting room reasons to disagree:
- leader: frames the central question and forces a conclusion based on evidence.
- market: challenges claims with price/volume/market structure.
- onchain: focuses on ecosystem/on-chain evidence when available; otherwise says data is unavailable.
- altcoin: compares relative strength, rotation, and coin-specific catalysts.
- risk: attacks assumptions and presents the bear case.
- trader: asks what observable condition would confirm or invalidate a scenario.
Do not invent data for any role.

NEWS/SOURCES:
Use recent, verifiable information only. For each news item use "title | source | short summary".
IMPORTANT OUTPUT SAFETY:
- Do NOT output URLs, Markdown links, footnotes, citation markers, reference IDs, or inline web citations such as [text](https://...) or 【...】.
- For source fields, use plain text only, e.g. "Reuters" or "CoinDesk". Never append a URL.
- If browsing/verification is unavailable, leave news/sources empty and explicitly state that recent verification was unavailable.
- Never invent sources, dates, events, quotes, prices, or on-chain facts.

OUTPUT:
Return EXACTLY ONE JSON code block and nothing else. Do not write any explanation before or after it.
The user will copy the entire response and paste it directly into the app.
Inside the JSON, use only valid JSON: double quotes for strings, no trailing commas, no comments.
Do not place Markdown, citations, URLs, or unescaped line breaks inside JSON strings.
If your interface automatically adds web citations, do not include them in the output; use only the plain source name.
Format:
```json
{"date":"YYYY-MM-DD","marketSummary":"max 2 sentences","story":{"mode":"DIVERGENCE","title":"...","openingHook":"...","centralQuestion":"...","debateTopics":["..."],"turningPoint":"...","surprise":"...","endingQuestion":"...","watchItems":["..."],"changes":["..."]},"coins":[{"id":"BTC","summary":"max 2 sentences","technical":["..."],"news":["title | source | short summary"],"bullScenario":"one sentence","bearScenario":"one sentence","risks":["..."]}],"globalFactors":["..."],"events":["..."],"risks":["..."],"correlations":["..."],"sources":["Reuters","CoinDesk"]}
```
Include BTC, ETH, BNB, XRP, SOL exactly once. Keep every array concise. Do not repeat input data or instructions. The story must be grounded in evidence and should create a different meeting narrative when the evidence genuinely differs.`;

  return prompt.slice(0, PROMPT_BUDGET.maxChars);
}