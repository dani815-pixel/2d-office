import { useEffect, useMemo, useState } from "react";
import type { MarketSnapshot, TraderSettings, TradingMode, CryptoMarketBrief, TradingTeamState, TradeSide, MeetingState, TradeRequest } from "../types";
import { COIN_META } from "../data/coins";
import { DEFAULT_TRADER_SETTINGS, TRADING_TEAM } from "../data/tradingTeam";
import { readTradingState, saveTradingState } from "../services/storage";
import { changeText, priceUSD } from "../utils/format";
import { checkExit, closeSimulatedPosition, createMeetingScenarios, createTradeReview, INITIAL_TRADING_BALANCE, openSimulatedPosition, updatePositions, updateTraderMemory } from "../engine/trading";

const cloneSettings = () => Object.fromEntries(Object.entries(DEFAULT_TRADER_SETTINGS).map(([id, value]) => [id, { ...value, confirmation: [...value.confirmation] }])) as Record<string, TraderSettings>;
const emptyState = (): TradingTeamState => ({ sessionId: "TRADING-LOCAL", sessionStartedAt: new Date().toISOString(), startingBalance: INITIAL_TRADING_BALANCE, balance: INITIAL_TRADING_BALANCE, positions: [], trades: [], reviews: [], scenarios: [], requests: [], profiles: TRADING_TEAM, settings: cloneSettings(), memories: {}, activities: {} });

export default function TradingRoom({ market, brief, meetingStatus, meetingId }: { market: MarketSnapshot; brief?: CryptoMarketBrief; meetingStatus: MeetingState["status"]; meetingId?: string }) {
  const [selected, setSelected] = useState("team-lead");
  const [tradeSide, setTradeSide] = useState<TradeSide>("LONG");
  const [quantity, setQuantity] = useState("0.01");
  const [state, setState] = useState<TradingTeamState>(() => readTradingState() || emptyState());
  const [notice, setNotice] = useState("");
  const activityLabels: Record<import("../types").TraderActivity, string> = { WORK: "업무 중", ANALYZE: "차트 분석", WATCH: "시장 관찰", TRADE: "거래 확인", TALK: "팀 대화", THINK: "복기 중", WALK: "이동 중", COFFEE: "커피 브레이크", BREAK: "잠시 휴식", RESTROOM: "화장실", OUTSIDE: "바깥 공기", RETURN: "복귀 중" };

  const trader = TRADING_TEAM.find((item) => item.id === selected) || TRADING_TEAM[0];
  const current = state.settings[trader.id] || DEFAULT_TRADER_SETTINGS[trader.id];
  const coin = trader.coin === "TEAM" ? "BTC" : trader.coin;

  useEffect(() => {
    setState((prev) => {
      const updated = updatePositions(prev.positions, market);
      const closed: { trade: ReturnType<typeof closeSimulatedPosition>["trade"]; review: ReturnType<typeof createTradeReview> }[] = [];
      const remaining = [];
      let balance = prev.balance;
      for (const position of updated) {
        const price = position.currentPrice;
        const reason = checkExit(position, price);
        if (!reason) { remaining.push(position); continue; }
        const result = closeSimulatedPosition(position, price, reason);
        balance += result.balanceDelta;
        closed.push({ trade: result.trade, review: createTradeReview(result.trade) });
      }
      if (!closed.length) return { ...prev, positions: updated };
      const reviews = closed.map((item) => item.review);
      const memories = { ...prev.memories };
      for (const item of closed) memories[item.trade.traderId] = updateTraderMemory(memories[item.trade.traderId], item.trade, item.review);
      const activities = { ...prev.activities };
      for (const item of closed) activities[item.trade.traderId] = "THINK";
      return { ...prev, balance, positions: remaining, trades: [...closed.map((item) => item.trade), ...prev.trades].slice(0, 100), reviews: [...reviews, ...prev.reviews].slice(0, 100), memories, activities };
    });
  }, [market]);

  useEffect(() => { saveTradingState(state); }, [state]);

  const scenarioRows = useMemo(() => brief ? createMeetingScenarios(brief, meetingId) : [], [brief, meetingId]);
  useEffect(() => {
    if (meetingStatus !== "FINISHED" || !brief) return;
    const scenarios = createMeetingScenarios(brief, meetingId);
    setState((prev) => {
      const nextActivities = { ...prev.activities, "team-lead": "WATCH" as const };
      for (const scenario of scenarios) {
        const specialist = TRADING_TEAM.find((member) => member.coin === scenario.coin);
        if (specialist) nextActivities[specialist.id] = "ANALYZE";
      }
      const requests = scenarios.filter((scenario) => scenario.bias === "LONG" || scenario.bias === "SHORT").map((scenario) => {
        const specialist = TRADING_TEAM.find((member) => member.coin === scenario.coin);
        return specialist ? { id: "request-" + scenario.id, scenarioId: scenario.id, traderId: specialist.id, coin: scenario.coin, side: scenario.bias as TradeSide, requestedAt: new Date().toISOString(), status: "PENDING" as const, note: scenario.approvalCriteria || scenario.entryCondition || "팀장 확인 조건 검토" } : null;
      }).filter(Boolean) as TradeRequest[];
      const existing = new Set(prev.requests.map((item) => item.scenarioId));
      return { ...prev, scenarios, requests: [...prev.requests, ...requests.filter((item) => !existing.has(item.scenarioId))], activities: nextActivities };
    });
  }, [meetingStatus, brief, meetingId]);
  const pendingRequests = state.requests.filter((item) => item.status === "PENDING");
  useEffect(() => {
    if (!pendingRequests.length) return;
    const timers = pendingRequests.map((request) => {
      const delay = 900 + (TRADING_TEAM.findIndex((member) => member.id === request.traderId) * 180);
      return window.setTimeout(() => setState((prev) => {
        if (!prev.requests.some((item) => item.id === request.id && item.status === "PENDING")) return prev;
        return { ...prev, activities: { ...prev.activities, [request.traderId]: "TALK" as const, "team-lead": "THINK" as const } };
      }), delay);
    });
    return () => timers.forEach(window.clearTimeout);
  }, [pendingRequests.map((item) => item.id + item.status).join("|")]);

  const myPositions = state.positions.filter((item) => item.traderId === trader.id);
  const decideRequest = (requestId: string, approve: boolean) => {
    const request = state.requests.find((item) => item.id === requestId);
    if (!request || request.status !== "PENDING") return;
    if (!approve) {
      setState((prev) => ({ ...prev, requests: prev.requests.map((item) => item.id === requestId ? { ...item, status: "REJECTED" as const } : item), activities: { ...prev.activities, [request.traderId]: "RETURN" as const, "team-lead": "THINK" as const } }));
      setNotice(request.coin + " 요청을 팀장이 거절했습니다.");
      window.setTimeout(() => setState((prev) => ({ ...prev, activities: { ...prev.activities, [request.traderId]: "ANALYZE" as const } })), 950);
      return;
    }
    const specialist = TRADING_TEAM.find((member) => member.id === request.traderId);
    const settings = specialist ? state.settings[specialist.id] || DEFAULT_TRADER_SETTINGS[specialist.id] : null;
    if (!specialist || !settings) return;
    const price = market.coins.find((item) => item.id === request.coin)?.price || 0;
    const riskBudget = state.balance * Math.max(settings.riskPercent, 0.1) / 100;
    const quantity = price > 0 ? Math.max(riskBudget / price, 0.000001) : 0;
    const result = openSimulatedPosition(state.balance, market, request.coin, settings.mode, request.side, quantity, settings.leverage, specialist.id, settings);
    if (!result.position) { setNotice(result.error || "승인 후 가상 진입에 실패했습니다."); return; }
    result.position.scenarioId = request.scenarioId;
    setState((prev) => ({ ...prev, balance: result.balance, positions: [...prev.positions, result.position!], requests: prev.requests.map((item) => item.id === requestId ? { ...item, status: "EXECUTED" as const } : item), activities: { ...prev.activities, [request.traderId]: "TRADE" as const, "team-lead": "THINK" as const } }));
    setNotice(request.coin + " " + request.side + " 승인 → 가상 진입 완료 · 리스크 " + settings.riskPercent + "%");
    window.setTimeout(() => setState((prev) => ({ ...prev, activities: { ...prev.activities, [request.traderId]: "RETURN" as const } })), 900);
    window.setTimeout(() => setState((prev) => ({ ...prev, activities: { ...prev.activities, [request.traderId]: "WATCH" as const, "team-lead": "WATCH" as const } })), 1800);
  };


  const update = (patch: Partial<TraderSettings>) => setState((prev) => ({ ...prev, settings: { ...prev.settings, [trader.id]: { ...current, ...patch } } }));
  const reset = () => update({ ...DEFAULT_TRADER_SETTINGS[trader.id], confirmation: [...DEFAULT_TRADER_SETTINGS[trader.id].confirmation] });
  const resetTradingRoom = () => {
    if (!window.confirm("트레이딩룸의 모든 가상 거래·복기·시나리오·설정을 초기화할까요?")) return;
    setState(emptyState());
    setSelected("team-lead");
    setTradeSide("LONG");
    setQuantity("0.01");
    setNotice("트레이딩룸을 초기화했습니다.");
  };

  const openTrade = () => {
    const result = openSimulatedPosition(state.balance, market, coin, current.mode, tradeSide, Number(quantity), current.leverage, trader.id, current);
    if (!result.position) { setNotice(result.error || "진입할 수 없습니다."); return; }
    setState((prev) => ({ ...prev, balance: result.balance, positions: [...prev.positions, result.position!] }));
    setNotice(coin + " " + tradeSide + " 가상 포지션이 열렸습니다.");
  };

  const closeTrade = (positionId: string) => {
    const position = state.positions.find((item) => item.id === positionId);
    if (!position) return;
    const exitPrice = market.coins.find((item) => item.id === position.coin)?.price;
    if (!exitPrice) return;
    const result = closeSimulatedPosition(position, exitPrice);
    setState((prev) => { const review = createTradeReview(result.trade); const memories = { ...prev.memories, [result.trade.traderId]: updateTraderMemory(prev.memories[result.trade.traderId], result.trade, review) }; return { ...prev, balance: prev.balance + result.balanceDelta, positions: prev.positions.filter((item) => item.id !== positionId), trades: [result.trade, ...prev.trades].slice(0, 100), reviews: [review, ...prev.reviews].slice(0, 100), memories, activities: { ...prev.activities, [result.trade.traderId]: "THINK" as const } }; });
    setNotice(position.coin + " 포지션 청산 · PnL " + result.trade.pnl.toFixed(2) + " USD · REVIEW 기록됨");
    window.setTimeout(() => setState((prev) => ({ ...prev, activities: { ...prev.activities, [result.trade.traderId]: "WATCH" as const } })), 1800);
  };

  return <div className="standard-page trading-page">
    <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-line" />06 / TRADING DESK</div><h1>Trading <em>room.</em></h1><p>회의 가설을 검토하고 로컬 가상 포지션을 운용합니다.</p></div><div className="page-head-action"><button className="button button--ghost" type="button" onClick={resetTradingRoom}>초기화</button></div></div>
    <div className="trading-banner"><div><strong>SIMULATION ONLY / LOCAL</strong><small>NO EXCHANGE API · NO REAL ORDERS</small></div><strong>BALANCE · {priceUSD(state.balance)}</strong></div>

    <section className="trading-panel"><div className="trading-panel-head">LIVE MARKET / BINANCE WS</div><div className="trading-coins">{market.coins.map((item) => <div className={"trading-coin trading-coin--" + (item.change24h >= 0 ? "up" : "down")} key={item.id}><strong>{COIN_META[item.id].name} / {item.id}</strong><b>{priceUSD(item.price)}</b><span>{changeText(item.change24h)} · LIVE</span></div>)}</div></section>

    <section className="trading-floor">
      <div className="trading-panel-head">TRADING FLOOR / 2D LIVE OFFICE</div>
      <div className="trading-floor-scene">
        <div className="trading-floor-label trading-floor-label--lead">TEAM LEAD / 김태훈</div>
        <div className="trading-lead-avatar">T</div>
        <div className="trading-floor-desk trading-floor-desk--lead" />
        {TRADING_TEAM.filter((member) => member.role === "SPECIALIST").map((member) => {
          const activity = state.activities[member.id] || "WORK";
          const pending = state.requests.some((request) => request.traderId === member.id && request.status === "PENDING");
          return <div className={"trading-actor trading-actor--" + member.coin.toLowerCase() + " trading-actor--" + activity.toLowerCase()} key={member.id}>
            <div className="trading-actor-shadow" />
            <div className="trading-actor-body"><span>{member.name.slice(1, 2)}</span></div>
            <strong>{member.name}</strong>
            <small>{pending ? "REQUEST / " + activityLabels[activity] : activityLabels[activity]}</small>
          </div>;
        })}
        <div className="trading-floor-zone trading-floor-zone--meeting">TEAM LEAD</div>
        <div className="trading-floor-zone trading-floor-zone--btc">BTC DESK</div>
        <div className="trading-floor-zone trading-floor-zone--eth">ETH DESK</div>
        <div className="trading-floor-zone trading-floor-zone--bnb">BNB DESK</div>
        <div className="trading-floor-zone trading-floor-zone--xrp">XRP DESK</div>
        <div className="trading-floor-zone trading-floor-zone--sol">SOL DESK</div>
      </div>
    </section>

    <div className="trading-grid">
      <section className="trading-panel"><div className="trading-panel-head">TRADING TEAM / 06</div><div className="trader-list">{TRADING_TEAM.map((item) => <button key={item.id} type="button" className={"trader-card " + (selected === item.id ? "trader-card--active" : "")} onClick={() => setSelected(item.id)}><strong><i />{item.name}</strong><small>{item.role === "TEAM_LEAD" ? "TEAM LEAD" : item.coin + " SPECIALIST"} · {activityLabels[state.activities[item.id] || "WORK"]}</small></button>)}</div></section>

      <section className="trading-panel"><div className="trading-panel-head">TRADER SETTINGS / LOCAL</div><div className="trading-settings"><h3>{trader.name}</h3>
        <label className="setting-control"><span>MODE</span><select value={current.mode} onChange={(e) => update({ mode: e.target.value as TradingMode })}><option value="SPOT">SPOT</option><option value="FUTURES">FUTURES</option></select></label>
        <label className="setting-control"><span>STRATEGY</span><input value={current.strategy} onChange={(e) => update({ strategy: e.target.value })} /></label>
        <label className="setting-control"><span>RISK %</span><input type="number" min="0" max="100" step="0.1" value={current.riskPercent} onChange={(e) => update({ riskPercent: Number(e.target.value) })} /></label>
        <label className="setting-control"><span>LEVERAGE</span><input type="number" min="1" max="100" step="1" value={current.leverage} disabled={current.mode === "SPOT"} onChange={(e) => update({ leverage: Number(e.target.value) })} /></label>
        <label className="setting-control"><span>STOP LOSS %</span><input type="number" min="0" max="100" step="0.1" value={current.stopLossPercent ?? ""} onChange={(e) => update({ stopLossPercent: e.target.value ? Number(e.target.value) : undefined })} /></label>
        <label className="setting-control"><span>TAKE PROFIT %</span><input type="number" min="0" max="1000" step="0.1" value={current.takeProfitPercent ?? ""} onChange={(e) => update({ takeProfitPercent: e.target.value ? Number(e.target.value) : undefined })} /></label>
        <label className="setting-control"><span>LONG</span><input type="checkbox" checked={current.allowLong} onChange={(e) => update({ allowLong: e.target.checked })} /></label>
        <label className="setting-control"><span>SHORT</span><input type="checkbox" checked={current.allowShort} disabled={current.mode === "SPOT"} onChange={(e) => update({ allowShort: e.target.checked })} /></label>
        <label className="setting-control"><span>CHANGE NOTE</span><input value={current.reason ?? ""} onChange={(e) => update({ reason: e.target.value })} placeholder="이번 회의에서 변경한 이유" /></label>
        <div className="trading-setting-actions"><button type="button" className="button button--outline" onClick={reset}>기본값 복원</button><span>AUTO SIMULATION OFF</span></div>
      </div></section>

      <section className="trading-panel"><div className="trading-panel-head">SIMULATED ORDER / {coin}</div>
        <div className="order-controls">
          <div className="order-sides"><button type="button" className={tradeSide === "LONG" ? "order-side order-side--active" : "order-side"} onClick={() => setTradeSide("LONG")}>LONG</button><button type="button" className={tradeSide === "SHORT" ? "order-side order-side--active" : "order-side"} disabled={current.mode === "SPOT"} onClick={() => setTradeSide("SHORT")}>SHORT</button></div>
          <label className="setting-control"><span>QUANTITY</span><input type="number" min="0.000001" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></label>
          <button type="button" className="button button--primary" onClick={openTrade}>가상 진입</button>
          {notice && <p className="trading-notice">{notice}</p>}
          <div className="position-list">{myPositions.length === 0 ? <small>OPEN POSITIONS / NONE</small> : myPositions.map((position) => <article className="position-card" key={position.id}><div><strong>{position.coin} {position.side}</strong><span>{position.mode} · {position.leverage}x</span></div><b className={position.unrealizedPnl >= 0 ? "up" : "down"}>{position.unrealizedPnl.toFixed(2)} USD</b><small>ENTRY {priceUSD(position.entryPrice)} · NOW {priceUSD(position.currentPrice)} · ROI {position.roi.toFixed(2)}%</small><button type="button" className="button button--text" onClick={() => closeTrade(position.id)}>현재가 청산</button></article>)}</div>
          <div className="trade-summary"><span>OPEN {state.positions.length}</span><span>CLOSED {state.trades.length}</span><span>REALIZED {state.trades.reduce((sum, item) => sum + item.pnl, 0).toFixed(2)} USD</span></div>
          {state.memories[trader.id] && <div className="trader-memory"><strong>TRADER MEMORY</strong><span>TRADES {state.memories[trader.id].totalTrades} · W {state.memories[trader.id].wins} · L {state.memories[trader.id].losses}</span><small>{state.memories[trader.id].currentLessons[0] || "아직 누적 교훈이 없습니다."}</small></div>}
        </div>
      </section>

      <section className="trading-panel"><div className="trading-panel-head">TEAM DECISION / REQUESTS</div>
        <div className="position-list">{state.requests.length === 0 ? <small>REQUESTS / NONE</small> : state.requests.slice(0, 8).map((request) => <article className="position-card" key={request.id}>
          <div><strong>{request.coin} {request.side}</strong><span>{TRADING_TEAM.find((m) => m.id === request.traderId)?.name || request.traderId} · {request.status}</span></div>
          <small>APPROVE IF · {request.note}</small>{request.status === "PENDING" && <small>REJECT IF · {state.scenarios.find((scenario) => scenario.id === request.scenarioId)?.rejectionCriteria || "무효화/확인 조건 불충족"}</small>}
          {request.status === "PENDING" && trader.role === "TEAM_LEAD" && <div className="trading-setting-actions"><button type="button" className="button button--primary" onClick={() => decideRequest(request.id, true)}>승인</button><button type="button" className="button button--outline" onClick={() => decideRequest(request.id, false)}>거절</button></div>}
          {request.status === "APPROVED" && <small>TEAM LEAD APPROVED · 담당자 진입 대기</small>}
        </article>)}</div>
      </section>

      <section className="trading-panel"><div className="trading-panel-head">OFFICE ACTIVITY / LIVE</div><div className="trader-activity-grid">{TRADING_TEAM.map((member) => <div className={"trader-activity trader-activity--" + (state.activities[member.id] || "WORK").toLowerCase()} key={member.id}><i /><strong>{member.name}</strong><span>{activityLabels[state.activities[member.id] || "WORK"]}</span></div>)}</div></section>\n\n      <section className="trading-panel"><div className="trading-panel-head">CURRENT MEETING SCENARIO</div>{!brief ? <div className="trading-empty">회의 결과가 아직 없습니다.</div> : meetingStatus !== "FINISHED" ? <div className="trading-empty">회의 진행 중 · 트레이딩 시나리오는 회의 종료 후 팀에 전달됩니다.</div> : <div className="scenario-list">{scenarioRows.map((scenario) => <article className="scenario-card" key={scenario.id}><div><strong>{scenario.coin}</strong><span>{scenario.bias} / MEETING</span></div><p>{scenario.reasoning}</p><small>ENTRY: {scenario.entryCondition}</small><small>INVALIDATE: {scenario.invalidation}</small><small>APPROVE: {scenario.approvalCriteria || "팀장 확인 기준 없음"}</small><small>REJECT: {scenario.rejectionCriteria || "팀장 거절 기준 없음"}</small><em>ENTRY / TP / SL은 회의에서 명시된 경우에만 사용 · 자동 주문 없음</em></article>)}</div>}</section>
    </div>
  </div>;
}
