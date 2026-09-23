export const MOCK_MARKET: MarketSnapshot = {
  timestamp: "2025-01-01T00:00:00.000Z",
  status: "MOCK",
  coins: [
    { id: "BTC", symbol: "BTC", price: 93500, change24h: 1.25, volume24h: 32000000000, marketCap: 1850000000000 },
    { id: "ETH", symbol: "ETH", price: 3350, change24h: -0.82, volume24h: 16500000000, marketCap: 402000000000 },
    { id: "BNB", symbol: "BNB", price: 695, change24h: 0.64, volume24h: 1900000000, marketCap: 101000000000 },
    { id: "XRP", symbol: "XRP", price: 2.31, change24h: -1.18, volume24h: 4100000000, marketCap: 133000000000 },
    { id: "SOL", symbol: "SOL", price: 189, change24h: 2.43, volume24h: 3800000000, marketCap: 91000000000 },
  ],
};

export const DEMO_RESEARCH = JSON.stringify({
  date: localISODate(),
  marketSummary: "데모 분석입니다. 실제 시장 조사 결과가 아니며, 가격 방향보다 거래량과 거시 변수의 확인이 중요합니다.",
  coins: [
    { id: "BTC", summary: "BTC의 단기 흐름은 거래량 확인이 필요합니다.", technical: ["주요 가격대에서 거래량 변화 관찰"], news: [], bullScenario: "거래량이 동반되면 강세 지속 가능성을 관찰합니다.", bearScenario: "거래량이 약해지면 되돌림 가능성을 점검합니다.", risks: ["급격한 변동성"] },
    { id: "ETH", summary: "ETH는 BTC와의 상대 강도 변화를 살펴볼 구간입니다.", technical: ["상대 강도 변화 확인"], news: [], bullScenario: "상대 강도가 개선되면 추가 움직임을 관찰합니다.", bearScenario: "상대 강도가 약해지면 보수적으로 해석합니다.", risks: ["유동성 변화"] },
    { id: "BNB", summary: "BNB는 생태계 흐름과 거래량을 함께 확인합니다.", technical: ["거래량 추세 점검"], news: [], bullScenario: "참여가 늘면 강세 시나리오를 검토합니다.", bearScenario: "참여가 줄면 상승 지속성을 재평가합니다.", risks: ["생태계 관련 변수"] },
    { id: "XRP", summary: "XRP는 이벤트 관련 변동성에 유의합니다.", technical: ["변동폭 확인"], news: [], bullScenario: "불확실성이 줄어들면 안정화 가능성을 봅니다.", bearScenario: "불확실성이 커지면 하방 변동성을 경계합니다.", risks: ["이벤트 리스크"] },
    { id: "SOL", summary: "SOL은 시장 위험 선호도와 네트워크 흐름을 함께 봅니다.", technical: ["상대 강도 점검"], news: [], bullScenario: "위험 선호가 유지되면 상대 강도를 확인합니다.", bearScenario: "시장 심리가 약해지면 변동성 확대를 경계합니다.", risks: ["높은 변동성"] },
  ],
  globalFactors: ["거시경제 발표 일정 확인", "시장 전반의 유동성 변화 관찰"],
  risks: ["데모 데이터는 투자 판단에 사용하지 마세요.", "거시 변수 및 거래량 확인 필요"],
  sources: ["Demo example only - not an external research source"],
}, null, 2);
