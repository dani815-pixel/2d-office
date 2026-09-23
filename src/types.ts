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

export interface AppState {
  market: MarketSnapshot;
  brief?: CryptoMarketBrief;
  meeting: MeetingState;
  archive: ArchiveItem[];
}

export type View = "OFFICE" | "MARKET" | "PROMPT" | "IMPORT" | "MEETING" | "REPORT" | "ARCHIVE";