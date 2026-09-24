import type { CoinId, TraderProfile, TraderSettings } from "../types";

export const TRADING_TEAM: TraderProfile[] = [
  { id: "team-lead", name: "김태훈", coin: "TEAM", role: "TEAM_LEAD", personality: "차분하고 조건을 확인한 뒤 결정을 내린다.", speakingStyle: "짧게 질문하고 리스크와 무효화 조건을 먼저 확인한다.", specialty: "전체 포지션과 팀 리스크 관리" },
  { id: "btc-trader", name: "김민준", coin: "BTC", role: "SPECIALIST", personality: "보수적이고 시장 구조를 중시한다.", speakingStyle: "추세와 확인 조건을 차분하게 설명한다.", specialty: "BTC 추세 / 시장 구조" },
  { id: "eth-trader", name: "이서준", coin: "ETH", role: "SPECIALIST", personality: "논리적이고 구조 변화에 민감하다.", speakingStyle: "돌파 조건과 실패 조건을 분리해서 말한다.", specialty: "ETH 돌파 / 구조 변화" },
  { id: "bnb-trader", name: "박도윤", coin: "BNB", role: "SPECIALIST", personality: "빠르고 상대강도 변화에 민감하다.", speakingStyle: "다른 코인과 비교하며 짧게 판단한다.", specialty: "BNB 상대강도 / 순환" },
  { id: "xrp-trader", name: "최현우", coin: "XRP", role: "SPECIALIST", personality: "변동성과 수급 변화에 신중하다.", speakingStyle: "급격한 움직임의 지속 여부를 확인한다.", specialty: "XRP 변동성 / 수급" },
  { id: "sol-trader", name: "정우진", coin: "SOL", role: "SPECIALIST", personality: "빠르고 모멘텀 변화에 적극적이다.", speakingStyle: "가격 행동과 진입 타이밍을 직접적으로 말한다.", specialty: "SOL 모멘텀 / 단기 가격행동" },
];

export const DEFAULT_TRADER_SETTINGS: Record<string, TraderSettings> = {
  "team-lead": { mode: "FUTURES", strategy: "RISK CONTROL", riskPercent: 1, leverage: 3, confirmation: ["TEAM REVIEW"], allowLong: true, allowShort: true, autoSimulation: false },
  "btc-trader": { mode: "FUTURES", strategy: "TREND", riskPercent: 1, leverage: 3, stopLossPercent: 1.2, takeProfitPercent: 2.5, confirmation: ["PRICE", "VOLUME"], allowLong: true, allowShort: true, autoSimulation: false },
  "eth-trader": { mode: "FUTURES", strategy: "BREAKOUT", riskPercent: 0.8, leverage: 3, stopLossPercent: 1, takeProfitPercent: 2.2, confirmation: ["PRICE", "VOLUME"], allowLong: true, allowShort: true, autoSimulation: false },
  "bnb-trader": { mode: "SPOT", strategy: "RELATIVE STRENGTH", riskPercent: 0.8, leverage: 1, confirmation: ["RELATIVE STRENGTH"], allowLong: true, allowShort: false, autoSimulation: false },
  "xrp-trader": { mode: "FUTURES", strategy: "VOLATILITY", riskPercent: 0.6, leverage: 2, stopLossPercent: 1.5, takeProfitPercent: 3, confirmation: ["VOLATILITY", "LIQUIDITY"], allowLong: true, allowShort: true, autoSimulation: false },
  "sol-trader": { mode: "FUTURES", strategy: "MOMENTUM", riskPercent: 0.5, leverage: 2, stopLossPercent: 1.5, takeProfitPercent: 3, confirmation: ["PRICE ACTION"], allowLong: true, allowShort: true, autoSimulation: false },
};

export const specialistForCoin = (coin: CoinId) => TRADING_TEAM.find((member) => member.coin === coin)!;
