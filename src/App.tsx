import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Office from "./components/Office";
import { type AppState, type ArchiveItem, type CoinId, type View } from "./types";
import { COIN_META } from "./data/coins";
import { TEAM } from "./data/team";
import { DEMO_RESEARCH, MOCK_MARKET } from "./data/demo";
import { getMarketSnapshot, subscribeMarketStream } from "./services/market";
import { readArchive, saveArchive } from "./services/storage";
import { copyText } from "./services/clipboard";
import { buildDailyPrompt } from "./engine/prompt";
import { parseResearch, type ParseResult } from "./engine/parser";
import { createMeetingEvents } from "./engine/meeting";
import { createMeetingMemory, createReport, reportToText } from "./engine/report";
import { LiveMeetingController } from "./services/liveMeeting";
import { changeText, compactUSD, dateText, priceUSD, resolveMeetingLiveText, timeText } from "./utils/format";

type IconName = "office" | "market" | "prompt" | "import" | "meeting" | "report" | "archive" | "refresh" | "arrow" | "copy" | "play" | "pause" | "skip" | "check" | "trash" | "clock" | "expand" | "close";

function Icon({ name, size = 18, className = "" }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    office: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    market: <><path d="M3 18h18M4 14l5-5 4 3 7-8" /><path d="M16 4h4v4" /></>,
    prompt: <><rect x="3" y="4" width="18" height="16" rx="2" /><path d="m7 9 3 3-3 3m6 0h4" /></>,
    import: <><path d="M12 3v12m-4-4 4 4 4-4" /><path d="M4 16v4h16v-4" /></>,
    meeting: <><path d="M8 5h8m-9 9h10M4 9h16M7 19h10" /><circle cx="4" cy="5" r="1" /><circle cx="20" cy="5" r="1" /><circle cx="4" cy="19" r="1" /><circle cx="20" cy="19" r="1" /></>,
    report: <><path d="M6 3h9l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 12h8M8 16h8" /></>,
    archive: <><rect x="3" y="4" width="18" height="5" rx="1" /><path d="M5 9v11h14V9M10 13h4" /></>,
    refresh: <><path d="M20 11a8 8 0 1 0-2.2 6.5M20 4v7h-7" /></>,
    arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></>,
    play: <path d="m8 5 11 7-11 7V5Z" />,
    pause: <><path d="M8 5v14M16 5v14" /></>,
    skip: <><path d="m4 5 9 7-9 7V5Zm10 0 8 7-8 7V5Z" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    trash: <><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7M10 11v6m4-6v6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    expand: <><path d="M8 3H3v5M16 3h5v5M21 16v5h-5M3 16v5h5" /><path d="M3 8 8 3m8 0 5 5m0 8-5 5m-8 0-5-5" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}

const NAV: { id: View; label: string; icon: IconName; group: string; number: string }[] = [
  { id: "OFFICE", label: "Office", icon: "office", group: "WORKSPACE", number: "01" },
  { id: "MARKET", label: "Market", icon: "market", group: "WORKSPACE", number: "02" },
  { id: "PROMPT", label: "Daily prompt", icon: "prompt", group: "RESEARCH FLOW", number: "03" },
  { id: "IMPORT", label: "AI import", icon: "import", group: "RESEARCH FLOW", number: "04" },
  { id: "MEETING", label: "Meeting room", icon: "meeting", group: "OUTPUT", number: "05" },
  { id: "REPORT", label: "Report", icon: "report", group: "OUTPUT", number: "06" },
  { id: "ARCHIVE", label: "Archive", icon: "archive", group: "OUTPUT", number: "07" },
];

function PageHead({ eyebrow, title, description, action }: { eyebrow: string; title: ReactNode; description: string; action?: ReactNode }) {
  return <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action && <div className="page-head-action">{action}</div>}</div>;
}

function EmptyState({ index, title, description, button, onClick }: { index: string; title: string; description: string; button: string; onClick: () => void }) {
  return <div className="empty-state"><span className="empty-index">{index} / NO DATA YET</span><div className="empty-symbol">[&nbsp; _ &nbsp;]</div><h2>{title}</h2><p>{description}</p><button className="button button--primary" onClick={onClick} type="button">{button}<Icon name="arrow" size={17} /></button></div>;
}

export default function App() {
  const [app, setApp] = useState<AppState>(() => ({ market: MOCK_MARKET, meeting: { status: "READY", events: [], index: 0 }, archive: readArchive() }));
  const [view, setView] = useState<View>("OFFICE");
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");
  const [selectedCoin, setSelectedCoin] = useState<CoinId>("BTC");
  const [prompt, setPrompt] = useState("");
  const [rawImport, setRawImport] = useState("");
  const [preview, setPreview] = useState<ParseResult | null>(null);
  const [importStatus, setImportStatus] = useState<"READY" | "PARSING" | "VALID" | "INVALID">("READY");
  const [speed, setSpeed] = useState(1);
  const [selectedArchiveId, setSelectedArchiveId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState(false);
  const [toast, setToast] = useState("");
  const [meetingFullscreen, setMeetingFullscreen] = useState(false);
  const meetingLayoutRef = useRef<HTMLDivElement>(null);
  const parseJob = useRef(0);
  const transcriptEnd = useRef<HTMLDivElement>(null);
  const liveMeetingRef = useRef(new LiveMeetingController());

  useEffect(() => {
    let mounted = true;
    getMarketSnapshot().then(({ snapshot, error }) => {
      if (!mounted) return;
      setApp((previous) => ({ ...previous, market: snapshot }));
      setMarketError(error || "");
      setMarketLoading(false);
    });
    return () => { mounted = false; };
  }, []);
  useEffect(() => { setStorageError(!saveArchive(app.archive)); }, [app.archive]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const go = (next: View) => { setView(next); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const refreshMarket = async () => {
    setMarketLoading(true);
    setMarketError("");
    const { snapshot, error } = await getMarketSnapshot(true);
    setApp((previous) => ({ ...previous, market: snapshot }));
    setMarketError(error || "");
    setMarketLoading(false);
    setToast(error ? "API 연결에 실패해 대체 데이터를 표시합니다." : "시장 데이터가 갱신되었습니다.");
  };
  const copy = async (text: string, success: string) => {
    try { await copyText(text); setToast(success); }
    catch { setToast("복사할 수 없습니다. 브라우저의 클립보드 권한을 확인해 주세요."); }
  };

  const finishMeeting = useCallback(() => {
    if (!app.brief) return;
    setApp((previous) => {
      if (previous.meeting.status === "FINISHED") return previous;
      const snapshot = previous.meeting.snapshot || previous.market;
      const { report, summary } = createReport(app.brief!, snapshot);
      const previousSession = previous.archive.reduce((max, item) => Math.max(max, item.memory?.session || 0), 0);
      const memory = createMeetingMemory(app.brief!, previousSession + 1);
      const item: ArchiveItem = {
        meetingId: report.id,
        date: report.date,
        marketSnapshot: snapshot,
        brief: app.brief!,
        meetingSummary: summary,
        memory,
        report,
      };
      return {
        ...previous,
        meeting: { ...previous.meeting, status: "FINISHED", index: previous.meeting.events.length - 1 },
        report,
        archive: [item, ...previous.archive].slice(0, 20),
      };
    });
    setSelectedArchiveId(null);
  }, [app.brief]);

  useEffect(() => {
    return subscribeMarketStream(
      (snapshot) => {
        setApp((previous) => {
          if (previous.meeting.status !== "RUNNING") return { ...previous, market: snapshot };
          liveMeetingRef.current.observe(snapshot);
          let nextMeeting = previous.meeting;
          const current = nextMeeting.events[nextMeeting.index];
          const canInsert = current?.type === "PAUSE" || current?.type === "LISTEN" || current?.type === "SCREEN";
          if (canInsert) {
            const signal = liveMeetingRef.current.consumePending();
            if (signal) {
              const events = [...nextMeeting.events];
              const speaker = signal.coin === "BTC" || signal.coin === "ETH" ? "market" : signal.coin === "BNB" || signal.coin === "XRP" ? "altcoin" : "trader";
              const intent = signal.direction === "DOWN" ? "CHALLENGE" : "EVIDENCE";
              const responder = speaker === "market" ? "risk" : speaker === "altcoin" ? "market" : "risk";
              const responseText = signal.direction === "DOWN" ? "하락 신호는 리스크 관점에서도 확인하겠습니다." : "상승 흐름이 다른 지표에서도 이어지는지 확인하겠습니다.";
              events.splice(Math.min(nextMeeting.index + 1, events.length), 0,
                { type: "SPEAK", speaker, text: signal.text, intent, live: true, duration: 8500 },
                { type: "SPEAK", speaker: responder, text: responseText, intent: "REPLY", replyTo: speaker, live: true, duration: 5000 },
              );
              nextMeeting = { ...nextMeeting, events };
            }
          }
          return { ...previous, market: snapshot, meeting: nextMeeting };
        });
        setMarketError("");
      },
      (message) => setMarketError(message),
    );
  }, []);;

  useEffect(() => {
    if (app.meeting.status !== "RUNNING") return;
    const current = app.meeting.events[app.meeting.index];
    if (!current) return;
    const timer = window.setTimeout(() => {
      if (current.type === "END" || app.meeting.index >= app.meeting.events.length - 1) finishMeeting();
      else setApp((previous) => previous.meeting.status === "RUNNING" && previous.meeting.index === app.meeting.index
        ? { ...previous, meeting: { ...previous.meeting, index: previous.meeting.index + 1 } } : previous);
    }, (current.duration || 1000) / speed);
    return () => window.clearTimeout(timer);
  }, [app.meeting, speed, finishMeeting]);
  useEffect(() => {
    const element = meetingLayoutRef.current;
    if (!element) return;
    const onFullscreenChange = () => setMeetingFullscreen(document.fullscreenElement === element);
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [view, app.brief]);

  const toggleMeetingFullscreen = async () => {
    const element = meetingLayoutRef.current;
    if (!element) return;
    try {
      if (document.fullscreenElement === element) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      setMeetingFullscreen(false);
      setToast("브라우저에서 전체화면을 사용할 수 없습니다.");
    }
  };
  useEffect(() => {
    if (view === "MEETING" && app.meeting.status !== "READY") {
      const scroller = transcriptEnd.current?.parentElement;
      scroller?.scrollTo({ top: scroller.scrollHeight, behavior: "smooth" });
    }
  }, [app.meeting.index, app.meeting.status, view]);

  const startMeeting = () => {
    if (!app.brief) return;
    liveMeetingRef.current.reset();
    setApp((previous) => ({ ...previous, meeting: { status: "RUNNING", events: createMeetingEvents(previous.brief!, previous.market, previous.archive[0]?.memory), index: 0, snapshot: previous.market }, report: undefined }));
    setSelectedArchiveId(null);
    go("MEETING");
  };
  const advanceMeeting = () => {
    if (app.meeting.index >= app.meeting.events.length - 2) { finishMeeting(); return; }
    setApp((previous) => ({ ...previous, meeting: { ...previous.meeting, index: previous.meeting.index + 1 } }));
  };
  const handleImport = () => {
    const job = ++parseJob.current;
    setImportStatus("PARSING"); setPreview(null);
    window.setTimeout(() => {
      if (job !== parseJob.current) return;
      const result = parseResearch(rawImport);
      setPreview(result); setImportStatus(result.brief ? "VALID" : "INVALID");
    }, 180);
  };
  const confirmImport = () => {
    if (!preview?.brief) return;
    setApp((previous) => ({ ...previous, brief: preview.brief, meeting: { status: "READY", events: [], index: 0 }, report: undefined }));
    setRawImport("");
    setPreview(null);
    setImportStatus("READY");
    setSelectedArchiveId(null); setToast("Market Brief가 확정되었습니다. 새 AI 결과를 받을 준비가 되었습니다."); go("MEETING");
  };

  const openCoin = (id: CoinId) => { setSelectedCoin(id); go("MARKET"); };
  const marketCoin = app.market.coins.find((coin) => coin.id === selectedCoin) || app.market.coins[0];
  const coinInterpretation = app.brief?.coins.find((coin) => coin.id === selectedCoin);
  const reportItem = selectedArchiveId ? app.archive.find((item) => item.meetingId === selectedArchiveId)
    : app.report ? app.archive.find((item) => item.meetingId === app.report?.id) : app.archive[0];
  const playedLines = app.meeting.events.map((event, index) => ({ event, index })).filter(({ event, index }) => event.type === "SPEAK" && index <= app.meeting.index);
  const totalLines = app.meeting.events.filter((event) => event.type === "SPEAK").length;
  const meetingProgress = app.meeting.events.length ? Math.round((app.meeting.index + 1) / app.meeting.events.length * 100) : 0;
  const dateLabel = new Intl.DateTimeFormat("ko-KR", { month: "short", day: "numeric", weekday: "short" }).format(new Date());

  return <div className="app-shell">
    <aside className="sidebar">
      <button className="brand" type="button" onClick={() => go("OFFICE")} aria-label="2D Crypto AI Office 홈"><span className="brand-mark"><i /><i /><i /><i /></span><span className="brand-name">CRYPTO<span>AI OFFICE</span></span></button>
      <div className="sidebar-caption">YOUR MARKET INTELLIGENCE DESK</div>
      <nav className="side-nav" aria-label="주 메뉴">{NAV.map((item, index) => <div key={item.id}>
        {(index === 0 || NAV[index - 1].group !== item.group) && <div className="nav-group">{item.group}</div>}
        <button className={`nav-link ${view === item.id ? "nav-link--active" : ""}`} onClick={() => { if (item.id === "REPORT") setSelectedArchiveId(null); go(item.id); }} type="button" aria-current={view === item.id ? "page" : undefined}><Icon name={item.icon} size={18} /><span>{item.label}</span><small>{item.number}</small></button>
      </div>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-system"><span className="system-icon"><span /><span /><span /></span><div><strong>SYSTEM ONLINE</strong><small>Local workspace / no AI key</small></div></div><div className="sidebar-version"><span>2D CRYPTO AI OFFICE</span><span>V 1.0</span></div></div>
    </aside>
    <div className="main-shell">
      <header className="topbar"><div className="breadcrumb"><span>WORKSPACE</span><b>/</b><strong>{view === "OFFICE" ? "OVERVIEW" : view}</strong></div><div className="topbar-actions"><span className="today-text"><Icon name="clock" size={15} />{dateLabel}</span><span className={`status-pill status-pill--${marketLoading ? "loading" : app.market.status.toLowerCase()}`}><i />{marketLoading ? "CONNECTING" : app.market.status}</span><button className={`top-refresh ${marketLoading ? "is-spinning" : ""}`} onClick={refreshMarket} disabled={marketLoading} title="시장 데이터 새로고침" aria-label="시장 데이터 새로고침" type="button"><Icon name="refresh" size={17} /></button></div></header>
      <main className="page-content">
        {storageError && (view === "ARCHIVE" || view === "MEETING" || view === "REPORT") && <div className="inline-warning"><span>!</span>브라우저 저장소에 접근할 수 없습니다. 보고서는 현재 세션에서만 유지됩니다.</div>}
        {view === "OFFICE" && <div className="office-page">
          <div className="office-intro">
            <div className="eyebrow"><span className="eyebrow-line" /> THE WORKSPACE <span className="eyebrow-suffix">/ 01</span></div>
            <div className="office-intro-row"><div><h1>2D CRYPTO<br /><span>AI OFFICE<span className="hero-period">.</span></span></h1><p>시장의 신호를 읽고, AI의 해석을 모아, 하나의 회의로 연결합니다.</p></div><div className="office-intro-actions"><button className="button button--primary" type="button" onClick={() => go("PROMPT")}>오늘의 AI 조사 시작 <Icon name="arrow" size={18} /></button><button className="button button--text" type="button" onClick={() => go("MARKET")}>시장 데이터 살펴보기 <Icon name="arrow" size={16} /></button></div></div>
          </div>
          <Office market={app.market} brief={app.brief} onCoinClick={openCoin} />
          <div className="scene-meta"><span><span className="meta-accent">SOURCE</span> {app.market.status === "MOCK" ? "DEMO DATA / USD" : "BINANCE WS + COINGECKO / USD"} {app.market.status === "MOCK" && <b>· 고정 예시 데이터, 실시간 아님</b>}</span><span>{app.market.status === "MOCK" ? "SAMPLE DATE" : "LAST SYNC"} {app.market.status === "MOCK" ? dateText(app.market.timestamp) : timeText(app.market.timestamp)} {app.market.status === "STALE" && "/ CACHED"}</span></div>
          {marketError && <div className="inline-warning"><span>!</span>{marketError}</div>}
          <div className="roster"><div className="roster-title"><span>THE TEAM</span><strong>06</strong></div>{TEAM.map((member) => <div className="roster-member" key={member.id}><i style={{ background: member.color }} /><strong>{member.name}</strong><span>{member.role}</span></div>)}</div>
        </div>}

        {view === "MARKET" && <div className="standard-page market-page"><PageHead eyebrow="02 / MARKET INTELLIGENCE" title={<>Market <em>monitor.</em></>} description="Binance WebSocket의 실시간 시세와 CoinGecko 보조 데이터를 함께 확인합니다." action={<button className="button button--outline" type="button" onClick={refreshMarket} disabled={marketLoading}><Icon name="refresh" size={16} className={marketLoading ? "spin" : ""} />데이터 갱신</button>} /><div className="section-rule"><span><i className={`feed-dot feed-dot--${app.market.status.toLowerCase()}`} />{marketLoading ? "CONNECTING TO COINGECKO" : `${app.market.status} MARKET DATA`}<span className="section-rule-muted"> / BINANCE WS · USD</span></span><span>UPDATED {dateText(app.market.timestamp)} · {timeText(app.market.timestamp)}</span></div>{marketError && <div className="inline-warning"><span>!</span>{marketError}</div>}<div className="market-grid">{app.market.coins.map((coin, index) => <button type="button" key={coin.id} onClick={() => setSelectedCoin(coin.id)} className={`coin-card ${selectedCoin === coin.id ? "coin-card--selected" : ""}`}><div className="coin-card-top"><span className="coin-symbol" style={{ color: COIN_META[coin.id].color, borderColor: `${COIN_META[coin.id].color}70`, background: `${COIN_META[coin.id].color}18` }}>{coin.id.slice(0, 1)}</span><span className="coin-card-name"><strong>{COIN_META[coin.id].name}</strong><small>{coin.id} / USD</small></span><span className="coin-index">0{index + 1} / 05</span></div><div className="coin-card-price">{priceUSD(coin.price)}</div><div className={`coin-card-change ${coin.change24h >= 0 ? "up" : "down"}`}>{coin.change24h >= 0 ? "↗" : "↘"} {changeText(coin.change24h)} <span>24H</span></div><div className="coin-card-stats"><div><span>24H VOLUME</span><strong>{compactUSD(coin.volume24h)}</strong></div><div><span>MARKET CAP</span><strong>{coin.marketCap ? compactUSD(coin.marketCap) : "N/A"}</strong></div><div><span>24H RANGE</span><strong>{priceUSD(coin.low24h)} — {priceUSD(coin.high24h)}</strong></div></div><div className="coin-card-bottom"><span><i className={`feed-dot feed-dot--${app.market.status.toLowerCase()}`} />{app.market.status} DATA</span><span>{timeText(app.market.timestamp)} <Icon name="arrow" size={14} /></span></div></button>)}</div><div className="market-insight"><div className="insight-header"><span className="eyebrow-small">SELECTED ASSET / {marketCoin.id}</span><h2>{COIN_META[marketCoin.id].name}<span> / {marketCoin.id}</span></h2></div><div className="insight-columns"><div><span className="data-type">01 / FACT · MARKET API</span><p>{priceUSD(marketCoin.price)} <span className={marketCoin.change24h >= 0 ? "up" : "down"}>({changeText(marketCoin.change24h)} / 24h)</span></p><small>가격·변동·거래량·고저가는 {app.market.status === "MOCK" ? "고정 예시 데이터" : "Binance WebSocket"}를 기준으로 하고, 시가총액은 CoinGecko 보조 데이터입니다.</small></div><div><span className="data-type">02 / INTERPRETATION · AI RESEARCH</span><p>{coinInterpretation?.summary || "아직 가져온 AI 분석이 없습니다."}</p><small>{coinInterpretation ? "AI 해석은 가격 사실 데이터를 변경하지 않습니다." : "조사 결과를 가져오면 이곳에 해석이 표시됩니다."}</small></div></div></div></div>}

        {view === "PROMPT" && <div className="standard-page prompt-page"><PageHead eyebrow="03 / EXTERNAL AI RESEARCH" title={<>One prompt. <em>Better context.</em></>} description="시세는 코드가 준비하고, 외부 AI에는 짧고 구조화된 조사만 요청합니다." /><div className="prompt-layout"><div className="editor-panel"><div className="editor-header"><div><span className="editor-square" />DAILY AI RESEARCH PROMPT <small>/ BUILDER</small></div><button className="button button--primary button--small" type="button" onClick={() => { setPrompt(buildDailyPrompt(app.market, app.archive[0])); setToast("오늘의 조사 프롬프트를 생성했습니다."); }}><Icon name="prompt" size={16} /> GENERATE DAILY AI PROMPT</button></div>{prompt ? <textarea className="prompt-output" value={prompt} readOnly aria-label="생성된 AI 조사 프롬프트" spellCheck={false} /> : <div className="prompt-placeholder"><div className="placeholder-code"><span>01</span><i>market.snapshot()</i><b>→</b><span>02</span><i>research.prompt()</i></div><h2>조사 준비가 완료되었습니다.</h2><p>현재 시장 스냅샷과 이전 회의 요약을 압축해<br />외부 AI에 전달할 프롬프트를 만듭니다.</p></div>}<div className="editor-footer"><div className="prompt-size"><span>PROMPT SIZE</span><strong>{prompt.length.toLocaleString()} chars <i>/</i> ~{Math.ceil(prompt.length / 4).toLocaleString()} tokens</strong><small>Estimated · 문자 수 / 4</small></div><div className="editor-actions"><button className="button button--outline" type="button" onClick={() => copy(prompt, "프롬프트가 복사되었습니다.")} disabled={!prompt}><Icon name="copy" size={16} /> 복사하기</button><button className="button button--text" type="button" onClick={() => go("IMPORT")}>결과 가져오기 <Icon name="arrow" size={16} /></button></div></div></div><aside className="prompt-side"><div className="side-section-label">INPUT / TODAY</div><h3>Only what matters.</h3><p>전체 API 응답이나 이전 회의록을 다시 보내지 않습니다. 외부 AI 호출은 앱이 대신하지 않습니다.</p><div className="side-data-row"><span>MARKET SOURCE</span><strong className={app.market.status === "MOCK" ? "down" : ""}>{app.market.status}</strong></div><div className="side-data-row"><span>ASSETS</span><strong>BTC · ETH · BNB · XRP · SOL</strong></div><div className="side-data-row"><span>PREVIOUS CONTEXT</span><strong>{app.archive.length ? "요약만 포함" : "없음"}</strong></div><div className="side-data-row"><span>MAX PROMPT</span><strong>12,000 CHARS</strong></div>{app.market.status !== "LIVE" && <div className="side-alert">{app.market.status === "MOCK" ? "예시 시세가 프롬프트에 포함됩니다. 외부 AI에서 현재 시세를 반드시 재확인하세요." : "현재 시세가 실시간으로 확인되지 않았습니다. 외부 AI에서 재확인하세요."}</div>}<div className="side-step"><span>01 / COPY PROMPT</span><span>02 / ASK YOUR AI</span><span>03 / PASTE RESULT</span></div></aside></div></div>}

        {view === "IMPORT" && <div className="standard-page import-page">
          <PageHead eyebrow="04 / RESEARCH IMPORT" title={<>Bring back <em>the insight.</em></>} description="외부 AI의 분석을 붙여넣고, 정규화된 Market Brief를 확인한 뒤 회의에 전달합니다." />
          <div className="import-layout">
            <div className="editor-panel import-editor">
              <div className="editor-header"><div><span className="editor-square" />PASTE AI RESEARCH RESULT <small>/ JSON · MARKDOWN · TEXT</small></div><span className={`import-indicator import-indicator--${importStatus.toLowerCase()}`}><i />{importStatus}</span></div>
              <textarea className="import-textarea" placeholder={'외부 AI의 응답을 여기에 붙여넣으세요.\n\n권장 형식: { "date": "YYYY-MM-DD", "marketSummary": "...", "coins": [...] }\nMarkdown 제목(## BTC) 또는 BTC: 요약 형태도 지원합니다.'} value={rawImport} onChange={(event) => { parseJob.current++; setRawImport(event.target.value); setPreview(null); setImportStatus("READY"); }} spellCheck={false} aria-label="AI 분석 결과 입력" />
              <div className="import-actions"><button type="button" className="button button--text" onClick={() => { parseJob.current++; setRawImport(DEMO_RESEARCH); setPreview(null); setImportStatus("READY"); }}>데모 결과 채우기 <Icon name="arrow" size={15} /></button><button type="button" className="button button--primary" onClick={handleImport} disabled={importStatus === "PARSING"}><Icon name="import" size={17} /> {importStatus === "PARSING" ? "분석 중..." : "분석 결과 가져오기"}</button></div>
            </div>
            <aside className="import-side"><span className="side-section-label">THE IMPORT PIPELINE</span><div className="pipeline-list"><div><span>01</span><strong>PARSE</strong><small>JSON 우선, Markdown / 일반 텍스트 지원</small></div><div><span>02</span><strong>NORMALIZE</strong><small>5개 코인을 공통 Brief 형식으로 변환</small></div><div><span>03</span><strong>VALIDATE</strong><small>요약과 코인 분석을 검사하고 미비점 표시</small></div><div><span>04</span><strong>CONFIRM</strong><small>확인 후에만 회의 엔진으로 전달</small></div></div><p className="side-note">AI가 제시한 가격은 사용하지 않습니다. 시장 수치는 Market API 스냅샷이 기준입니다.</p></aside>
          </div>
          {preview && <section className={`preview-panel ${preview.brief ? "preview-panel--valid" : "preview-panel--invalid"}`}>
            <div className="preview-header"><div><span className="eyebrow-small">IMPORT PREVIEW / {preview.format}</span><h2>{preview.brief ? "Market Brief is ready." : "결과를 확인해 주세요."}</h2></div><span className={`preview-stamp ${preview.brief ? "preview-stamp--valid" : "preview-stamp--invalid"}`}><Icon name={preview.brief ? "check" : "import"} size={15} /> {preview.brief ? "VALID" : "INVALID"}</span></div>
            {preview.errors.length > 0 && <div className="validation-box validation-box--error"><strong>VALIDATION ERRORS</strong>{preview.errors.map((error) => <p key={error}>{error}</p>)}</div>}
            {preview.brief && <><div className="preview-summary"><span>MARKET SUMMARY</span><p>{preview.brief.marketSummary}</p></div>{preview.brief.viewerTakeaways?.length ? <div className="preview-takeaways"><span>VIEWER TAKEAWAYS</span>{preview.brief.viewerTakeaways.map((item) => <p key={item}>• {item}</p>)}</div> : null}{preview.warnings.length > 0 && <div className="validation-box"><strong>⚠ 일부 정보가 자동으로 추출되지 않았습니다.</strong><p>아래 경고를 확인한 뒤 원문을 수정하거나 그대로 회의에 전달할 수 있습니다.</p></div>}<div className="preview-coins">{preview.brief.coins.map((coin) => { const complete = Boolean(coin.summary || coin.technical.length || coin.news.length || coin.risks.length); return <div key={coin.id}><strong>{coin.id}</strong><p>{coin.summary || "요약 없음"}</p>{coin.interpretation && <small className="preview-interpretation">해석: {coin.interpretation}</small>}<span>{complete ? "EXTRACTED" : "MISSING"} · {coin.technical.length} TECHNICAL · {coin.news.length} NEWS · {coin.risks.length} RISKS</span></div>; })}</div><div className="preview-lower"><div><span>RISKS</span>{preview.brief.risks.length ? preview.brief.risks.map((risk) => <p key={risk}>{risk}</p>) : <p>제공되지 않음</p>}</div><div><span>SOURCES</span>{preview.brief.sources.length ? preview.brief.sources.map((source) => <p key={source}>{source}</p>) : <p>제공되지 않음. 출처를 별도로 확인하세요.</p>}</div></div></>}
            {preview.warnings.length > 0 && <div className="validation-box"><strong>VALIDATION NOTES / {preview.warnings.length}</strong>{preview.warnings.map((warning) => <p key={warning}>{warning}</p>)}</div>}
            {preview.brief && <div className="preview-confirm"><span>FACT와 INTERPRETATION은 별도로 보관됩니다.</span><div><button className="button button--text" type="button" onClick={() => { setPreview(null); setImportStatus("READY"); }}>수정하기</button><button className="button button--primary" type="button" onClick={confirmImport}><Icon name="check" size={17} /> 회의 준비 <Icon name="arrow" size={17} /></button></div></div>}
          </section>}
        </div>}

        {view === "MEETING" && <div className="standard-page meeting-page">
          <PageHead eyebrow="05 / THE MEETING ROOM" title={<>Six minds. <em>One brief.</em></>} description="확정된 Market Brief로 회의를 재생합니다. 진행 중 외부 AI를 다시 호출하지 않습니다." action={<div className="meeting-head-actions"><button className="button button--outline button--small" type="button" onClick={toggleMeetingFullscreen}><Icon name="expand" size={15} /> 전체화면</button><span className={`meeting-status meeting-status--${app.meeting.status.toLowerCase()}`}><i />{app.meeting.status}</span></div>} />
          {!app.brief ? <EmptyState index="05" title="회의 자료가 아직 없습니다." description="AI 조사 결과를 가져오고 미리보기를 확인한 뒤 회의를 시작할 수 있습니다." button="AI 결과 가져오기" onClick={() => go("IMPORT")} /> : <>
            <div ref={meetingLayoutRef} className={`meeting-layout ${meetingFullscreen ? "meeting-layout--fullscreen" : ""}`}><div className="meeting-stage">
              <div className="meeting-stage-head"><span>LIVE OFFICE / MEETING ROOM</span>{meetingFullscreen && <button className="button button--small button--outline" type="button" onClick={toggleMeetingFullscreen}><Icon name="close" size={14} /> 닫기</button>}</div><Office market={app.market} brief={app.brief} meeting={app.meeting} onCoinClick={openCoin} />
              <div className="playback-bar"><div className="playback-progress"><div><span>MEETING PROGRESS</span><strong>{app.meeting.status === "READY" ? "STANDING BY" : app.meeting.status === "FINISHED" ? "COMPLETE" : `${meetingProgress}%`}</strong></div><div className="progress-track"><i style={{ width: `${meetingProgress}%` }} /></div></div><div className="playback-controls">
                {app.meeting.status === "READY" ? <button className="button button--primary" type="button" onClick={startMeeting}><Icon name="play" size={16} /> START MEETING</button>
                  : app.meeting.status === "FINISHED" ? <><button className="button button--outline" type="button" onClick={startMeeting}><Icon name="refresh" size={16} /> 다시 재생</button><button className="button button--primary" type="button" onClick={() => { setSelectedArchiveId(null); go("REPORT"); }}>보고서 보기 <Icon name="arrow" size={16} /></button></>
                    : <><button className="control-icon" type="button" title={app.meeting.status === "PAUSED" ? "회의 계속" : "회의 일시정지"} aria-label={app.meeting.status === "PAUSED" ? "회의 계속" : "회의 일시정지"} onClick={() => setApp((previous) => ({ ...previous, meeting: { ...previous.meeting, status: previous.meeting.status === "PAUSED" ? "RUNNING" : "PAUSED" } }))}><Icon name={app.meeting.status === "PAUSED" ? "play" : "pause"} size={18} /></button><button className="control-icon" type="button" title="다음 이벤트" aria-label="다음 이벤트" onClick={advanceMeeting}><Icon name="skip" size={18} /></button><button className="speed-control" type="button" onClick={() => setSpeed(speed === 1 ? 2 : 1)} title="재생 속도 변경">{speed}x</button><button className="button button--text" type="button" onClick={finishMeeting}>회의 종료 <Icon name="arrow" size={16} /></button></>}
              </div></div>
            </div><aside className="transcript-panel"><div className="transcript-header"><span><i className="record-dot" />LIVE TRANSCRIPT</span><small>{playedLines.length.toString().padStart(2, "0")} / {totalLines.toString().padStart(2, "0")}</small></div><div className="transcript-body">{app.meeting.status === "READY" ? <div className="brief-ready"><span className="eyebrow-small">BRIEF LOADED / {app.brief.date}</span><h2>Ready when<br />you are.</h2><p>{app.brief.marketSummary}</p><div className="brief-ready-divider" /><small>6명의 AI 직원이 5개 코인과 시장 리스크를 순서대로 검토합니다.</small></div> : <>
              {playedLines.length === 0 && <div className="transcript-waiting"><span className="loading-bars"><i /><i /><i /></span><p>팀이 회의실로 이동하고 있습니다...</p></div>}
              {playedLines.map(({ event, index }) => { const member = TEAM.find((person) => person.id === event.speaker); return <div className={`transcript-line ${index === app.meeting.index && app.meeting.status === "RUNNING" ? "transcript-line--current" : ""}`} key={index}><div className="transcript-avatar" style={{ background: member?.color }}>{member?.name.slice(0, 1)}</div><div><div className="transcript-speaker"><strong>{member?.name}</strong><span>{member?.role}</span></div><p>{event.text ? resolveMeetingLiveText(event.text, app.market) : ""}</p></div></div>; })}
              {app.meeting.status === "FINISHED" && <div className="transcript-finished"><Icon name="check" size={18} /><strong>MEETING COMPLETE</strong><span>보고서가 생성되고 로컬 아카이브에 저장되었습니다.</span></div>}<div ref={transcriptEnd} /></>}</div><div className="transcript-footer"><span>ENGINE / LOCAL EVENTS</span><span>NO AI CALLS DURING MEETING</span></div></aside></div>
            <div className="meeting-teamline"><span>IN THE ROOM</span>{TEAM.map((member) => <div key={member.id}><i style={{ background: member.color }} />{member.role}</div>)}</div>
          </>}
        </div>}

        {view === "REPORT" && <div className="standard-page report-page">
          <PageHead eyebrow="06 / DAILY MEETING REPORT" title={<>The daily <em>brief.</em></>} description="회의에서 나온 해석을 사실 데이터와 나란히 기록합니다. 매수 또는 매도 지시가 아닙니다." action={reportItem && <button className="button button--outline" type="button" onClick={() => copy(reportToText(reportItem), "보고서가 복사되었습니다.")}><Icon name="copy" size={16} />보고서 복사</button>} />
          {!reportItem ? <EmptyState index="06" title="아직 생성된 보고서가 없습니다." description="Market Brief를 확정하고 회의를 마치면 보고서가 자동으로 생성됩니다." button={app.brief ? "회의실로 이동" : "AI 결과 가져오기"} onClick={() => go(app.brief ? "MEETING" : "IMPORT")} /> : <div className="report-document">
            <div className="report-cover"><div className="report-cover-top"><span>2D CRYPTO AI OFFICE <b>/ INTELLIGENCE RECORD</b></span><span>DOC / {reportItem.meetingId.slice(0, 8).toUpperCase()}</span></div><h2>Daily meeting<br /><em>report.</em></h2><div className="report-cover-bottom"><div><span>ISSUED</span><strong>{dateText(reportItem.report.createdAt)}</strong></div><div><span>RESEARCH DATE</span><strong>{reportItem.date}</strong></div><div><span>MARKET SOURCE</span><strong>{reportItem.marketSnapshot.status} / {reportItem.marketSnapshot.status === "MOCK" ? "DEMO DATA" : "BINANCE WS + COINGECKO"}</strong></div></div></div>
            <section className="report-section"><div className="report-section-heading"><span>01 / OVERVIEW</span><h3>Market overview</h3></div><div className="report-section-body"><p className="report-lead">{reportItem.brief.marketSummary}</p>{(reportItem.brief.globalFactors?.length ?? 0) > 0 && <div className="report-sublist"><strong>GLOBAL FACTORS</strong>{reportItem.brief.globalFactors?.map((factor) => <p key={factor}>{factor}</p>)}</div>}{reportItem.brief.viewerTakeaways?.length ? <div className="report-sublist"><strong>VIEWER TAKEAWAYS</strong>{reportItem.brief.viewerTakeaways.map((item) => <p key={item}>{item}</p>)}</div> : null}</div></section>
            <section className="report-section"><div className="report-section-heading"><span>02 / ASSET REVIEW</span><h3>Five assets,<br />five perspectives</h3></div><div className="report-section-body"><div className="report-assets">{reportItem.brief.coins.map((coin) => { const fact = reportItem.marketSnapshot.coins.find((row) => row.id === coin.id); return <div className="report-asset" key={coin.id}><div className="report-asset-head"><div><span className="asset-dot" style={{ background: COIN_META[coin.id].color }} /><strong>{coin.id}</strong><small>{COIN_META[coin.id].name}</small></div>{fact && <div className="report-fact"><span>FACT / {reportItem.marketSnapshot.status}</span><strong>{priceUSD(fact.price)}</strong><b className={fact.change24h >= 0 ? "up" : "down"}>{changeText(fact.change24h)}</b></div>}</div><p>{coin.summary}</p>{coin.interpretation && <div className="report-analysis-box"><span>INTERPRETATION</span><p>{coin.interpretation}</p>{coin.counterView && <><span>COUNTER VIEW</span><p>{coin.counterView}</p></>}{coin.verification?.length ? <><span>VERIFY</span>{coin.verification.map((item) => <p key={item}>• {item}</p>)}</> : null}</div>}<div className="scenario-pair"><div><span>BULL SCENARIO</span><p>{coin.bullScenario || "제공된 시나리오 없음"}</p></div><div><span>BEAR SCENARIO</span><p>{coin.bearScenario || "제공된 시나리오 없음"}</p></div></div>{coin.technical.length > 0 && <small className="report-technical">WATCH: {coin.technical.join(" · ")}</small>}</div>; })}</div></div></section>
            <section className="report-section"><div className="report-section-heading"><span>03 / CROSS MARKET</span><h3>Context & risk</h3></div><div className="report-section-body"><p className="report-lead report-lead--small">{reportItem.report.crossMarket}</p><div className="report-sublist"><strong>KEY RISKS</strong>{reportItem.brief.risks.length ? reportItem.brief.risks.map((risk) => <p key={risk}>{risk}</p>) : <p>명시된 전체 시장 리스크가 없습니다. 별도 확인이 필요합니다.</p>}</div></div></section>
            <section className="report-section"><div className="report-section-heading"><span>04 / CONCLUSION</span><h3>What to watch</h3></div><div className="report-section-body"><div className="watchlist-line">{reportItem.report.watchlist.map((id, index) => <div key={id}><span>0{index + 1}</span><strong>{id}</strong></div>)}</div><small className="watchlist-note">24시간 변동폭 기준 관찰 목록이며 매매 신호가 아닙니다.</small><p className="report-conclusion">{reportItem.report.conclusion}</p><div className="report-sublist"><strong>MEETING SUMMARY</strong><p>{reportItem.meetingSummary}</p></div></div></section>
            <div className="report-sources"><span>SOURCES / {reportItem.brief.sources.length.toString().padStart(2, "0")}</span><div>{reportItem.brief.sources.length ? reportItem.brief.sources.map((source) => <p key={source}>{source}</p>) : <p>제공된 출처 없음. 분석 근거를 별도로 확인하세요.</p>}</div></div><div className="report-disclaimer">이 보고서는 시나리오 검토를 위한 정보이며 금융 또는 투자 자문이 아닙니다. 가격 데이터 상태: {reportItem.marketSnapshot.status}.</div>
          </div>}
        </div>}

        {view === "ARCHIVE" && <div className="standard-page archive-page"><PageHead eyebrow="07 / LOCAL RECORDS" title={<>A record of <em>thinking.</em></>} description="완료된 회의와 보고서는 이 브라우저의 localStorage에 저장됩니다." action={<span className="archive-counter">{app.archive.length.toString().padStart(2, "0")} <small>RECORDS</small></span>} />{!app.archive.length ? <EmptyState index="07" title="아직 저장된 회의가 없습니다." description="회의를 완료하면 시장 스냅샷, Brief와 보고서가 자동으로 여기에 보관됩니다." button={app.brief ? "회의실로 이동" : "조사 시작하기"} onClick={() => go(app.brief ? "MEETING" : "PROMPT")} /> : <div className="archive-list"><div className="archive-list-head"><span>DATE / SESSION</span><span>MARKET SUMMARY</span><span>DATA</span><span>ACTIONS</span></div>{app.archive.map((item, index) => <div className="archive-row" key={item.meetingId}><div className="archive-date"><span>#{String(app.archive.length - index).padStart(3, "0")}</span><strong>{dateText(item.report.createdAt)}</strong><small>{timeText(item.report.createdAt)} · {item.date}</small></div><p>{item.brief.marketSummary}</p><span className={`archive-source archive-source--${item.marketSnapshot.status.toLowerCase()}`}><i />{item.marketSnapshot.status}</span><div className="archive-actions"><button className="button button--text" type="button" onClick={() => { setSelectedArchiveId(item.meetingId); go("REPORT"); }}>보고서 열기 <Icon name="arrow" size={16} /></button><button className="archive-delete" title="기록 삭제" aria-label={`${item.date} 기록 삭제`} type="button" onClick={() => { if (!window.confirm("이 회의 기록을 삭제할까요?")) return; setApp((previous) => ({ ...previous, archive: previous.archive.filter((entry) => entry.meetingId !== item.meetingId), report: previous.report?.id === item.meetingId ? undefined : previous.report })); if (selectedArchiveId === item.meetingId) setSelectedArchiveId(null); }}><Icon name="trash" size={16} /></button></div></div>)}</div>}<p className="archive-footnote">최대 20개의 회의를 이 기기에 보관합니다. 브라우저 데이터를 삭제하면 기록도 삭제됩니다.</p></div>}
      </main>
      <footer className="app-footer"><span>2D CRYPTO AI OFFICE <b>/</b> BUILT FOR BETTER QUESTIONS</span><span>MARKET RESEARCH ONLY · NOT FINANCIAL ADVICE</span></footer>
    </div>
    {toast && <div className="toast" role="status"><span className="toast-dot" />{toast}<button type="button" onClick={() => setToast("")} aria-label="알림 닫기">×</button></div>}
  </div>;
}
