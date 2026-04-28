import { Layout } from "@/components/layout/Layout";
import { useListMatches, useGetDashboardSummary, getListMatchesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowRight, Swords, Trophy, Users, Star, Flame, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { TEAM_COLOR } from "@/lib/ipl-constants";

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
  const { data: matches, isLoading: loadingMatches } = useListMatches(
    { status: "upcoming" },
    { query: { queryKey: getListMatchesQueryKey({ status: "upcoming" }) } }
  );

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() },
  });

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
                You have{" "}
                <span className="text-white font-semibold">{summary?.liveMatches ?? 0}</span>{" "}
                live match{(summary?.liveMatches ?? 0) !== 1 ? "es" : ""} and{" "}
                <span className="text-white font-semibold">{summary?.upcomingMatches ?? 0}</span>{" "}
                upcoming — IPL 2026.
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
            ) : (
              matches?.slice(0, 3).map((match) => {
                const c1 = TEAM_COLOR[match.team1Code ?? ""] ?? "hsl(var(--primary))";
                const c2 = TEAM_COLOR[match.team2Code ?? ""] ?? "hsl(var(--primary))";
                return (
                  <div
                    key={match.id}
                    className="glass-card rounded-2xl p-5 group hover:border-primary/50 transition-colors relative overflow-hidden"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(90deg, ${c1}, ${c2})` }}
                    />

                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                        {match.matchType}
                      </span>
                      <span className="text-xs text-muted-foreground">{match.venue?.split(",")[0]}</span>
                    </div>

                    <div className="flex justify-between items-center mb-6">
                      <div className="flex flex-col items-center gap-2 w-1/3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner"
                          style={{ background: `${c1}22`, border: `1.5px solid ${c1}50`, color: c1 }}
                        >
                          {match.team1Code}
                        </div>
                        <span className="text-sm font-medium text-center truncate w-full">{match.team1}</span>
                      </div>

                      <div className="flex flex-col items-center justify-center w-1/3">
                        <span className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded-md">VS</span>
                      </div>

                      <div className="flex flex-col items-center gap-2 w-1/3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-inner"
                          style={{ background: `${c2}22`, border: `1.5px solid ${c2}50`, color: c2 }}
                        >
                          {match.team2Code}
                        </div>
                        <span className="text-sm font-medium text-center truncate w-full">{match.team2}</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm">
                      <span className="text-muted-foreground truncate max-w-[60%]">{match.venue}</span>
                      <span className="font-medium text-white font-mono">
                        {format(new Date(match.scheduledAt), "MMM dd, HH:mm")}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.upcomingMatches ?? 0}</div>
              <div className="text-sm text-muted-foreground">Upcoming Matches</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Swords className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.liveMatches ?? 0}</div>
              <div className="text-sm text-muted-foreground">Live Now</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.teamsCreated ?? 0}</div>
              <div className="text-sm text-muted-foreground">Teams Created</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.totalPoints ?? 0}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
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
