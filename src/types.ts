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

export interface CoinBrief {
  id: CoinId;
  summary: string;
  technical: string[];
  news: string[];
  bullScenario: string;
  bearScenario: string;
  risks: string[];
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
  story?: MeetingStory;
}

export type RoleId = "leader" | "market" | "onchain" | "altcoin" | "risk" | "trader";

export type CharacterStatus =
  | "IDLE" | "WALK" | "SIT" | "STAND" | "SPEAK"
  | "LISTEN" | "THINK" | "POINT" | "ALERT" | "END";

export type MeetingDialogueIntent = "STATEMENT" | "QUESTION" | "REPLY" | "CHALLENGE" | "AGREE" | "EVIDENCE" | "SUMMARY";

export interface MeetingEvent {
  type: "MOVE" | "SPEAK" | "LISTEN" | "SCREEN" | "EMOTION" | "PAUSE" | "END";
  speaker?: RoleId;
  text?: string;
  target?: string;
  replyTo?: RoleId;
  intent?: MeetingDialogueIntent;
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

export interface ArchiveItem {
  meetingId: string;
  date: string;
  marketSnapshot: MarketSnapshot;
  brief: CryptoMarketBrief;
  meetingSummary: string;
  report: MeetingReport;
}

export interface AppState {
  market: MarketSnapshot;
  brief?: CryptoMarketBrief;
  meeting: MeetingState;
  report?: MeetingReport;
  archive: ArchiveItem[];
}

export type View = "OFFICE" | "MARKET" | "PROMPT" | "IMPORT" | "MEETING" | "REPORT" | "ARCHIVE";