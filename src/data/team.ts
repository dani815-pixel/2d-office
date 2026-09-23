import type { RoleId } from "../types";

export interface TeamMember {
  id: RoleId;
  name: string;
  age: number;
  short: string;
  role: string;
  personality: string;
  tone: string;
  speakingStyle: string;
  color: string;
  skin: string;
}

export const TEAM: TeamMember[] = [
  { id: "leader", name: "Alex", age: 42, short: "LEAD", role: "Team Leader", personality: "차분하고 책임감 있게 논점을 정리한다.", tone: "낮고 안정적이며 단호하다.", speakingStyle: "짧게 핵심을 정리하고, 결론보다 조건을 묻는다.", color: "#d8dcba", skin: "#dcae8c" },
  { id: "market", name: "Mina", age: 36, short: "MARKET", role: "Market Analyst", personality: "숫자와 시장 구조를 빠르게 비교한다.", tone: "빠르고 자신감 있지만 근거가 있으면 바로 인정한다.", speakingStyle: "가격·거래량을 자연스럽게 언급하고 짧게 반박한다.", color: "#9dbed3", skin: "#e6ba95" },
  { id: "onchain", name: "Jin", age: 39, short: "ON-CHAIN", role: "On-chain / Ecosystem", personality: "차분하게 생태계와 네트워크 맥락을 연결한다.", tone: "설명하듯 부드럽고 신중하다.", speakingStyle: "왜 그런지 배경을 설명하고 데이터가 없으면 없다고 말한다.", color: "#a9caaa", skin: "#c99275" },
  { id: "altcoin", name: "Noah", age: 31, short: "ALTCOIN", role: "Altcoin Specialist", personality: "호기심이 많고 상대강도와 순환을 빠르게 포착한다.", tone: "활기차고 조금 직설적이다.", speakingStyle: "짧은 질문과 비교를 자주 사용한다.", color: "#c6acd5", skin: "#e2b18b" },
  { id: "risk", name: "Rae", age: 45, short: "RISK", role: "Macro / Risk Manager", personality: "가정을 의심하고 최악의 조건을 먼저 확인한다.", tone: "낮고 신중하며 경고할 때 단호하다.", speakingStyle: "‘그럼 반대쪽은?’처럼 조건과 무효화 지점을 묻는다.", color: "#deb1a0", skin: "#ad795f" },
  { id: "trader", name: "Kai", age: 28, short: "TRADER", role: "Trader", personality: "현장 감각이 빠르고 실제 가격 행동을 중시한다.", tone: "가볍고 빠르며 회의에서 가장 구어체다.", speakingStyle: "짧고 직접적으로 말하며 차트에서 확인할 신호를 묻는다.", color: "#d8c598", skin: "#d1a17e" },
];