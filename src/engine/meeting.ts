import { COIN_IDS, type CoinId, type CryptoMarketBrief, type MarketSnapshot, type MeetingEvent, type MeetingMemory, type RoleId, type TradingTeamState } from "../types";


const analystFor: Record<CoinId, RoleId> = {
  BTC: "market", ETH: "onchain", BNB: "altcoin", XRP: "altcoin", SOL: "onchain",
};

const TARGET_MEETING_MS = 20 * 60 * 1000;

export function createMeetingEvents(brief: CryptoMarketBrief, market: MarketSnapshot, previousMemory?: MeetingMemory, trading?: TradingTeamState): MeetingEvent[] {
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
  const turningPoint = (text: string, speaker: RoleId = "leader") => {
    if (!text.trim()) return;
    screen("TURNING_POINT");
    events.push({ type: "EMOTION", speaker, target: "ALERT", duration: 1800 });
    say(speaker, text, "TURNING_POINT");
    pause(3200);
  };
  const pause = (duration = 2200) => events.push({ type: "PAUSE", duration });
  const splitSpeech = (text: string, maxLength = 92): string[] => {
    const clean = text.trim();
    if (clean.length <= maxLength) return [clean];
    const sentences = clean.split(/(?<=[.!?。！？])\s*/).filter(Boolean);
    const chunks: string[] = [];
    let current = "";
    for (const sentence of sentences) {
      if (!current) current = sentence;
      else if ((current + " " + sentence).length <= maxLength) current += " " + sentence;
      else { chunks.push(current); current = sentence; }
    }
    if (current) chunks.push(current);
    if (chunks.length === 1) {
      chunks.length = 0;
      for (let i = 0; i < clean.length; i += maxLength) chunks.push(clean.slice(i, i + maxLength));
    }
    return chunks;
  };

  const say = (
    speaker: RoleId,
    text: string,
    intent: MeetingEvent["intent"] = "STATEMENT",
    replyTo?: RoleId,
  ) => {
    for (const chunk of splitSpeech(text)) {
      events.push({
        type: "SPEAK",
        speaker,
        text: chunk,
        intent,
        replyTo,
        duration: Math.min(14000, Math.max(5000, 3200 + chunk.length * 34)),
      });
    }
  };
  const characterLead: Record<RoleId, string> = {
    leader: "좋습니다. 핵심만 짚어보죠.",
    market: "숫자를 놓고 보면 조금 다르게 보입니다.",
    onchain: "맥락을 하나 더 붙여서 볼 필요가 있습니다.",
    altcoin: "저는 알트 흐름을 같이 봐야 한다고 봐요.",
    risk: "잠깐, 반대 조건도 확인해보죠.",
    trader: "차트에서는 이 부분이 먼저 보여요.",
  };
  const voice = (role: RoleId, kind: "challenge" | "question" | "summary" | "evidence") => {
    const lines: Record<RoleId, Record<string, string>> = {
      leader: { challenge: "잠시 정리하죠. 이 주장의 핵심 조건부터 보겠습니다.", question: "그렇다면 무엇을 확인해야 판단을 바꿀 수 있을까요?", summary: "좋습니다. 핵심 조건을 회의 기록에 남기겠습니다.", evidence: "이 부분은 확인된 사실과 해석을 분리해서 보겠습니다." },
      market: { challenge: "가격만으로는 부족합니다. 반대 데이터도 확인해야 합니다.", question: "가격과 거래량이 함께 확인되는 조건은 무엇입니까?", summary: "시장 데이터 기준으로 핵심 변수를 정리하겠습니다.", evidence: "가격 구조와 거래량에서 확인되는 근거를 보겠습니다." },
      onchain: { challenge: "온체인이나 생태계 흐름까지 보면 다른 해석이 가능합니다.", question: "네트워크 지표에서도 같은 변화가 확인됩니까?", summary: "시장 외부 데이터와 함께 교차검증하겠습니다.", evidence: "생태계 데이터에서 확인되는 변화부터 보겠습니다." },
      altcoin: { challenge: "알트 쪽 흐름을 보면 그 결론은 아직 이릅니다.", question: "상대 강도 차이가 실제 자금 이동으로 이어졌습니까?", summary: "자산 간 차이를 기준으로 정리하겠습니다.", evidence: "알트 상대강도와 순환 흐름을 확인하겠습니다." },
      risk: { challenge: "반대 시나리오를 놓치면 안 됩니다. 깨지는 조건부터 보죠.", question: "이 가정이 틀렸다고 판단할 기준은 무엇입니까?", summary: "리스크 조건과 무효화 지점을 기록하겠습니다.", evidence: "하방 조건과 불확실성을 우선 확인하겠습니다." },
      trader: { challenge: "차트에서는 아직 확정 신호로 보기 어렵습니다.", question: "실제 움직임으로 인정할 확인 신호가 있습니까?", summary: "확인 전까지는 시나리오로만 관리하겠습니다.", evidence: "가격 행동과 구조가 말하는 근거부터 보겠습니다." },
    };
    return lines[role][kind];
  };
  const react = (speaker: RoleId, target: "THINK" | "ALERT" = "THINK") => {
    events.push({ type: "EMOTION", speaker, target, duration: target === "ALERT" ? 1100 : 900 });
  };
  const debate = (
    topic: string,
    proposer: RoleId,
    challenger: RoleId,
    response: RoleId = proposer,
  ) => {
    const cleanTopic = topic.trim();
    if (!cleanTopic) return;
    const topicShort = cleanTopic.length > 70 ? cleanTopic.slice(0, 70) + "…" : cleanTopic;
    say("leader", "첫 번째 쟁점입니다. " + cleanTopic, "QUESTION");
    pause(900);
    say(proposer, cleanTopic, "STATEMENT", "leader");
    pause(1400);
    react(challenger);
    const challengerLead = characterLead[challenger];
    say(challenger, challengerLead + " " + topicShort + "만으로 결론을 내리기는 이릅니다.", "CHALLENGE", proposer);
    react(response, "ALERT");
    say(response, "맞습니다. 그럼 이걸 확인해보죠. " + voice(response, "question"), "QUESTION", challenger);
    pause(1200);
    react(challenger);
    say(challenger, "그 조건이 확인되면 방금 주장의 신뢰도가 올라갈 수 있습니다. 반대로 확인되지 않으면 해석을 낮춰야 합니다.", "REPLY", response);
    react("risk", "ALERT");
    say("risk", "한 가지 더 보죠. " + topicShort + "이 반대로 움직일 가능성도 열어두겠습니다.", "CHALLENGE", challenger);
    react("leader");
    say("leader", "좋습니다. 지금까지 나온 의견을 나누면, 확인된 사실과 해석을 분리할 수 있습니다.", "SUMMARY", "risk");
    say("leader", "이제 제가 정리하겠습니다. 다음 순서는 이 해석을 검증할 데이터, 반대 조건, 그리고 실제 가격 행동입니다.", "QUESTION", "risk");
  };
  const evidenceDebate = (id: CoinId) => {
    const coin = coinBrief(id);
    const analyst = analystFor[id];
    if (!coin) return;
    say(analyst, coin.summary || "제공된 분석이 없어 추가 확인이 필요합니다.", "STATEMENT");
    if (coin.interpretation) {
      react(analyst);
      say(analyst, "제 해석은 " + coin.interpretation, "STATEMENT");
    }
    if (coin.counterView) {
      react("risk", "ALERT");
      say("risk", "반대로 보면 " + coin.counterView, "CHALLENGE", analyst);
    }
    if (coin.verification?.[0]) {
      react("trader");
      say("trader", "그 해석을 확인하려면 " + coin.verification[0] + "부터 보겠습니다.", "QUESTION", "risk");
    }
    if (coin.technical[0]) {
      react("trader");
      say("trader", "방금 말씀하신 흐름에서 제가 확인하고 싶은 건 " + coin.technical[0], "EVIDENCE", analyst);
      react(analyst, "ALERT");
      say(analyst, "네, 그 지표는 중요한 단서입니다. 다만 이것만으로 방향을 확정하지 말고 다른 조건과 같이 보겠습니다.", "REPLY", "trader");
    }
    if (coin.news[0]) {
      react("altcoin");
      say("altcoin", "최근 확인된 변수는 " + coin.news[0], "EVIDENCE", analyst);
      react("risk", "ALERT");
      say("risk", "이 변수가 실제 가격에 반영됐다고 단정할 근거가 충분한지도 보겠습니다.", "CHALLENGE", "altcoin");
    }
    say("risk", coin.bearScenario || coin.risks[0] || "반대 시나리오도 열어 두겠습니다.", "CHALLENGE", analyst);
    if (coin.bullScenario) {
      say(analyst, "상방 조건은 " + coin.bullScenario, "REPLY", "risk");
      say("trader", "그 조건이 확인되기 전까지는 시나리오로만 기록하겠습니다.", "SUMMARY", analyst);
    }
    if (coin.risks?.[1]) say("risk", "추가 리스크는 " + coin.risks[1], "EVIDENCE", analyst);
  };
  const previousOpen = previousMemory?.openFollowUps ?? [];
  const previousResolved = previousMemory?.resolvedFollowUps ?? [];
  const completedTrades = trading?.trades
    ? [...trading.trades].sort((a, b) => new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()).slice(0, 3)
    : [];
  const traderName = (id: string) => trading?.profiles.find((member) => member.id === id)?.name || id;
  const tradingReview = () => {
    if (!completedTrades.length) return;
    screen("TRADING_REVIEW");
    say("leader", "지난 거래부터 짚고 가죠. 결과를 현재 시장 판단과 섞지 말고, 확인된 사실부터 보겠습니다.", "QUESTION");
    for (const trade of completedTrades) {
      const review = trading?.reviews.find((item) => item.tradeId === trade.id);
      const name = traderName(trade.traderId);
      say("trader", name + " 담당 거래입니다. " + trade.coin + " " + trade.side + ", 진입 " + trade.entryPrice.toFixed(2) + ", 청산 " + trade.exitPrice.toFixed(2) + ", PnL " + trade.pnl.toFixed(2) + " USD, " + trade.closeReason + "로 종료됐습니다.", "EVIDENCE", "leader");
      if (review?.facts?.[0]) say("trader", "기록상 사실은 " + review.facts[0] + "입니다.", "EVIDENCE", "leader");
      if (review?.interpretation?.[0]) say("risk", "해석은 " + review.interpretation[0] + "이지만, 결과만으로 원인을 확정하지는 않겠습니다.", "CHALLENGE", "trader");
      if (review?.possibleCauses?.[0]) say("risk", review.possibleCauses[0], "QUESTION", "trader");
      if (review?.lessons?.[0]) say("trader", "이번 복기에서 남은 교훈은 " + review.lessons[0], "SUMMARY", "risk");
      if (review?.improvement) say("leader", "좋습니다. 다음 시나리오에서는 " + review.improvement + "을 확인 조건으로 다시 검증하죠.", "SUMMARY", "trader");
      pause(900);
    }
    say("leader", "복기 결과는 과거 거래에 대한 학습 자료로만 남기고, 오늘 시장 방향은 오늘 확인되는 데이터로 다시 판단하겠습니다.", "SUMMARY");
    pause(1400);
  };
  const continuityIntro = () => {
    if (!previousMemory) return;
    say("leader", "지난 회의에서 남겨둔 질문부터 보겠습니다. " + previousMemory.question, "SUMMARY");
    if (previousOpen.length) {
      const item = previousOpen[0];
      say("leader", "아직 열려 있는 건 이겁니다. " + item.text, "QUESTION");
      const coin = item.coin ? coinBrief(item.coin) : undefined;
      if (coin?.verification?.[0]) {
        say("leader", "오늘은 " + coin.verification[0] + "을 확인해서 이 질문을 좁혀보죠.", "QUESTION");
      } else {
        say("leader", "오늘 확인되는 데이터가 있는지부터 보겠습니다.", "QUESTION");
      }
    } else if (previousResolved.length) {
      say("leader", "지난 회의에서 확인하기로 한 항목은 오늘 자료에서 답이 나온 부분부터 정리하죠.", "SUMMARY");
    } else {
      say("leader", "지난 회의의 핵심을 기준으로 오늘 달라진 점부터 보겠습니다.", "SUMMARY");
    }
    pause(1800);
  };

  const moveToTable = () => {
    events.push({ type: "MOVE", target: "TABLE", duration: 3200 });
    events.push({ type: "LISTEN", duration: 2500 });
  };
  const coinFact = (id: CoinId) => market.coins.find((coin) => coin.id === id);
  const coinBrief = (id: CoinId) => brief.coins.find((coin) => coin.id === id);
  const coinIntro = (id: CoinId) => {
    const fact = coinFact(id);
    say("leader", id + "를 보겠습니다. " + (fact
      ? "현재 시세는 {{PRICE:" + id + "}}, 24시간 변동은 {{CHANGE:" + id + "}}입니다."
      : "핵심 관찰점을 들어보죠."), "STATEMENT");
  };
  const coinEvidence = (id: CoinId) => {
    const coin = coinBrief(id);
    if (!coin) return;
    const analyst = analystFor[id];
    say("leader", id + "에서 무엇이 실제로 중요한지부터 보겠습니다. " + (coin.advancedSignals?.length ? "일반적인 가격 설명을 넘어 전문 지표까지 확인하죠." : "확인 가능한 근거부터 짚겠습니다."), "QUESTION");
    evidenceDebate(id);
    if (coin.advancedSignals?.length) {
      const signal = coin.advancedSignals[0];
      say(analyst, "전문 지표를 하나 보면 " + signal, "EVIDENCE", "leader");
      say("leader", "좋습니다. 그 지표가 가격 움직임과 같은 방향인지, 아니면 엇갈리는지 확인해보죠.", "QUESTION", analyst);
      if (coin.advancedSignals[1]) say("risk", "두 번째로는 " + coin.advancedSignals[1] + "도 같이 보겠습니다.", "CHALLENGE", analyst);
      say("trader", "그럼 차트에서 확인할 포인트는 이 지표가 실제 가격 행동으로 이어지는지입니다.", "SUMMARY", "leader");
    }
    say("leader", id + " 논쟁은 여기까지 정리하죠. 확인된 사실, 해석, 그리고 판단을 바꿀 조건을 기록하겠습니다.", "SUMMARY");
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
  continuityIntro();
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
    if (story?.turningPoint) turningPoint(story.turningPoint, "altcoin");
    if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise, "EVIDENCE", "altcoin");
  } else if (mode === "CORRELATION_BREAK" || mode === "DIVERGENCE") {
    say("market", mode === "DIVERGENCE" ? "같은 시장인데도 움직임이 달라진 자산을 먼저 비교하겠습니다." : "평소 함께 움직이던 관계가 달라졌는지부터 확인하겠습니다.");
    say("onchain", correlations[0] || "비교 가능한 상관관계 데이터가 제한적이므로 가격과 거래량을 함께 보겠습니다.");
    const topics = story?.debateTopics ?? [];
    if (topics[0]) debate(topics[0], "market", "risk");
    if (topics[1]) debate(topics[1], "risk", "trader", "market");
    allCoins();
    if (story?.turningPoint) turningPoint(story.turningPoint, "market");
    if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise, "EVIDENCE", "market");
  } else if (mode === "BREAKOUT_TENSION") {
    screen("SCENARIO");
    say("trader", "움직임이 나왔다는 사실과 조건이 확인됐다는 것은 다릅니다. 어떤 조건을 통과해야 하는지 보겠습니다.");
    if (story?.debateTopics?.[0]) debate(story.debateTopics[0], "market", "risk", "trader");
    else say("market", "가격과 거래량이 함께 확인되는지 살펴보겠습니다.", "QUESTION");
    allCoins(leadersFirst);
    if (story?.turningPoint) turningPoint(story.turningPoint, "trader");
  } else if (mode === "QUIET_BEFORE_MOVE") {
    say("leader", "오늘은 결론을 서두르지 않는 것이 오히려 중요한 회의입니다.");
    if (story?.debateTopics?.[0]) debate(story.debateTopics[0], "risk", "market", "leader");
    else say("risk", "서로 반대되는 신호가 있는지 확인하겠습니다.", "QUESTION");
    allCoins();
    if (story?.turningPoint) turningPoint(story.turningPoint, "market");
    say("trader", story?.endingQuestion || "다음 움직임을 확인할 관찰 조건을 남기겠습니다.");
  } else {
    const topics = story?.debateTopics ?? [];
    if (topics[0]) debate(topics[0], "market", "risk");
    if (topics[1]) debate(topics[1], "risk", "trader", "market");
    if (topics[2]) debate(topics[2], "trader", "onchain", "leader");
    allCoins();
    if (story?.turningPoint) turningPoint(story.turningPoint, "market");
    if (story?.surprise && story.surprise !== "없음") say("onchain", "의외의 관찰은 " + story.surprise, "EVIDENCE", "market");
  }

  tradingReview();

  screen("TRADING_DESK");
  say("leader", "이제 회의에서 나온 해석을 가상 트레이딩 시나리오로 바꿔보죠. 지금은 주문이 아니라 조건을 정리합니다.", "QUESTION");
  const tradingCoins = [...COIN_IDS]
    .sort((a, b) => Math.abs(coinFact(b)?.change24h || 0) - Math.abs(coinFact(a)?.change24h || 0))
    .slice(0, 3);
  for (const id of tradingCoins) {
    const coin = coinBrief(id);
    if (!coin) continue;
    const analyst = analystFor[id];
    say(analyst, id + "는 상방 조건을 " + (coin.bullScenario || "추가 확인") + "로 보고, 반대 조건은 " + (coin.bearScenario || "추가 확인") + "입니다.", "EVIDENCE", "leader");
    if (coin.verification?.[0]) {
      say("trader", id + " 가상 시나리오는 " + coin.verification[0] + "이 확인될 때만 검토하겠습니다.", "QUESTION", analyst);
    } else {
      say("trader", id + "는 확인 조건이 부족해서 우선 WATCH로 두겠습니다.", "SUMMARY", analyst);
    }
    say("risk", id + "는 무효화 조건을 먼저 봐야 합니다. " + (coin.risks?.[0] || coin.bearScenario || "추가 리스크 확인"), "CHALLENGE", "trader");
    say("leader", id + "에 대한 팀 판단은 조건부 시나리오로 기록하고, 확인 전에는 가상 주문도 자동 실행하지 않습니다.", "SUMMARY");
    pause(900);
  }
  say("trader", "좋아요. 진입보다 확인 조건과 무효화 조건을 먼저 들고 트레이딩룸으로 넘기겠습니다.", "SUMMARY", "leader");
  say("leader", "회의 종료 후에는 각 코인 담당자가 시나리오를 검토하고, 김태훈 팀장이 승인 여부를 확인합니다.", "SUMMARY", "trader");
  pause(1600);

  screen("RISK");
  events.push({ type: "EMOTION", speaker: "risk", target: "ALERT", duration: 1800 });
  say("risk", brief.risks[0] || "시장 리스크가 명시되지 않았습니다. 불확실성을 우선 고려하겠습니다.");
  say("market", brief.risks[1] ? "시장 구조 관점에서는 " + brief.risks[1] : "거래량과 시장 폭을 다시 확인하겠습니다.");
  say("trader", "예측보다 어떤 조건이 확인되면 시나리오가 바뀌는지 정리하겠습니다.", "QUESTION", "market");
  if (story?.changes?.length) say("leader", "오늘 달라진 점은 " + story.changes.join(" / "));
  pause();

  screen("CONCLUSION");
  if (previousOpen.length) {
    const next = previousOpen[0];
    say("leader", "오늘 확인하지 못한 부분은 다음 회의로 넘기겠습니다: " + next.text, "SUMMARY");
  }
  say("leader", "오늘의 관찰 목록은 " + (story?.watchItems?.length ? story.watchItems.join(", ") : watchlist.join(", ")) + "입니다.");
  if (brief.viewerTakeaways?.length) say("leader", "메모할 핵심은 " + brief.viewerTakeaways.join(" / ") + "입니다.", "SUMMARY");
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