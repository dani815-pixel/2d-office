import { COIN_IDS, type CoinId, type CryptoMarketBrief, type MarketSnapshot, type MeetingEvent, type RoleId } from "../types";
import { changeText, priceUSD } from "../utils/format";

const analystFor: Record<CoinId, RoleId> = {
  BTC: "market", ETH: "onchain", BNB: "altcoin", XRP: "altcoin", SOL: "onchain",
};

const TARGET_MEETING_MS = 20 * 60 * 1000;
const ROLES: RoleId[] = ["leader", "market", "onchain", "altcoin", "risk", "trader"];

export function createMeetingEvents(brief: CryptoMarketBrief, market: MarketSnapshot): MeetingEvent[] {
  const events: MeetingEvent[] = [];
  const story = brief.story;
  const mode = story?.mode || "CROSSROADS";
  const globalFactors = brief.globalFactors ?? [];
  const correlations = brief.correlations ?? [];
  const briefEvents = brief.events ?? [];
  const watchlist = [...COIN_IDS]
    .sort((a, b) => Math.abs(market.coins.find((coin) => coin.id === b)?.change24h || 0) - Math.abs(market.coins.find((coin) => coin.id === a)?.change24h || 0))
    .slice(0, 3);

  const screen = (target: string) => events.push({ type: "SCREEN", target, duration: 2200 });
  const pause = (duration = 2200) => events.push({ type: "PAUSE", duration });
  const say = (speaker: RoleId, text: string) => {
    if (!text.trim()) return;
    events.push({
      type: "SPEAK",
      speaker,
      text,
      duration: Math.min(14000, Math.max(7000, 4200 + text.length * 38)),
    });
  };
  const moveToTable = () => {
    for (const speaker of ROLES) events.push({ type: "MOVE", speaker, target: "TABLE", duration: 3200 });
    events.push({ type: "LISTEN", duration: 2500 });
  };
  const coinFact = (id: CoinId) => market.coins.find((coin) => coin.id === id);
  const coinBrief = (id: CoinId) => brief.coins.find((coin) => coin.id === id);
  const coinIntro = (id: CoinId) => {
    const fact = coinFact(id);
    say("leader", id + "를 보겠습니다. " + (fact
      ? (market.status === "MOCK" ? "예시" : market.status === "STALE" ? "저장된" : "API") + " 시세 " + priceUSD(fact.price) + ", 24시간 " + changeText(fact.change24h) + "입니다."
      : "핵심 관찰점을 들어보죠."));
  };
  const coinEvidence = (id: CoinId) => {
    const coin = coinBrief(id);
    say(analystFor[id], coin?.summary || "제공된 분석이 없어 추가 확인이 필요합니다.");
    if (coin?.technical[0]) say("trader", "가격과 구조를 기준으로 보면 " + coin.technical[0]);
    if (coin?.news[0]) say("altcoin", "최근 확인된 변수는 " + coin.news[0]);
    say("risk", coin?.bearScenario || coin?.risks[0] || "반대 시나리오도 열어 두겠습니다.");
    if (coin?.bullScenario) say(analystFor[id], "상방 조건은 " + coin.bullScenario);
    if (coin?.risks[1]) say("risk", "추가 리스크는 " + coin.risks[1]);
  };
  const allCoins = (order: CoinId[] = [...COIN_IDS]) => {
    for (const id of order) {
      screen(id);
      coinIntro(id);
      coinEvidence(id);
      pause(2600);
    }
  };
  const strongestFirst = [...COIN_IDS].sort(
    (a, b) => Math.abs(coinFact(b)?.change24h || 0) - Math.abs(coinFact(a)?.change24h || 0),
  );
  const leadersFirst = strongestFirst.length ? strongestFirst : [...COIN_IDS];

  moveToTable();
  screen("OVERVIEW");
  say("leader", story?.openingHook || "오늘 시장에서 가장 중요한 질문부터 정리하겠습니다.");
  say("market", brief.marketSummary || "시장 전반 요약이 제공되지 않았습니다.");
  say("leader", story?.centralQuestion || "오늘의 가격 움직임이 어떤 조건에서 의미를 갖는지 확인하겠습니다.");
  if (story?.title) say("leader", "오늘 회의의 주제는 '" + story.title + "'입니다.");
  if (globalFactors[0]) say("risk", globalFactors[0]);

  if (mode === "RISK_ALERT") {
    screen("RISK");
    events.push({ type: "EMOTION", speaker: "risk", target: "ALERT", duration: 1800 });
    say("risk", "잠깐. 오늘은 상승 신호보다 먼저 깨질 수 있는 조건을 확인해야 합니다.");
    say("risk", brief.risks[0] || "핵심 리스크 데이터가 충분하지 않습니다.");
    say("market", story?.turningPoint || "시장 구조에서 확인되는 변화부터 다시 보겠습니다.");
    pause();
    allCoins();
  } else if (mode === "CATALYST_COUNTDOWN") {
    screen("SCENARIO");
    say("leader", "오늘의 핵심은 가격 자체보다 예정된 촉매가 어떤 조건을 바꿀 수 있는지입니다.");
    say("market", story?.turningPoint || "확인된 촉매의 영향 범위를 먼저 구분하겠습니다.");
    if (briefEvents[0]) say("altcoin", briefEvents[0].title + (briefEvents[0].summary ? " — " + briefEvents[0].summary : ""));
    say("trader", story?.endingQuestion || "촉매가 실제 시장 데이터에 반영됐다고 볼 조건은 무엇인지 확인하겠습니다.");
    pause();
    allCoins();
  } else if (mode === "ROTATION" || mode === "LEADERSHIP_SHIFT") {
    say("altcoin", mode === "ROTATION" ? "오늘은 자산별 움직임보다 자금과 관심의 이동 순서를 보겠습니다." : "오늘의 질문은 누가 시장의 리더십을 차지하고 있는가입니다.");
    say("market", story?.debateTopics?.[0] || "상대 강도와 거래량을 함께 비교하겠습니다.");
    allCoins(leadersFirst);
    screen("SCENARIO");
    say("altcoin", story?.turningPoint || "상대 강도 변화가 지속되는지 확인해야 합니다.");
    if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise);
  } else if (mode === "CORRELATION_BREAK" || mode === "DIVERGENCE") {
    say("market", mode === "DIVERGENCE" ? "같은 시장인데도 움직임이 달라진 자산을 먼저 비교하겠습니다." : "평소 함께 움직이던 관계가 달라졌는지부터 확인하겠습니다.");
    say("onchain", correlations[0] || "비교 가능한 상관관계 데이터가 제한적이므로 가격과 거래량을 함께 보겠습니다.");
    const topics = story?.debateTopics ?? [];
    topics.slice(0, 2).forEach((topic, index) => say(index === 0 ? "market" : "risk", topic));
    allCoins();
    screen("SCENARIO");
    if (story?.turningPoint) say("market", "전환점은 여기입니다. " + story.turningPoint);
    if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise);
  } else if (mode === "BREAKOUT_TENSION") {
    screen("SCENARIO");
    say("trader", "움직임이 나왔다는 사실과 조건이 확인됐다는 것은 다릅니다. 어떤 조건을 통과해야 하는지 보겠습니다.");
    say("market", story?.debateTopics?.[0] || "가격과 거래량이 함께 확인되는지 살펴보겠습니다.");
    allCoins(leadersFirst);
    screen("SCENARIO");
    say("trader", story?.turningPoint || "다음 확인 지점에서 조건이 유지되는지가 핵심입니다.");
  } else if (mode === "QUIET_BEFORE_MOVE") {
    say("leader", "오늘은 결론을 서두르지 않는 것이 오히려 중요한 회의입니다.");
    say("risk", story?.debateTopics?.[0] || "서로 반대되는 신호가 있는지 확인하겠습니다.");
    allCoins();
    screen("SCENARIO");
    say("market", story?.turningPoint || "아직 해소되지 않은 변수가 무엇인지 정리하겠습니다.");
    say("trader", story?.endingQuestion || "다음 움직임을 확인할 관찰 조건을 남기겠습니다.");
  } else {
    const topics = story?.debateTopics ?? [];
    topics.slice(0, 3).forEach((topic, index) => say(index === 0 ? "market" : index === 1 ? "risk" : "trader", topic));
    allCoins();
    screen("SCENARIO");
    if (story?.turningPoint) say("market", "전환점은 여기입니다. " + story.turningPoint);
    if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise);
  }

  screen("RISK");
  events.push({ type: "EMOTION", speaker: "risk", target: "ALERT", duration: 1800 });
  say("risk", brief.risks[0] || "시장 리스크가 명시되지 않았습니다. 불확실성을 우선 고려하겠습니다.");
  say("market", brief.risks[1] ? "시장 구조 관점에서는 " + brief.risks[1] : "거래량과 시장 폭을 다시 확인하겠습니다.");
  say("trader", "예측보다 어떤 조건이 확인되면 시나리오가 바뀌는지 정리하겠습니다.");
  if (story?.changes?.length) say("leader", "오늘 달라진 점은 " + story.changes.join(" / "));
  pause();

  screen("CONCLUSION");
  say("leader", "오늘의 관찰 목록은 " + (story?.watchItems?.length ? story.watchItems.join(", ") : watchlist.join(", ")) + "입니다.");
  say("trader", story?.endingQuestion || "다음 확인 시점까지 어떤 신호가 실제로 나타나는지 보겠습니다.");
  say("risk", "확인되지 않은 신호만으로 결론을 확대하지 않겠습니다.");
  say("leader", "확정된 사실과 시나리오를 분리해서 기록하겠습니다.");
  say("leader", "회의를 마칩니다. 이 내용은 투자 지시가 아닌 시장 해석입니다.");
  events.push({ type: "END", duration: 1200 });

  const activeDuration = events.slice(0, -1).reduce((sum, event) => sum + (event.duration || 0), 0);
  const scale = activeDuration > 0 ? TARGET_MEETING_MS / activeDuration : 1;
  for (const event of events) {
    if (event.type !== "END" && event.duration) event.duration = Math.max(900, Math.round(event.duration * scale));
  }
  return events;
}