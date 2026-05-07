/**
 * Stats.tsx — IPL 2026 Season Statistics
 * Pulls from GET /api/ipl/season-stats → { players: SeasonPlayer[] }
 * Derives all leaderboards client-side from the flat player array.
 * Fantasy points calculated using our scoring rules.
 */
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { apiJson } from "@/lib/api";
import { TEAM_COLOR, TEAM_LOGO } from "@/lib/ipl-constants";
import { ALL_IPL_2026_PLAYERS } from "@/lib/ipl-players-2026";
import { ChevronDown, ChevronUp, RefreshCw, Award } from "lucide-react";

// ── Design tokens ─────────────────────────────────────────────────────
const V      = "#7C6FF7";
const CARD   = "rgba(19,23,38,0.7)";
const BORDER = "rgba(255,255,255,0.08)";
const DIM    = "rgba(255,255,255,0.38)";
const BDR2   = "rgba(255,255,255,0.05)";
const GOLD   = "#e8a020";
const SILVER = "#9ca3af";
const BRONZE = "#d97706";

// ── API shape from /ipl/season-stats ─────────────────────────────────
interface SeasonPlayer {
  name: string;
  matches: number;
  runs: number; balls: number; fours: number; sixes: number;
  notOuts: number; innings: number;
  wickets: number; runsConceded: number; ballsBowled: number;
  dots: number; maidens: number;
}

// ── Fantasy scoring (mirrors server calcPoints) ───────────────────────
function calcFantasyPts(p: SeasonPlayer): number {
  let pts = 0;

  // Playing XI — approximate: 4 pts per match
  pts += p.matches * 4;

  // Batting
  pts += p.runs;
  pts += p.fours * 4;
  pts += p.sixes * 6;

  // Milestones — approximate from runs (season total)
  // We can't know per-innings milestones from aggregated data,
  // so we skip milestone bonuses — server per-match calc is accurate,
  // this is the best we can do from aggregated season data.

  // Bowling
  pts += p.wickets * 30;
  pts += p.dots * 2;
  pts += p.maidens * 12;

  return pts;
}

// ── Category config ───────────────────────────────────────────────────
const CATS = [
  { id: "fantasyPts", label: "Fantasy",    sub: "Most Fantasy Points",    unit: "pts",  color: V,         icon: "⚡" },
  { id: "runs",       label: "Orange Cap", sub: "Most Runs",              unit: "runs", color: "#fb923c", icon: "🏏" },
  { id: "wickets",    label: "Purple Cap", sub: "Most Wickets",           unit: "wkts", color: "#a89ff9", icon: "🎯" },
  { id: "sixes",      label: "Sixes",      sub: "Most Sixes",             unit: "6s",   color: "#818cf8", icon: "6s" },
  { id: "fours",      label: "Fours",      sub: "Most Fours",             unit: "4s",   color: "#60a5fa", icon: "4s" },
  { id: "dots",       label: "Dot Balls",  sub: "Most Dot Balls Bowled",  unit: "dots", color: "#6ee7b7", icon: "•" },
  { id: "maidens",    label: "Maidens",    sub: "Most Maiden Overs",      unit: "M",    color: "#34d399", icon: "M" },
] as const;
type CatId = typeof CATS[number]["id"];

// ── Helpers ───────────────────────────────────────────────────────────
function medalColor(i: number) {
  if (i === 0) return GOLD;
  if (i === 1) return SILVER;
  if (i === 2) return BRONZE;
  return "rgba(255,255,255,0.25)";
}

// Lookup team from player DB
const PLAYER_TEAM_MAP = new Map(ALL_IPL_2026_PLAYERS.map(p => [p.name, p.team]));
function getTeam(name: string) { return PLAYER_TEAM_MAP.get(name) ?? ""; }

function statValue(p: SeasonPlayer, cat: CatId): number {
  switch (cat) {
    case "fantasyPts": return calcFantasyPts(p);
    case "runs":       return p.runs;
    case "wickets":    return p.wickets;
    case "sixes":      return p.sixes;
    case "fours":      return p.fours;
    case "dots":       return p.dots;
    case "maidens":    return p.maidens;
  }
}

function subLine(p: SeasonPlayer, cat: CatId): string {
  const sr = p.balls > 0 ? ((p.runs / p.balls) * 100).toFixed(1) : "—";
  const eco = p.ballsBowled > 0 ? ((p.runsConceded / p.ballsBowled) * 6).toFixed(2) : "—";
  switch (cat) {
    case "fantasyPts":
      return [p.runs > 0 && `${p.runs}r`, p.wickets > 0 && `${p.wickets}w`].filter(Boolean).join(" · ") || "";
    case "runs":
      return `SR: ${sr} · ${p.innings} inn · ${p.fours}×4 ${p.sixes}×6`;
    case "wickets":
      return `Eco: ${eco} · ${Math.floor(p.ballsBowled / 6)}.${p.ballsBowled % 6} ov`;
    case "sixes":
      return `${p.runs} runs · SR: ${sr}`;
    case "fours":
      return `${p.runs} runs · SR: ${sr}`;
    case "dots":
      return `${p.wickets}w · ${Math.floor(p.ballsBowled / 6)}.${p.ballsBowled % 6} ov`;
    case "maidens":
      return `${p.wickets}w · Eco: ${eco}`;
  }
}

// ── Team logo ─────────────────────────────────────────────────────────
function TeamLogo({ code, size = 22 }: { code: string; size?: number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo) return (
    <img src={logo} alt={code}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.3, color }}>
      {code || "?"}
    </div>
  );
}

// ── Podium ────────────────────────────────────────────────────────────
function Podium({ entries, cat }: { entries: SeasonPlayer[]; cat: CatId }) {
  const top = entries.slice(0, 3);
  if (top.length < 2) return null;
  const order  = top.length === 3 ? [top[1], top[0], top[2]] : top;
  const pColors = [SILVER, GOLD, BRONZE];
  const catConf = CATS.find(c => c.id === cat)!;

  return (
    <div style={{ display: "grid",
      gridTemplateColumns: `repeat(${order.length}, 1fr)`,
      gap: 8, alignItems: "flex-end", marginBottom: "1.1rem" }}>
      {order.map((p, oi) => {
        const realRank = top.indexOf(p);
        const col      = pColors[oi];
        const tc       = TEAM_COLOR[getTeam(p.name)] ?? "#aaa";
        const val      = statValue(p, cat);

        return (
          <motion.div key={p.name}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: oi * 0.07, duration: 0.3, ease: [0.22,1,0.36,1] }}
            style={{
              borderRadius: 16, padding: "0.85rem 0.6rem",
              background: `${col}0e`, border: `1.5px solid ${col}35`,
              display: "flex", flexDirection: "column",
              alignItems: "center", textAlign: "center",
              position: "relative", overflow: "hidden",
              minHeight: oi === 1 ? 200 : 168,
            }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
              background: `radial-gradient(ellipse 80% 55% at 50% 0%, ${col}16, transparent 70%)` }} />

            {/* Rank bubble */}
            <div style={{ width: 26, height: 26, borderRadius: "50%",
              background: `${col}22`, border: `2px solid ${col}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.78rem", fontWeight: 900, color: col,
              marginBottom: "0.5rem", zIndex: 1 }}>
              {realRank + 1}
            </div>

            <TeamLogo code={getTeam(p.name)} size={oi === 1 ? 30 : 24} />

            <div style={{ fontWeight: 800, fontSize: oi === 1 ? "0.8rem" : "0.7rem",
              color: "#fff", marginTop: "0.4rem", lineHeight: 1.25,
              overflow: "hidden", textOverflow: "ellipsis", width: "100%",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any, zIndex: 1 }}>
              {p.name.split(" ").slice(-1)[0]}
            </div>
            <div style={{ fontSize: "0.6rem", color: tc, fontWeight: 700, marginTop: 1, zIndex: 1 }}>
              {getTeam(p.name)}
            </div>

            <div style={{ marginTop: "0.45rem",
              fontSize: oi === 1 ? "1.75rem" : "1.35rem",
              fontWeight: 900, color: col,
              fontFamily: "JetBrains Mono, monospace", lineHeight: 1, zIndex: 1 }}>
              {val}
            </div>
            <div style={{ fontSize: "0.58rem", color: DIM, marginTop: 2, zIndex: 1 }}>
              {catConf.unit}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Stat row ──────────────────────────────────────────────────────────
function StatRow({ p, rank, cat }: { p: SeasonPlayer; rank: number; cat: CatId }) {
  const team  = getTeam(p.name);
  const tc    = TEAM_COLOR[team] ?? "#aaa";
  const val   = statValue(p, cat);
  const sub   = subLine(p, cat);
  const mc    = medalColor(rank);
  const top3  = rank < 3;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "0.55rem 1rem",
      borderBottom: `1px solid ${BDR2}`,
      borderLeft: `3px solid ${top3 ? mc : "rgba(255,255,255,0.05)"}`,
      background: top3 ? `${mc}06` : "transparent",
      transition: "background 0.12s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = top3 ? `${mc}06` : "transparent"}>

      {/* Rank */}
      <div style={{ width: 22, textAlign: "center", flexShrink: 0,
        fontWeight: 800, fontSize: top3 ? "0.88rem" : "0.7rem",
        fontFamily: "JetBrains Mono, monospace", color: mc }}>
        {rank + 1}
      </div>

      <TeamLogo code={team} size={22} />

      {/* Name + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {p.name}
        </div>
        {sub && (
          <div style={{ fontSize: "0.62rem", color: DIM, marginTop: 1,
            fontFamily: "JetBrains Mono, monospace" }}>
            {sub}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontFamily: "JetBrains Mono, monospace",
          fontSize: top3 ? "1.05rem" : "0.95rem", fontWeight: 900,
          color: top3 ? mc : "rgba(255,255,255,0.75)" }}>
          {val}
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Stats() {
  const [players, setPlayers]    = useState<SeasonPlayer[]>([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState("");
  const [activeCat, setCat]      = useState<CatId>("fantasyPts");
  const [expanded, setExpanded]  = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  async function fetchStats() {
    setLoading(true); setError("");
    try {
      const data = await apiJson<{ players: SeasonPlayer[] }>("/ipl/season-stats");
      setPlayers(data.players ?? []);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stats");
    }
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  const catConf = CATS.find(c => c.id === activeCat)!;

  // Sort players for current category — filter out zeros
  const ranked = useMemo(() => {
    return [...players]
      .filter(p => statValue(p, activeCat) > 0)
      .sort((a, b) => statValue(b, activeCat) - statValue(a, activeCat));
  }, [players, activeCat]);

  const visible = expanded ? ranked : ranked.slice(0, 15);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
          <div>
            <div className="pill pill-violet" style={{ display: "inline-flex", marginBottom: "0.4rem" }}>
              IPL 2026
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.6rem,5vw,2.1rem)",
              fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
              Statistics
            </h1>
            <p style={{ margin: "0.25rem 0 0", color: DIM, fontSize: "0.88rem" }}>
              Season leaders across all completed matches
            </p>
          </div>
          <button onClick={fetchStats} className="btn-secondary press"
            style={{ height: 36, borderRadius: 10, padding: "0 0.85rem", fontSize: "0.8rem" }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {CATS.map(cat => (
            <button key={cat.id} onClick={() => { setCat(cat.id); setExpanded(false); }}
              className="press-sm"
              style={{
                padding: "0.38rem 0.85rem", borderRadius: 9999,
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                background: activeCat === cat.id ? `${cat.color}20` : "rgba(255,255,255,0.04)",
                color: activeCat === cat.id ? cat.color : DIM,
                border: `1px solid ${activeCat === cat.id ? `${cat.color}45` : BORDER}`,
                fontFamily: "inherit", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <span style={{ fontSize: "0.72rem", fontFamily: "monospace" }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* Main leaderboard card */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20,
          overflow: "hidden",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>

          {/* Card header */}
          <div style={{ padding: "0.85rem 1rem",
            background: `${catConf.color}0a`,
            borderBottom: `1px solid ${catConf.color}20`,
            display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: `${catConf.color}18`, border: `1px solid ${catConf.color}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontFamily: "monospace" }}>
              {catConf.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: "0.9rem", color: "#fff" }}>
                {catConf.sub}
              </div>
              <div style={{ fontSize: "0.67rem", color: DIM, marginTop: 1 }}>
                {ranked.length} players · season aggregate
              </div>
            </div>
          </div>

          {/* Loading shimmer */}
          {loading && (
            <div style={{ padding: "0.75rem" }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="shimmer"
                  style={{ height: 46, borderRadius: 10, marginBottom: 4 }} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ padding: "2rem", textAlign: "center",
              color: "#f87171", fontSize: "0.85rem" }}>
              {error} — check your connection and refresh
            </div>
          )}

          {/* Empty */}
          {!loading && !error && ranked.length === 0 && (
            <div style={{ padding: "3rem 2rem", textAlign: "center", color: DIM }}>
              <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📊</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 600 }}>
                Stats will appear once matches are completed
              </div>
            </div>
          )}

          {/* Podium */}
          {!loading && ranked.length >= 2 && (
            <div style={{ padding: "0.85rem 0.85rem 0" }}>
              <Podium entries={ranked} cat={activeCat} />
            </div>
          )}

          {/* Column header */}
          {!loading && ranked.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "22px 24px 1fr auto",
              gap: 10, padding: "0.38rem 1rem",
              borderTop: `1px solid ${BORDER}`,
              borderBottom: `1px solid ${BORDER}`,
              background: "rgba(255,255,255,0.02)" }}>
              {["#", "", "Player", catConf.unit.toUpperCase()].map((h, i) => (
                <div key={i} style={{ fontSize: "0.58rem", fontWeight: 700,
                  letterSpacing: "0.08em", textTransform: "uppercase" as const,
                  color: "rgba(255,255,255,0.2)",
                  textAlign: i === 3 ? "right" : "left" as any }}>
                  {h}
                </div>
              ))}
            </div>
          )}

          {/* Rows */}
          {!loading && visible.map((p, i) => (
            <StatRow key={p.name} p={p} rank={i} cat={activeCat} />
          ))}

          {/* Show more */}
          {!loading && ranked.length > 15 && (
            <button onClick={() => setExpanded(v => !v)} className="press"
              style={{ width: "100%", padding: "0.7rem",
                background: "rgba(255,255,255,0.02)", border: "none",
                borderTop: `1px solid ${BORDER}`, color: DIM,
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit", display: "flex",
                alignItems: "center", justifyContent: "center", gap: 5 }}>
              {expanded
                ? <><ChevronUp size={13} /> Show less</>
                : <><ChevronDown size={13} /> Show all {ranked.length}</>}
            </button>
          )}
        </div>

        {/* Scoring rules */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
          overflow: "hidden",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
          <button onClick={() => setRulesOpen(v => !v)} className="press-sm"
            style={{ width: "100%", padding: "0.85rem 1rem",
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit" }}>
            <Award size={14} style={{ color: GOLD }} />
            <span style={{ fontWeight: 700, fontSize: "0.85rem",
              color: "rgba(255,255,255,0.7)" }}>
              Fantasy Scoring Rules
            </span>
            <div style={{ marginLeft: "auto" }}>
              {rulesOpen
                ? <ChevronUp size={13} style={{ color: DIM }} />
                : <ChevronDown size={13} style={{ color: DIM }} />}
            </div>
          </button>

          <AnimatePresence>
            {rulesOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeInOut" }}
                style={{ overflow: "hidden" }}>
                <div style={{ padding: "0 1rem 1rem",
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: "0.5rem" }}>
                  {[
                    { group: "Base",      rules: [["Playing XI", "+4"]] },
                    { group: "Batting",   rules: [["Run","+1"],["Four","+4"],["Six","+6"],["Duck","-2"],["25+","+4"],["50+","+8"],["75+","+12"],["100+","+16"]] },
                    { group: "SR Bonus",  rules: [["SR >190","+8"],["SR >170","+6"],["SR >150","+4"],["SR ≥130","+2"],["SR 70-100","-2"],["SR 60-69","-4"],["SR 50-59","-6"]] },
                    { group: "Bowling",   rules: [["Wicket","+30"],["LBW/Bowled","+8"],["Dot ball","+2"],["Maiden","+12"],["3-wkt","+8"],["4-wkt","+12"],["5-wkt","+16"]] },
                    { group: "Economy",   rules: [["Eco <5","+8"],["Eco <6","+6"],["Eco ≤7","+4"],["Eco ≤8","+2"],["Eco 10-11","-2"],["Eco 11-12","-4"],["Eco >12","-6"]] },
                    { group: "Fielding",  rules: [["Catch","+8"],["3+ catches","+4"],["Stumping","+12"],["Direct R/O","+10"],["Indirect R/O","+5"]] },
                    { group: "Multiplier",rules: [["Captain","2×"],["Vice-Capt","1.5×"]] },
                  ].map(sec => (
                    <div key={sec.group} style={{ background: "rgba(255,255,255,0.025)",
                      border: `1px solid ${BORDER}`, borderRadius: 12,
                      padding: "0.7rem 0.85rem" }}>
                      <div style={{ fontSize: "0.6rem", fontWeight: 800,
                        letterSpacing: "0.1em", textTransform: "uppercase" as const,
                        color: V, marginBottom: "0.45rem" }}>
                        {sec.group}
                      </div>
                      {sec.rules.map(([ev, pts]) => (
                        <div key={ev} style={{ display: "flex",
                          justifyContent: "space-between", alignItems: "center",
                          padding: "0.18rem 0", borderBottom: `1px solid ${BDR2}` }}>
                          <span style={{ fontSize: "0.7rem", color: DIM }}>{ev}</span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700,
                            fontFamily: "JetBrains Mono, monospace",
                            color: pts.startsWith("+") ? "#6ee7b7"
                              : pts.startsWith("-") ? "#f87171" : "#fbbf24" }}>
                            {pts}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </Layout>
  );
}
