import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  MapPin, Swords, Radio, Calendar, Trophy,
  ChevronDown, ChevronUp, RefreshCw, Award, Clock,
} from "lucide-react";
import { TEAM_LOGO, TEAM_COLOR, TEAM_FULL_NAME, ALL_TEAMS } from "@/lib/ipl-constants";
import {
  useIplMatches, useIplStandings,
  type IplMatch, type IplStanding as StandingRow,
} from "@/hooks/use-ipl-data";
import { apiJson } from "@/lib/api";

// ── Design tokens ─────────────────────────────────────────────────────
const V      = "#7C6FF7";
const CARD   = "rgba(19,23,38,0.7)";
const BORDER = "rgba(255,255,255,0.08)";
const DIM    = "rgba(255,255,255,0.38)";
const BDR2   = "rgba(255,255,255,0.05)";

// ── Scorecard API types ───────────────────────────────────────────────
interface BatterRow {
  PlayerName: string;
  Runs: number; Balls: number; Fours: number; Sixes: number;
  DotBalls: number; StrikeRate: string;
  Dismissal: string; NotOut: boolean;
  PlayingOrder: number;
}
interface BowlerRow {
  PlayerName: string;
  Overs: string; Balls: number; Runs: number;
  Wickets: number; Economy: number;
  Dots: number; Maidens: number;
  BowlingOrder: number;
}
interface InningsData {
  InningsNo: number; InningsName: string; TeamCode: string; TotalScore: string;
  Batsmen: BatterRow[]; Bowlers: BowlerRow[];
}
interface ScorecardResp { innings: InningsData[]; isLive?: boolean; }
interface PlayerStat {
  runs: number; balls: number; fours: number; sixes: number; duck: boolean;
  fifty: boolean; century: boolean;
  wickets: number; dots: number; maidens: number; ballsBowled: number;
  runsConceded: number; catches: number; runOuts: number; stumpings: number;
}
interface PointsResp {
  playerPoints: Record<string, number>;
  playerStats: Record<string, PlayerStat>;
}

function srFmt(runs: number, balls: number) { return balls === 0 ? "—" : ((runs/balls)*100).toFixed(1); }
function ecoFmt(runs: number, balls: number) { return balls === 0 ? "—" : ((runs/balls)*6).toFixed(2); }
function ptsColor(pts?: number) {
  if (pts === undefined) return DIM;
  if (pts >= 60) return "#6ee7b7";
  if (pts >= 30) return "#a89ff9";
  if (pts > 0)   return "rgba(255,255,255,0.65)";
  return "#f87171";
}
function fmtPts(pts?: number) {
  if (pts === undefined) return "—";
  return pts >= 0 ? `+${pts}` : `${pts}`;
}

// ── Team badge ────────────────────────────────────────────────────────
function TeamBadge({ code, size = 36 }: { code: string; size?: number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo) return (
    <img src={logo} alt={code}
      style={{ width: size, height: size, objectFit: "contain" }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
  );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.28, color,
    }}>{code}</div>
  );
}

// ── Scorecard embedded inside match card ──────────────────────────────
type SCTab = "scorecard" | "stats" | "fantasy";

function InlineScorecard({ matchId, mom, isLive }: { matchId: string; mom: string | null; isLive: boolean }) {
  const [scorecard, setSC] = useState<ScorecardResp | null>(null);
  const [points, setPts]   = useState<PointsResp | null>(null);
  const [loading, setLoad] = useState(true);
  const [error, setErr]    = useState("");
  const [tab, setTab]      = useState<SCTab>("scorecard");
  const firstLoad          = useRef(false);

  const load = useCallback(() => {
    Promise.allSettled([
      apiJson<ScorecardResp>(`/ipl/scorecard/${matchId}`),
      apiJson<PointsResp>(`/ipl/points/${matchId}`),
    ]).then(([scRes, ptsRes]) => {
      if (scRes.status === "fulfilled") { setSC(scRes.value); setErr(""); }
      else if (!firstLoad.current) setErr(scRes.reason?.message ?? "Scorecard not yet available");
      if (ptsRes.status === "fulfilled") setPts(ptsRes.value);
      firstLoad.current = true;
    }).finally(() => setLoad(false));
  }, [matchId]);

  useEffect(() => {
    load();
    if (!isLive) return;
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load, isLive]);

  const innings = scorecard?.innings ?? [];

  // Fantasy rows sorted by pts
  const fantasyRows = useMemo(() => {
    if (!points) return [];
    return Object.entries(points.playerPoints)
      .map(([name, pts]) => ({ name, pts, stats: points.playerStats[name] }))
      .sort((a, b) => b.pts - a.pts);
  }, [points]);

  // Stats tab: merge batting + bowling per player, sorted by pts
  const statsRows = useMemo(() => {
    type StatRow = {
      name: string;
      runs: number; balls: number; fours: number; sixes: number;
      wickets: number; dots: number; maidens: number;
      milestone: "100" | "50" | null;
      pts: number;
    };
    const map: Record<string, StatRow> = {};
    for (const inn of innings) {
      for (const b of inn.Batsmen) {
        if (!map[b.PlayerName]) map[b.PlayerName] = { name: b.PlayerName, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, dots: 0, maidens: 0, milestone: null, pts: 0 };
        map[b.PlayerName].runs  += b.Runs;
        map[b.PlayerName].balls += b.Balls;
        map[b.PlayerName].fours += b.Fours;
        map[b.PlayerName].sixes += b.Sixes;
      }
      for (const b of inn.Bowlers) {
        if (!map[b.PlayerName]) map[b.PlayerName] = { name: b.PlayerName, runs: 0, balls: 0, fours: 0, sixes: 0, wickets: 0, dots: 0, maidens: 0, milestone: null, pts: 0 };
        map[b.PlayerName].wickets += b.Wickets;
        map[b.PlayerName].dots    += b.Dots;
        map[b.PlayerName].maidens += b.Maidens;
      }
    }
    for (const row of Object.values(map)) {
      row.pts = points?.playerPoints[row.name] ?? 0;
      const s = points?.playerStats[row.name];
      if (s?.century) row.milestone = "100";
      else if (s?.fifty) row.milestone = "50";
    }
    return Object.values(map).sort((a, b) => b.pts - a.pts);
  }, [innings, points]);

  // Table header helper — defined inside render so TH is available to all tabs
  const TH = ({ children, right }: { children: string; right?: boolean }) => (
    <th style={{
      padding: "0.3rem 0.5rem", fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase" as const,
      color: "rgba(255,255,255,0.25)", textAlign: right ? "right" : "left",
    }}>{children}</th>
  );

  if (loading) return (
    <div style={{ padding: "1rem", display: "flex", flexDirection: "column", gap: 6 }}>
      {[1,2,3].map(i => <div key={i} className="shimmer" style={{ height: 14, borderRadius: 6 }} />)}
    </div>
  );

  if (error && !scorecard) return (
    <div style={{ padding: "1rem", fontSize: "0.8rem", color: DIM, textAlign: "center" }}>
      {error}
    </div>
  );

  if (!scorecard) return null;

  const TABS: { key: SCTab; label: string }[] = [
    { key: "scorecard", label: "Scorecard" },
    { key: "stats",     label: "Stats" },
    { key: "fantasy",   label: "Fantasy Pts" },
  ];

  return (
    <div style={{ borderTop: `1px solid ${BORDER}` }}>
      {/* Tab bar */}
      <div style={{ display: "flex", gap: 4, padding: "0.65rem 1rem 0", flexWrap: "wrap" }}>
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)} className="press-sm"
            style={{
              padding: "0.35rem 0.85rem", borderRadius: 9999, fontSize: "0.75rem",
              fontWeight: 600, cursor: "pointer", border: "none",
              background: tab === key ? `${V}22` : "rgba(255,255,255,0.04)",
              color: tab === key ? "#a89ff9" : DIM,
              outline: tab === key ? `1px solid ${V}40` : "1px solid rgba(255,255,255,0.07)",
              fontFamily: "inherit",
            }}>
            {label}
            {key === "scorecard" && isLive && (
              <span style={{ marginLeft: 5, display: "inline-block",
                width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                verticalAlign: "middle", position: "relative", top: -1 }}
                className="live-pulse" />
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: "0.75rem 1rem 1rem" }}>

        {/* ── SCORECARD TAB ── */}
        {tab === "scorecard" && innings.map((inn, ii) => {
          const tc = TEAM_COLOR[inn.TeamCode] ?? V;
          return (
            <div key={ii} style={{ marginBottom: ii < innings.length - 1 ? "1.5rem" : 0 }}>
              {/* Innings header */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: "0.55rem" }}>
                <div style={{ width: 3, height: 18, borderRadius: 2, background: tc, flexShrink: 0 }} />
                <span style={{ fontWeight: 800, fontSize: "0.85rem", color: "#fff" }}>
                  {inn.InningsName}
                </span>
                {inn.TotalScore && (
                  <span style={{ fontFamily: "JetBrains Mono, monospace",
                    fontSize: "0.85rem", fontWeight: 700, color: tc }}>
                    {inn.TotalScore}
                  </span>
                )}
              </div>

              {/* Batting */}
              {inn.Batsmen.length > 0 && (
                <div style={{ overflowX: "auto", marginBottom: "0.75rem" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse",
                    minWidth: 380, fontSize: "0.75rem" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <TH>Batter</TH>
                        <TH right>R</TH><TH right>B</TH>
                        <TH right>4s</TH><TH right>6s</TH>
                        <TH right>SR</TH><TH right>Pts</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {inn.Batsmen.map((b, bi) => {
                        const pts = points?.playerPoints[b.PlayerName];
                        return (
                          <tr key={bi} style={{ borderBottom: `1px solid ${BDR2}`,
                            background: bi % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                            <td style={{ padding: "0.38rem 0.5rem" }}>
                              <div style={{ fontWeight: 600, color: "#fff" }}>
                                {b.PlayerName}
                                {b.Runs >= 100 && <span style={{ marginLeft: 4, fontSize: "0.58rem", fontWeight: 800, color: "#fbbf24", background: "rgba(251,191,36,0.12)", padding: "1px 4px", borderRadius: 4 }}>100</span>}
                                {b.Runs >= 50 && b.Runs < 100 && <span style={{ marginLeft: 4, fontSize: "0.58rem", fontWeight: 800, color: "#fb923c", background: "rgba(251,146,60,0.12)", padding: "1px 4px", borderRadius: 4 }}>50</span>}
                              </div>
                              <div style={{ fontSize: "0.6rem", color: DIM, marginTop: 1 }}>
                                {b.NotOut ? "not out" : b.Dismissal || "not out"}
                              </div>
                            </td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
                              color: b.Runs >= 50 ? "#fbbf24" : "#fff" }}>
                              {b.Runs}{b.NotOut && <span style={{ color: "#6ee7b7", fontSize: "0.65rem" }}>*</span>}
                            </td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: DIM, fontFamily: "JetBrains Mono, monospace" }}>{b.Balls}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: b.Fours > 0 ? "#60a5fa" : DIM,
                              fontFamily: "JetBrains Mono, monospace" }}>{b.Fours}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: b.Sixes > 0 ? "#a89ff9" : DIM,
                              fontFamily: "JetBrains Mono, monospace" }}>{b.Sixes}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: DIM, fontFamily: "JetBrains Mono, monospace" }}>
                              {b.StrikeRate !== "0.00" ? parseFloat(b.StrikeRate).toFixed(1) : srFmt(b.Runs, b.Balls)}
                            </td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
                              color: ptsColor(pts) }}>{fmtPts(pts)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Bowling */}
              {inn.Bowlers.length > 0 && (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse",
                    minWidth: 320, fontSize: "0.75rem" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                        <TH>Bowler</TH>
                        <TH right>O</TH><TH right>R</TH>
                        <TH right>W</TH><TH right>Eco</TH>
                        <TH right>Dots</TH><TH right>M</TH><TH right>Pts</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {inn.Bowlers.map((b, bi) => {
                        const pts = points?.playerPoints[b.PlayerName];
                        return (
                          <tr key={bi} style={{ borderBottom: `1px solid ${BDR2}`,
                            background: bi % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                            <td style={{ padding: "0.38rem 0.5rem",
                              fontWeight: 600, color: "#fff" }}>{b.PlayerName}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: DIM, fontFamily: "JetBrains Mono, monospace" }}>{b.Overs}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: DIM, fontFamily: "JetBrains Mono, monospace" }}>{b.Runs}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
                              color: b.Wickets >= 3 ? "#6ee7b7" : b.Wickets > 0 ? "#a89ff9" : DIM }}>{b.Wickets}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: DIM, fontFamily: "JetBrains Mono, monospace" }}>
                              {b.Economy > 0 ? b.Economy.toFixed(2) : ecoFmt(b.Runs, b.Balls)}
                            </td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: b.Dots > 0 ? "#60a5fa" : DIM,
                              fontFamily: "JetBrains Mono, monospace" }}>{b.Dots}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              color: b.Maidens > 0 ? "#fbbf24" : DIM,
                              fontFamily: "JetBrains Mono, monospace" }}>{b.Maidens}</td>
                            <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                              fontWeight: 700, fontFamily: "JetBrains Mono, monospace",
                              color: ptsColor(pts) }}>{fmtPts(pts)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}

        {/* ── STATS TAB ── */}
        {tab === "stats" && (
          <div>
            {mom && (
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "0.5rem 0.75rem", marginBottom: "0.75rem",
                background: "rgba(232,160,32,0.08)", border: "1px solid rgba(232,160,32,0.2)",
                borderRadius: 10 }}>
                <Award size={13} style={{ color: "#fbbf24", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, color: "rgba(232,160,32,0.7)",
                    letterSpacing: "0.08em", textTransform: "uppercase" }}>Man of the Match</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{mom}</div>
                </div>
              </div>
            )}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse",
                minWidth: 480, fontSize: "0.73rem" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <TH>Player</TH>
                    <TH right>R</TH>
                    <TH right>B</TH>
                    <TH right>4s</TH>
                    <TH right>6s</TH>
                    <TH right>SR</TH>
                    <TH right>MS</TH>
                    <TH right>W</TH>
                    <TH right>Dot</TH>
                    <TH right>M</TH>
                    <TH right>Pts</TH>
                  </tr>
                </thead>
                <tbody>
                  {statsRows.map((row, ri) => (
                    <tr key={row.name} style={{ borderBottom: `1px solid ${BDR2}`,
                      background: ri % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                      <td style={{ padding: "0.35rem 0.5rem", fontWeight: 600, color: "#fff",
                        whiteSpace: "nowrap", maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.name}
                        {row.name === mom && (
                          <span style={{ marginLeft: 4, fontSize: "0.5rem", color: "#fbbf24" }}>★</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
                        color: row.runs >= 50 ? "#fbbf24" : row.runs > 0 ? "#fff" : DIM }}>
                        {row.runs > 0 ? row.runs : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace", color: DIM }}>
                        {row.balls > 0 ? row.balls : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace",
                        color: row.fours > 0 ? "#60a5fa" : DIM }}>
                        {row.fours > 0 ? row.fours : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace",
                        color: row.sixes > 0 ? "#a89ff9" : DIM }}>
                        {row.sixes > 0 ? row.sixes : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace", color: DIM }}>
                        {row.balls > 0 ? srFmt(row.runs, row.balls) : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem" }}>
                        {row.milestone === "100"
                          ? <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#fbbf24",
                              background: "rgba(251,191,36,0.12)", padding: "1px 5px", borderRadius: 4 }}>100</span>
                          : row.milestone === "50"
                          ? <span style={{ fontSize: "0.58rem", fontWeight: 800, color: "#fb923c",
                              background: "rgba(251,146,60,0.12)", padding: "1px 5px", borderRadius: 4 }}>50</span>
                          : <span style={{ color: DIM }}>—</span>}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace", fontWeight: 700,
                        color: row.wickets >= 3 ? "#6ee7b7" : row.wickets > 0 ? "#a89ff9" : DIM }}>
                        {row.wickets > 0 ? row.wickets : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace",
                        color: row.dots > 0 ? "#60a5fa" : DIM }}>
                        {row.dots > 0 ? row.dots : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontFamily: "JetBrains Mono, monospace",
                        color: row.maidens > 0 ? "#fbbf24" : DIM }}>
                        {row.maidens > 0 ? row.maidens : "—"}
                      </td>
                      <td style={{ textAlign: "right", padding: "0.35rem 0.5rem",
                        fontWeight: 800, fontFamily: "JetBrains Mono, monospace",
                        fontSize: "0.82rem", color: ptsColor(row.pts) }}>
                        {fmtPts(row.pts)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── FANTASY POINTS TAB ── */}
        {tab === "fantasy" && (
          <div>
            {mom && (
              <div style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "0.55rem 0.75rem", marginBottom: "0.75rem",
                background: "rgba(232,160,32,0.08)", border: "1px solid rgba(232,160,32,0.2)",
                borderRadius: 10 }}>
                <Award size={14} style={{ color: "#fbbf24", flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, color: "rgba(232,160,32,0.7)",
                    letterSpacing: "0.08em", textTransform: "uppercase" }}>Man of the Match</div>
                  <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{mom}</div>
                </div>
              </div>
            )}

            {/* Top 3 podium */}
            {fantasyRows.slice(0, 3).length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: "0.75rem" }}>
                {fantasyRows.slice(0, 3).map((row, i) => {
                  const cols = ["#fbbf24","#9ca3af","#d97706"];
                  const s = row.stats;
                  return (
                    <div key={row.name} style={{ flex: 1, background: `${cols[i]}08`,
                      border: `1px solid ${cols[i]}25`, borderRadius: 11,
                      padding: "0.55rem 0.65rem" }}>
                      <div style={{ fontSize: "0.58rem", fontWeight: 800, color: cols[i],
                        letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 }}>
                        {["1st","2nd","3rd"][i]}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: "0.75rem", color: "#fff",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.name}
                      </div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 900, color: cols[i],
                        fontFamily: "JetBrains Mono, monospace", lineHeight: 1.2, marginTop: 2 }}>
                        {row.pts}<span style={{ fontSize: "0.6rem", marginLeft: 2 }}>pts</span>
                      </div>
                      {s && (
                        <div style={{ fontSize: "0.6rem", color: DIM, marginTop: 3 }}>
                          {s.runs > 0 && `${s.runs}r(${s.balls}b) `}
                          {s.wickets > 0 && `${s.wickets}w `}
                          {s.catches > 0 && `${s.catches}ct`}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Full table */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse",
                minWidth: 440, fontSize: "0.75rem" }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <TH>Player</TH>
                    <TH right>Batting</TH>
                    <TH right>Bowling</TH>
                    <TH right>Field</TH>
                    <TH right>Pts</TH>
                  </tr>
                </thead>
                <tbody>
                  {fantasyRows.map((row, ri) => {
                    const s = row.stats;
                    const bat = s.runs > 0
                      ? `${s.runs}(${s.balls}) ${s.fours}×4 ${s.sixes}×6`
                      : s.duck ? "0 duck" : "—";
                    const bowl = s.wickets > 0 || s.ballsBowled > 0
                      ? `${s.wickets}w ${s.dots}d ${s.maidens}m`
                      : "—";
                    const field = [
                      s.catches > 0 && `${s.catches}ct`,
                      s.stumpings > 0 && `${s.stumpings}st`,
                      s.runOuts > 0 && `${s.runOuts}ro`,
                    ].filter(Boolean).join(" ") || "—";
                    return (
                      <tr key={row.name} style={{ borderBottom: `1px solid ${BDR2}`,
                        background: ri % 2 === 0 ? "rgba(255,255,255,0.015)" : "transparent" }}>
                        <td style={{ padding: "0.38rem 0.5rem",
                          fontWeight: 600, color: "#fff" }}>{row.name}</td>
                        <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                          color: DIM, fontFamily: "JetBrains Mono, monospace",
                          fontSize: "0.7rem", whiteSpace: "nowrap" }}>{bat}</td>
                        <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                          color: s.wickets > 0 ? "#6ee7b7" : DIM,
                          fontFamily: "JetBrains Mono, monospace",
                          fontSize: "0.7rem", whiteSpace: "nowrap" }}>{bowl}</td>
                        <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                          color: s.catches > 0 || s.stumpings > 0 ? "#fb923c" : DIM,
                          fontFamily: "JetBrains Mono, monospace", fontSize: "0.7rem" }}>
                          {field}
                        </td>
                        <td style={{ textAlign: "right", padding: "0.38rem 0.5rem",
                          fontWeight: 800, fontFamily: "JetBrains Mono, monospace",
                          fontSize: "0.85rem", color: ptsColor(row.pts) }}>
                          {fmtPts(row.pts)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main MatchCard with expandable scorecard ──────────────────────────
function MatchCard({ match }: { match: IplMatch }) {
  const [open, setOpen] = useState(match.isLive);
  const c1 = TEAM_COLOR[match.homeTeam] ?? "#aaa";
  const c2 = TEAM_COLOR[match.awayTeam] ?? "#aaa";
  const canExpand = match.isCompleted || match.isLive;

  return (
    <div style={{
      background: CARD, borderRadius: 18, overflow: "hidden",
      border: `1px solid ${open ? (match.isLive ? "rgba(34,197,94,0.25)" : `${V}22`) : BORDER}`,
      borderTop: `2px solid ${match.isLive ? "#22c55e" : match.isCompleted ? V : "rgba(255,255,255,0.12)"}`,
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
      transition: "border-color 0.2s",
    }}>

      {/* Card header */}
      <div
        onClick={() => canExpand && setOpen(o => !o)}
        style={{ padding: "1rem", cursor: canExpand ? "pointer" : "default" }}>

        {/* Top row: badges + date */}
        <div style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: "0.85rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontSize: "0.65rem", fontWeight: 700,
              color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.06)",
              padding: "2px 8px", borderRadius: 6,
            }}>M{match.matchNumber}</span>
            {match.isLive && (
              <span style={{ display: "flex", alignItems: "center", gap: 4,
                fontSize: "0.65rem", fontWeight: 700, color: "#22c55e",
                background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)",
                padding: "2px 8px", borderRadius: 6 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }}
                  className="live-pulse" />
                LIVE
              </span>
            )}
            {match.isCompleted && (
              <span className="pill pill-violet" style={{ fontSize: "0.62rem" }}>Result</span>
            )}
            {match.isUpcoming && (
              <span style={{ fontSize: "0.65rem", fontWeight: 700,
                color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 3 }}>
                <Clock size={11} /> {match.matchTime}
              </span>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: "0.68rem", color: DIM }}>{match.matchDate}</span>
            {canExpand && (
              <div style={{ width: 24, height: 24, borderRadius: 7,
                background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                {open
                  ? <ChevronUp size={12} style={{ color: DIM }} />
                  : <ChevronDown size={12} style={{ color: DIM }} />}
              </div>
            )}
          </div>
        </div>

        {/* Teams row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {/* Home */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
            <TeamBadge code={match.homeTeam} size={42} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: c1 }}>{match.homeTeam}</div>
              <div style={{ fontSize: "0.68rem", color: DIM }}>{match.homeTeamFull}</div>
              {match.firstInningsScore && (
                <div style={{ fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.95rem", fontWeight: 700, color: c1, marginTop: 2 }}>
                  {match.firstInningsScore}
                </div>
              )}
            </div>
          </div>

          {/* VS */}
          <div style={{ padding: "0 0.75rem", textAlign: "center" }}>
            <Swords size={20} style={{ color: "rgba(255,255,255,0.1)", display: "block", margin: "0 auto" }} />
            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.2)",
              fontWeight: 700, marginTop: 2 }}>VS</div>
          </div>

          {/* Away */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "flex-end" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 800, fontSize: "1rem", color: c2 }}>{match.awayTeam}</div>
              <div style={{ fontSize: "0.68rem", color: DIM }}>{match.awayTeamFull}</div>
              {match.secondInningsScore && (
                <div style={{ fontFamily: "JetBrains Mono, monospace",
                  fontSize: "0.95rem", fontWeight: 700, color: c2, marginTop: 2 }}>
                  {match.secondInningsScore}
                </div>
              )}
            </div>
            <TeamBadge code={match.awayTeam} size={42} />
          </div>
        </div>

        {/* Result / toss / MOM */}
        {match.isCompleted && match.result && (
          <div style={{ marginTop: "0.75rem", padding: "0.5rem 0.75rem", borderRadius: 10,
            background: "rgba(255,255,255,0.03)", border: `1px solid ${BORDER}`,
            textAlign: "center" }}>
            <span style={{ fontSize: "0.78rem", fontWeight: 700,
              color: match.winningTeamCode
                ? (TEAM_COLOR[match.winningTeamCode] ?? "#6ee7b7")
                : "#6ee7b7" }}>
              {match.result}
            </span>
            {match.mom && (
              <span style={{ fontSize: "0.72rem", color: DIM, marginLeft: "0.75rem" }}>
                MOM: <b style={{ color: "#fbbf24" }}>{match.mom}</b>
              </span>
            )}
          </div>
        )}
        {!match.isCompleted && match.tossText && (
          <div style={{ marginTop: "0.6rem", fontSize: "0.72rem",
            color: DIM, textAlign: "center", fontStyle: "italic" }}>
            {match.tossText}
          </div>
        )}

        {/* Venue */}
        <div style={{ marginTop: "0.5rem", display: "flex", alignItems: "center",
          gap: 4, fontSize: "0.68rem", color: "rgba(255,255,255,0.25)" }}>
          <MapPin size={10} />
          {match.venue}{match.city ? `, ${match.city}` : ""}
        </div>
      </div>

      {/* Expandable scorecard */}
      <AnimatePresence>
        {open && canExpand && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}>
            <InlineScorecard matchId={match.iplId} mom={match.mom} isLive={match.isLive ?? false} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Points table (unchanged logic, updated styles) ────────────────────
function LeagueTable({ standings, loading, seasonComplete }: {
  standings: StandingRow[]; loading: boolean; seasonComplete: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const rows = standings.length > 0
    ? [...standings].sort((a, b) => a.position - b.position)
    : ALL_TEAMS.map((t, i) => ({
        team: t, teamFull: TEAM_FULL_NAME[t] ?? t,
        played: 0, won: 0, lost: 0, noResult: 0, tied: 0, nrr: 0, points: 0, position: i + 1,
      }));

  const GRID = "3px 24px 36px 1fr 30px 30px 30px 16px 52px 14px 54px";

  function nrrFmt(r: StandingRow) {
    if (r.played === 0) return { label: "—", color: DIM };
    const v = parseFloat(String(r.nrr));
    if (isNaN(v)) return { label: "—", color: DIM };
    return { label: (v >= 0 ? "+" : "") + v.toFixed(3),
      color: v > 0 ? "#6ee7b7" : v < 0 ? "#f87171" : DIM };
  }

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`,
      borderRadius: 18, overflow: "hidden",
      backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.85rem 1rem", borderBottom: `1px solid ${BORDER}`,
        background: "rgba(255,255,255,0.015)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <Trophy size={14} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: 800, fontSize: "0.8rem", letterSpacing: "0.06em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
            IPL 2026 — Points Table
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6ee7b7" }} />
            <span style={{ fontSize: "0.62rem", color: DIM }}>Top 4 qualify</span>
          </div>
          <button onClick={() => setCollapsed(c => !c)} style={{
            background: "none", border: "none", cursor: "pointer",
            color: DIM, padding: 2, display: "flex", alignItems: "center",
          }}>
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}>

            {/* Column headers */}
            {!loading && (
              <div style={{ display: "grid", gridTemplateColumns: GRID,
                alignItems: "center", padding: "6px 8px",
                borderBottom: `1px solid ${BDR2}`,
                background: "rgba(255,255,255,0.02)" }}>
                {["","#","","Team","P","W","L","","NRR","","PTS"].map((h, i) => (
                  <div key={i} style={{ textAlign: i > 3 ? "center" : "left" as any,
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.06em",
                    textTransform: "uppercase" as any,
                    color: "rgba(255,255,255,0.25)", paddingLeft: i === 3 ? 8 : 0 }}>
                    {h}
                  </div>
                ))}
              </div>
            )}

            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="shimmer"
                    style={{ height: 54, margin: "4px 8px", borderRadius: 10 }} />
                ))
              : rows.map((row, idx) => {
                  const isTop4 = row.position <= 4;
                  const nrr    = nrrFmt(row);
                  const winPct = row.played > 0 ? Math.round((row.won / row.played) * 100) : 0;
                  const isCut  = !isTop4 && idx > 0 && rows[idx - 1].position <= 4;
                  return (
                    <div key={row.team}>
                      {isCut && (
                        <div style={{ display: "flex", alignItems: "center",
                          gap: 8, height: 22, padding: "0 12px", pointerEvents: "none" }}>
                          <div style={{ flex: 1, height: 1,
                            background: "linear-gradient(90deg, transparent, rgba(110,231,183,0.5))" }} />
                          <span style={{ fontSize: "0.48rem", fontWeight: 800,
                            letterSpacing: "0.12em", textTransform: "uppercase" as any,
                            color: "#6ee7b7", opacity: 0.6 }}>Playoff cutoff</span>
                          <div style={{ flex: 1, height: 1,
                            background: "linear-gradient(90deg, rgba(110,231,183,0.5), transparent)" }} />
                        </div>
                      )}
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.03, duration: 0.22 }}
                        style={{ display: "grid", gridTemplateColumns: GRID,
                          alignItems: "center", padding: "12px 8px",
                          borderBottom: `1px solid ${BDR2}`,
                          transition: "background 0.15s" }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.025)"}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = "transparent"}>
                        {/* Accent bar */}
                        <div style={{ alignSelf: "stretch", borderRadius: "0 3px 3px 0",
                          background: isTop4 ? "#6ee7b7" : "rgba(255,255,255,0.15)",
                          opacity: isTop4 ? 0.8 : 0.3 }} />
                        {/* Position */}
                        <div style={{ textAlign: "center" as any, fontSize: "0.72rem",
                          fontWeight: 800, color: isTop4 ? "#6ee7b7" : "rgba(255,255,255,0.28)" }}>
                          {row.position}
                        </div>
                        {/* Logo */}
                        <div style={{ display: "flex", justifyContent: "center" }}>
                          <TeamBadge code={row.team} size={28} />
                        </div>
                        {/* Team name */}
                        <div style={{ paddingLeft: 8, minWidth: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: "0.82rem",
                            color: isTop4 ? "#fff" : "rgba(255,255,255,0.65)",
                            whiteSpace: "nowrap" }}>
                            {row.team}
                            {isTop4 && seasonComplete && (
                              <span style={{ marginLeft: 5, fontSize: "0.5rem",
                                fontWeight: 800, letterSpacing: "0.08em",
                                padding: "1px 4px", borderRadius: 3,
                                background: "rgba(110,231,183,0.15)", color: "#6ee7b7",
                                border: "1px solid rgba(110,231,183,0.3)" }}>Q</span>
                            )}
                          </div>
                          {row.played > 0 && (
                            <div style={{ marginTop: 3, height: 3, borderRadius: 2,
                              background: "rgba(255,255,255,0.07)", overflow: "hidden", maxWidth: 80 }}>
                              <div style={{ height: "100%", borderRadius: 2, width: `${winPct}%`,
                                background: isTop4 ? "#6ee7b7" : "rgba(255,255,255,0.2)",
                                transition: "width 0.6s ease" }} />
                            </div>
                          )}
                        </div>
                        {/* Stats */}
                        {[row.played, row.won, row.lost].map((v, ci) => (
                          <div key={ci} style={{ textAlign: "center" as any,
                            fontSize: "0.82rem", fontWeight: 700,
                            color: v === 0 ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.6)",
                            fontVariantNumeric: "tabular-nums" }}>
                            {v}
                          </div>
                        ))}
                        <div />
                        {/* NRR */}
                        <div style={{ textAlign: "center" as any,
                          fontSize: "0.78rem", fontWeight: 700, color: nrr.color,
                          fontVariantNumeric: "tabular-nums" }}>
                          {nrr.label}
                        </div>
                        <div />
                        {/* Points */}
                        <div style={{ textAlign: "center" as any }}>
                          <div style={{ display: "inline-block",
                            padding: "3px 10px", borderRadius: 7,
                            background: isTop4 ? "rgba(110,231,183,0.1)" : "rgba(255,255,255,0.06)",
                            border: `1.5px solid ${isTop4 ? "rgba(110,231,183,0.3)" : "rgba(255,255,255,0.1)"}` }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: 900,
                              color: isTop4 ? "#6ee7b7" : "rgba(255,255,255,0.6)",
                              fontVariantNumeric: "tabular-nums" }}>
                              {row.points}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  );
                })
            }
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
type MatchTab = "live"|"upcoming"|"completed"|"all";

export default function Matches() {
  const { data: matches = [], isLoading, error: matchesError, refetch } = useIplMatches({ refetchInterval: 30_000 });
  const { data: standings = [], isLoading: standingsLoading } = useIplStandings();
  const [tab, setTab] = useState<MatchTab>("live");

  const filtered = useMemo(() => {
    const list = tab === "live"      ? matches.filter(m => m.isLive)
               : tab === "upcoming"  ? matches.filter(m => m.isUpcoming)
               : tab === "completed" ? [...matches.filter(m => m.isCompleted)].reverse()
               : matches;
    return list;
  }, [matches, tab]);

  const counts = {
    live:      matches.filter(m => m.isLive).length,
    upcoming:  matches.filter(m => m.isUpcoming).length,
    completed: matches.filter(m => m.isCompleted).length,
    all:       matches.length,
  };

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.75rem,5vw,2.2rem)",
              fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Matches
            </h1>
            <p style={{ margin: "0.3rem 0 0", color: DIM, fontSize: "0.9rem" }}>
              IPL 2026 · {matches.length} matches · click a result to see the scorecard
            </p>
          </div>
          <button onClick={() => refetch()} className="btn-secondary press"
            style={{ height: 38, borderRadius: 12, padding: "0 0.9rem", fontSize: "0.82rem" }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {/* Points table */}
        <LeagueTable standings={standings} loading={standingsLoading}
          seasonComplete={!isLoading && matches.length > 0 && matches.every(m => m.isCompleted)} />

        {matchesError && (
          <div style={{ padding: "0.85rem 1rem", background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)", borderRadius: 12,
            color: "#f87171", fontSize: "0.85rem" }}>
            Failed to load matches — {matchesError.message}
          </div>
        )}

        {/* Tab bar */}
        <div className="tab-bar" style={{ width: "fit-content" }}>
          {(["live","upcoming","completed","all"] as MatchTab[]).map(t => (
            <button key={t} className={`tab-item ${tab === t ? "active" : ""}`}
              onClick={() => setTab(t)}
              style={{ padding: "0.4rem 0.85rem", fontSize: "0.8rem" }}>
              {t === "live" && (
                <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Radio size={11} /> Live ({counts.live})
                </span>
              )}
              {t !== "live" && (
                `${t.charAt(0).toUpperCase() + t.slice(1)} (${counts[t]})`
              )}
            </button>
          ))}
        </div>

        {/* Match list */}
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {[1,2,3].map(i => (
              <div key={i} className="shimmer" style={{ height: 180, borderRadius: 18 }} />
            ))}
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {filtered.map(m => <MatchCard key={m.iplId} match={m} />)}
            {filtered.length === 0 && (
              <div style={{ padding: "3rem 2rem", textAlign: "center",
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.08)", borderRadius: 18 }}>
                <Swords size={28} style={{ margin: "0 auto 0.75rem", opacity: 0.2 }} />
                <div style={{ fontSize: "0.95rem", fontWeight: 700,
                  color: "rgba(255,255,255,0.35)" }}>
                  No {tab !== "all" ? tab : ""} matches
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
