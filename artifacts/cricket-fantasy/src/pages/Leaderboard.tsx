/**
 * Leaderboard.tsx
 *
 * Two distinct sections:
 *
 * 1. IPL 2026 Points Table  — official team standings from API
 *
 * 2. Fantasy Leagues        — every private league the user is in.
 *    - League selector across the top (pill tabs).
 *    - Each league shows its own ranked table based on fantasy points
 *      accumulated from the players in each team's squad.
 *    - Click any member to expand their squad + points breakdown.
 *    - "My rank" badge on the user's own row.
 *    - Configuration summary (budget, format, squad size) at the top of
 *      each league card so context is clear.
 */

import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, TrendingUp, Users, Table2, ChevronDown,
  ChevronUp, Star, Medal, Gavel, Crown, Zap,
  BarChart2, Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { TEAM_COLOR, TEAM_LOGO, TEAM_FULL_NAME } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Standing {
  team: string; teamFull: string;
  played: number; won: number; lost: number;
  noResult: number; points: number; nrr: number; position: number;
}

interface SquadPlayer {
  name: string; team: string; role: string;
  purchasePrice: number;   // Cr paid at auction
  fantasyPts: number;      // season fantasy points accumulated
}

interface LeagueMember {
  id: string;
  username: string;
  initials: string;
  color: string;
  isMe?: boolean;
  teamName: string;       // their squad name
  squad: SquadPlayer[];
  totalPts: number;       // sum of squad fantasy points
  rank: number;
  prevRank?: number;      // for ↑↓ arrows
  budgetSpent: number;    // total Cr used in auction
}

interface League {
  id: string;
  name: string;
  color: string;
  format: "classic" | "tier";
  squadSize: number;
  budget: number;
  captainVC: boolean;
  members: LeagueMember[];
  auctionDate: string;
}

// ── Mock data ─────────────────────────────────────────────────────────────────
// Points are per-player season fantasy totals — based on their role/credits

const LEAGUES: League[] = [];

// ── Helpers ────────────────────────────────────────────────────────────────────

const ROLE_ICON: Record<string, string> = { BAT: "🏏", BWL: "🎯", AR: "⚡", WK: "🧤" };
const ROLE_COLOR: Record<string, string> = { BAT: "#60a5fa", BWL: "#f472b6", AR: "#34d399", WK: "#fbbf24" };
const COL = "rgba(255,255,255,0.35)";
const DIV = "rgba(255,255,255,0.07)";

function rankMedal(rank: number) {
  if (rank === 1) return { emoji: "🥇", color: "#f59e0b" };
  if (rank === 2) return { emoji: "🥈", color: "#9ca3af" };
  if (rank === 3) return { emoji: "🥉", color: "#d97706" };
  return { emoji: `#${rank}`, color: "rgba(255,255,255,0.3)" };
}

function Avatar({ initials, color, size = 32 }: { initials: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${color}28`, border: `2px solid ${color}60`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: size * 0.3, fontWeight: 800, color: "#fff",
    }}>
      {initials}
    </div>
  );
}

function RankDelta({ prev, curr }: { prev?: number; curr: number }) {
  if (!prev || prev === curr) return null;
  const up = curr < prev;
  return (
    <span style={{
      fontSize: "0.58rem", fontWeight: 700,
      color: up ? "#22c55e" : "#f87171",
      display: "flex", alignItems: "center", gap: 1,
    }}>
      {up ? "↑" : "↓"}{Math.abs(prev - curr)}
    </span>
  );
}

// ── Squad expansion panel ─────────────────────────────────────────────────────

function SquadPanel({ member, leagueColor, captainVC }: {
  member: LeagueMember; leagueColor: string; captainVC: boolean;
}) {
  const sorted = [...member.squad].sort((a, b) => b.fantasyPts - a.fantasyPts);
  const maxPts = sorted[0]?.fantasyPts ?? 1;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <div style={{
        margin: "0 1rem 1rem",
        background: "rgba(255,255,255,0.025)",
        border: `1px solid ${leagueColor}25`,
        borderRadius: 14, overflow: "hidden",
      }}>
        {/* Squad header */}
        <div style={{
          padding: "0.55rem 0.9rem",
          background: `${leagueColor}0d`,
          borderBottom: `1px solid ${leagueColor}20`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: leagueColor, letterSpacing: "0.08em" }}>
            {member.teamName} — {member.squad.length} players
          </span>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
            ₹{member.budgetSpent}Cr spent
          </span>
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 60px 70px 80px",
          padding: "0.4rem 0.9rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.08em",
          color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
        }}>
          <span>Player</span>
          <span style={{ textAlign: "right" }}>Paid</span>
          <span style={{ textAlign: "right" }}>Pts</span>
          <span style={{ textAlign: "right" }}>Bar</span>
        </div>

        {/* Players */}
        {sorted.map((p, i) => {
          const tc     = TEAM_COLOR[p.team] ?? "#aaa";
          const rc     = ROLE_COLOR[p.role] ?? "#aaa";
          const pct    = Math.round((p.fantasyPts / maxPts) * 100);
          const isCap  = captainVC && i === 0;
          const isVC   = captainVC && i === 1;

          return (
            <div key={p.name} style={{
              display: "grid", gridTemplateColumns: "1fr 60px 70px 80px",
              padding: "0.45rem 0.9rem", alignItems: "center",
              borderBottom: i < sorted.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: isCap ? "rgba(232,160,32,0.05)" : isVC ? "rgba(129,140,248,0.04)" : "transparent",
            }}>
              {/* Name + role */}
              <div style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
                <span style={{ fontSize: "0.82rem" }}>{ROLE_ICON[p.role]}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#fff",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {p.name}
                    </span>
                    {isCap && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "#e8a020",
                        background: "rgba(232,160,32,0.15)", padding: "0px 4px", borderRadius: 3 }}>
                        C
                      </span>
                    )}
                    {isVC && (
                      <span style={{ fontSize: "0.55rem", fontWeight: 800, color: "#818cf8",
                        background: "rgba(129,140,248,0.15)", padding: "0px 4px", borderRadius: 3 }}>
                        VC
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.62rem", fontWeight: 600, color: tc }}>{p.team}</span>
                </div>
              </div>
              {/* Paid */}
              <span style={{ textAlign: "right", fontSize: "0.7rem", fontFamily: "monospace",
                color: "rgba(255,255,255,0.35)" }}>
                ₹{p.purchasePrice}Cr
              </span>
              {/* Points */}
              <span style={{ textAlign: "right", fontWeight: 700, fontSize: "0.78rem",
                color: pct > 70 ? "#22c55e" : pct > 40 ? "#60a5fa" : "rgba(255,255,255,0.55)",
                fontFamily: "monospace" }}>
                {p.fantasyPts}
              </span>
              {/* Bar */}
              <div style={{ paddingLeft: 8 }}>
                <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2,
                    background: leagueColor, transition: "width 0.4s", opacity: 0.8 }} />
                </div>
              </div>
            </div>
          );
        })}

        {/* Squad totals row */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 60px 70px 80px",
          padding: "0.55rem 0.9rem",
          borderTop: `1px solid ${leagueColor}20`,
          background: `${leagueColor}08`,
        }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, color: leagueColor }}>Total</span>
          <span style={{ textAlign: "right", fontSize: "0.7rem", fontFamily: "monospace",
            color: "rgba(255,255,255,0.35)" }}>
            ₹{member.budgetSpent}Cr
          </span>
          <span style={{ textAlign: "right", fontWeight: 900, fontSize: "0.85rem",
            color: leagueColor, fontFamily: "monospace" }}>
            {member.totalPts}
          </span>
          <span />
        </div>
      </div>
    </motion.div>
  );
}

// ── League leaderboard card ────────────────────────────────────────────────────

function LeagueCard({ league }: { league: League }) {
  const [expandedId, setExpanded] = useState<string | null>(null);

  const sorted = [...league.members].sort((a, b) => a.rank - b.rank);
  const me     = league.members.find(m => m.isMe);
  const leader = sorted[0];

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid rgba(255,255,255,0.08)`,
      borderRadius: 20, overflow: "hidden",
    }}>
      {/* League header */}
      <div style={{
        padding: "1rem 1.25rem",
        background: `${league.color}0d`,
        borderBottom: `1px solid ${league.color}25`,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 12, flexShrink: 0,
            background: `${league.color}20`, border: `1px solid ${league.color}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Gavel size={18} style={{ color: league.color }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "1rem", color: "#fff", lineHeight: 1.2 }}>
              {league.name}
            </div>
            <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
              Auctioned {league.auctionDate} · {league.members.length} teams
            </div>
          </div>
        </div>

        {/* Config chips */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {[
            `${league.format === "tier" ? "🏆 Tier" : "🔀 Classic"}`,
            `₹${league.budget}Cr`,
            `${league.squadSize}p`,
            league.captainVC ? "C/VC" : null,
          ].filter(Boolean).map(chip => (
            <span key={chip!} style={{
              fontSize: "0.62rem", fontWeight: 600, padding: "2px 8px", borderRadius: 20,
              background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.5)",
            }}>
              {chip}
            </span>
          ))}
        </div>
      </div>

      {/* My rank summary */}
      {me && (
        <div style={{
          padding: "0.6rem 1.25rem",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(255,255,255,0.02)",
        }}>
          <Star size={12} style={{ color: league.color }} />
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
            Your rank: <b style={{ color: league.color }}>#{me.rank}</b>
          </span>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>·</span>
          <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
            <b style={{ color: "#fff" }}>{me.totalPts.toLocaleString()}</b> pts
          </span>
          {leader && me.id !== leader.id && (
            <>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>·</span>
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)" }}>
                <b style={{ color: "#f87171" }}>
                  {(leader.totalPts - me.totalPts).toLocaleString()} pts
                </b>{" "}behind {leader.username}
              </span>
            </>
          )}
        </div>
      )}

      {/* Column headers */}
      <div style={{
        display: "grid", gridTemplateColumns: "44px 1fr 100px 80px 32px",
        padding: "0.5rem 1.25rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
        color: "rgba(255,255,255,0.25)", textTransform: "uppercase",
      }}>
        <span>Rank</span>
        <span>Team</span>
        <span style={{ textAlign: "right" }}>Fantasy Pts</span>
        <span style={{ textAlign: "right" }}>Budget</span>
        <span />
      </div>

      {/* Member rows */}
      {sorted.map((member) => {
        const medal    = rankMedal(member.rank);
        const isExpanded = expandedId === member.id;
        const pctOfLeader = Math.round((member.totalPts / (sorted[0]?.totalPts ?? 1)) * 100);

        return (
          <div key={member.id}>
            {/* Row */}
            <div
              onClick={() => setExpanded(isExpanded ? null : member.id)}
              style={{
                display: "grid", gridTemplateColumns: "44px 1fr 100px 80px 32px",
                padding: "0.8rem 1.25rem", cursor: "pointer", alignItems: "center",
                borderBottom: isExpanded ? "none" : "1px solid rgba(255,255,255,0.04)",
                background: member.isMe
                  ? "rgba(192,25,44,0.05)"
                  : isExpanded ? "rgba(255,255,255,0.03)" : "transparent",
                borderLeft: member.isMe ? `3px solid ${league.color}` : "3px solid transparent",
                transition: "background 0.15s",
              }}
            >
              {/* Rank */}
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{
                  fontWeight: 800, fontSize: member.rank <= 3 ? "1.1rem" : "0.85rem",
                  color: medal.color,
                }}>
                  {medal.emoji}
                </span>
                <RankDelta prev={member.prevRank} curr={member.rank} />
              </div>

              {/* User */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                <Avatar initials={member.initials} color={member.color} size={34} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {member.username}
                    </span>
                    {member.isMe && (
                      <span style={{ fontSize: "0.58rem", fontWeight: 800, padding: "1px 6px",
                        borderRadius: 20, background: `${league.color}25`, color: league.color,
                        flexShrink: 0 }}>
                        YOU
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>
                    {member.teamName}
                  </span>
                </div>
              </div>

              {/* Points + mini bar */}
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", fontFamily: "monospace",
                  color: member.rank === 1 ? "#f59e0b" : member.isMe ? league.color : "rgba(255,255,255,0.8)" }}>
                  {member.totalPts.toLocaleString()}
                </div>
                <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)",
                  marginTop: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${pctOfLeader}%`, borderRadius: 2,
                    background: member.rank === 1 ? "#f59e0b" : league.color, opacity: 0.7 }} />
                </div>
              </div>

              {/* Budget spent */}
              <div style={{ textAlign: "right", fontSize: "0.7rem",
                fontFamily: "monospace", color: "rgba(255,255,255,0.35)" }}>
                ₹{member.budgetSpent}Cr
              </div>

              {/* Chevron */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {isExpanded
                  ? <ChevronUp  size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
                  : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.2)" }} />
                }
              </div>
            </div>

            {/* Expanded squad */}
            <AnimatePresence>
              {isExpanded && (
                <SquadPanel member={member} leagueColor={league.color} captainVC={league.captainVC} />
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function Leaderboard() {
  const [standings,   setStandings]   = useState<Standing[]>([]);
  const [loadingStandings, setLoadingS] = useState(true);
  const [activeLeague, setActiveLeague] = useState<string>("l1");
  const [mainTab, setMainTab]           = useState<"fantasy" | "ipl">("fantasy");

  useEffect(() => {
    apiFetch("/ipl/standings")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.standings)) setStandings(d.standings); })
      .catch(() => {})
      .finally(() => setLoadingS(false));
  }, []);

  const selectedLeague = LEAGUES.find(l => l.id === activeLeague) ?? LEAGUES[0] ?? null;
  const top3 = standings.slice(0, 3);
  const podiumDisplay = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;
  const podiumHeights = ["h-28", "h-36", "h-24"];

  // My overall stats across all leagues
  const myStats = useMemo(() => {
    if (LEAGUES.length === 0) return { leagues: 0, bestRank: 0, topPts: 0 };
    const myRows = LEAGUES.flatMap(l => l.members.filter(m => m.isMe));
    if (myRows.length === 0) return { leagues: 0, bestRank: 0, topPts: 0 };
    const bestRank = Math.min(...myRows.map(m => m.rank));
    const topPts   = Math.max(...myRows.map(m => m.totalPts));
    return { leagues: myRows.length, bestRank, topPts };
  }, []);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-400" />
              Leaderboard
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Your fantasy leagues · ranked by squad fantasy points
            </p>
          </div>
          {/* Main tab switcher */}
          <div className="flex gap-1.5">
            {([["fantasy", "Fantasy Leagues"], ["ipl", "IPL Standings"]] as const).map(([t, lbl]) => (
              <button key={t} onClick={() => setMainTab(t)}
                style={{
                  padding: "0.45rem 1rem", borderRadius: 10, cursor: "pointer",
                  background: mainTab === t ? "rgba(232,160,32,0.15)" : "rgba(255,255,255,0.05)",
                  border: `1px solid ${mainTab === t ? "rgba(232,160,32,0.35)" : "rgba(255,255,255,0.08)"}`,
                  color: mainTab === t ? "#e8a020" : "rgba(255,255,255,0.45)",
                  fontSize: "0.82rem", fontWeight: 600,
                }}>
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* ── My stats strip ── */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Leagues In",   value: myStats.leagues,            color: "#818cf8", icon: <Users size={15} /> },
            { label: "Best Rank",    value: `#${myStats.bestRank}`,     color: "#f59e0b", icon: <Crown size={15} /> },
            { label: "Top Season Pts",value: myStats.topPts.toLocaleString(), color: "#34d399", icon: <Zap size={15} /> },
          ].map(s => (
            <div key={s.label} style={{
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "0.85rem 1rem",
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                background: `${s.color}18`, border: `1px solid ${s.color}28`,
                display: "flex", alignItems: "center", justifyContent: "center", color: s.color }}>
                {s.icon}
              </div>
              <div>
                <div style={{ fontSize: "1.35rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ══ FANTASY LEAGUES TAB ══ */}
        {mainTab === "fantasy" && (
          <>
            {/* League selector pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
                Your leagues
              </span>
              {LEAGUES.map(l => {
                const me = l.members.find(m => m.isMe);
                return (
                  <button key={l.id} onClick={() => setActiveLeague(l.id)}
                    style={{
                      padding: "0.4rem 0.9rem", borderRadius: 20, cursor: "pointer",
                      background: activeLeague === l.id ? `${l.color}22` : "rgba(255,255,255,0.04)",
                      border: `1.5px solid ${activeLeague === l.id ? l.color : "rgba(255,255,255,0.09)"}`,
                      color: activeLeague === l.id ? l.color : "rgba(255,255,255,0.45)",
                      fontSize: "0.78rem", fontWeight: 600, transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 7,
                    }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: l.color }} />
                    {l.name}
                    {me && (
                      <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)" }}>
                        #{me.rank}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Active league card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeLeague}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <LeagueCard league={selectedLeague} />
              </motion.div>
            </AnimatePresence>

            {/* Info note */}
            <div style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "0.65rem 1rem", borderRadius: 10,
              background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <Info size={13} style={{ color: "rgba(255,255,255,0.25)", flexShrink: 0 }} />
              <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                Points are calculated from real IPL 2026 match performances of each player in your squad,
                using the scoring rules configured for this league. Captain earns 2×, Vice-Captain 1.5×
                {!selectedLeague.captainVC && " (C/VC disabled for this league)"}.
              </span>
            </div>
          </>
        )}

        {/* ══ IPL STANDINGS TAB ══ */}
        {mainTab === "ipl" && (
          <>
            {/* Podium */}
            {loadingStandings ? (
              <div className="grid grid-cols-3 gap-4">
                {[0,1,2].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)}
              </div>
            ) : top3.length === 3 && (
              <div className="grid grid-cols-3 gap-3 items-end">
                {podiumDisplay.map((entry, i) => {
                  const color = TEAM_COLOR[entry.team] ?? "#818cf8";
                  const logo  = TEAM_LOGO[entry.team];
                  return (
                    <motion.div key={entry.team}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className={`flex flex-col items-center justify-end rounded-2xl border p-4 ${podiumHeights[i]}`}
                      style={{
                        background: `${color}10`,
                        border: `1px solid ${color}30`,
                      }}>
                      {logo
                        ? <img src={logo} alt={entry.team} className="w-10 h-10 object-contain mb-1" />
                        : <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold mb-1"
                            style={{ background: `${color}22`, color }}>{entry.team}</div>
                      }
                      <p className="text-white font-semibold text-sm text-center">{entry.team}</p>
                      <p className="text-xs font-bold mt-0.5" style={{ color }}>
                        {entry.points} pts
                      </p>
                      <Medal size={14} className="mt-1" style={{ color }} />
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Points table */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${DIV}`,
              borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "0.75rem 1rem", borderBottom: `1px solid ${DIV}`,
                display: "flex", alignItems: "center", gap: 8 }}>
                <Table2 style={{ width: 14, height: 14, color: COL }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: COL,
                  letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  IPL 2026 Points Table
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 480 }}>
                  <thead>
                    <tr style={{ borderBottom: `1px solid ${DIV}` }}>
                      {["#","Team","P","W","L","NR","NRR","Pts"].map(h => (
                        <th key={h} style={{ padding: "8px 12px",
                          textAlign: h === "Team" ? "left" : "center",
                          fontSize: "0.65rem", fontWeight: 700, color: COL,
                          letterSpacing: "0.06em", textTransform: "uppercase" }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loadingStandings
                      ? Array.from({ length: 10 }).map((_, i) => (
                          <tr key={i}><td colSpan={7} style={{ padding: 8 }}>
                            <Skeleton className="h-10 w-full bg-white/5" />
                          </td></tr>
                        ))
                      : standings.map(row => {
                          const isTop4 = row.position <= 4;
                          const color  = TEAM_COLOR[row.team] ?? "#818cf8";
                          const logo   = TEAM_LOGO[row.team];
                          return (
                            <motion.tr key={row.team}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: row.position * 0.04 }}
                              style={{ borderBottom: `1px solid ${DIV}`,
                                background: isTop4 ? "rgba(52,211,153,0.03)" : "transparent" }}>
                              <td style={{ padding: "10px 12px", textAlign: "center" }}>
                                <span style={{ fontWeight: 700, fontSize: "0.8rem",
                                  color: isTop4 ? "#34d399" : "rgba(255,255,255,0.35)" }}>
                                  {row.position}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                  {isTop4 && <div style={{ width: 3, height: 22, borderRadius: 2,
                                    background: "#34d399", flexShrink: 0 }} />}
                                  {logo
                                    ? <img src={logo} alt={row.team}
                                        style={{ width: 28, height: 28, objectFit: "contain", flexShrink: 0 }} />
                                    : <div style={{ width: 28, height: 28, borderRadius: "50%",
                                        background: `${color}22`, border: `1px solid ${color}50`,
                                        display: "flex", alignItems: "center", justifyContent: "center",
                                        fontSize: "0.6rem", fontWeight: 800, color, flexShrink: 0 }}>
                                        {row.team}
                                      </div>
                                  }
                                  <div>
                                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#f1f5f9" }}>
                                      {row.team}
                                    </div>
                                    <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>
                                      {TEAM_FULL_NAME[row.team] ?? row.teamFull}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              {[row.played, row.won, row.lost, row.noResult].map((v, ci) => (
                                <td key={ci} style={{ padding: "10px 12px", textAlign: "center",
                                  fontSize: "0.82rem", fontVariantNumeric: "tabular-nums",
                                  color: v === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.75)" }}>
                                  {v}
                                </td>
                              ))}
                              <td style={{ padding: "10px 12px", textAlign: "center",
                                fontSize: "0.82rem", fontVariantNumeric: "tabular-nums",
                                color: row.nrr > 0 ? "#34d399" : row.nrr < 0 ? "#f87171" : "rgba(255,255,255,0.3)" }}>
                                {row.played > 0 ? (row.nrr >= 0 ? "+" : "") + row.nrr.toFixed(3) : "—"}
                              </td>
                              <td style={{ padding: "10px 12px", textAlign: "center",
                                fontWeight: 800, fontSize: "0.9rem", fontVariantNumeric: "tabular-nums",
                                color: isTop4 ? "#34d399" : "rgba(255,255,255,0.75)" }}>
                                {row.points}
                              </td>
                            </motion.tr>
                          );
                        })
                    }
                  </tbody>
                </table>
              </div>
              <div style={{ padding: "8px 16px", borderTop: `1px solid ${DIV}`,
                display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 3, height: 14, borderRadius: 2, background: "#34d399" }} />
                <span style={{ fontSize: "0.62rem", color: COL }}>
                  Playoff qualification zone (Top 4)
                </span>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
