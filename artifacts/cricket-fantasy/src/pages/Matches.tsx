import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Swords, Radio, Calendar, Trophy } from "lucide-react";
import { TEAM_LOGO, TEAM_COLOR, TEAM_FULL_NAME, ALL_TEAMS } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

interface StandingRow {
  team: string;
  teamFull: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
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
  mom: string | null;
  tossText: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

const COL_HEADER = "rgba(255,255,255,0.35)";
const DIVIDER = "rgba(255,255,255,0.07)";

function SmallLogo({ code }: { code: string }) {
  const logo = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo) {
    return (
      <img
        src={logo}
        alt={code}
        style={{ width: 26, height: 26, objectFit: "contain" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: 26, height: 26, borderRadius: "50%",
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: "0.6rem", color,
    }}>
      {code}
    </div>
  );
}

function LeagueTable({ standings, loading }: { standings: StandingRow[]; loading: boolean }) {
  const rows: StandingRow[] = standings.length > 0
    ? standings
    : ALL_TEAMS.map((t, i) => ({
        team: t, teamFull: TEAM_FULL_NAME[t] ?? t,
        played: 0, won: 0, lost: 0, tied: 0, nrr: 0, points: 0, position: i + 1,
      }));

  const cols = ["#", "Team", "P", "W", "L", "T", "NRR", "Pts"];

  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow: "hidden",
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "14px 20px 12px",
        borderBottom: `1px solid ${DIVIDER}`,
      }}>
        <Trophy style={{ width: 15, height: 15, color: "#f59e0b" }} />
        <span style={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.7)" }}>
          IPL 2026 — Points Table
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${DIVIDER}` }}>
              {cols.map(c => (
                <th key={c} style={{
                  padding: c === "Team" ? "8px 16px 8px 8px" : "8px 14px",
                  textAlign: c === "#" || c === "Team" ? "left" : "center",
                  color: COL_HEADER,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                  letterSpacing: "0.06em",
                  whiteSpace: "nowrap",
                }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 10 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${DIVIDER}` }}>
                    <td colSpan={8} style={{ padding: "10px 14px" }}>
                      <div style={{ height: 14, borderRadius: 6, background: "rgba(255,255,255,0.05)" }} />
                    </td>
                  </tr>
                ))
              : rows.map((row, idx) => {
                  const color = TEAM_COLOR[row.team] ?? "#aaa";
                  const isTop4 = idx < 4;
                  return (
                    <tr
                      key={row.team}
                      style={{
                        borderBottom: `1px solid ${DIVIDER}`,
                        background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                      onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)")}
                    >
                      <td style={{ padding: "9px 8px 9px 14px", whiteSpace: "nowrap" }}>
                        <div style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: isTop4 ? `${color}22` : "rgba(255,255,255,0.06)",
                          border: isTop4 ? `1.5px solid ${color}60` : "1.5px solid rgba(255,255,255,0.1)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "0.65rem", fontWeight: 800,
                          color: isTop4 ? color : "rgba(255,255,255,0.4)",
                        }}>
                          {idx + 1}
                        </div>
                      </td>
                      <td style={{ padding: "9px 16px 9px 8px", whiteSpace: "nowrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <SmallLogo code={row.team} />
                          <div>
                            <div style={{ fontWeight: 700, color: isTop4 ? color : "#fff", fontSize: "0.83rem" }}>
                              {row.team}
                            </div>
                            <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)", lineHeight: 1 }}>
                              {row.teamFull}
                            </div>
                          </div>
                        </div>
                      </td>
                      {[row.played, row.won, row.lost, row.tied].map((v, ci) => (
                        <td key={ci} style={{ padding: "9px 14px", textAlign: "center", color: v === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.7)", fontVariantNumeric: "tabular-nums" }}>
                          {v}
                        </td>
                      ))}
                      <td style={{ padding: "9px 14px", textAlign: "center", fontVariantNumeric: "tabular-nums", color: row.nrr > 0 ? "#34d399" : row.nrr < 0 ? "#f87171" : "rgba(255,255,255,0.35)" }}>
                        {row.played > 0 ? (row.nrr >= 0 ? "+" : "") + row.nrr.toFixed(3) : "—"}
                      </td>
                      <td style={{ padding: "9px 14px", textAlign: "center", fontWeight: 800, fontSize: "0.88rem", color: isTop4 ? color : "rgba(255,255,255,0.75)", fontVariantNumeric: "tabular-nums" }}>
                        {row.points}
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      <div style={{ padding: "8px 14px", borderTop: `1px solid ${DIVIDER}`, display: "flex", gap: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#34d399" }} />
          <span style={{ fontSize: "0.65rem", color: COL_HEADER }}>Playoff qualification zone (Top 4)</span>
        </div>
      </div>
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

        {match.tossText && (
          <p className="text-xs text-muted-foreground mt-4 text-center italic">{match.tossText}</p>
        )}
        {match.mom && (
          <div className="mt-2 text-center text-xs">
            <span className="text-yellow-400">⭐ MOM:</span>{" "}
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

        <LeagueTable standings={standings} loading={standingsLoading} />

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
            {["all", "live", "upcoming", "completed"].map(t => (
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

          {["all", "live", "upcoming", "completed"].map(tab => (
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
