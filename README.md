# 2D CRYPTO AI OFFICE

> 실시간 암호화폐 시장 데이터 → Daily AI Research → CryptoMarketBrief → Story-driven 2D AI Meeting → Report → Archive

**BTC · ETH · BNB · XRP · SOL** 5개 자산을 기준으로 시장을 관찰하고, 외부 AI의 조사 결과를 정규화한 뒤 2D 사무실에서 가상 분석팀이 토론하는 **React + Vite + TypeScript** 프로젝트입니다.

현재 AI API는 앱 내부에서 직접 호출하지 않고 **External AI Research / Copy & Paste / Parse** 구조를 사용합니다.

---

## 1. 프로젝트 목표

단순한 암호화폐 대시보드가 아니라, 매일의 시장 데이터와 외부 AI 리서치를 **방송형 회의 콘텐츠**로 연결하는 것이 목표입니다.

핵심 파이프라인:

```
Real-time Crypto Data
        ↓
Daily Research Prompt
        ↓
External AI Research
        ↓
ONE CANVAS / Copy
        ↓
AI Result Parser
        ↓
CryptoMarketBrief
        ↓
Story Engine
        ↓
Meeting Engine
        ↓
2D Crypto Office
        ↓
Meeting Report
        ↓
Archive
```

핵심 원칙은 **AI 응답이 UI나 HTML을 직접 실행하지 않는 것**입니다.

```
AI Result
   ↓
Parser / Normalizer
   ↓
CryptoMarketBrief
   ↓
MeetingEngine
   ↓
MeetingEvent[]
   ↓
Office Renderer
```

---

## 2. 현재 지원 자산

초기 및 핵심 지원 자산은 변경하지 않습니다.

- BTC
- ETH
- BNB
- XRP
- SOL

캐릭터는 특정 코인에 1:1로 고정하지 않고 역할 중심으로 회의에 참여합니다.

---

## 3. 현재 구현 상태

### Market

현재 시장 데이터는 **CoinGecko 초기 스냅샷 + Binance WebSocket 실시간 스트림** 구조입니다.

```
CoinGecko REST
    ↓
Initial MarketSnapshot
    ├── marketCap
    └── initial price / volume / high / low / 24h change

Binance WebSocket
    ↓
1초 단위 buffer / flush
    ↓
MarketSnapshot
    ├── price
    ├── 24h change
    ├── volume
    ├── high
    └── low
```

지원 데이터:

- USD 가격
- 24시간 변동률
- 24시간 거래량
- 시가총액
- 24시간 고가 / 저가
- timestamp
- market status

Binance 스트림 대상:

- BTCUSDT
- ETHUSDT
- BNBUSDT
- XRPUSDT
- SOLUSDT

### Fallback

CoinGecko 요청 실패 시:

```
Session Snapshot
      ↓
Cached Snapshot
      ↓
Mock Data
```

순서로 fallback합니다.

상태:

| 상태 | 의미 |
|---|---|
| LIVE | 현재 스냅샷이 live 데이터 기준 |
| STALE | 이전 저장 데이터를 사용 |
| MOCK | 고정 예시 데이터 |
| ERROR | 오류 상태 표현용 타입 |

> 현재 `LIVE`는 MarketSnapshot의 데이터 상태를 의미하며 Binance WebSocket 연결 상태와 완전히 동일한 개념은 아닙니다. WebSocket 상태 분리는 후속 안정화 대상입니다.

---

## 4. Daily AI Research Prompt

`src/engine/prompt.ts`에서 매일 사용할 외부 AI 조사 프롬프트를 생성합니다.

프롬프트에는 다음이 포함됩니다.

- 현재 날짜
- snapshot timestamp
- market status
- BTC / ETH / BNB / XRP / SOL 압축 시장 데이터
- 이전 회의의 짧은 summary / risks / watchlist
- 시장 전체 분석 요구
- 코인별 분석 요구
- 최근 뉴스 및 출처 검증 요구
- Story Engine 요구
- 캐릭터별 분석 관점
- 사실과 해석 분리
- 직접적인 매수 / 매도 지시 금지

### 토큰 절약

입력 시장 데이터는 긴 객체 대신 compact 형태를 사용합니다.

```
BTC: [price, change24h, volumeM, low, high]
```

현재 Prompt Budget:

- 최대 프롬프트 약 12,000 characters
- 뉴스 최대 3개
- 출처 최대 8개
- 이전 회의 요약 최대 800 characters

---

## 5. ONE CANVAS External AI Workflow

외부 AI 결과는 **하나의 Canvas / 하나의 Document**에 완성하도록 프롬프트에서 명시합니다.

목표 workflow:

```
Daily Prompt
    ↓
External AI
    ↓
ONE CANVAS
    ↓
Canvas 전체 복사
    ↓
AI Result Import
    ↓
Parser
```

외부 AI 출력 규칙:

- 하나의 Canvas / Document만 사용
- 여러 메시지로 결과 분할 금지
- 분석 과정 / reasoning 출력 금지
- 최종 결과 외 설명 금지
- JSON 하나만 출력
- URL 금지
- Markdown 링크 금지
- footnote / citation marker 금지
- JSON 내부의 주석 / trailing comma 금지
- BTC / ETH / BNB / XRP / SOL 각각 정확히 한 번 포함

이 구조의 목적은 **사용자가 Canvas 전체를 한 번 복사하여 앱에 바로 붙여넣을 수 있게 하는 것**입니다.

> Canvas 동작 자체는 사용하는 외부 AI 서비스의 UI 지원 여부에 따라 달라질 수 있습니다. 앱은 Canvas 결과를 문자열로 받아 Parse하는 구조입니다.

---

## 6. AI Result Import / Parser

`src/engine/parser.ts`가 외부 AI 결과를 `CryptoMarketBrief`로 변환합니다.

지원 형식:

- JSON
- JSON code fence
- Markdown
- Plain text
- 간단한 `BTC: ...` 형태

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

검사 항목:

- JSON 유효성
- 최상위 object 여부
- 코인 ID
- 필수 필드
- 누락 코인
- 부분 추출
- warnings / errors

AI 원문을 Meeting Engine에 직접 전달하지 않습니다.

---

## 7. CryptoMarketBrief

앱 내부의 표준 AI 리서치 모델입니다.

주요 구조:

- date
- marketSummary
- coins
- risks
- events
- sources
- globalFactors
- correlations
- story

코인별:

- summary
- technical
- news
- bullScenario
- bearScenario
- risks

이 모델을 기준으로 이후의 Story / Meeting / Report가 동작합니다.

---

## 8. Story Engine

매일 동일한 순서로 발표하지 않도록 당일 조사 결과에 맞는 회의 스토리를 선택합니다.

지원 모드:

| Mode | 중심 내용 |
|---|---|
| BREAKOUT_TENSION | 중요한 조건을 통과하는지 검증 |
| LEADERSHIP_SHIFT | 시장 리더십 변화 |
| DIVERGENCE | 자산별 행동 차이 |
| CATALYST_COUNTDOWN | 이벤트 / 촉매 |
| RISK_ALERT | 하방 위험 / 충돌 신호 |
| ROTATION | 자금 / 관심 이동 |
| CORRELATION_BREAK | 상관관계 변화 |
| QUIET_BEFORE_MOVE | 아직 해결되지 않은 혼재 신호 |
| CROSSROADS | Bull / Bear 근거가 팽팽한 상황 |

Story는 허구의 사건을 만드는 장치가 아니라 **검증 가능한 시장 데이터와 리서치에서 회의의 논쟁 구조를 만드는 장치**입니다.

Story 데이터:

- mode
- title
- openingHook
- centralQuestion
- debateTopics
- turningPoint
- surprise
- endingQuestion
- watchItems
- changes

---

## 9. 2D Meeting Engine

Meeting Engine:

```
CryptoMarketBrief
      +
Meeting Start MarketSnapshot
      ↓
MeetingEngine
      ↓
MeetingEvent[]
```

기본 이벤트:

- MOVE
- SPEAK
- LISTEN
- SCREEN
- EMOTION
- PAUSE
- END

발언에는 대화 의도를 표현할 수 있습니다.

- STATEMENT
- QUESTION
- REPLY
- CHALLENGE
- AGREE
- EVIDENCE
- SUMMARY
- TURNING_POINT

또한 실시간 시장 발언은 `live: true`로 구분합니다.

---

## 10. 6인 AI 회의팀

| 캐릭터 | 역할 |
|---|---|
| Alex | Team Leader |
| Mina | Market Analyst |
| Jin | On-chain / Ecosystem |
| Noah | Altcoin Specialist |
| Rae | Macro / Risk Manager |
| Kai | Trader |

역할 중심으로 회의를 구성하며 캐릭터와 코인을 1:1로 연결하지 않습니다.

회의 중 역할:

- Leader → 핵심 질문과 결론
- Market → 가격 / 거래량 / 시장 구조
- On-chain → 온체인 / 생태계 근거
- Altcoin → 상대 강도 / 순환
- Risk → 반대 근거 / 위험
- Trader → 확인 / 무효화 조건

---

## 11. 약 20분 Story-driven Meeting

현재 Meeting Engine은 전체 이벤트 시간을 자동 정규화합니다.

목표:

- 1x → 약 20분
- 2x → 약 10분

Story Mode에 따라:

- 분석 순서
- 논쟁 순서
- Risk 개입
- Turning Point
- 화면 전환
- 결론

이 달라질 수 있습니다.

---

## 12. 실시간 회의 시장 신호

회의 중 Binance WebSocket 데이터는 `LiveMeetingController`에서 관찰할 수 있습니다.

현재 탐지 기준:

- 최근 30초 window
- 최소 약 0.7% 움직임
- 3회 연속 방향 확인
- 120초 cooldown
- 최대 5개 live trigger

신호 예:

```
BTC
최근 30초 +0.82%
↓
실시간 흐름 확인
↓
Live SPEAK
↓
다른 역할의 REPLY
```

Live 발언은 일반 발언과 구분되어 Office에서 **LIVE MARKET** 표시로 보여집니다.

> 현재 live signal은 회의의 안전한 이벤트 지점에서 주입하는 단계입니다. 시장 신호를 항상 먼저 수집한 뒤 안전 지점에서 queue로 주입하는 구조는 다음 안정화 단계의 핵심 과제입니다.

---

## 13. 2D Office UI

CSS / SVG 기반의 2D 픽셀풍 Office입니다.

현재 구현:

- 2D 회의실
- 6개 캐릭터
- 책상 / 모니터
- 코인 ticker
- 시장 monitor
- 캐릭터 이동
- 발언 상태
- 듣기 상태
- 생각 상태
- Point / Screen
- Risk Alert
- Active Speaker Highlight
- Speech Bubble
- Transcript
- 가격 변화 pulse
- Live Market Speech 표시

### Live Price Visual

가격이 WebSocket으로 변경되면:

- focused monitor 가격 pulse
- ticker 가격 pulse
- 상승 / 하락 방향별 animation

을 표시합니다.

시장 모니터에는:

```
DATA: LIVE / LIVE SYNC ...
● STREAM
```

형태의 live indicator가 표시됩니다.

---

## 14. Meeting Fullscreen / Transcript

회의 화면은 앱 내부 fullscreen overlay 방식입니다.

구성:

- 2D Office
- 캐릭터
- Monitor
- 재생 속도
- 회의 진행 상태
- 현재 발언자
- Speech Bubble
- 하단 terminal-style transcript

Transcript:

- 자동 스크롤
- 현재 이벤트 표시
- 발언자 / 역할 표시
- intent 표시
- 전체 발언 기록

ESC로 fullscreen을 종료할 수 있습니다.

---

## 15. Meeting Snapshot과 Live Market 분리

회의 시작 시점의 스냅샷은 `meeting.snapshot`으로 보관합니다.

```
Meeting Start Snapshot
        ↓
Meeting Report
        ↓
회의 당시 사실 기록

Current Live Market
        ↓
Office Monitor
        ↓
Ticker / 실시간 화면
```

따라서 회의 중 시장이 움직여도 보고서는 회의 시작 시점 데이터를 기준으로 작성할 수 있습니다.

---

## 16. Report / Archive

회의 종료:

```
Meeting
  ↓
createReport()
  ↓
MeetingReport
  ↓
ArchiveItem
  ↓
localStorage
```

현재:

- Meeting Report 생성
- Meeting Summary 저장
- 시장 스냅샷 저장
- CryptoMarketBrief 저장
- 보고서 텍스트 복사
- Archive 최대 20개
- 과거 회의 다시 열기
- 기록 삭제

localStorage가 실패해도 현재 세션에서 핵심 동작이 유지되도록 방어합니다.

---

## 17. 프로젝트 구조

```
src/
├── App.tsx
├── types.ts
├── index.css
│
├── components/
│   └── Office.tsx
│
├── data/
│   ├── coins.ts
│   ├── team.ts
│   └── demo.ts
│
├── engine/
│   ├── prompt.ts
│   ├── parser.ts
│   ├── meeting.ts
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

### 주요 파일

| 파일 | 역할 |
|---|---|
| `App.tsx` | 앱 상태 / 화면 흐름 / 회의 진행 |
| `types.ts` | 공통 TypeScript 모델 |
| `Office.tsx` | 2D Office 렌더링 |
| `coins.ts` | 5개 코인 메타데이터 |
| `team.ts` | 6인 회의팀 |
| `demo.ts` | fallback / demo data |
| `prompt.ts` | Daily AI Research Prompt |
| `parser.ts` | AI 결과 parsing / normalization |
| `meeting.ts` | Story-driven Meeting Event 생성 |
| `report.ts` | Meeting Report |
| `market.ts` | CoinGecko + Binance market service |
| `liveMeeting.ts` | 실시간 시장 신호 탐지 |
| `storage.ts` | localStorage |
| `clipboard.ts` | 복사 기능 |
| `format.ts` | 숫자 / 가격 / 시간 formatting |

---

## 18. 최근 회의 UX / 대화 개선

### STEP 1 — 긴 발언 처리
긴 AI 발언이 말풍선에서 잘리지 않도록 개선했습니다.

- 긴 발언을 약 92자 기준으로 문장 단위 분할
- 하나의 긴 문장을 여러 `SPEAK` 이벤트로 분리
- 분할된 발언을 순차적으로 재생
- 말풍선의 기존 4줄 강제 절단 제거
- 긴 텍스트는 말풍선 내부 스크롤 지원
- 전체 발언은 Transcript에 유지

목표는 긴 분석 문장을 억지로 한 화면에 넣는 것이 아니라 **실제 사람이 여러 호흡으로 말하는 것처럼 보여주는 것**입니다.

### STEP 2 — 자연스러운 대화 흐름
회의 대화 구조를 단순한 고정 멘트 나열에서 문맥 기반 대화로 개선했습니다.

기본 흐름:

```
주장
 ↓
반론
 ↓
질문
 ↓
재응답
 ↓
Risk 반론
 ↓
Leader 정리
 ↓
다음 확인 항목
```

`replyTo`와 `intent`를 실제 대화 흐름에 활용하며, 다음 발언이 이전 발언의 핵심 내용을 받아서 응답하도록 구성합니다.

### STEP 3 — 캐릭터별 나이 / 직책 / 성격 / 말투
6인 회의팀에 고유한 캐릭터 프로필을 추가했습니다.

| 캐릭터 | 나이 | 직책 | 대화 스타일 |
|---|---:|---|---|
| Alex | 42 | Team Leader | 차분하고 핵심을 정리 |
| Mina | 36 | Market Analyst | 숫자·가격·거래량 중심 |
| Jin | 39 | On-chain / Ecosystem | 배경과 맥락 설명 |
| Noah | 31 | Altcoin Specialist | 활기차고 직설적 |
| Rae | 45 | Macro / Risk Manager | 가정과 반대 시나리오 검증 |
| Kai | 28 | Trader | 빠르고 구어체, 가격 행동 중심 |

캐릭터 프로필은 UI 표시용 데이터에만 머무르지 않고 **External AI Prompt와 Meeting Engine 양쪽에 반영**합니다.

목표:

- 캐릭터마다 다른 문장 패턴
- 지나치게 딱딱한 보고서체 감소
- 질문 / 반론 / 정리 방식 차별화
- 전문성을 유지하면서 실제 회의 같은 구어체 구현

### STEP 4 — 시청자용 Highlight / Note

### STEP 5 — 풍부한 시장 해석 / 검증 / 시청자 Takeaway

Daily Prompt와 `CryptoMarketBrief`를 확장해 단순 뉴스 요약을 넘어 **사실 → 해석 → 반대 해석 → 검증 조건 → 시청자 메모** 흐름을 보존합니다.

추가된 코인별 분석 필드:

- `interpretation` — 데이터에 대한 해석
- `counterView` — 반대 방향의 해석
- `verification` — 해석을 확인하거나 무효화할 조건
- `takeaways` — 시청자가 메모할 핵심

시장 전체에는:

- `viewerTakeaways` — 오늘의 핵심 메모 포인트 3~5개

프롬프트 원칙:

- 확인된 사실과 해석을 명확히 분리
- 상관관계를 인과관계로 단정하지 않음
- 확인된 이벤트와 예상 영향 구분
- 각 논쟁에 반대 해석과 검증 조건 포함
- 근거가 약하면 억지로 결론을 만들지 않음
- 기존 `PROMPT_BUDGET.maxChars = 12000`을 유지해 입력량 증가를 제한

Meeting Engine에서도 이 데이터를 사용합니다.

```
FACT
 ↓
INTERPRETATION
 ↓
COUNTER VIEW
 ↓
VERIFICATION
 ↓
VIEWER TAKEAWAY
```

이를 통해 회의가 단순히 "무슨 뉴스가 있었는가"를 말하는 것을 넘어 **왜 그렇게 해석할 수 있는지, 반대로 볼 근거는 무엇인지, 무엇을 확인해야 하는지**까지 토론하도록 확장했습니다.

회의 중 중요한 내용을 시청자가 바로 메모할 수 있도록 `HIGHLIGHT` 이벤트를 추가했습니다.

지원 유형:

- `KEY_POINT` — 핵심 포인트
- `EVIDENCE` — 근거 / 데이터
- `RISK` — 위험 요소
- `WATCH` — 계속 지켜볼 항목
- `INSIGHT` — 해석 / 인사이트

화면에는 해당 내용을 별도 카드로 표시합니다.

예:

```
KEY POINT

BTC 하락과 거래량 증가가 동시에 나타나는지 확인

NOTE THIS
```

이 기능은 모든 발언을 강조하는 것이 아니라 **회의에서 실제로 메모할 가치가 있는 정보만 별도 표시**하는 것을 목표로 합니다.

---

## 19. 현재 완료된 개발 단계

### Phase 1 — 기반 구조
- Mock / Coin / Team data 분리
- TypeScript 모델 정리

### Phase 2 — Market Data
- MarketSnapshot
- CoinGecko REST
- 가격 / 거래량 / 시가총액 / 고가 / 저가
- cache / fallback
- LIVE / STALE / MOCK

### Phase 3 — Dashboard
- 5개 코인 카드
- 24H change
- volume
- market cap
- 24H range
- live 상태

### Phase 4 — Daily Research
- Compact Prompt
- 이전 회의 context
- 외부 AI research workflow
- token budget

### Phase 5 — AI Import
- JSON / Markdown / Text parser
- 누락 코인 확인
- normalization
- CryptoMarketBrief

### Phase 6 — Story Engine
- 9개 Story Mode
- Hook / Central Question
- Debate Topics
- Turning Point
- Surprise
- Ending Question
- Watch Items / Changes

### Phase 7 — Meeting Engine
- MeetingEvent
- 6인 역할
- Story-driven event sequence
- 대화 intent
- 약 20분 normalization

### Phase 8 — 2D Office / Meeting UX
- 2D Office
- 캐릭터 상태
- Speech Bubble
- Fullscreen overlay
- terminal transcript
- auto scroll
- ESC 종료
- active speaker
- 가격 변화 animation

### Phase 9 — Real-time Market Stream
- Binance WebSocket ticker
- 5개 코인 실시간 stream
- 1초 buffer / flush
- reconnect
- subscriber architecture
- CoinGecko market cap 유지

### Phase 10 — Live Meeting Signal
- 30초 가격 변화 window
- 3회 연속 방향 확인
- 약 0.7% 이상 움직임 조건
- 120초 cooldown
- 최대 5개 trigger
- pending signal queue
- safe point 주입
- Live SPEAK / REPLY
- LIVE MARKET 시각 표시

### Phase 11 — Report / Archive
- MeetingReport
- ArchiveItem
- localStorage
- 최대 20개 archive
- 보고서 복사 / 삭제

### Phase 12 — External AI Output Hardening
- JSON code block 강제
- Canvas / Document 단일 출력 요구
- URL / citation / markdown link 차단 요구
- plain source name 요구
- parser URL / citation sanitize
- copy-once / paste-direct workflow

---

## 19. 현재 확인된 핵심 파이프라인

```
CoinGecko
    ↓
Initial MarketSnapshot
    ↓
Binance WebSocket
    ↓
Live Market Stream
    ↓
┌─────────────────────────┐
│                         │
↓                         ↓
Daily Prompt          Live Detector
↓                         ↓
External AI           Live Signal
↓                         │
Parser                    │
↓                         │
CryptoMarketBrief         │
↓                         │
Story Engine              │
↓                         │
Meeting Engine ←──────────┘
↓
MeetingEvent[]
↓
2D Office
↓
Meeting Report
↓
Archive
```

회의 중 AI API를 다시 호출하지 않습니다.

```
Meeting 중
❌ AI API 호출
❌ HTML 직접 실행
❌ AI가 UI를 직접 변경

Meeting 중
✓ 기존 CryptoMarketBrief 사용
✓ MeetingEvent 재생
✓ Binance live market 표시
✓ Live signal 처리
✓ 캐릭터 상태 변경
✓ Transcript 출력
```

---

## 20. 현재 알려진 안정화 과제

현재 핵심 기능은 연결되어 있지만, **실제 브라우저 장시간 실행 전 안정화 테스트가 필요합니다.**

우선순위:

1. Live Detector가 시장 신호를 항상 먼저 기록하고 안전한 회의 지점에서 queue로 주입하도록 분리
2. Binance WebSocket 상태와 Market Data 상태 분리
3. WebSocket reconnect / duplicate socket / timer / listener 장시간 검증
4. Live signal 삽입으로 회의 시간이 과도하게 늘어나지 않도록 duration 정책 보정
5. Market source label을 데이터별 실제 provider와 일치시킴
6. Parser에 URL / citation 잔여 데이터가 들어왔을 때의 sanitize 강화
7. localStorage schema / migration 정책
8. 실제 브라우저에서 20분 회의 + 실시간 stream 장시간 테스트
9. Report / Archive 재실행 테스트
10. 모바일 / 작은 화면 검증

### 중요한 설계 원칙

앞으로 live 기능은 다음 구조로 안정화합니다.

```
Binance WebSocket
      ↓
Market Stream
      ↓
Live Detector
      ↓
Signal Queue
      ↓
Meeting Safe Point
      ↓
Live Dialogue
      ↓
Existing Meeting Flow
      ↓
Report / Archive
```

실시간 탐지와 회의 이벤트 삽입을 분리하는 것이 핵심입니다.

---

## 21. 아직 구현되지 않은 주요 확장

### Market
- Provider 상태 전용 모델
- Provider failover
- freshness 정책 강화
- rate-limit / reconnect 안정화

### Research
- 앱 내부 AI API 연동 검토
- 자동 뉴스 수집
- 뉴스 출처 검증 강화
- 날짜 / 이벤트 검증 강화

### Meeting
- queue 기반 실시간 끼어들기
- 자연스러운 반박 / 재반박
- 캐릭터별 interjection
- Story Mode 전용 장면
- 카메라 연출
- 장면 전환
- 감정 상태 확장

### Report
- 전체 transcript 저장
- Turning Point 자동 기록
- HTML / PDF 보고서
- Story 기반 보고서

### Persistence
- IndexedDB
- export / import
- cloud archive

---

## 22. 실행

개발:

```bash
npm install
npm run dev
```

기본 흐름은 `OFFICE → MARKET → DAILY PROMPT → AI IMPORT → MEETING → REPORT → ARCHIVE` 순서로 확인합니다.

AI 없이 테스트하려면 `AI IMPORT`에서 **데모 결과 채우기 → 분석 결과 가져오기 → 회의 준비**를 사용합니다.

회의에서는 `START MEETING → 1x/2x → PAUSE/RESUME → NEXT EVENT → 전체화면 → ESC → 회의 종료 → 보고서 → Archive`를 확인합니다.

### Parser 테스트

다음 입력을 각각 확인합니다.

1. 정상 JSON
2. JSON code fence
3. Markdown
4. Plain text
5. URL이 포함된 news/source
6. `[Reuters](https://...)` 형태의 Markdown link
7. `【citation】` 형태의 citation marker
8. 일부 코인이 누락된 결과
9. 잘못된 JSON

URL / Markdown link / citation marker가 들어와도 정규화된 Brief에 그대로 남지 않는지 확인합니다.

### 실시간 Market / Meeting 테스트

- BTC / ETH / BNB / XRP / SOL 가격 갱신
- 24H change / volume / high / low 갱신
- Binance WS source 표시
- 가격 pulse
- 회의 중 live signal 탐지
- safe point에서 Live SPEAK / REPLY 삽입
- `LIVE MARKET` 표시
- WebSocket 오류 반복 여부
- 전체회의 흐름 유지

가능하면 10~20분 이상 실행해 reconnect, duplicate socket, timer/listener 문제를 확인합니다.

### Production build

```bash
npm run build
npm run preview
```

Vite는 production build에 `vite build`를 사용하고, 기본 build 결과는 `dist`에 생성됩니다. `vite preview`는 로컬에서 production build를 확인할 때 사용합니다. citeturn0search0turn0search1

### 테스트 기록

| 항목 | 결과 |
|---|---|
| `npm install` | PASS / FAIL |
| `npm run build` | PASS / FAIL |
| Market REST | PASS / FAIL |
| Binance WebSocket | PASS / FAIL |
| Prompt copy | PASS / FAIL |
| AI Import JSON | PASS / FAIL |
| AI Import Markdown | PASS / FAIL |
| Parser sanitize | PASS / FAIL |
| Meeting playback | PASS / FAIL |
| Live signal | PASS / FAIL |
| Report | PASS / FAIL |
| Archive | PASS / FAIL |
| Refresh persistence | PASS / FAIL |
| Fullscreen / ESC | PASS / FAIL |

**중요:** 현재까지 실제 로컬 브라우저 장시간 테스트와 production build를 완료한 것으로 간주하지 않습니다. 위 항목은 로컬 환경에서 직접 검증해야 합니다.

---

## 23. 환경 변수

선택적으로 CoinGecko Demo API Key를 사용할 수 있습니다.

```env
VITE_COINGECKO_DEMO_API_KEY=your_key
```

`VITE_` 접두사가 붙은 값은 브라우저 번들에 노출될 수 있으므로 비밀 키를 저장하면 안 됩니다.

---

## 24. 권장 External AI 출력 구조

Daily Prompt는 다음과 같은 구조의 JSON을 요구합니다.

```json
{
  "date": "YYYY-MM-DD",
  "marketSummary": "간결한 시장 요약",
  "story": {
    "mode": "DIVERGENCE",
    "title": "오늘의 회의 제목",
    "openingHook": "회의 시작 질문",
    "centralQuestion": "핵심 질문",
    "debateTopics": ["논쟁점 1", "논쟁점 2"],
    "turningPoint": "전환점",
    "surprise": "의외의 관찰",
    "endingQuestion": "시청자가 지켜볼 질문",
    "watchItems": ["관찰 항목"],
    "changes": ["오늘 달라진 점"]
  },
  "coins": [
    {
      "id": "BTC",
      "summary": "요약",
      "technical": ["기술적 관찰"],
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

실제 결과에는 BTC / ETH / BNB / XRP / SOL이 각각 정확히 한 번씩 포함되어야 합니다.

---

## 25. 설계 철학

### 1. Data First
시장 데이터와 AI 해석을 분리합니다.

### 2. Normalize First
AI 결과는 바로 UI에 사용하지 않고 `CryptoMarketBrief`로 정규화합니다.

### 3. Event Driven Meeting
회의는 텍스트를 직접 화면에 출력하는 것이 아니라 `MeetingEvent[]`로 표현합니다.

### 4. Story Before Animation
애니메이션보다 먼저 회의의 논리와 이야기 구조를 만듭니다.

### 5. Evidence Before Drama
재미있는 회의를 만들되 근거 없는 데이터나 사건을 만들지 않습니다.

### 6. External AI First
현재는 외부 AI를 사용자가 선택할 수 있도록 앱과 AI 공급자를 분리합니다.

### 7. Token Conscious
반복되는 시장 데이터와 이전 context를 압축해 불필요한 AI 입력을 줄입니다.

### 8. Live Detection ≠ Live Insertion
시장 움직임을 탐지하는 것과 회의에 발언을 삽입하는 것을 분리합니다.

---

## 26. 프로젝트 상태

**현재 단계: Real-time / Story-driven 2D Crypto AI Meeting Prototype**

현재:

- 5개 핵심 코인 데이터
- CoinGecko 초기 snapshot
- Binance WebSocket live stream
- Daily external AI research
- ONE CANVAS copy/paste workflow
- JSON / Markdown / Text parser
- CryptoMarketBrief normalization
- 9개 Story Mode
- 20분 Meeting Engine
- 6인 2D Office
- Live Market Speech
- Meeting Report
- Archive

까지 연결되어 있습니다.

다음 핵심 단계는 **로컬 브라우저에서 build → market stream → parser → meeting → live signal → report → archive 전체 흐름을 실제로 검증하고 발견된 런타임 문제를 순차적으로 수정하는 것**입니다.

전체 구조는 앞으로도 다음 흐름을 유지합니다.

```
Market Data
    ↓
Research
    ↓
Normalized Brief
    ↓
Story
    ↓
Meeting Events
    ↓
2D Renderer
    ↓
Report / Archive
```

---

## Disclaimer

이 프로젝트는 암호화폐 시장 데이터와 리서치 결과를 시각화하고 시나리오를 검토하기 위한 소프트웨어입니다.

시장 데이터는 외부 API 및 WebSocket 상태에 따라 지연되거나 실패할 수 있으며, AI가 생성한 뉴스 / 해석 / 시나리오는 별도의 검증이 필요합니다.

회의의 Bull / Bear 내용은 조건부 시나리오이며 투자 자문 또는 매매 지시가 아닙니다.
