import type { RoleId } from "../types";

export const TEAM: { id: RoleId; name: string; short: string; role: string; color: string; skin: string }[] = [
  { id: "leader", name: "Alex", short: "LEAD", role: "Team Leader", color: "#d8dcba", skin: "#dcae8c" },
  { id: "market", name: "Mina", short: "MARKET", role: "Market Analyst", color: "#9dbed3", skin: "#e6ba95" },
  { id: "onchain", name: "Jin", short: "ON-CHAIN", role: "On-chain / Ecosystem", color: "#a9caaa", skin: "#c99275" },
  { id: "altcoin", name: "Noah", short: "ALTCOIN", role: "Altcoin Specialist", color: "#c6acd5", skin: "#e2b18b" },
  { id: "risk", name: "Rae", short: "RISK", role: "Macro / Risk Manager", color: "#deb1a0", skin: "#ad795f" },
  { id: "trader", name: "Kai", short: "TRADER", role: "Trader", color: "#d8c598", skin: "#d1a17e" },
];