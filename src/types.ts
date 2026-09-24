export const COIN_IDS = ["BTC", "ETH", "BNB", "XRP", "SOL"] as const;
export type CoinId = (typeof COIN_IDS)[number];

export type MarketStatus = "LIVE" | "STALE" | "ERROR" | "MOCK";

export interface CoinMarket {
  id: CoinId;
  symbol: CoinId;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  high24h: number;
  low24h: number;
}

export interface MarketSnapshot {
  timestamp: string;
  status: MarketStatus;
  coins: CoinMarket[];
}

export interface LiveMeetingSignal {
  coin: CoinId;
  direction: "UP" | "DOWN";
  movePercent: number;
  text: string;
}

export interface CoinBrief {
  id: CoinId;
  summary: string;
  technical: string[];
  news: string[];
  bullScenario: string;
  bearScenario: string;
  risks: string[];
  interpretation?: string;
  counterView?: string;
  verification?: string[];
  takeaways?: string[];
  advancedSignals?: string[];
}

export interface MarketEvent {
  title: string;
  summary: string;
  source?: string;
}

export interface MeetingStory {
  mode: string;
  title: string;
  openingHook: string;
  centralQuestion: string;
  debateTopics: string[];
  turningPoint: string;
  surprise: string;
  endingQuestion: string;
  watchItems: string[];
  changes: string[];
}

export type Source = string;

export interface CryptoMarketBrief {
  date: string;
  marketSummary: string;
  coins: CoinBrief[];
  risks: string[];
  events?: MarketEvent[];
  sources: Source[];
  globalFactors?: string[];
  correlations?: string[];
  viewerTakeaways?: string[];
  story?: MeetingStory;
}

export type RoleId = "leader" | "market" | "onchain" | "altcoin" | "risk" | "trader";

export type CharacterStatus =
  | "IDLE" | "WALK" | "SIT" | "STAND" | "SPEAK"
  | "LISTEN" | "THINK" | "POINT" | "ALERT" | "END";

export type MeetingDialogueIntent = "STATEMENT" | "QUESTION" | "REPLY" | "CHALLENGE" | "AGREE" | "EVIDENCE" | "SUMMARY" | "TURNING_POINT";

export interface MeetingEvent {
  type: "MOVE" | "SPEAK" | "LISTEN" | "SCREEN" | "EMOTION" | "HIGHLIGHT" | "PAUSE" | "END";
  speaker?: RoleId;
  text?: string;
  target?: string;
  replyTo?: RoleId;
  intent?: MeetingDialogueIntent;
  live?: boolean;
  livePriceCoin?: CoinId;
  duration?: number;
}

export interface MeetingState {
  status: "READY" | "RUNNING" | "PAUSED" | "FINISHED";
  events: MeetingEvent[];
  index: number;
  snapshot?: MarketSnapshot;
}

export interface MeetingReport {
  id: string;
  date: string;
  createdAt: string;
  crossMarket: string;
  watchlist: CoinId[];
  conclusion: string;
}

export interface MeetingFollowUp {
  text: string;
  coin?: CoinId;
  status: "OPEN" | "RESOLVED";
}

export interface MeetingMemory {
  session: number;
  question: string;
  keyFindings: string[];
  openFollowUps: MeetingFollowUp[];
  resolvedFollowUps: MeetingFollowUp[];
  watchItems: string[];
  turningPoint?: string;
}

export interface ArchiveItem {
  meetingId: string;
  date: string;
  marketSnapshot: MarketSnapshot;
  brief: CryptoMarketBrief;
  meetingSummary: string;
  memory?: MeetingMemory;
  report: MeetingReport;
}

export type TradingMode = "SPOT" | "FUTURES";
export type TradeSide = "LONG" | "SHORT";
export type TraderRole = "TEAM_LEAD" | "SPECIALIST";
export type TraderActivity = "WORK" | "ANALYZE" | "WATCH" | "TRADE" | "TALK" | "THINK" | "WALK" | "COFFEE" | "BREAK" | "RESTROOM" | "OUTSIDE" | "RETURN";

export interface TraderProfile {
  id: string;
  name: string;
  coin: CoinId | "TEAM";
  role: TraderRole;
  personality: string;
  speakingStyle: string;
  specialty: string;
}

export interface TraderSettings {
  mode: TradingMode;
  strategy: string;
  riskPercent: number;
  leverage: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  confirmation: string[];
  allowLong: boolean;
  allowShort: boolean;
  autoSimulation: boolean;
  reason?: string;
}

export interface TradeScenario {
  id: string;
  meetingId?: string;
  coin: CoinId;
  bias: "LONG" | "SHORT" | "NEUTRAL" | "WATCH";
  marketMode: "SPOT" | "FUTURES" | "BOTH";
  entryCondition?: string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  invalidation?: string;
  reasoning: string;
  confidence?: "LOW" | "MEDIUM" | "HIGH";
  source: "MEETING";
}

export interface Position {
  id: string;
  coin: CoinId;
  mode: TradingMode;
  side: TradeSide;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  leverage: number;
  margin?: number;
  stopLoss?: number;
  takeProfit?: number;
  unrealizedPnl: number;
  roi: number;
  openedAt: string;
  traderId: string;
  scenarioId?: string;
}

export interface Trade {
  id: string;
  coin: CoinId;
  mode: TradingMode;
  side: TradeSide;
  quantity: number;
  leverage: number;
  entryPrice: number;
  exitPrice: number;
  pnl: number;
  roi: number;
  openedAt: string;
  closedAt: string;
  closeReason: "MANUAL" | "TAKE_PROFIT" | "STOP_LOSS" | "LIQUIDATION";
  traderId: string;
  scenarioId?: string;
}

export interface TradeReview {
  tradeId: string;
  traderId: string;
  result: "WIN" | "LOSS" | "BREAKEVEN";
  facts: string[];
  interpretation: string[];
  possibleCauses: string[];
  lessons: string[];
  regret?: string;
  improvement?: string;
  confidence: "LOW" | "MEDIUM" | "HIGH";
  createdAt: string;
}

export interface TraderMemory {
  traderId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  repeatedMistakes: string[];
  provenStrengths: string[];
  currentLessons: string[];
  strategyChanges: string[];
  riskChanges: string[];
  openQuestions: string[];
  lastReview?: TradeReview;
}

export interface TradingTeamState {
  sessionId: string;
  sessionStartedAt: string;
  startingBalance: number;
  balance: number;
  positions: Position[];
  trades: Trade[];
  reviews: TradeReview[];
  scenarios: TradeScenario[];
  profiles: TraderProfile[];
  settings: Record<string, TraderSettings>;
  memories: Record<string, TraderMemory>;
  activities: Record<string, TraderActivity>;
}

export interface AppState {
  market: MarketSnapshot;
  brief?: CryptoMarketBrief;
  meeting: MeetingState;
  archive: ArchiveItem[];
}

export type View = "OFFICE" | "MARKET" | "PROMPT" | "IMPORT" | "MEETING" | "REPORT" | "ARCHIVE";