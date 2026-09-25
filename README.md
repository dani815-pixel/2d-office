# 2D CRYPTO AI OFFICE

> Real-time Crypto Market → External AI Research → CryptoMarketBrief → Story-driven 2D Meeting → Trading Desk → Local Virtual Trading → Review → Next Meeting

**BTC · ETH · BNB · XRP · SOL** 5개 자산을 중심으로 실시간 시장 데이터와 외부 AI 리서치를 결합해, 2D 오피스 회의와 로컬 가상 트레이딩까지 연결하는 **React + Vite + TypeScript** 프로젝트입니다.

현재 앱 내부에서 AI API를 직접 호출하지 않고 **External AI Research → Copy/Paste → Parse** 구조를 사용합니다.

---

## 1. 핵심 목표

단순한 암호화폐 대시보드가 아니라 매일의 시장 분석을 **회의 콘텐츠 → 트레이딩 시나리오 → 가상 거래 → 복기 → 다음 회의**로 연결하는 것이 목표입니다.

```
Real-time Market
      ↓
Daily Research Prompt
      ↓
External AI Research
      ↓
Copy / Paste
      ↓
AI Result Parser
      ↓
CryptoMarketBrief
      ↓
Story Engine
      ↓
2D AI Meeting
      ↓
Trading Desk
      ↓
Trading Room
      ↓
Team Lead Decision
      ↓
Virtual Trade
      ↓
Trade Review / Trader Memory
      ↓
Next Daily Prompt / Next Meeting
```

핵심 원칙:

- AI 응답이 UI나 HTML을 직접 실행하지 않음
- AI 결과는 Parser를 거쳐 표준 모델로 정규화
- 회의는 `MeetingEvent[]`로 생성
- 실시간 시장값과 AI 리서치값의 책임을 분리
- 실제 거래소 주문은 하지 않음
- 외부 AI는 거래의 **판단 기준**만 제공하고 최종 승인/거절은 팀장이 결정

---

## 2. 지원 자산

현재 핵심 자산은 다음 5개로 고정합니다.

- BTC
- ETH
- BNB
- XRP
- SOL

회의 캐릭터는 코인에 1:1 고정되지 않고 역할 중심으로 구성합니다.

---

## 3. Market Data

현재 시장 데이터 구조:

```
CoinGecko REST
    ↓
Initial MarketSnapshot
    ├─ marketCap
    └─ initial market fields

Binance WebSocket
    ↓
1초 buffer / flush
    ↓
Live MarketSnapshot
    ├─ price
    ├─ change24h
    ├─ volume24h
    ├─ high24h
    └─ low24h
```

### Source of Truth

| 데이터 | 현재 소스 |
|---|---|
| 가격 | Binance WebSocket |
| 24H 변화 | Binance WebSocket |
| 24H 거래량 | Binance WebSocket |
| 24H 고가 | Binance WebSocket |
| 24H 저가 | Binance WebSocket |
| Market Cap | CoinGecko 보조 데이터 |

지원 Binance stream:

- BTCUSDT
- ETHUSDT
- BNBUSDT
- XRPUSDT
- SOLUSDT

### Fallback

```
CoinGecko
   ↓ 실패
Cached Snapshot
   ↓ 실패
Mock Data
```

Market status:

- `LIVE`
- `STALE`
- `MOCK`
- `ERROR`

현재 Market Data Status와 WebSocket Connection Status는 별도 모델로 완전히 분리되어 있지 않으며, 장시간 안정화 단계에서 분리할 예정입니다.

---

## 4. Daily AI Research

`src/engine/prompt.ts`가 외부 AI용 Daily Research Prompt를 생성합니다.

Prompt에는 다음이 포함됩니다.

- 현재 날짜
- 현재 시장 snapshot
- BTC / ETH / BNB / XRP / SOL 시장 데이터
- 이전 회의 Memory
- 시장 전체 분석
- 코인별 분석
- 최근 뉴스 및 출처
- Story Engine
- 사실 / 해석 / 불확실성 구분
- 검증 조건
- Trading Scenario 조건
- 이전 거래 Memory

### Token Budget

불필요한 입력을 줄이기 위해:

- Prompt 최대 약 12,000 characters
- 시장 데이터 compact 표현
- 뉴스 최대 3개 수준
- source 수 제한
- 이전 회의는 최신 1 session만 전달
- trader memory도 핵심 lesson / strategy / risk 위주로 압축

---

## 5. External AI Output

외부 AI는 **ONE CANVAS / ONE DOCUMENT** 형태의 최종 결과를 생성하도록 요구합니다.

권장 흐름:

```
Daily Prompt
   ↓
External AI
   ↓
ONE CANVAS
   ↓
전체 복사
   ↓
AI IMPORT
   ↓
Parser
```

출력 원칙:

- JSON 하나
- BTC / ETH / BNB / XRP / SOL 각각 정확히 한 번
- reasoning 출력 금지
- URL / Markdown link / citation marker 금지
- JSON 내부 comment / trailing comma 금지
- 검증되지 않은 뉴스나 수치를 임의 생성하지 않음

---

## 6. AI Result Parser

`src/engine/parser.ts`는 외부 AI 결과를 `CryptoMarketBrief`로 정규화합니다.

지원:

- JSON
- JSON code fence
- Markdown
- Plain text
- 간단한 코인별 텍스트

처리:

```
Raw AI Result
    ↓
Format Detection
    ↓
Extraction
    ↓
Validation
    ↓
Normalization
    ↓
CryptoMarketBrief
```

검증:

- JSON 구조
- 코인 ID
- 중복 코인
- 누락 코인
- 필수 필드
- trading schema
- advanced signals
- story mode
- events
- URL / citation sanitize

Import Preview 상태:

- `PARSING`
- `VALID`
- `WARNING`
- `INVALID`

경고가 있어도 정상적인 Brief가 생성되면 자동 보정 내용을 WARNING으로 보여줍니다.

---

## 7. CryptoMarketBrief

앱 내부 표준 분석 모델입니다.

주요 시장 필드:

- `date`
- `marketSummary`
- `coins`
- `risks`
- `events`
- `sources`
- `globalFactors`
- `correlations`
- `viewerTakeaways`
- `story`

코인별 분석:

- `summary`
- `technical`
- `news`
- `bullScenario`
- `bearScenario`
- `risks`
- `interpretation`
- `counterView`
- `verification`
- `takeaways`
- `advancedSignals`

Trading 관련:

- `tradingBias`
- `tradingEntryCondition`
- `tradingInvalidation`
- `tradingMode`
- `tradingApprovalCriteria`
- `tradingRejectionCriteria`

중요한 원칙:

> `tradingApprovalCriteria`와 `tradingRejectionCriteria`는 **팀장의 판단 기준**이지 AI의 최종 승인/거절 결과가 아닙니다.

---

## 8. Story Engine

현재 Story Mode:

- `BREAKOUT_TENSION`
- `LEADERSHIP_SHIFT`
- `DIVERGENCE`
- `CATALYST_COUNTDOWN`
- `RISK_ALERT`
- `ROTATION`
- `CORRELATION_BREAK`
- `QUIET_BEFORE_MOVE`
- `CROSSROADS`

Story 구조:

- title
- openingHook
- centralQuestion
- debateTopics
- turningPoint
- surprise
- endingQuestion
- watchItems
- changes

Story는 허구의 사건을 만드는 기능이 아니라 **검증 가능한 시장 데이터와 리서치에서 논쟁 구조를 만드는 기능**입니다.

---

## 9. 2D Meeting

구조:

```
CryptoMarketBrief
      +
Meeting Start Snapshot
      ↓
MeetingEngine
      ↓
MeetingEvent[]
      ↓
2D Office Renderer
```

이벤트:

- MOVE
- SPEAK
- LISTEN
- SCREEN
- EMOTION
- PAUSE
- HIGHLIGHT
- END

Speech intent:

- STATEMENT
- QUESTION
- REPLY
- CHALLENGE
- AGREE
- EVIDENCE
- SUMMARY
- TURNING_POINT

긴 발언은 여러 SPEAK 이벤트로 분리해 말풍선이 과도하게 잘리지 않도록 합니다.

---

## 10. 6인 회의팀

| 캐릭터 | 나이 | 역할 |
|---|---:|---|
| Alex | 42 | Team Leader |
| Mina | 36 | Market Analyst |
| Jin | 39 | On-chain / Ecosystem |
| Noah | 31 | Altcoin Specialist |
| Rae | 45 | Macro / Risk Manager |
| Kai | 28 | Trader |

캐릭터마다 personality / tone / speaking style을 가지고 있으며 Prompt와 Meeting Engine에 반영됩니다.

---

## 11. 실시간 Meeting Signal

`src/services/liveMeeting.ts`가 Binance WebSocket 흐름을 관찰합니다.

현재 기준:

- rolling window 약 30초
- 최소 약 0.7% move
- 3회 연속 방향 확인
- cooldown 약 120초
- 최대 5개 trigger
- pending queue 최대 3개

구조:

```
Binance WebSocket
      ↓
Live Detector
      ↓
Signal Queue
      ↓
Meeting Safe Point
      ↓
Live SPEAK / REPLY
```

실시간 발언에는 `live: true`를 사용하고 Office에서 LIVE MARKET으로 구분합니다.

회의 발언의 현재 가격은 AI 결과에 고정하지 않고:

- `{{PRICE:BTC}}`
- `{{CHANGE:BTC}}`

placeholder를 사용해 발화 시점의 최신 Binance 값으로 치환합니다.

---

## 12. 2D Office UX

현재 구현:

- 2D 회의실
- 6인 캐릭터
- 책상 / 모니터
- ticker
- market monitor
- 캐릭터 이동
- active speaker
- speech bubble
- terminal transcript
- highlight card
- price pulse
- live market indicator
- fullscreen
- ESC 종료
- 재생 속도
- PAUSE / RESUME / NEXT EVENT

Highlight 종류:

- KEY_POINT
- EVIDENCE
- RISK
- WATCH
- INSIGHT

---

## 13. Meeting Timer / Fullscreen

회의 Timer는 live market 업데이트 때문에 effect가 재시작되지 않도록 안정화되어 있습니다.

Fullscreen은 브라우저 Fullscreen API를 사용합니다.

- `requestFullscreen()`
- `exitFullscreen()`
- `fullscreenchange`
- ESC 종료

---

## 14. Meeting Report / Archive

회의 종료:

```
Meeting
  ↓
Report
  ↓
Archive
  ↓
MeetingMemory
```

Archive에는 다음을 보관할 수 있습니다.

- Brief
- Meeting Report
- Meeting Summary
- Market Snapshot
- Meeting Memory
- Watch items
- Follow-up

다회차 회의는 최신 이전 session의 Memory를 다음 Prompt와 Meeting Engine에 전달합니다.

---

# 15. TRADING ROOM

Trading Room은 회의에서 나온 조건부 시나리오를 **실제 거래소 주문 없이** 로컬 가상 거래로 검증하는 공간입니다.

화면에는:

> **SIMULATION ONLY — NO REAL ORDERS**

를 기준으로 동작합니다.

### 전체 흐름

```
Real-time Market
      ↓
Daily AI Research
      ↓
AI Meeting
      ↓
Trading Desk
      ↓
Coin Specialist
      ↓
Trade Request
      ↓
김태훈 Team Lead
   ├─ APPROVE
   └─ REJECT
      ↓
Virtual Trade
      ↓
PnL
      ↓
TP / SL / Manual Close
      ↓
Trade Review
      ↓
Trader Memory
      ↓
Next Meeting
```

---

## 16. Trading Team

현재 트레이딩팀은 한국인 캐릭터로 구성합니다.

| 이름 | 역할 | 담당 |
|---|---|---|
| 김태훈 | TEAM LEAD | 전체 포지션 / 팀 리스크 |
| 김민준 | SPECIALIST | BTC |
| 이서준 | SPECIALIST | ETH |
| 박도윤 | SPECIALIST | BNB |
| 최현우 | SPECIALIST | XRP |
| 정우진 | SPECIALIST | SOL |

회의의 `trader` 캐릭터는 트레이딩팀의 **김태훈 팀장**과 연결됩니다.

---

## 17. Trader Settings

트레이더별 설정:

- SPOT / FUTURES
- strategy
- risk percent
- leverage
- stop loss
- take profit
- confirmation
- LONG 허용
- SHORT 허용
- auto simulation

각 트레이더의 성격과 전략은 서로 다를 수 있으며 향후 회의 내용과 과거 거래 Memory에 따라 변경할 수 있는 구조입니다.

---

## 18. Meeting → Trading Scenario

`createMeetingScenarios()`가 `CryptoMarketBrief`를 Trading Scenario로 변환합니다.

전달되는 값:

- bias
- market mode
- entry condition
- invalidation
- reasoning
- approval criteria
- rejection criteria
- confidence
- meeting ID

LONG / SHORT 시나리오가 생기더라도 **자동 주문되지 않습니다.**

회의 종료 후:

```
Scenario
   ↓
PENDING REQUEST
   ↓
Specialist
   ↓
Team Lead Decision
```

---

## 19. 가장 중요한 규칙 — AI와 팀장의 역할 분리

이 프로젝트의 Trading 의사결정 구조는 다음과 같습니다.

### External AI

AI는:

- 시장을 분석
- LONG / SHORT / WATCH 시나리오 제시
- 진입 조건 제시
- 무효화 조건 제시
- 승인 기준 제시
- 거절 기준 제시

까지만 합니다.

### 김태훈 Team Lead

최종 결정은 김태훈 팀장이 합니다.

```
External AI
   ↓
APPROVE IF
REJECT IF
   ↓
Specialist Request
   ↓
김태훈 Team Lead
   ├─ APPROVE
   │    ↓
   │  Virtual Order
   │
   └─ REJECT
        ↓
      Re-review
```

즉:

> **AI가 "승인"하는 것이 아닙니다. AI가 판단 기준을 제공하고, 팀장이 화면에서 승인 또는 거절을 직접 선택합니다.**

현재 UI에도 이 역할을 명확히 표시합니다.

---

## 20. Trading Request 상태

요청 상태:

- `PENDING`
- `APPROVED`
- `REJECTED`
- `EXECUTED`

승인 연출:

```
PENDING
  ↓
TEAM LEAD APPROVED
  ↓
담당자 주문 준비
  ↓
VIRTUAL ORDER EXECUTED
  ↓
담당자 복귀
  ↓
WATCH
```

거절 연출:

```
PENDING
  ↓
TEAM LEAD REJECTED
  ↓
담당자 재검토
  ↓
WATCH
```

---

## 21. Virtual Trading

초기 가상 자본:

**$100,000**

지원:

- SPOT
- FUTURES
- LONG
- SHORT
- leverage
- margin
- position
- unrealized PnL
- ROI
- TP
- SL
- manual close

실시간 가격은 기존 Binance WebSocket의 MarketSnapshot을 읽기만 하며 실제 거래소 주문 API는 사용하지 않습니다.

### TP / SL

현재 포지션 가격이 조건에 도달하면 자동 청산합니다.

```
Position
   ↓
Current Price
   ↓
checkExit()
   ├─ TAKE_PROFIT
   ├─ STOP_LOSS
   └─ continue
```

---

## 22. Trade Review / Trader Memory

거래가 종료되면 자동으로 복기합니다.

```
Trade
 ↓
TradeReview
 ↓
TraderMemory
 ↓
Next Research / Meeting
```

복기 정보:

- 결과
- 진입 / 청산
- PnL
- 청산 이유
- 가능한 원인
- lesson
- regret
- improvement
- confidence

손실 거래에서는 특히:

- 진입 확인 조건
- 무효화 조건
- 리스크 크기
- 반복 실수
- 다음 전략 변경

을 검토합니다.

중요한 원칙:

> 거래 결과만 보고 원인을 확정하지 않습니다.

---

## 23. Trader Activity / 2D Trading Floor

Trading Room은 정적인 주문 화면이 아니라 2D Trading Floor로 구성됩니다.

현재 활동:

- WORK
- ANALYZE
- TALK
- THINK
- TRADE
- RETURN
- WATCH

향후 확장 예정:

- COFFEE
- OUTSIDE
- RESTROOM
- WALK
- BREAK

활동 상태에 따라 트레이더의 위치와 애니메이션이 변경됩니다.

현재 목표는:

```
분석
 ↓
팀장에게 이동
 ↓
대화 / 판단 대기
 ↓
승인 / 거절
 ↓
거래
 ↓
자리 복귀
 ↓
복기
```

를 2D 화면에서 자연스럽게 보여주는 것입니다.

---

## 24. Trading Persistence

localStorage key:

```
crypto-ai-office.trading.v1
```

저장:

- balance
- positions
- trades
- reviews
- scenarios
- requests
- profiles
- settings
- memories
- activities

기존 저장 데이터에 새 필드가 없어도 기본값으로 보정하는 migration 방어가 포함되어 있습니다.

---

# 25. GLOBAL RESET

현재 RESET은 Trading Room만 초기화하는 기능이 아니라 **전체 Workspace 데이터를 초기화**합니다.

사이드바의:

**RESET ALL DATA**

버튼으로 실행합니다.

초기화 대상:

- Meeting
- Meeting Report
- Archive
- Meeting Memory
- AI Import text
- AI Import preview
- Trading balance
- Positions
- Trades
- Reviews
- Scenarios
- Requests
- Trader Memory
- Trader Activities
- Trader Settings

초기화 후:

```
RESET ALL DATA
      ↓
localStorage 앱 데이터 삭제
      ↓
Meeting 초기 상태
Trading 초기 상태
Report 초기 상태
Archive 초기 상태
Import 초기 상태
      ↓
OFFICE
```

초기 Trading balance는 다시 **$100,000**으로 돌아갑니다.

초기화하지 않는 것:

- 소스 코드
- 코인 정의
- 팀 정의
- 기본 Trading Team
- 기본 Trader Settings
- Prompt 코드
- Market service 구조

초기화는 되돌릴 수 없다는 확인 메시지를 거칩니다.

---

## 26. 다회차 회의 Continuity

이전 회의의 Memory:

- session
- 핵심 질문
- key findings
- open follow-ups
- resolved follow-ups
- watch items
- turning point

를 다음 회의에 전달합니다.

특히 Trading Memory가 있으면:

- 총 거래
- 승 / 패
- 현재 lesson
- 전략 변경
- 리스크 변경

을 압축해서 다음 Prompt에 전달합니다.

목표:

```
SESSION 01
   ↓
Trade
   ↓
Review
   ↓
Trader Memory
   ↓
SESSION 02
   ↓
Previous Lesson
   ↓
Strategy Improvement
```

과거 가격은 현재 가격의 근거로 재사용하지 않습니다.

---

## 27. 프로젝트 구조

```
src/
├── App.tsx
├── types.ts
├── index.css
│
├── components/
│   ├── Office.tsx
│   └── TradingRoom.tsx
│
├── data/
│   ├── coins.ts
│   ├── team.ts
│   ├── tradingTeam.ts
│   └── demo.ts
│
├── engine/
│   ├── prompt.ts
│   ├── parser.ts
│   ├── meeting.ts
│   ├── trading.ts
│   └── report.ts
│
├── services/
│   ├── market.ts
│   ├── liveMeeting.ts
│   ├── storage.ts
│   └── clipboard.ts
│
└── utils/
    └── format.ts
```

주요 파일:

| 파일 | 역할 |
|---|---|
| App.tsx | 전체 상태 / 화면 / 회의 진행 |
| Office.tsx | 2D Meeting Office |
| TradingRoom.tsx | 2D Trading Floor / 가상 거래 |
| types.ts | TypeScript 모델 |
| prompt.ts | External AI Prompt |
| parser.ts | AI 결과 Parser / Validation |
| meeting.ts | Meeting Event 생성 |
| trading.ts | Trading Scenario / Position / Review |
| report.ts | Report / Meeting Memory |
| market.ts | CoinGecko + Binance |
| liveMeeting.ts | 실시간 시장 신호 |
| storage.ts | localStorage |
| format.ts | 가격 / 시간 / live placeholder |

---

# 28. 현재 개발 완료 단계

### Phase 1 — 기본 구조
- React / Vite / TypeScript
- 5개 코인
- 6인 회의팀
- 공통 TypeScript 모델

### Phase 2 — Market
- CoinGecko 초기 데이터
- Binance WebSocket
- 1초 buffer / flush
- reconnect
- cache / fallback
- LIVE / STALE / MOCK

### Phase 3 — Research
- Daily Prompt
- External AI workflow
- ONE CANVAS
- compact market data
- prompt budget

### Phase 4 — Parser
- JSON
- Markdown
- Plain text
- normalization
- validation
- warning system
- trading schema validation

### Phase 5 — Story / Meeting
- Story Engine
- Meeting Engine
- 20분 기준 event sequence
- 6인 역할
- 자연스러운 대화
- Highlight
- live price placeholder

### Phase 6 — 2D Office
- 캐릭터 이동
- speech bubble
- transcript
- fullscreen
- price pulse
- LIVE MARKET 표시

### Phase 7 — Report / Archive
- Meeting Report
- Archive
- Meeting Memory
- 다회차 continuity

### Phase 8 — Trading Room
- 6인 한국인 Trading Team
- SPOT / FUTURES
- LONG / SHORT
- virtual balance
- positions
- PnL / ROI
- TP / SL
- trade history

### Phase 9 — Team Lead Decision
- Meeting → Trading Scenario
- Specialist Request
- PENDING
- Team Lead APPROVE
- Team Lead REJECT
- APPROVED → EXECUTED
- REJECTED → Re-review

### Phase 10 — Trade Review
- TradeReview
- regret
- lesson
- improvement
- TraderMemory
- next meeting continuity

### Phase 11 — Trading Floor
- 2D trader activity
- ANALYZE
- TALK
- THINK
- TRADE
- RETURN
- WATCH

### Phase 12 — Global Reset
- 전체 앱 데이터 초기화
- Meeting / Report / Archive / Trading / Import 동시 초기화
- Trading-only reset 제거

---

# 29. 현재 핵심 전체 구조

```
┌─────────────────────┐
│ Binance WebSocket   │
│ Real-time Market    │
└─────────┬───────────┘
          ↓
   MarketSnapshot
          ↓
┌─────────────────────┐
│ Daily AI Research   │
└─────────┬───────────┘
          ↓
 CryptoMarketBrief
          ↓
    Story Engine
          ↓
   2D AI Meeting
          ↓
    Trading Desk
          ↓
┌─────────────────────┐
│ Trading Specialists │
└─────────┬───────────┘
          ↓
    Trade Request
          ↓
┌─────────────────────┐
│ 김태훈 Team Lead    │
│                     │
│ APPROVE / REJECT    │
└─────────┬───────────┘
          ↓
    Virtual Trade
          ↓
      Live PnL
          ↓
     TP / SL / Close
          ↓
     Trade Review
          ↓
    Trader Memory
          ↓
    Next AI Prompt
          ↓
    Next Meeting
```

---

# 30. 중요한 설계 원칙

### Data First
시장 데이터와 AI 해석을 분리합니다.

### Normalize First
AI 결과는 바로 UI에 사용하지 않고 `CryptoMarketBrief`로 정규화합니다.

### Event Driven
회의는 HTML 문자열이 아니라 `MeetingEvent[]`로 표현합니다.

### Story Before Animation
애니메이션보다 회의 논리와 대화 흐름을 먼저 만듭니다.

### Evidence Before Drama
극적인 장면을 만들더라도 근거 없는 시장 사실을 만들지 않습니다.

### Live Detection ≠ Live Insertion
시장 움직임 탐지와 회의 발언 삽입을 분리합니다.

### AI Criteria ≠ Team Decision
External AI는 승인/거절 기준을 만들지만 최종 선택은 김태훈 팀장이 합니다.

### Simulation Only
Trading Room은 실제 주문을 실행하지 않습니다.

### Memory Driven Improvement
거래 결과는 복기와 Trader Memory를 거쳐 다음 회의의 개선 요소가 됩니다.

### Token Conscious
시장 데이터와 이전 Memory를 압축하여 불필요한 AI 입력을 줄입니다.

---

# 31. 실행

개발:

```bash
npm install
npm run dev
```

Production build:

```bash
npm run build
```

Preview:

```bash
npm run preview
```

기본 확인 순서:

```
OFFICE
 ↓
MARKET
 ↓
DAILY PROMPT
 ↓
AI IMPORT
 ↓
MEETING
 ↓
TRADING ROOM
 ↓
REPORT
 ↓
ARCHIVE
```

AI 없이 테스트하려면 AI IMPORT에서 데모 결과를 채워 사용할 수 있습니다.

---

# 32. 권장 브라우저 테스트

### Market

1. BTC / ETH / BNB / XRP / SOL 실시간 가격 확인
2. 24H change / volume / high / low 확인
3. Binance WS 표시 확인
4. 가격 pulse 확인
5. reconnect 확인

### AI Import

1. 정상 JSON
2. JSON code fence
3. Markdown
4. Plain text
5. 누락 코인
6. 잘못된 JSON
7. URL / citation marker
8. 불완전한 trading schema

### Meeting

1. START MEETING
2. 1x / 2x
3. PAUSE / RESUME
4. NEXT EVENT
5. 캐릭터 이동
6. Speech Bubble
7. Transcript
8. Highlight
9. Fullscreen / ESC
10. live signal
11. 회의 timer 장시간 유지

### Trading Room

1. 회의 종료
2. Trading Scenario 생성
3. Specialist Request 생성
4. PENDING 확인
5. 김태훈 팀장 APPROVE
6. APPROVED → EXECUTED 확인
7. Virtual Position 확인
8. 실시간 PnL 확인
9. TP / SL 확인
10. Manual Close
11. Trade Review
12. Trader Memory
13. Team Lead REJECT
14. REJECTED → Re-review 확인

### Continuity

1. SESSION 01 종료
2. Trade 생성 / 종료
3. Review / Memory 생성
4. SESSION 02 시작
5. Previous Memory가 Prompt에 포함되는지 확인
6. 이전 미해결 질문 재등장 확인
7. 이전 거래 lesson이 다음 회의에 연결되는지 확인

### Global Reset

1. RESET ALL DATA
2. 확인 메시지
3. Meeting 초기화
4. Report 초기화
5. Archive 초기화
6. Trading 초기화
7. Import 초기화
8. Trading balance $100,000 복구
9. OFFICE 화면으로 이동

---

# 33. 현재 안정화 과제

핵심 기능은 연결되어 있으며 다음 단계는 실제 브라우저 장시간 실행을 통한 안정화입니다.

우선순위:

1. Binance WebSocket 상태와 Market Data 상태 분리
2. reconnect / duplicate socket / interval / listener 장시간 검증
3. Live Detector와 Meeting Signal Queue 분리 강화
4. live signal 삽입 후 meeting duration 정책 검증
5. Parser sanitize 추가 강화
6. localStorage schema / migration 확장
7. 20분 Meeting + WebSocket 장시간 테스트
8. Trading Room 장시간 PnL / TP / SL 테스트
9. Report / Archive persistence 테스트
10. 작은 화면 / 반응형 UI 테스트

향후 핵심 안정화 구조:

```
Market Stream
    ↓
Live Detector
    ↓
Signal Queue
    ↓
Meeting Safe Point
    ↓
Meeting Event
    ↓
2D Renderer
```

---

# 34. 환경 변수

선택적으로 CoinGecko Demo API Key를 사용할 수 있습니다.

```env
VITE_COINGECKO_DEMO_API_KEY=your_key
```

`VITE_` 값은 브라우저 번들에 노출될 수 있으므로 비밀 키를 저장하지 않습니다.

---

# 35. External AI 권장 출력 예시

```json
{
  "date": "YYYY-MM-DD",
  "marketSummary": "시장 요약",
  "story": {
    "mode": "DIVERGENCE",
    "title": "오늘의 회의",
    "openingHook": "시작 질문",
    "centralQuestion": "핵심 질문",
    "debateTopics": ["논쟁점"],
    "turningPoint": "전환점",
    "surprise": "의외의 관찰",
    "endingQuestion": "시청자가 볼 질문",
    "watchItems": ["관찰 항목"],
    "changes": ["변화"]
  },
  "coins": [
    {
      "id": "BTC",
      "summary": "요약",
      "technical": ["기술적 관찰"],
      "news": ["뉴스"],
      "bullScenario": "상방 조건",
      "bearScenario": "하방 조건",
      "risks": ["리스크"],
      "interpretation": "해석",
      "counterView": "반대 해석",
      "verification": ["검증 조건"],
      "takeaways": ["시청자 메모"],
      "advancedSignals": [],
      "tradingBias": "WATCH",
      "tradingEntryCondition": "",
      "tradingInvalidation": "",
      "tradingMode": "BOTH",
      "tradingApprovalCriteria": "",
      "tradingRejectionCriteria": ""
    }
  ],
  "globalFactors": [],
  "events": [],
  "risks": [],
  "correlations": [],
  "viewerTakeaways": [],
  "sources": []
}
```

실제 결과에는 BTC / ETH / BNB / XRP / SOL이 각각 정확히 한 번씩 포함되어야 합니다.

---

# 36. 프로젝트 상태

**현재 단계: Real-time + Story-driven 2D Crypto AI Meeting + Local Trading Room Prototype**

현재 연결된 핵심 기능:

- 5개 핵심 코인
- CoinGecko 초기 snapshot
- Binance WebSocket live stream
- Daily External AI Research
- ONE CANVAS copy/paste workflow
- JSON / Markdown / Text parser
- CryptoMarketBrief normalization
- Story Engine
- 2D Meeting
- Live Market Signal
- Meeting Report
- Archive
- 6인 Korean Trading Team
- Meeting-derived Trading Scenario
- Team Lead approval / rejection
- Local virtual trading
- PnL / TP / SL
- Trade Review
- Trader Memory
- Global Reset

최종 목표 구조:

```
MARKET
  ↓
RESEARCH
  ↓
BRIEF
  ↓
STORY
  ↓
MEETING
  ↓
TRADING
  ↓
REVIEW
  ↓
MEMORY
  ↓
NEXT MEETING
```

---

## Disclaimer

이 프로젝트의 Trading Room은 **로컬 가상 거래 시뮬레이션**이며 실제 거래소 주문을 실행하지 않습니다.

시장 데이터는 외부 API / WebSocket 상태에 따라 지연되거나 실패할 수 있습니다.

External AI가 생성한 뉴스, 해석, 시나리오 및 거래 조건은 별도의 검증이 필요합니다.

Bull / Bear / LONG / SHORT는 조건부 시나리오이며 투자 자문 또는 실제 매매 지시가 아닙니다.
