import type { CSSProperties } from "react";
import { COIN_IDS, type CharacterStatus, type CoinId, type CryptoMarketBrief, type MarketSnapshot, type MeetingState, type RoleId } from "../types";
import { COIN_META, TEAM } from "../data/mock";
import { changeText, priceUSD } from "../utils/format";

const DESK_POSITIONS: Record<RoleId, [number, number]> = {
  leader: [13, 51], market: [32, 51], onchain: [13, 73],
  altcoin: [32, 73], risk: [45, 55], trader: [45, 78],
};
const TABLE_POSITIONS: Record<RoleId, [number, number]> = {
  leader: [68, 48], market: [82, 48], onchain: [61, 67],
  altcoin: [89, 67], risk: [68, 85], trader: [83, 85],
};

interface OfficeProps {
  market: MarketSnapshot;
  brief?: CryptoMarketBrief;
  meeting?: MeetingState;
  onCoinClick?: (id: CoinId) => void;
}

function PixelAgent({ color, skin, variant }: { color: string; skin: string; variant: number }) {
  return (
    <svg className="pixel-agent" viewBox="0 0 64 76" shapeRendering="crispEdges" aria-hidden="true">
      <ellipse cx="32" cy="72" rx="21" ry="4" fill="#020809" opacity=".42" />
      <rect x="18" y="56" width="11" height="13" fill="#273034" /><rect x="35" y="56" width="11" height="13" fill="#273034" />
      <rect x="16" y="67" width="14" height="5" fill="#10181a" /><rect x="34" y="67" width="14" height="5" fill="#10181a" />
      <rect x="12" y="38" width="8" height="19" fill={color} /><rect x="44" y="38" width="8" height="19" fill={color} />
      <rect x="13" y="54" width="7" height="6" fill={skin} /><rect x="44" y="54" width="7" height="6" fill={skin} />
      <rect x="18" y="34" width="28" height="25" fill={color} /><rect x="21" y="37" width="6" height="19" fill="#ffffff" opacity=".14" />
      <rect x="29" y="35" width="6" height="13" fill="#26363a" opacity=".7" />
      <rect x="29" y="29" width="7" height="9" fill={skin} />
      <rect x="18" y="11" width="28" height="23" fill={skin} /><rect x="17" y="16" width="3" height="12" fill={skin} />
      <rect x="21" y="22" width="4" height="3" fill="#263034" /><rect x="39" y="22" width="4" height="3" fill="#263034" />
      <rect x="27" y="29" width="11" height="2" fill="#9b715f" opacity=".7" />
      {variant % 3 === 0 ? <><rect x="17" y="8" width="30" height="9" fill="#22292a" /><rect x="18" y="16" width="7" height="5" fill="#22292a" /></>
        : variant % 3 === 1 ? <><rect x="18" y="7" width="27" height="8" fill="#3a3030" /><rect x="16" y="13" width="6" height="20" fill="#3a3030" /><rect x="43" y="13" width="5" height="17" fill="#3a3030" /></>
          : <><rect x="19" y="8" width="27" height="7" fill="#292e30" /><rect x="21" y="5" width="18" height="5" fill="#292e30" /></>}
    </svg>
  );
}

export default function Office({ market, brief, meeting, onCoinClick }: OfficeProps) {
  const active = meeting && meeting.status !== "READY";
  const current = active ? meeting.events[meeting.index] : undefined;
  const screenTarget = active
    ? [...meeting.events.slice(0, meeting.index + 1)].reverse().find((event) => event.type === "SCREEN")?.target || "OVERVIEW"
    : "OVERVIEW";
  const focusedCoin = COIN_IDS.includes(screenTarget as CoinId) ? market.coins.find((coin) => coin.id === screenTarget) : undefined;

  const agentState = (id: RoleId): CharacterStatus => {
    if (!active) return "IDLE";
    if (meeting.status === "FINISHED") return "END";
    if (meeting.status === "PAUSED") return "THINK";
    if (current?.type === "MOVE" && current.speaker === id) return "WALK";
    if (current?.type === "EMOTION" && current.speaker === id) return current.target === "ALERT" ? "ALERT" : "THINK";
    if (current?.type === "SCREEN" && id === "leader") return "POINT";
    if (current?.type === "LISTEN") return id === "leader" ? "STAND" : "LISTEN";
    if (current?.type === "PAUSE") return "THINK";
    if (current?.type === "SPEAK") return current.speaker === id ? "SPEAK" : "LISTEN";
    return "SIT";
  };

  return (
    <div className={`office-unit ${meeting ? "office-unit--meeting" : ""}`}>
      <div className="scene-toolbar">
        <div className="scene-toolbar-left"><span className="scene-led" /> <span>OFFICE FLOOR</span><span className="toolbar-separator">/</span><span className="toolbar-dim">LEVEL 01</span></div>
        <div className="scene-toolbar-right"><span className="tiny-live-dot" /> {active ? meeting.status : "6 AGENTS ONLINE"}<span className="toolbar-divider" /> <span className="toolbar-dim">CAM 01</span></div>
      </div>

      <div className="office-canvas">
        <div className="scene-wall" /><div className="scene-floor" />
        <div className="scene-window"><div className="window-skyline" /><div className="window-cross" /></div>
        <div className="scene-wall-light scene-wall-light--one" /><div className="scene-wall-light scene-wall-light--two" />
        <div className="room-divider"><span className="divider-door" /></div>
        <div className="scene-room-title room-title--work">ANALYSIS BAY <span>01 / RESEARCH</span></div>
        <div className="scene-room-title room-title--meet">MEETING ROOM <span>02 / DISCUSSION</span></div>
        <div className="scene-plant plant--one"><i /><i /><i /></div>
        <div className="scene-plant plant--two"><i /><i /><i /></div>

        <div className="work-desk desk--one"><div className="desk-screen"><span /></div><div className="desk-keyboard" /></div>
        <div className="work-desk desk--two"><div className="desk-screen"><span /></div><div className="desk-keyboard" /></div>
        <div className="work-desk desk--three"><div className="desk-screen"><span /></div><div className="desk-keyboard" /></div>
        <div className="work-desk desk--four"><div className="desk-screen"><span /></div><div className="desk-keyboard" /></div>
        <div className="work-desk desk--five"><div className="desk-screen"><span /></div><div className="desk-keyboard" /></div>
        <div className="work-desk desk--six"><div className="desk-screen"><span /></div><div className="desk-keyboard" /></div>

        <div className="meeting-table"><div className="table-inset"><span className="table-line" /><span className="table-core">AI / 06</span><span className="table-line" /></div></div>
        <div className="meeting-chair chair--one" /><div className="meeting-chair chair--two" />
        <div className="meeting-chair chair--three" /><div className="meeting-chair chair--four" />
        <div className="meeting-chair chair--five" /><div className="meeting-chair chair--six" />

        <div className="wall-monitor">
          <div className="monitor-top"><span className="monitor-indicator" /> <span>OFFICE / INTELLIGENCE</span><span className="monitor-channel">CH.01</span></div>
          <div className="monitor-content">
            {focusedCoin ? (
              <div className="monitor-focus">
                <div className="monitor-caption">ASSET FOCUS <span>/ {focusedCoin.id}</span></div>
                <div className="monitor-focus-main"><strong>{priceUSD(focusedCoin.price)}</strong><span className={focusedCoin.change24h >= 0 ? "up" : "down"}>{changeText(focusedCoin.change24h)}</span></div>
                <div className="monitor-meter"><span style={{ width: `${Math.min(88, 26 + Math.abs(focusedCoin.change24h) * 9)}%`, background: COIN_META[focusedCoin.id].color }} /></div>
                <div className="monitor-foot">24H CHANGE <span>{market.status} / USD</span></div>
              </div>
            ) : screenTarget === "RISK" ? (
              <div className="monitor-message"><div className="monitor-caption">RISK ASSESSMENT / 07</div><strong>CHECK THE DOWNSIDE.</strong><p>{brief?.risks[0] || "확인된 리스크를 점검합니다."}</p></div>
            ) : screenTarget === "SCENARIO" || screenTarget === "CONCLUSION" ? (
              <div className="monitor-message"><div className="monitor-caption">{screenTarget} / 07</div><strong>{screenTarget === "CONCLUSION" ? "OBSERVE. VERIFY. DECIDE." : "CONNECT THE SIGNALS."}</strong><p>{screenTarget === "CONCLUSION" ? "관찰 목록과 리스크를 보고서에 기록합니다." : brief?.correlations[0] || "시장 간 연결고리를 확인합니다."}</p></div>
            ) : (
              <div className="monitor-overview"><div className="monitor-caption">MARKET PULSE <span>/ 05 ASSETS</span></div><div className="monitor-list">
                {market.coins.map((coin) => <div key={coin.id}><b>{coin.id}</b><span className={coin.change24h >= 0 ? "up" : "down"}>{changeText(coin.change24h)}</span></div>)}
              </div></div>
            )}
          </div>
          <div className="monitor-bottom"><span>DATA: {market.status}</span><span>● ● ●</span></div>
        </div>

        {TEAM.map((agent, index) => {
          const moved = !!active && (meeting.status === "FINISHED" || meeting.events.slice(0, meeting.index + 1).some((event) => event.type === "MOVE" && event.speaker === agent.id));
          const [left, top] = moved ? TABLE_POSITIONS[agent.id] : DESK_POSITIONS[agent.id];
          const state = agentState(agent.id);
          return (
            <div key={agent.id} className={`scene-agent ${moved ? "scene-agent--meeting" : ""} ${state === "SPEAK" ? "scene-agent--speaking" : ""} ${state === "WALK" ? "scene-agent--walking" : ""} ${state === "POINT" ? "scene-agent--pointing" : ""} ${state === "ALERT" ? "scene-agent--alert" : ""}`}
              style={{ left: `${left}%`, top: `${top}%`, "--agent-color": agent.color } as CSSProperties} title={`${agent.name} / ${agent.role} / ${state}`}>
              {state === "SPEAK" && <span className="agent-voice"><i /><i /><i /></span>}
              <PixelAgent color={agent.color} skin={agent.skin} variant={index} />
              <div className="agent-tag"><span className="agent-tag-dot" />{agent.short}</div>
            </div>
          );
        })}
        <div className="canvas-corner canvas-corner--tl" /><div className="canvas-corner canvas-corner--tr" />
        <div className="canvas-corner canvas-corner--bl" /><div className="canvas-corner canvas-corner--br" />
      </div>

      <div className="scene-ticker">
        <div className="ticker-label">MARKET<br />FEED <span>///</span></div>
        <div className="ticker-assets">
          {market.coins.map((coin) => (
            <button key={coin.id} className="ticker-asset" onClick={() => onCoinClick?.(coin.id)} type="button" title={`${COIN_META[coin.id].name} 시장 상세 보기`}>
              <span className="ticker-symbol"><i style={{ background: COIN_META[coin.id].color }} />{coin.id}</span>
              <strong>{priceUSD(coin.price)}</strong>
              <span className={`ticker-change ${coin.change24h >= 0 ? "up" : "down"}`}>{changeText(coin.change24h)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}