import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowRight, Swords, Trophy, Star, Flame, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { TEAM_COLOR, TEAM_LOGO, TEAM_FULL_NAME } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

interface IplMatch {
  iplId: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamFull: string;
  awayTeamFull: string;
  venue: string;
  city: string;
  matchDate: string;
  matchTime: string;
  firstInningsScore: string | null;
  secondInningsScore: string | null;
  result: string | null;
  winningTeamCode: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

// Week-by-week points across IPL 2026 season (realistic fantasy arc)
const chartData = [
  { day: "W1",  points: 187 },
  { day: "W2",  points: 312 },
  { day: "W3",  points: 245 },
  { day: "W4",  points: 418 },
  { day: "W5",  points: 376 },
  { day: "W6",  points: 502 },
  { day: "W7",  points: 489 },
];

// Quick picks — top IPL 2026 differential picks
const DIFFERENTIALS = [
  { name: "Tilak Varma",    team: "MI",   role: "AR",  sel: "28%",  pts: 312 },
  { name: "Sai Sudharsan",  team: "GT",   role: "BAT", sel: "31%",  pts: 287 },
  { name: "Varun Chakravarthy", team: "KKR", role: "BWL", sel: "34%", pts: 274 },
];

export default function Dashboard() {
  const [iplMatches, setIplMatches] = useState<IplMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);

  useEffect(() => {
    apiFetch("/ipl/matches")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.matches)) setIplMatches(d.matches); })
      .catch(() => {})
      .finally(() => setLoadingMatches(false));
  }, []);

  const upcomingMatches = iplMatches.filter(m => m.isUpcoming || m.isLive).slice(0, 3);

  const liveCount      = iplMatches.filter(m => m.isLive).length;
  const upcomingCount  = iplMatches.filter(m => m.isUpcoming).length;
  const completedCount = iplMatches.filter(m => m.isCompleted).length;
  const totalCount     = iplMatches.length;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <Layout>
      <motion.div
        className="space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <motion.div
          variants={itemVariants}
          className="relative rounded-3xl overflow-hidden glass-card p-8 min-h-[200px] flex items-center"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 w-full flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Welcome back, Strategist!
              </h1>
              <p className="text-muted-foreground text-lg">
                {liveCount > 0
                  ? <><span className="text-green-400 font-semibold">{liveCount} live</span> now · </>
                  : null}
                <span className="text-white font-semibold">{upcomingCount}</span> upcoming ·{" "}
                <span className="text-white font-semibold">{completedCount}</span> completed — IPL 2026.
              </p>

              <div className="mt-6 flex gap-4">
                <Link
                  href="/matches"
                  className="inline-flex items-center justify-center h-10 px-6 font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]"
                >
                  View Matches
                </Link>
                <Link
                  href="/auction"
                  className="inline-flex items-center justify-center h-10 px-6 font-medium bg-white/5 text-white border border-white/10 rounded-full hover:bg-white/10 transition-colors"
                >
                  Join Auction
                </Link>
              </div>
            </div>

            {/* Weekly points sparkline */}
            <div className="hidden md:block w-1/3 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0f1220", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                    itemStyle={{ color: "hsl(var(--primary))" }}
                    formatter={(v: number) => [`${v} pts`, "Points"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="points"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorPoints)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Upcoming Matches */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Upcoming Fixtures
            </h2>
            <Link href="/matches" className="text-sm text-primary hover:text-primary/80 flex items-center gap-1">
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loadingMatches ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-2xl bg-white/5" />
              ))
            ) : upcomingMatches.length === 0 ? (
              <div className="col-span-3 text-center py-10 text-muted-foreground text-sm">No upcoming matches found.</div>
            ) : (
              upcomingMatches.map((match) => {
                const c1 = TEAM_COLOR[match.homeTeam] ?? "hsl(var(--primary))";
                const c2 = TEAM_COLOR[match.awayTeam] ?? "hsl(var(--primary))";
                const logo1 = TEAM_LOGO[match.homeTeam];
                const logo2 = TEAM_LOGO[match.awayTeam];
                return (
                  <div
                    key={match.iplId}
                    className="glass-card rounded-2xl p-5 group hover:border-primary/50 transition-colors relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                    />

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                        M{match.matchNumber}
                      </span>
                      <span className="text-xs text-muted-foreground">{match.matchDate} • {match.matchTime}</span>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                      <div className="flex flex-col items-center gap-2 w-5/12">
                        {logo1
                          ? <img src={logo1} alt={match.homeTeam} className="w-12 h-12 object-contain" />
                          : <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: `${c1}22`, border: `1.5px solid ${c1}50`, color: c1 }}>{match.homeTeam}</div>
                        }
                        <span className="text-xs font-semibold text-center" style={{ color: c1 }}>{match.homeTeam}</span>
                        <span className="text-xs text-muted-foreground text-center leading-tight">{TEAM_FULL_NAME[match.homeTeam] ?? match.homeTeamFull}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center w-2/12">
                        <span className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded-md font-bold">VS</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 w-5/12">
                        {logo2
                          ? <img src={logo2} alt={match.awayTeam} className="w-12 h-12 object-contain" />
                          : <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg" style={{ background: `${c2}22`, border: `1.5px solid ${c2}50`, color: c2 }}>{match.awayTeam}</div>
                        }
                        <span className="text-xs font-semibold text-center" style={{ color: c2 }}>{match.awayTeam}</span>
                        <span className="text-xs text-muted-foreground text-center leading-tight">{TEAM_FULL_NAME[match.awayTeam] ?? match.awayTeamFull}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/5 flex items-center gap-1 text-xs text-muted-foreground">
                      <span className="truncate">{match.venue}{match.city ? `, ${match.city}` : ""}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-blue-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tabular-nums">
                {loadingMatches ? "—" : upcomingCount}
              </div>
              <div className="text-xs text-muted-foreground">Upcoming</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
              <Swords className="w-5 h-5 text-green-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tabular-nums">
                {loadingMatches ? "—" : liveCount > 0
                  ? <span className="text-green-400">{liveCount}</span>
                  : 0}
              </div>
              <div className="text-xs text-muted-foreground">Live Now</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-purple-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tabular-nums">
                {loadingMatches ? "—" : completedCount}
              </div>
              <div className="text-xs text-muted-foreground">Completed</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
              <Star className="w-5 h-5 text-orange-400" />
            </div>
            <div className="min-w-0">
              <div className="text-2xl font-bold tabular-nums">
                {loadingMatches ? "—" : totalCount}
              </div>
              <div className="text-xs text-muted-foreground">Total Matches</div>
            </div>
          </div>
        </motion.div>

        {/* Differential Picks */}
        <motion.div variants={itemVariants} className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Differential Picks This Week
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {DIFFERENTIALS.map((p) => {
              const color = TEAM_COLOR[p.team] ?? "#818cf8";
              return (
                <div
                  key={p.name}
                  className="glass-card rounded-2xl p-4 flex items-center gap-4"
                  style={{ borderLeft: `3px solid ${color}` }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                    style={{ background: `${color}20`, color }}
                  >
                    {p.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-sm truncate">{p.name}</p>
                    <p className="text-xs" style={{ color }}>{p.team} · {p.role}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-cyan-400 font-bold text-sm">{p.pts} pts</p>
                    <p className="text-slate-500 text-xs">{p.sel} sel.</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
