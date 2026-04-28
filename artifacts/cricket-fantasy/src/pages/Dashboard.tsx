import { Layout } from "@/components/layout/Layout";
import { useListMatches, useGetDashboardSummary, getListMatchesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { ArrowRight, Swords, Trophy, Users, Star, Flame } from "lucide-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { ResponsiveContainer, AreaChart, Area, XAxis, Tooltip } from "recharts";

const chartData = [
  { day: 'Mon', points: 120 },
  { day: 'Tue', points: 210 },
  { day: 'Wed', points: 180 },
  { day: 'Thu', points: 320 },
  { day: 'Fri', points: 450 },
  { day: 'Sat', points: 390 },
  { day: 'Sun', points: 520 },
];

export default function Dashboard() {
  const { data: matches, isLoading: loadingMatches } = useListMatches(
    { status: 'upcoming' },
    { query: { queryKey: getListMatchesQueryKey({ status: 'upcoming' }) } }
  );

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
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
        <motion.div variants={itemVariants} className="relative rounded-3xl overflow-hidden glass-card p-8 min-h-[200px] flex items-center">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-transparent pointer-events-none" />
          
          <div className="relative z-10 w-full flex justify-between items-center">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome back, Strategist!</h1>
              <p className="text-muted-foreground text-lg">You have {summary?.liveMatches || 0} live matches and {summary?.upcomingMatches || 0} upcoming.</p>
              
              <div className="mt-6 flex gap-4">
                <Link href="/matches" className="inline-flex items-center justify-center h-10 px-6 font-medium bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition-colors shadow-[0_0_20px_-5px_rgba(6,182,212,0.5)]">
                  View Matches
                </Link>
                <Link href="/my-teams" className="inline-flex items-center justify-center h-10 px-6 font-medium bg-white/5 text-white border border-white/10 rounded-full hover:bg-white/10 transition-colors">
                  Create Team
                </Link>
              </div>
            </div>

            <div className="hidden md:block w-1/3 h-[120px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="points" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPoints)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        {/* Highlight Matches */}
        <motion.div variants={itemVariants} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Hot Upcoming Matches
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
            ) : matches?.slice(0, 3).map((match) => (
              <div key={match.id} className="glass-card rounded-2xl p-5 group hover:border-primary/50 transition-colors relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="flex justify-between items-center mb-4">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/20">
                    {match.matchType}
                  </span>
                  <span className="text-xs text-muted-foreground">{match.venue?.split(",")[0]}</span>
                </div>

                <div className="flex justify-between items-center mb-6">
                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg shadow-inner">
                      {match.team1Code}
                    </div>
                    <span className="text-sm font-medium text-center truncate w-full">{match.team1}</span>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-1/3">
                    <span className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded-md">VS</span>
                  </div>

                  <div className="flex flex-col items-center gap-2 w-1/3">
                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg shadow-inner">
                      {match.team2Code}
                    </div>
                    <span className="text-sm font-medium text-center truncate w-full">{match.team2}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground truncate max-w-[60%]">{match.venue}</span>
                  <span className="font-medium text-white font-mono">{format(new Date(match.scheduledAt), 'MMM dd, HH:mm')}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.upcomingMatches || 0}</div>
              <div className="text-sm text-muted-foreground">Upcoming Matches</div>
            </div>
          </div>
          
          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
              <Swords className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.liveMatches || 0}</div>
              <div className="text-sm text-muted-foreground">Live Matches</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.teamsCreated || 0}</div>
              <div className="text-sm text-muted-foreground">Teams Created</div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <Star className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <div className="text-2xl font-bold">{summary?.totalPoints || 0}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}
