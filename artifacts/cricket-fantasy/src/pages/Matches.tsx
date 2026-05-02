import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Swords, Radio, Calendar, Trophy, ChevronDown, ChevronUp } from "lucide-react";
import { TEAM_LOGO, TEAM_COLOR, TEAM_FULL_NAME, ALL_TEAMS } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

interface StandingRow {
  team: string;
  teamFull: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  nrr: number;
  points: number;
  position: number;
}

interface IplMatch {
  iplId: string;
  matchNumber: number;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFull: string;
  awayTeamFull: string;
  venue: string;
  city: string;
  matchDate: string;
  matchTime: string;
  status: string;
  firstInningsScore: string | null;
  secondInningsScore: string | null;
  result: string | null;
  winningTeamCode: string | null;
  mom: string | null;
  tossText: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

function TeamBadge({ code, size = 36 }: { code: string; size?: number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo)
    return (
      <img src={logo} alt={code}
        style={{ width: size, height: size, objectFit: "contain" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.28, color,
    }}>
      {code}
    </div>
  );
}

function LeagueTable({ standings, loading, seasonComplete }: { standings: StandingRow[]; loading: boolean; seasonComplete: boolean }) {
  const [collapsed, setCollapsed] = useState(false);

  const rows: StandingRow[] = standings.length > 0
    ? [...standings].sort((a, b) => a.position - b.position)
    : ALL_TEAMS.map((t, i) => ({
        team: t, teamFull: TEAM_FULL_NAME[t] ?? t,
        played: 0, won: 0, lost: 0, noResult: 0, nrr: 0, points: 0, position: i + 1,
      }));

  const qualifiers = rows.filter(r => r.position <= 4);
  const rest       = rows.filter(r => r.position > 4);
  const maxPts     = Math.max(...rows.map(r => r.points), 1);

  function nrrDisplay(row: StandingRow) {
    if (row.played === 0) return { label: "—", color: "rgba(255,255,255,0.25)" };
    const n = parseFloat(String(row.nrr));
    if (isNaN(n)) return { label: "—", color: "rgba(255,255,255,0.25)" };
    return {
      label: (n >= 0 ? "+" : "") + n.toFixed(3),
      color: n > 0 ? "#34d399" : n < 0 ? "#f87171" : "rgba(255,255,255,0.35)",
    };
  }

  function Stat({ value, highlight }: { label: string; value: string | number; highlight?: string }) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minWidth: 32 }}>
        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: highlight ?? "rgba(255,255,255,0.75)",
          fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>
          {value === 0 ? <span style={{ color: "rgba(255,255,255,0.2)" }}>0</span> : value}
        </span>
      </div>
    );
  }

  // Shared grid: accent-bar | pos | logo | team-name | P | W | L | NRR | PTS
  const GRID_COLS = "3px 24px 36px 1fr 40px 40px 40px 56px 56px";

  function ColHeaders() {
    const lbl = (t: string) => (
      <div style={{
        textAlign: "center" as const,
        fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase" as const, color: "rgba(255,255,255,0.35)",
      }}>
        {t}
      </div>
    );
    return (
      <div style={{
        display: "grid", gridTemplateColumns: GRID_COLS,
        alignItems: "center",
        padding: "7px 16px 7px 0",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.02)",
      }}>
        <div /><div /><div /><div />
        {lbl("P")}{lbl("W")}{lbl("L")}{lbl("NRR")}{lbl("PTS")}
      </div>
    );
  }

  function TeamRow({ row, idx }: { row: StandingRow; idx: number }) {
    const isTop3  = row.position <= 4;
    const accent  = isTop3 ? "#34d399" : "rgba(255,255,255,0.18)";
    const winPct  = row.played > 0 ? Math.round((row.won / row.played) * 100) : 0;
    const nrr     = nrrDisplay(row);
    const ptsPct  = maxPts > 0 ? (row.points / maxPts) * 100 : 0;

    const statVal = (val: string | number, color?: string) => (
      <div style={{
        textAlign: "center" as const,
        fontSize: "0.78rem", fontWeight: 700, fontVariantNumeric: "tabular-nums",
        color: color ?? "rgba(255,255,255,0.5)",
      }}>
        {val}
      </div>
    );

    return (
      <motion.div
        key={row.team}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: idx * 0.04, duration: 0.25, ease: "easeOut" }}
        style={{
          display: "grid", gridTemplateColumns: GRID_COLS,
          alignItems: "center",
          padding: "10px 16px 10px 0",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: isTop3 ? "rgba(52,211,153,0.04)" : "transparent",
          transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = isTop3
          ? "rgba(52,211,153,0.07)"
          : "rgba(255,255,255,0.025)")}
        onMouseLeave={e => (e.currentTarget.style.background = isTop3
          ? "rgba(52,211,153,0.04)"
          : "transparent")}
      >
        {/* Col 1: Left accent bar */}
        <div style={{
          alignSelf: "stretch", borderRadius: "0 3px 3px 0",
          background: accent, opacity: isTop3 ? 0.8 : 0.3,
        }} />

        {/* Col 2: Position */}
        <div style={{
          textAlign: "center" as const,
          fontSize: "0.72rem", fontWeight: 800, fontVariantNumeric: "tabular-nums",
          color: isTop3 ? "#34d399" : "rgba(255,255,255,0.3)",
        }}>
          {row.position}
        </div>

        {/* Col 3: Logo */}
        <div style={{ display: "flex", justifyContent: "center" }}>
          <TeamBadge code={row.team} size={32} />
        </div>

        {/* Col 4: Name + win-rate bar */}
        <div style={{ minWidth: 0, paddingLeft: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontWeight: 800, fontSize: "0.85rem",
              color: isTop3 ? "#fff" : "rgba(255,255,255,0.7)",
              whiteSpace: "nowrap",
            }}>
              {row.team}
            </span>
            {isTop3 && seasonComplete && (
              <span style={{
                fontSize: "0.52rem", fontWeight: 800, letterSpacing: "0.08em",
                padding: "1px 5px", borderRadius: 4,
                background: "rgba(52,211,153,0.15)", color: "#34d399",
                border: "1px solid rgba(52,211,153,0.3)",
              }}>Q</span>
            )}
          </div>
          <div style={{
            fontSize: "0.62rem", color: "rgba(255,255,255,0.28)",
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
            maxWidth: 140, marginTop: 1,
          }}>
            {row.teamFull}
          </div>
          {row.played > 0 && (
            <div style={{ marginTop: 4, height: 3, borderRadius: 2,
              background: "rgba(255,255,255,0.07)", overflow: "hidden", maxWidth: 100 }}>
              <div style={{
                height: "100%", borderRadius: 2, width: `${winPct}%`,
                background: isTop3 ? "linear-gradient(90deg,#34d399,#34d39980)" : "rgba(255,255,255,0.2)",
                transition: "width 0.6s ease",
              }} />
            </div>
          )}
        </div>

        {/* Cols 5-8: P W L NRR */}
        {statVal(row.played)}
        {statVal(row.won, row.won > 0 ? "rgba(255,255,255,0.75)" : undefined)}
        {statVal(row.lost)}
        {statVal(nrr.label, nrr.color)}

        {/* Col 9: Points */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{
            padding: "3px 8px", borderRadius: 7,
            background: isTop3 ? "rgba(52,211,153,0.12)" : "rgba(255,255,255,0.06)",
            border: `1.5px solid ${isTop3 ? "rgba(52,211,153,0.35)" : "rgba(255,255,255,0.1)"}`,
          }}>
            <span style={{
              fontSize: "0.95rem", fontWeight: 900,
              color: isTop3 ? "#34d399" : "rgba(255,255,255,0.6)",
              fontVariantNumeric: "tabular-nums", lineHeight: 1,
            }}>
              {row.points}
            </span>
          </div>
          {row.played > 0 && (
            <div style={{ marginTop: 3, height: 2, width: 32, borderRadius: 1,
              background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 1, width: `${ptsPct}%`,
                background: isTop3 ? "#34d399" : "rgba(255,255,255,0.25)",
                transition: "width 0.6s ease",
              }} />
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 16px 12px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(255,255,255,0.015)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy style={{ width: 15, height: 15, color: "#f59e0b" }} />
          <span style={{ fontWeight: 800, fontSize: "0.82rem", letterSpacing: "0.08em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.8)" }}>
            IPL 2026 — Points Table
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#34d399" }} />
            <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              Top 4 qualify
            </span>
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: "rgba(255,255,255,0.3)", padding: 2, display: "flex", alignItems: "center" }}>
            {collapsed
              ? <ChevronDown style={{ width: 15, height: 15 }} />
              : <ChevronUp   style={{ width: 15, height: 15 }} />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            {loading ? (
              <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} style={{ height: 52, borderRadius: 10,
                    background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s infinite" }} />
                ))}
              </div>
            ) : (
              <>
                <ColHeaders />
                {qualifiers.map((row, i) => <TeamRow key={row.team} row={row} idx={i} />)}
                <div style={{ height: 1, background: "rgba(255,255,255,0.08)", margin: "0 16px",
                  position: "relative" }}>
                  <span style={{
                    position: "absolute", left: "50%", top: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.25)",
                    background: "rgba(9,12,24,1)", padding: "0 8px", whiteSpace: "nowrap",
                  }}>
                    Playoff cutoff
                  </span>
                </div>
                {rest.map((row, i) => <TeamRow key={row.team} row={row} idx={i + 4} />)}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TeamLogo({ code }: { code: string }) {
  const logo = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#00d4ff";
  if (logo) {
    return (
      <img
        src={logo}
        alt={code}
        style={{ width: 52, height: 52, objectFit: "contain" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: 52, height: 52, borderRadius: "50%",
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: "0.85rem", color,
    }}>
      {code}
    </div>
  );
}

function MatchCard({ match }: { match: IplMatch }) {
  const homeColor = TEAM_COLOR[match.homeTeam] ?? "#00d4ff";
  const awayColor = TEAM_COLOR[match.awayTeam] ?? "#00d4ff";

  return (
    <motion.div
      variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
      className="glass-card rounded-2xl overflow-hidden hover:border-primary/40 cursor-pointer"
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-white">
            M{match.matchNumber}
          </span>
          {match.isLive && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
              <Radio className="w-3 h-3" /> LIVE
            </span>
          )}
          {match.isCompleted && (
            <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-muted-foreground">
              COMPLETED
            </span>
          )}
          {match.isUpcoming && (
            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              UPCOMING
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {match.matchDate} • {match.matchTime}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <TeamLogo code={match.homeTeam} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: homeColor }}>{match.homeTeam}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[130px]">{match.homeTeamFull}</div>
              {match.firstInningsScore && (
                <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: homeColor, marginTop: 2 }}>
                  {match.firstInningsScore}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 px-4">
            <div className="text-muted-foreground/30">
              <Swords className="w-8 h-8" />
            </div>
            <span className="text-xs text-muted-foreground font-mono font-bold">VS</span>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end text-right">
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: awayColor }}>{match.awayTeam}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[130px]">{match.awayTeamFull}</div>
              {match.secondInningsScore && (
                <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: awayColor, marginTop: 2 }}>
                  {match.secondInningsScore}
                </div>
              )}
            </div>
            <TeamLogo code={match.awayTeam} />
          </div>
        </div>

        {match.isCompleted && match.result && (
          <div className="mt-4 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-center">
            <p className="text-xs font-semibold" style={{ color: match.winningTeamCode ? (TEAM_COLOR[match.winningTeamCode] ?? "#34d399") : "#34d399" }}>
              {match.result}
            </p>
          </div>
        )}
        {!match.isCompleted && match.tossText && (
          <p className="text-xs text-muted-foreground mt-4 text-center italic">{match.tossText}</p>
        )}
        {match.mom && (
          <div className="mt-2 text-center text-xs">
            <span className="text-yellow-400">MOM:</span>{" "}
            <span className="text-white font-semibold">{match.mom}</span>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-white/5 bg-background/30 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        {match.venue}{match.city ? `, ${match.city}` : ""}
      </div>
    </motion.div>
  );
}

export default function Matches() {
  const [matches, setMatches] = useState<IplMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [standings, setStandings] = useState<StandingRow[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(true);

  useEffect(() => {
    apiFetch("/ipl/matches")
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
        }
        return r.json();
      })
      .then(d => {
        if (Array.isArray(d.matches)) {
          setMatches(d.matches);
        } else {
          setError(`Unexpected response format (count=${d.count ?? "?"})`);
        }
      })
      .catch(e => setError(`Failed to load matches: ${e.message}`))
      .finally(() => setLoading(false));

    apiFetch("/ipl/standings")
      .then(async r => r.json())
      .then(d => {
        if (Array.isArray(d.standings) && d.standings.length > 0) {
          setStandings(d.standings);
        }
      })
      .catch(() => {})
      .finally(() => setStandingsLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const filterMatches = (tab: string) => {
    if (tab === "live") return matches.filter(m => m.isLive);
    if (tab === "upcoming") return matches.filter(m => m.isUpcoming);
    if (tab === "completed") return matches.filter(m => m.isCompleted);
    return matches;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Matches</h1>
          <p className="text-muted-foreground">
            Live scores, results and upcoming fixtures — IPL 2026 ({matches.length} matches)
          </p>
        </div>

        <LeagueTable
          standings={standings}
          loading={standingsLoading}
          seasonComplete={!loading && matches.length > 0 && matches.every(m => m.isCompleted)}
        />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="live" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
            {["live", "upcoming", "completed", "all"].map(t => (
              <TabsTrigger
                key={t}
                value={t}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize"
              >
                {t === "live" ? (
                  <span className="flex items-center gap-1.5"><Radio className="w-3 h-3" /> Live ({matches.filter(m => m.isLive).length})</span>
                ) : t === "all" ? `All (${matches.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${filterMatches(t).length})`}
              </TabsTrigger>
            ))}
          </TabsList>

          {["live", "upcoming", "completed", "all"].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-0 outline-none">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/5" />)}
                </div>
              ) : (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filterMatches(tab).map(match => (
                    <MatchCard key={match.iplId} match={match} />
                  ))}
                  {filterMatches(tab).length === 0 && (
                    <div className="text-center py-20 glass-card rounded-2xl">
                      <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold mb-2">No Matches</h3>
                      <p className="text-muted-foreground">No {tab !== "all" ? tab : ""} matches found.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
