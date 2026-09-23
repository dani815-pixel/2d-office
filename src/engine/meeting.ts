import { COIN_IDS, type CoinId, type CryptoMarketBrief, type MarketSnapshot, type MeetingEvent, type RoleId } from "../types";
import { changeText, priceUSD } from "../utils/format";

const analystFor: Record<CoinId, RoleId> = {
  BTC: "market", ETH: "onchain", BNB: "altcoin", XRP: "altcoin", SOL: "onchain",
};

const TARGET_MEETING_MS = 20 * 60 * 1000;

export function createMeetingEvents(brief: CryptoMarketBrief, market: MarketSnapshot): MeetingEvent[] {
  const events: MeetingEvent[] = [];
  const story = brief.story;
  const globalFactors = brief.globalFactors ?? [];
  const correlations = brief.correlations ?? [];
  const briefEvents = brief.events ?? [];
  const watchlist = [...COIN_IDS]
    .sort((a, b) => Math.abs(market.coins.find((coin) => coin.id === b)?.change24h || 0) - Math.abs(market.coins.find((coin) => coin.id === a)?.change24h || 0))
    .slice(0, 3);

  const screen = (target: string) => events.push({ type: "SCREEN", target, duration: 2200 });
  const pause = (duration = 2200) => events.push({ type: "PAUSE", duration });
  const say = (speaker: RoleId, text: string) => events.push({
    type: "SPEAK",
    speaker,
    text,
    duration: Math.min(14000, Math.max(7000, 4200 + text.length * 38)),
  });

  for (const speaker of ["leader", "market", "onchain", "altcoin", "risk", "trader"] as RoleId[]) {
    events.push({ type: "MOVE", speaker, target: "TABLE", duration: 3200 });
  }
  events.push({ type: "LISTEN", duration: 2500 });

  screen("OVERVIEW");
  say("leader", story?.openingHook || "오늘 시장에서 가장 중요한 질문부터 정리하겠습니다.");
  say("market", brief.marketSummary || "시장 전반 요약이 제공되지 않았습니다.");
  say("leader", story?.centralQuestion || "오늘의 가격 움직임이 어떤 조건에서 의미를 갖는지 확인하겠습니다.");
  say("risk", globalFactors[0] || "거시 환경과 유동성 변화를 먼저 확인해야 합니다.");
  if (story?.title) say("leader", "오늘 회의의 주제는 '" + story.title + "'입니다.");
  pause();

  const topics = story?.debateTopics ?? [];
  topics.slice(0, 3).forEach((topic, index) => {
    say(index === 0 ? "market" : index === 1 ? "risk" : "trader", topic);
  });

  for (const id of COIN_IDS) {
    const coin = brief.coins.find((item) => item.id === id);
    const fact = market.coins.find((item) => item.id === id);
    screen(id);
    say("leader", id + "를 보겠습니다. " + (fact
      ? (market.status === "MOCK" ? "예시" : market.status === "STALE" ? "저장된" : "API") + " 시세 " + priceUSD(fact.price) + ", 24시간 " + changeText(fact.change24h) + "입니다."
      : "핵심 관찰점을 들어보죠."));
    say(analystFor[id], coin?.summary || "제공된 분석이 없어 추가 확인이 필요합니다.");
    if (coin?.technical[0]) say("trader", "가격과 구조를 기준으로 보면 " + coin.technical[0]);
    if (coin?.news[0]) say("altcoin", "최근 확인된 변수는 " + coin.news[0]);
    say("risk", coin?.bearScenario || coin?.risks[0] || "반대 시나리오도 열어 두겠습니다.");
    say(analystFor[id], coin?.bullScenario ? "상방 조건은 " + coin.bullScenario : "상방 근거가 확인되기 전에는 단정하지 않겠습니다.");
    if (coin?.risks[1]) say("risk", "추가 리스크는 " + coin.risks[1]);
    pause(2600);
  }

  screen("SCENARIO");
  say("leader", story?.centralQuestion || "이제 개별 코인을 넘어 시장 전체의 연결고리를 확인하겠습니다.");
  say("onchain", correlations[0] || "코인 간 상대 강도와 생태계 흐름을 함께 확인해야 합니다.");
  if (briefEvents[0]) say("altcoin", briefEvents[0].title + (briefEvents[0].summary && briefEvents[0].summary !== briefEvents[0].title ? " — " + briefEvents[0].summary : ""));
  else say("altcoin", "개별 이벤트와 시장 방향을 분리해서 해석하겠습니다.");
  if (story?.turningPoint) say("market", "전환점은 여기입니다. " + story.turningPoint);
  if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise);
  pause();

  screen("RISK");
  events.push({ type: "EMOTION", speaker: "risk", target: "ALERT", duration: 1800 });
  say("risk", brief.risks[0] || "시장 리스크가 명시되지 않았습니다. 불확실성을 우선 고려하겠습니다.");
  say("market", brief.risks[1] ? "시장 구조 관점에서는 " + brief.risks[1] : "거래량과 시장 폭을 다시 확인하겠습니다.");
  say("trader", "지금 단계에서 중요한 것은 예측보다 어떤 조건이 확인되면 시나리오가 바뀌는지입니다.");
  if (story?.changes?.length) say("leader", "오늘 달라진 점은 " + story.changes.join(" / "));
  pause();

  screen("CONCLUSION");
  say("leader", "오늘의 관찰 목록은 " + (story?.watchItems?.length ? story.watchItems.join(", ") : watchlist.join(", ")) + "입니다.");
  say("trader", story?.endingQuestion || "다음 확인 시점까지 어떤 신호가 실제로 나타나는지 보겠습니다.");
  say("risk", "확인되지 않은 신호만으로 결론을 확대하지 않겠습니다.");
  say("leader", "오늘 회의의 결론은 확정된 사실과 시나리오를 분리해서 기록하겠습니다.");
  say("leader", "회의를 마칩니다. 이 내용은 투자 지시가 아닌 시장 해석입니다.");
  events.push({ type: "END", duration: 1200 });

  const activeDuration = events.slice(0, -1).reduce((sum, event) => sum + (event.duration || 0), 0);
  const scale = activeDuration > 0 ? TARGET_MEETING_MS / activeDuration : 1;
  for (const event of events) {
    if (event.type !== "END" && event.duration) event.duration = Math.max(900, Math.round(event.duration * scale));
  }
  return events;
}