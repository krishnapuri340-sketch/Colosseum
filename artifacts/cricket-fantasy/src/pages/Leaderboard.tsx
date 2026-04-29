import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Users, Table2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TEAM_LOGO, TEAM_COLOR, TEAM_FULL_NAME } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

interface Standing {
  team: string;
  teamFull: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
  nrr: number;
  position: number;
}

const mockFantasy = [
  { rank: 1,  username: "SRH_Fanatic",       points: 9142, teams: 52 },
  { rank: 2,  username: "BumrahOrNothing",   points: 8734, teams: 47 },
  { rank: 3,  username: "KKR_Narine_Gang",   points: 8291, teams: 43 },
  { rank: 4,  username: "GillForPresident",  points: 7988, teams: 39 },
  { rank: 5,  username: "PantBackStronger",  points: 7612, teams: 35 },
  { rank: 6,  username: "TravisHeadCase",    points: 7204, teams: 31 },
  { rank: 7,  username: "RCB_Believer",      points: 6891, teams: 27 },
  { rank: 8,  username: "KingKohliFC",       points: 6543, teams: 24 },
  { rank: 9,  username: "MI_PalTan",         points: 6187, teams: 21 },
  { rank: 10, username: "RashidSpinZone",    points: 5834, teams: 18 },
];

const rankColor = (rank: number) => {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-600";
  return "text-slate-500";
};

const rankBg = (rank: number) => {
  if (rank === 1) return "bg-yellow-400/10 border-yellow-400/20";
  if (rank === 2) return "bg-slate-300/10 border-slate-300/20";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/20";
  return "bg-white/[0.03] border-white/10";
};

const COL = "rgba(255,255,255,0.35)";
const DIV = "rgba(255,255,255,0.07)";

export default function Leaderboard() {
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/ipl/standings")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.standings)) setStandings(d.standings); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const top3 = standings.slice(0, 3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeight = ["h-28", "h-36", "h-24"];
  const podiumOrder2 = [1, 0, 2];

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-8"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-400" />
            IPL 2026 Points Table
          </h1>
          <p className="text-sm text-slate-400 mt-1">Live standings — updated from official IPL data</p>
        </div>

        {/* Podium — top 3 teams */}
        {loading ? (
          <div className="grid grid-cols-3 gap-4">
            {[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)}
          </div>
        ) : top3.length === 3 && (
          <div className="grid grid-cols-3 gap-3 items-end">
            {podiumOrder.map((entry, i) => {
              const color = TEAM_COLOR[entry.team] ?? "#818cf8";
              const logo = TEAM_LOGO[entry.team];
              return (
                <motion.div
                  key={entry.team}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: podiumOrder2[i] * 0.1 }}
                  style={{ order: podiumOrder2[i] }}
                  className={`flex flex-col items-center justify-end rounded-2xl border p-4 ${rankBg(entry.position)} ${podiumHeight[i]}`}
                >
                  {logo
                    ? <img src={logo} alt={entry.team} className="w-10 h-10 object-contain mb-1" />
                    : <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mb-1" style={{ background: `${color}22`, color }}>{entry.team}</div>
                  }
                  <p className="text-white font-semibold text-sm text-center leading-tight">{entry.team}</p>
                  <p className={`text-xs font-bold mt-0.5 ${rankColor(entry.position)}`}>{entry.points} pts</p>
                  {entry.position <= 3 && <Medal size={14} className={`mt-1 ${rankColor(entry.position)}`} />}
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Full Points Table */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${DIV}`, borderRadius: 16, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: `1px solid ${DIV}`, display: "flex", alignItems: "center", gap: 8 }}>
            <Table2 style={{ width: 14, height: 14, color: COL }} />
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: COL, letterSpacing: "0.08em", textTransform: "uppercase" }}>
              Points Table — IPL 2026
            </span>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${DIV}` }}>
                  {["#", "Team", "P", "W", "L", "NRR", "Pts"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Team" ? "left" : "center", fontSize: "0.68rem", fontWeight: 700, color: COL, letterSpacing: "0.06em", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}><td colSpan={7} style={{ padding: 8 }}><Skeleton className="h-10 w-full bg-white/5" /></td></tr>
                  ))
                ) : standings.map(row => {
                  const isTop4 = row.position <= 4;
                  const color = TEAM_COLOR[row.team] ?? "#818cf8";
                  const logo = TEAM_LOGO[row.team];
                  return (
                    <motion.tr
                      key={row.team}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: row.position * 0.04 }}
                      style={{
                        borderBottom: `1px solid ${DIV}`,
                        background: isTop4 ? "rgba(52,211,153,0.03)" : "transparent",
                      }}
                    >
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.8rem", color: isTop4 ? "#34d399" : "rgba(255,255,255,0.4)" }}>
                          {row.position}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          {isTop4 && <div style={{ width: 3, height: 22, borderRadius: 2, background: "#34d399", flexShrink: 0 }} />}
                          {logo
                            ? <img src={logo} alt={row.team} style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
                            : <div style={{ width: 28, height: 28, borderRadius: "50%", background: `${color}22`, border: `1px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.6rem", fontWeight: 800, color, flexShrink: 0 }}>{row.team}</div>
                          }
                          <div>
                            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f1f5f9" }}>{row.team}</div>
                            <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)" }}>{TEAM_FULL_NAME[row.team] ?? row.teamFull}</div>
                          </div>
                        </div>
                      </td>
                      {[row.played, row.won, row.lost].map((v, ci) => (
                        <td key={ci} style={{ padding: "10px 12px", textAlign: "center", fontSize: "0.82rem", color: v === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.75)", fontVariantNumeric: "tabular-nums" }}>{v}</td>
                      ))}
                      <td style={{ padding: "10px 12px", textAlign: "center", fontSize: "0.82rem", fontVariantNumeric: "tabular-nums", color: row.nrr > 0 ? "#34d399" : row.nrr < 0 ? "#f87171" : "rgba(255,255,255,0.35)" }}>
                        {row.played > 0 ? (row.nrr >= 0 ? "+" : "") + row.nrr.toFixed(3) : "—"}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 800, fontSize: "0.9rem", color: isTop4 ? "#34d399" : "rgba(255,255,255,0.75)", fontVariantNumeric: "tabular-nums" }}>
                        {row.points}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "8px 16px", borderTop: `1px solid ${DIV}`, display: "flex", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 3, height: 14, borderRadius: 2, background: "#34d399" }} />
              <span style={{ fontSize: "0.65rem", color: COL }}>Playoff qualification zone (Top 4)</span>
            </div>
          </div>
        </div>

        {/* Fantasy Rankings */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Fantasy Rankings
          </h2>

          <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
            <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-xs text-slate-500 font-medium uppercase tracking-wider">
              <div className="col-span-1">Rank</div>
              <div className="col-span-7">Player</div>
              <div className="col-span-2 text-right">Points</div>
              <div className="col-span-2 text-right">Teams</div>
            </div>

            {mockFantasy.map((entry, i) => (
              <motion.div
                key={entry.rank}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors ${entry.rank <= 3 ? "bg-white/[0.02]" : ""}`}
              >
                <div className="col-span-1">
                  {entry.rank <= 3
                    ? <Trophy size={16} className={rankColor(entry.rank)} />
                    : <span className={`text-base font-bold ${rankColor(entry.rank)}`}>#{entry.rank}</span>
                  }
                </div>
                <div className="col-span-7 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/10 flex items-center justify-center text-white text-xs font-bold border border-white/10 shrink-0">
                    {entry.username.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-white font-medium text-sm">{entry.username}</span>
                </div>
                <div className="col-span-2 text-right">
                  <span className="text-cyan-400 font-semibold text-sm">{entry.points.toLocaleString()}</span>
                </div>
                <div className="col-span-2 text-right flex items-center justify-end gap-1 text-slate-400 text-sm">
                  <Users size={12} />
                  {entry.teams}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Players",   value: "2,14,738",  icon: <Users size={16} className="text-primary" /> },
            { label: "Matches Played",  value: standings[0]?.played ? `${standings.reduce((a,s)=>a+s.played,0)/2 | 0}` : "—", icon: <Trophy size={16} className="text-yellow-400" /> },
            { label: "Avg NRR",         value: standings.length ? (standings.reduce((a,s)=>a+s.nrr,0)/standings.length).toFixed(3) : "—", icon: <TrendingUp size={16} className="text-green-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-slate-500 text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
