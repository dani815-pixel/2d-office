import { COIN_IDS, type CoinId, type CryptoMarketBrief, type MarketSnapshot, type MeetingEvent, type RoleId } from "../types";
import { changeText, priceUSD } from "../utils/format";

const analystFor: Record<CoinId, RoleId> = {
  BTC: "market", ETH: "onchain", BNB: "altcoin", XRP: "altcoin", SOL: "onchain",
};

export function createMeetingEvents(brief: CryptoMarketBrief, market: MarketSnapshot): MeetingEvent[] {
  const events: MeetingEvent[] = [];
  const screen = (target: string) => events.push({ type: "SCREEN", target, duration: 450 });
  const say = (speaker: RoleId, text: string) => events.push({ type: "SPEAK", speaker, text, duration: Math.min(3900, 1700 + text.length * 26) });

  for (const speaker of ["leader", "market", "onchain", "altcoin", "risk", "trader"] as RoleId[]) {
    events.push({ type: "MOVE", speaker, target: "TABLE", duration: 420 });
  }
  events.push({ type: "LISTEN", duration: 450 });
  screen("OVERVIEW");
  say("leader", "오늘의 시장 브리핑을 시작하겠습니다. 사실과 해석을 구분해서 살펴보죠.");
  say("market", brief.marketSummary);
  say("risk", brief.globalFactors[0] || "거시 환경과 유동성 변화는 계속 확인이 필요합니다.");

  for (const id of COIN_IDS) {
    const coin = brief.coins.find((item) => item.id === id);
    const fact = market.coins.find((item) => item.id === id);
    screen(id);
    say("leader", `${id}를 보겠습니다. ${fact ? `${market.status === "MOCK" ? "예시" : market.status === "STALE" ? "저장된" : "API"} 시세 ${priceUSD(fact.price)}, 24시간 ${changeText(fact.change24h)}입니다.` : "핵심 관찰점을 들어보죠."}`);
    say(analystFor[id], coin?.summary || "제공된 분석이 없어 추가 확인이 필요합니다.");
    say("trader", coin?.technical[0] ? `실행보다 확인이 먼저입니다. ${coin.technical[0]}` : "가격과 거래량의 반응을 함께 관찰하겠습니다.");
    say("risk", coin?.bearScenario || coin?.risks[0] || "반대 시나리오도 열어두어야 합니다.");
    say(analystFor[id], coin?.bullScenario ? `반대로 상방 조건은 ${coin.bullScenario}` : "상방 근거도 확인되기 전에는 단정하지 않겠습니다.");
    say("leader", `${id}는 두 시나리오를 열어 두고 다음 자산으로 넘어가겠습니다.`);
    events.push({ type: "PAUSE", duration: 350 });
  }

  screen("SCENARIO");
  say("leader", "이제 자산 간 연결고리를 짚어보죠.");
  say("onchain", brief.correlations[0] || "BTC와 주요 알트코인의 상대 강도 및 생태계 흐름을 함께 봐야 합니다.");
  say("altcoin", brief.events[0] || "개별 이벤트는 전체 시장 방향과 분리해서 해석하겠습니다.");
  screen("RISK");
  events.push({ type: "EMOTION", speaker: "risk", target: "ALERT", duration: 500 });
  say("risk", brief.risks[0] || "시장 리스크가 명시되지 않았습니다. 불확실성을 우선 고려하겠습니다.");
  say("trader", "확인되지 않은 신호만으로 결론을 내리지 않겠습니다.");
  say("market", brief.risks[1] ? `추가로 ${brief.risks[1]}` : "거래량과 시장 폭을 다시 확인하겠습니다.");
  screen("CONCLUSION");
  say("leader", "오늘의 관찰 목록은 변동폭을 기준으로 정리하고, 시나리오가 바뀌는지 확인하겠습니다.");
  say("leader", "회의를 마칩니다. 이 내용은 투자 지시가 아닌 시장 해석입니다.");
  events.push({ type: "END", duration: 600 });
  return events;
}