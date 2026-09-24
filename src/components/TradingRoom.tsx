import { useEffect, useMemo, useState } from "react";
import type { MarketSnapshot, TraderSettings, TradingMode, CryptoMarketBrief } from "../types";
import { COIN_META } from "../data/coins";
import { DEFAULT_TRADER_SETTINGS, TRADING_TEAM } from "../data/tradingTeam";
import { readTradingState, saveTradingState } from "../services/storage";
import { changeText, priceUSD } from "../utils/format";

const cloneSettings = () => Object.fromEntries(Object.entries(DEFAULT_TRADER_SETTINGS).map(([id, value]) => [id, { ...value, confirmation: [...value.confirmation] }])) as Record<string, TraderSettings>;

export default function TradingRoom({ market, brief }: { market: MarketSnapshot; brief?: CryptoMarketBrief }) {
  const [selected, setSelected] = useState("team-lead");
  const [settings, setSettings] = useState<Record<string, TraderSettings>>(() => readTradingState()?.settings || cloneSettings());
  const trader = TRADING_TEAM.find((item) => item.id === selected) || TRADING_TEAM[0];
  const current = settings[trader.id] || DEFAULT_TRADER_SETTINGS[trader.id];

  useEffect(() => {
    const saved = readTradingState();
    const base = saved || { sessionId: "TRADING-LOCAL", sessionStartedAt: new Date().toISOString(), startingBalance: 100000, balance: 100000, positions: [], trades: [], reviews: [], scenarios: [], profiles: TRADING_TEAM, settings: cloneSettings(), memories: {}, activities: {} };
    saveTradingState({ ...base, settings });
  }, [settings]);

  const scenarioRows = useMemo(() => brief?.coins.map((coin) => {
    const bias = coin.bullScenario && coin.bearScenario ? "WATCH" : coin.bullScenario ? "LONG" : coin.bearScenario ? "SHORT" : "WATCH";
    return { coin, bias };
  }) || [], [brief]);

  const update = (patch: Partial<TraderSettings>) => setSettings((prev) => ({ ...prev, [trader.id]: { ...current, ...patch } }));
  const reset = () => setSettings((prev) => ({ ...prev, [trader.id]: { ...DEFAULT_TRADER_SETTINGS[trader.id], confirmation: [...DEFAULT_TRADER_SETTINGS[trader.id].confirmation] } }));

  return <div className="standard-page trading-page">
    <div className="page-head"><div><div className="eyebrow"><span className="eyebrow-line" />06 / TRADING DESK</div><h1>Trading <em>room.</em></h1><p>회의 가설을 검토하고 트레이더별 설정을 관리하는 로컬 시뮬레이션 데스크입니다.</p></div></div>
    <div className="trading-banner"><div><strong>SIMULATION ONLY / LOCAL</strong><small>NO EXCHANGE API · NO REAL ORDERS</small></div><strong>TEAM LEAD · 김태훈</strong></div>

    <section className="trading-panel"><div className="trading-panel-head">LIVE MARKET / BINANCE WS</div><div className="trading-coins">{market.coins.map((coin) => <div className={"trading-coin trading-coin--" + (coin.change24h >= 0 ? "up" : "down")} key={coin.id}><strong>{COIN_META[coin.id].name} / {coin.id}</strong><b>{priceUSD(coin.price)}</b><span>{changeText(coin.change24h)} · LIVE</span></div>)}</div></section>

    <div className="trading-grid">
      <section className="trading-panel"><div className="trading-panel-head">TRADING TEAM / 06</div><div className="trader-list">{TRADING_TEAM.map((item) => <button key={item.id} type="button" className={"trader-card " + (selected === item.id ? "trader-card--active" : "")} onClick={() => setSelected(item.id)}><strong><i />{item.name}</strong><small>{item.role === "TEAM_LEAD" ? "TEAM LEAD" : item.coin + " SPECIALIST"}</small></button>)}</div></section>

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

      <section className="trading-panel"><div className="trading-panel-head">CURRENT MEETING SCENARIO</div>{!brief ? <div className="trading-empty">회의 결과가 아직 없습니다.</div> : <div className="scenario-list">{scenarioRows.map(({ coin, bias }) => <article className="scenario-card" key={coin.id}><div><strong>{coin.id}</strong><span>{bias} / MEETING</span></div><p>{coin.interpretation || coin.summary}</p><small>{coin.bullScenario ? "BULL: " + coin.bullScenario : ""}</small><small>{coin.bearScenario ? "BEAR: " + coin.bearScenario : ""}</small><em>ENTRY / TP / SL: 회의에서 명시된 경우에만 사용</em></article>)}</div>}</section>
    </div>
  </div>;
}
