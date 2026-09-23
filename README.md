# 2D CRYPTO AI OFFICE

> 실시간 암호화폐 시장 데이터 → 일일 AI 리서치 → 구조화된 Market Brief → 2D AI 회의 → 보고서 → Archive

**BTC · ETH · BNB · XRP · SOL** 5개 자산을 기준으로 시장을 관찰하고, 외부 AI의 조사 결과를 회의용 데이터로 정규화한 뒤 2D 사무실에서 가상의 분석팀이 토론하는 React + Vite + TypeScript 프로젝트입니다.

AI API를 앱 내부에서 직접 호출하지 않는 **External AI Research / Paste & Parse 구조**를 기본으로 합니다.

---

## 1. 프로젝트 목표

이 프로젝트는 단순한 암호화폐 대시보드가 아니라 **시장 데이터와 AI 리서치를 하나의 방송형 회의 흐름으로 연결하는 2D Crypto AI Office**를 목표로 합니다.

핵심 흐름:

```
Real-time Crypto Data
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
Meeting Engine
        ↓
2D Office Meeting
        ↓
Meeting Report
        ↓
Archive
```

중요한 설계 원칙은 **AI 응답 자체를 회의 엔진이 직접 실행하지 않는 것**입니다.

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

즉, AI가 HTML이나 UI를 직접 조작하지 않고 구조화된 데이터만 제공합니다.

---

## 2. 현재 구현 범위

현재까지 다음 기능이 구현되어 있습니다.

### Market

- BTC / ETH / BNB / XRP / SOL 고정 지원
- CoinGecko 기반 시장 데이터 조회
- USD 가격
- 24시간 변동률
- 24시간 거래량
- 시가총액
- 24시간 고가 / 저가
- 시장 데이터 상태 표시
- 세션 스냅샷 재사용
- localStorage 캐시
- API 실패 시 STALE / MOCK fallback
- 회의 진행 중 30초 간격 시장 데이터 동기화
- 회의 화면의 모니터와 ticker에 최신 스냅샷 반영

### Daily AI Research Prompt

- 현재 시장 스냅샷을 compact JSON 형태로 프롬프트에 포함
- 이전 회의의 짧은 요약 / 리스크 / watchlist를 선택적으로 전달
- 토큰 사용량을 줄이기 위해 입력 데이터 압축
- 최근 뉴스와 출처 검증 요구
- 사실과 해석 분리 요구
- 직접적인 매수 / 매도 지시 금지
- JSON 출력 강제
- 5개 코인 전체 포함 강제
- Story Engine용 구조화 필드 생성

### AI Result Import

외부 AI에서 생성한 결과를 복사해 붙여넣는 방식입니다.

지원 형식:

- JSON
- Markdown
- 일반 텍스트
- `BTC: ...` 형태의 간단한 텍스트

Import 단계에서:

- 코인별 추출 상태 표시
- 누락 코인 확인
- 부분 추출 경고
- 데이터 정규화
- Market Brief 미리보기
- 수정 후 회의 준비

AI 원문을 회의 엔진에 직접 전달하지 않습니다.

### Market Brief

정규화된 `CryptoMarketBrief`가 앱 내부의 핵심 AI 결과 모델입니다.

주요 구조:

- 날짜
- 전체 시장 요약
- BTC / ETH / BNB / XRP / SOL 분석
- 기술적 관찰
- 뉴스
- Bull Scenario
- Bear Scenario
- 코인별 리스크
- 글로벌 요인
- 이벤트
- 시장 리스크
- 상관관계
- 출처
- 회의 Story

---

## 3. Story Engine

현재 프로젝트에서 가장 중요한 확장 기능 중 하나입니다.

매일 동일한:

> 시장 요약 → BTC → ETH → BNB → XRP → SOL → 리스크 → 결론

형태만 반복하지 않도록 AI가 당일 데이터에 맞는 **회의 스토리 모드**를 생성합니다.

### 지원 Story Mode

| Mode | 회의 중심 |
|---|---|
| `BREAKOUT_TENSION` | 중요한 조건을 통과하는지 검증 |
| `LEADERSHIP_SHIFT` | 시장 리더십 변화 |
| `DIVERGENCE` | 같은 시장에서 나타나는 자산별 차이 |
| `CATALYST_COUNTDOWN` | 예정된 이벤트 / 촉매 중심 |
| `RISK_ALERT` | 하방 위험과 충돌 신호 중심 |
| `ROTATION` | 자금 / 관심의 이동과 상대 강도 |
| `CORRELATION_BREAK` | 기존 상관관계 변화 |
| `QUIET_BEFORE_MOVE` | 아직 해결되지 않은 혼재 신호 |
| `CROSSROADS` | Bull / Bear 근거가 팽팽한 상황 |

스토리 모드는 임의로 순환하지 않습니다.

**당일 조사 결과에서 실제로 확인되는 근거에 맞는 모드를 선택하도록 프롬프트에서 요구합니다.**

### Story 데이터

현재 Story는 다음 정보를 포함합니다.

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

목표는 **허구의 드라마를 만드는 것**이 아니라 실제 시장 데이터와 검증된 리서치를 이용해 회의의 서사 구조를 만드는 것입니다.

---

## 4. 2D Meeting Engine

회의 엔진은 `CryptoMarketBrief`와 `MarketSnapshot`만 사용하여 `MeetingEvent[]`를 생성합니다.

### 기본 이벤트

- `MOVE`
- `SPEAK`
- `LISTEN`
- `SCREEN`
- `EMOTION`
- `PAUSE`
- `END`

### 현재 구현

회의 시작:

- 캐릭터가 테이블로 이동
- Overview 화면 표시
- 오늘의 Hook
- 시장 요약
- Central Question
- 회의 제목
- 글로벌 요인

이후 Story Mode에 따라 회의 진행 구조가 달라집니다.

예:

- Risk Alert → 초반부터 Risk Manager가 위험 조건을 제기
- Catalyst Countdown → 촉매 / 이벤트를 먼저 확인
- Rotation → 상대 강도와 리더십 중심
- Divergence → 자산 간 차이를 먼저 비교
- Correlation Break → 상관관계 변화부터 검토
- Breakout Tension → 돌파 조건과 확인 기준 중심
- Quiet Before Move → 결론보다 미해결 조건 중심
- Crossroads → 균형형 토론

각 코인 분석에는 가능한 경우:

- 현재 시장 스냅샷
- 요약
- 기술적 관찰
- 뉴스
- Bear Scenario
- Bull Scenario
- 추가 리스크

가 포함됩니다.

### 회의 시간

현재 이벤트들의 duration을 마지막에 자동 정규화합니다.

- **1x: 약 20분**
- **2x: 약 10분**

콘텐츠 양이 달라도 전체 회의가 목표 시간에 맞도록 스케일링합니다.

---

## 5. 2D Office UI

현재 Office는 CSS / SVG 기반의 2D 픽셀풍 UI로 구성되어 있습니다.

### 캐릭터

총 6명:

| 이름 | 역할 |
|---|---|
| Alex | Team Leader |
| Mina | Market Analyst |
| Jin | On-chain / Ecosystem |
| Noah | Altcoin Specialist |
| Rae | Macro / Risk Manager |
| Kai | Trader |

캐릭터는 특정 코인에 1:1 고정되지 않습니다.

회의 상황에 따라 역할별로 발언합니다.

### 회의 연출

현재 구현:

- 캐릭터 이동
- 발언자 상태
- 듣기 상태
- 생각 상태
- 포인트 / 화면 지시
- Risk Alert 감정 상태
- 현재 발언자 강조
- 캐릭터 위 말풍선
- 이름 / 역할 표시
- 발언 내용 표시
- 말풍선 애니메이션
- 화면의 코인별 데이터 포커스

### Speech Bubble

현재 `SPEAK` 이벤트의:

```
speaker
text
duration
```

을 그대로 사용합니다.

따라서 별도의 AI 호출 없이 현재 발언자의 캐릭터 위에 해당 발언 내용이 표시됩니다.

긴 발언은 말풍선에서 제한된 줄 수로 보여주고 전체 내용은 하단 transcript에서 확인할 수 있도록 구성되어 있습니다.

---

## 6. Meeting Fullscreen / Terminal Transcript

회의 화면에는 별도의 **Meeting Fullscreen Mode**가 있습니다.

전체화면에서는:

- 2D 회의실
- 캐릭터
- 모니터
- 재생 컨트롤
- 하단 transcript

을 회의 전용 화면으로 구성합니다.

브라우저의 실제 Fullscreen API가 아니라 앱 내부 overlay 방식입니다.

### Transcript

하단에는 VS Code 터미널과 유사한 형태의 회의 로그 영역을 사용합니다.

목표:

- 현재 회의 진행 상황 확인
- 발언 기록 확인
- 이벤트 진행 위치 확인
- 자동 스크롤
- 회의 화면과 실제 발언 데이터의 일치

현재 ESC로 fullscreen을 종료할 수 있습니다.

---

## 7. Market Data Architecture

시장 데이터는 하나의 공통 스냅샷으로 관리합니다.

```
CoinGecko
    ↓
MarketService
    ↓
MarketSnapshot
    ├── Market Dashboard
    ├── Daily Prompt
    ├── Meeting Monitor
    └── Meeting Report
```

코인별로 개별 API를 호출하는 구조가 아닙니다.

### MarketSnapshot

각 코인에 대해 현재 다음 정보를 관리합니다.

- price
- change24h
- volume24h
- marketCap
- high24h
- low24h

스냅샷에는:

- timestamp
- status
- coins

가 포함됩니다.

### 상태

| 상태 | 의미 |
|---|---|
| LIVE | API에서 정상 수신 |
| STALE | 이전 저장 데이터 사용 |
| MOCK | 고정 예시 데이터 사용 |
| ERROR | 오류 상태 표현용 타입 |

MOCK 데이터는 실시간 가격으로 취급하지 않습니다.

---

## 8. Meeting 중 실시간 데이터와 회의 사실 데이터 분리

회의 진행 중 시장 데이터는 30초 간격으로 새로 동기화됩니다.

하지만 회의 보고서의 기준이 되는 `meeting.snapshot`과 현재 live `market`은 분리되어 있습니다.

즉:

```
Meeting Start Snapshot
        ↓
보고서 / 당시 회의 사실

Current Live Snapshot
        ↓
회의 화면 모니터 / ticker
```

이 구조를 통해 회의 중 화면은 최신 상태를 보여주면서도, 보고서는 회의 시작 당시의 시장 데이터를 기준으로 기록할 수 있습니다.

---

## 9. Report / Archive

회의 종료 시:

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

보고서에는 현재 다음 내용이 포함됩니다.

- 날짜
- 생성 시간
- 시장 데이터 상태
- 시장 요약
- 코인별 분석
- 가격 / 24h 변화
- 기술적 관찰
- Bull / Bear 시나리오
- 코인별 리스크
- 뉴스
- Cross Market
- Risk
- Watchlist
- Conclusion
- Meeting Summary
- Sources

### Archive

- 최대 20개 저장
- 최신 기록 우선
- 과거 회의 보고서 다시 열기
- 기록 삭제
- 보고서 텍스트 복사

localStorage 사용이 불가능해도 현재 세션의 핵심 동작은 유지하도록 처리되어 있습니다.

---

## 10. 데이터 모델

주요 TypeScript 모델은 `src/types.ts`에서 관리합니다.

핵심 타입:

```
CoinId
MarketStatus
CoinMarket
MarketSnapshot
CoinBrief
MarketEvent
CryptoMarketBrief
MeetingStory
MeetingEvent
MeetingState
MeetingReport
ArchiveItem
AppState
View
```

### 핵심 데이터 흐름

```
MarketSnapshot
      │
      ├── Prompt Builder
      │       ↓
      │   External AI
      │       ↓
      │   Parser
      │       ↓
      └── CryptoMarketBrief
                  │
                  ├── Story
                  │
                  ↓
             MeetingEngine
                  ↓
             MeetingEvent[]
                  ↓
               Office
                  ↓
             MeetingReport
                  ↓
               Archive
```

---

## 11. 프로젝트 구조

현재 주요 구조:

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
│   ├── storage.ts
│   └── clipboard.ts
│
└── utils/
    └── format.ts
```

### 역할

| 파일 | 역할 |
|---|---|
| `App.tsx` | 전체 앱 상태 및 화면 흐름 |
| `types.ts` | 공통 데이터 모델 |
| `Office.tsx` | 2D 사무실 / 캐릭터 / 회의 렌더링 |
| `coins.ts` | 5개 코인 메타데이터 |
| `team.ts` | 회의 캐릭터 / 역할 |
| `demo.ts` | fallback / 데모 데이터 |
| `prompt.ts` | 일일 AI 조사 프롬프트 생성 |
| `parser.ts` | AI 결과 파싱 / 정규화 |
| `meeting.ts` | Story 기반 회의 이벤트 생성 |
| `report.ts` | 보고서 생성 / 텍스트 변환 |
| `market.ts` | 시장 API 및 snapshot 관리 |
| `storage.ts` | localStorage 저장 / 복구 |
| `clipboard.ts` | 프롬프트 / 보고서 복사 |
| `format.ts` | 가격 / 숫자 / 시간 포맷 |

---

## 12. 외부 AI 사용 방식

현재 앱은 OpenAI / Claude / Gemini 등의 API를 앱에서 직접 호출하지 않습니다.

사용자가:

1. Daily Prompt 생성
2. Prompt 복사
3. 외부 AI에 붙여넣기
4. AI 조사 실행
5. 결과 복사
6. 앱의 AI Result Import에 붙여넣기
7. Parse
8. Meeting 준비

하는 구조입니다.

장점:

- API Key 관리 부담 감소
- AI 서비스 교체 가능
- AI 결과를 사용자가 직접 검토 가능
- 앱과 AI 공급자의 결합도 감소
- 불필요한 반복 API 호출 방지

---

## 13. 토큰 사용량 최적화

현재 프롬프트는 토큰 사용량을 고려해 설계되어 있습니다.

### Compact Input

시장 데이터를 긴 JSON 객체 대신 다음과 같이 압축합니다.

```
BTC: [price, change24h, volumeM, low, high]
```

또한:

- 뉴스 최대 3개
- 출처 최대 8개
- 이전 회의 요약 최대 800자
- Story 배열 길이 제한
- 프롬프트 전체 최대 약 12,000 characters

등의 제한을 사용합니다.

목표는 **회의 품질을 유지하면서 불필요한 AI 입력 토큰을 줄이는 것**입니다.

---

## 14. 안전한 데이터 처리 원칙

AI가 제공한 정보와 시장 API 데이터는 서로 다른 역할을 가집니다.

### 시장 가격

가격 / 거래량 / 고가 / 저가 등의 기본 시장 수치는 MarketSnapshot을 기준으로 합니다.

AI 응답에서 가격을 다시 읽어 시장 가격을 덮어쓰지 않습니다.

### 뉴스

AI가 최근 뉴스와 출처를 제공하도록 요구하지만:

- 출처를 검증할 수 없으면 비워둘 수 있음
- 존재하지 않는 출처 생성 금지
- 확인되지 않은 이벤트 생성 금지
- 확인되지 않은 온체인 데이터 생성 금지

를 프롬프트에서 요구합니다.

### 해석

Bull / Bear Scenario는 예측 결과가 아니라 **조건부 시나리오**로 취급합니다.

앱 자체는 매수 / 매도 지시를 생성하는 구조가 아닙니다.

---

## 15. 현재 완료된 개발 단계

### Phase 1 — 기반 정리

- Mock 데이터 분리
- Coin / Team / Demo 데이터 구조화
- TypeScript 데이터 모델 정리

### Phase 2 — Market Data

- MarketSnapshot 도입
- CoinGecko 연동
- 고가 / 저가 / 거래량 / 시가총액 추가
- 캐시 / fallback
- LIVE / STALE / MOCK 상태

### Phase 3 — Dashboard

- 5개 코인 시장 카드
- 24H 변화
- 거래량
- 시가총액
- 24H Range
- LIVE 상태 표시

### Phase 4 — Daily Research

- Daily Prompt Builder
- Compact Prompt
- 이전 회의 context
- 외부 AI 조사 workflow

### Phase 5 — AI Import

- JSON parser
- Markdown parser
- Plain text parser
- 누락 코인 처리
- 정규화된 CryptoMarketBrief 생성

### Phase 6 — Meeting Engine

- MeetingEvent 구조
- 6개 캐릭터
- 시장 데이터 기반 발언
- 코인별 분석
- Risk / Scenario / Conclusion
- 보고서 연결

### Phase 7 — Live Meeting

- 회의 중 30초 market sync
- 모니터 live data
- SCREEN 이벤트와 코인 포커스 연결
- 현재 발언자 표시

### Phase 8 — Meeting UX

- Meeting Fullscreen
- 하단 terminal-style transcript
- 자동 스크롤
- ESC 종료
- Speech Bubble
- Active Speaker Highlight

### Phase 9 — Story Engine

- MeetingStory 데이터 모델
- 9개 Story Mode
- Hook / Central Question
- Debate Topics
- Turning Point
- Surprise
- Ending Question
- Watch Items
- Changes

### Phase 10 — Story-driven 20분 회의

- Story Mode별 실제 이벤트 순서 분기
- 코인 분석 순서 변화
- Risk / Catalyst / Rotation / Divergence 등 모드별 연출
- 약 20분 회의 시간 정규화
- 2배속 약 10분

### Phase 11 — Report / Archive

- MeetingReport
- Meeting Summary
- ArchiveItem
- localStorage
- 최대 20개 archive
- 보고서 복사
- 기록 삭제

---

## 16. 현재 확인된 기술적 상태

### 정상적으로 연결된 핵심 파이프라인

```
MarketService
   ↓
MarketSnapshot
   ↓
Prompt Builder
   ↓
External AI
   ↓
Parser
   ↓
CryptoMarketBrief
   ↓
Meeting Story
   ↓
MeetingEngine
   ↓
MeetingEvent[]
   ↓
Office
   ↓
MeetingReport
   ↓
Archive
```

### 현재 회의에서 AI를 다시 호출하지 않음

회의 시작 후에는 이미 정규화된 `CryptoMarketBrief`를 사용합니다.

따라서:

```
회의 중
❌ AI API 호출
❌ 새로운 AI 분석 요청
❌ HTML 직접 생성
```

대신:

```
회의 중
✓ 기존 Brief 사용
✓ MeetingEvent 재생
✓ Live Market Snapshot 표시
✓ 캐릭터 상태 변경
✓ Transcript 출력
```

---

## 17. 아직 구현되지 않은 항목

현재 프로젝트는 핵심 프로토타입 구조가 잡힌 단계이며 다음 항목은 후속 개발 대상입니다.

### Market

- Binance secondary provider
- Provider 자동 failover
- 더 세밀한 API rate-limit 처리
- 시장 데이터 freshness 정책 강화

### Research

- 앱 내부 자동 AI API 연동 여부 검토
- 자동 뉴스 수집
- 뉴스 출처 검증 강화
- 날짜 / 이벤트 검증 강화

### Meeting

- 캐릭터 간 실제 끼어들기
- 반박 / 재반박 구조
- 특정 캐릭터의 발언 후 다른 캐릭터가 즉시 대응
- Story Mode별 전용 연출 강화
- 장면 전환
- 카메라 연출
- 회의실 내 이동 패턴 다양화
- 발언 길이에 따른 자연스러운 애니메이션
- 더 풍부한 감정 상태

### UI

- 실제 브라우저 Fullscreen API 검토
- 모바일 / 작은 화면 최적화
- 화면 전환 애니메이션
- 회의실 장면 연출 강화

### Report

- HTML / PDF 보고서
- Story Mode 기반 보고서 구성
- 전체 회의 transcript 저장
- 회의 중 주요 Turning Point 자동 기록

### Persistence

- IndexedDB 검토
- 클라우드 Archive 검토
- 사용자별 저장 구조
- 데이터 export / import

---

## 18. 다음 개발 우선순위

현재 가장 중요한 다음 단계는 **회의가 실제로 대화처럼 느껴지게 만드는 것**입니다.

현재는 Story Mode에 따라 이벤트 순서가 달라지지만, 다음 단계에서는:

```
A 발언
  ↓
B 반박
  ↓
A 재설명
  ↓
C 새로운 증거 제시
  ↓
Risk 개입
  ↓
Leader 정리
```

와 같은 **대화 관계 자체**를 MeetingEvent에 표현하는 방향이 필요합니다.

그 다음:

1. 캐릭터 끼어들기 / 반박
2. Story Mode별 고유 장면
3. Turning Point 연출
4. 회의 transcript 강화
5. Report에 실제 회의 내용 저장
6. PDF / HTML 보고서
7. Binance fallback
8. 뉴스 / AI 자동화

순서로 확장할 수 있습니다.

---

## 19. 실행

```bash
npm install
npm run dev
```

프로덕션 빌드:

```bash
npm run build
```

현재 개발 환경에서는 GitHub 코드 구조와 연결 관계를 점검했으며, 이 문서 갱신 시점에 로컬 브라우저에서 실제 `npm run build`를 실행한 것은 아닙니다.

---

## 20. 환경 변수

선택적으로 CoinGecko Demo API Key를 사용할 수 있습니다.

```env
VITE_COINGECKO_DEMO_API_KEY=your_key
```

예:

```bash
cp .env.example .env.local
```

단, `VITE_` 접두사가 붙은 값은 브라우저 번들에 노출될 수 있으므로 **비밀 키를 저장하면 안 됩니다.**

---

## 21. 권장 AI 출력 구조

외부 AI에서 다음 형태의 JSON을 반환하도록 Daily Prompt가 요구합니다.

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

실제 사용 시 `coins`에는 다음 5개 ID가 정확히 한 번씩 포함되어야 합니다.

```
BTC
ETH
BNB
XRP
SOL
```

---

## 22. 설계 철학

이 프로젝트는 다음 원칙을 유지합니다.

### 1. Data First

시장 데이터와 AI 해석을 분리합니다.

### 2. Normalize First

AI 결과는 바로 UI에 사용하지 않고 `CryptoMarketBrief`로 정규화합니다.

### 3. Event Driven Meeting

회의는 텍스트를 직접 화면에 뿌리는 것이 아니라 `MeetingEvent[]`로 표현합니다.

### 4. Story Before Animation

애니메이션보다 먼저 회의의 논리와 이야기 구조를 만듭니다.

### 5. Evidence Before Drama

시청자에게 재미있는 회의를 만들되, 근거 없는 사건이나 데이터를 만들어내지 않습니다.

### 6. External AI First

현재는 외부 AI를 사용자가 직접 선택할 수 있도록 API 공급자와 앱을 분리합니다.

### 7. Token Conscious

매일 반복되는 시장 데이터와 이전 context를 압축해 불필요한 AI 입력을 줄입니다.

---

## 23. 프로젝트 상태

**현재 단계: Story-driven 2D Crypto AI Meeting Prototype**

핵심 데이터 파이프라인과 2D 회의 재생 구조는 연결되어 있습니다.

현재 가장 큰 개발 과제는 **정적인 순차 발표형 회의에서 실제 토론형 / 방송형 회의로 발전시키는 것**입니다.

이후 개발에서는 새로운 기능을 추가할 때에도 다음 구조를 유지합니다.

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

시장 데이터는 외부 API 상태에 따라 지연되거나 실패할 수 있으며, AI가 생성한 뉴스 / 해석 / 시나리오는 별도의 검증이 필요합니다.

이 프로젝트의 회의 내용은 투자 자문 또는 매매 지시가 아닙니다.
