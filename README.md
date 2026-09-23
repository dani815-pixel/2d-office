# 2D CRYPTO AI OFFICE

시장 데이터 확인부터 외부 AI 조사, 2D 회의, 보고서, 로컬 기록까지 이어지는 React + Vite + TypeScript 앱입니다. AI API 키 없이 동작합니다.

## 실행

```bash
npm install
npm run dev
npm run build
```

기본 시장 데이터는 [CoinGecko의 keyless `/coins/markets` API](https://docs.coingecko.com/docs/keyless-public-api)를 사용합니다. 선택적으로 `.env.example`을 `.env.local`로 복사하고 `VITE_COINGECKO_DEMO_API_KEY`를 설정할 수 있습니다. `VITE_` 환경 변수는 브라우저에 노출되므로 비밀 키를 넣지 마세요.

## 사용 흐름

1. **Market**: BTC, ETH, BNB, XRP, SOL의 USD 가격, 24시간 변화, 거래량, 시가총액을 확인합니다.
2. **Daily prompt**: 조사 프롬프트를 생성하고 복사해 ChatGPT, Claude, Gemini 등에 전달합니다.
3. **AI import**: 응답을 붙여넣고 미리보기 및 유효성 검사 후 확정합니다. JSON 권장, Markdown 제목 및 일반 텍스트의 `BTC: ...` 형식도 지원합니다. `데모 결과 채우기`로 전체 흐름을 시험할 수 있습니다.
4. **Meeting room**: 여섯 역할의 직원이 Brief를 사용해 회의합니다. 일시정지, 다음 이벤트, 2배속, 종료가 가능합니다. 회의 중 추가 AI 요청은 없습니다.
5. **Report / Archive**: 종료 시 보고서를 만들고 브라우저 localStorage에 최대 20개까지 저장합니다. 보고서 복사와 기록 삭제를 지원합니다.

권장 AI 응답 형식:

```json
{
  "date": "YYYY-MM-DD",
  "marketSummary": "간결한 시장 요약",
  "coins": [
    {
      "id": "BTC",
      "summary": "간결한 해석",
      "technical": ["확인할 기술적 조건"],
      "news": ["제목 | 출처 | 짧은 요약"],
      "bullScenario": "상방 조건",
      "bearScenario": "하방 조건",
      "risks": ["리스크"]
    }
  ],
  "globalFactors": [],
  "events": [],
  "risks": [],
  "correlations": [],
  "sources": []
}
```

실제로는 다섯 코인 모두 포함하세요. 누락된 코인은 미리보기에서 경고를 표시하고 빈 분석으로 채웁니다. 가격은 AI 결과에서 읽지 않으며 CoinGecko 스냅샷이 기준입니다.

## 데이터 상태

- **LIVE**: API 요청 성공. 앱 로드 시 한 번, 이후 수동 새로고침 때만 요청합니다.
- **STALE**: API 실패로 이전에 저장한 시장 스냅샷을 사용합니다.
- **MOCK**: API 및 캐시를 사용할 수 없어 고정 예시 데이터를 사용합니다. 예시 가격은 실시간으로 표시하지 않습니다.
- API 오류는 상태 표시와 안내 문구로 알립니다. 로컬 저장소가 비활성화되어도 현재 세션은 사용할 수 있습니다.

## 구조

`src/services`는 시장 API, 저장소 및 클립보드를, `src/engine`은 프롬프트, 파서, 회의 이벤트 및 보고서 생성 로직을 담당합니다. 중심 상태는 `src/App.tsx`에 있고 CSS/SVG 사무실은 `src/components/Office.tsx`에 있습니다. 실시간 소켓, 자동 뉴스 수집, 음성, AI API 호출, 로그인 및 클라우드 동기화는 포함하지 않습니다.

이 앱은 시장 해석과 시나리오 검토를 위한 도구이며 투자 자문이나 매매 지시가 아닙니다.