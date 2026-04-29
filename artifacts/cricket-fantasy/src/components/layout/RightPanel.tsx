import { 
  useGetDashboardActivity, 
  useGetTopPlayers,
  useGetDashboardSummary,
  getGetDashboardActivityQueryKey,
  getGetTopPlayersQueryKey,
  getGetDashboardSummaryQueryKey
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Trophy, TrendingUp, Users } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { TEAM_LOGO } from "@/lib/ipl-constants";

export function RightPanel() {
  const { data: activity, isLoading: loadingActivity } = useGetDashboardActivity({
    query: { queryKey: getGetDashboardActivityQueryKey() }
  });
  
  const { data: topPlayers, isLoading: loadingPlayers } = useGetTopPlayers({
    query: { queryKey: getGetTopPlayersQueryKey() }
  });

  const { data: summary, isLoading: loadingSummary } = useGetDashboardSummary({
    query: { queryKey: getGetDashboardSummaryQueryKey() }
  });

  return (
    <aside className="hidden xl:flex w-80 h-screen fixed right-0 top-0 border-l border-white/5 bg-background/50 backdrop-blur-xl flex-col z-40">
      <div className="p-6 border-b border-white/5 h-20 flex items-center">
        <h2 className="font-semibold text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Live Pulse
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
        {/* Quick Stats */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Performance</h3>
          
          {loadingSummary ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
              <Skeleton className="h-16 w-full rounded-xl bg-white/5" />
            </div>
          ) : summary ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card p-4 rounded-xl flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Global Rank</span>
                <span className="text-2xl font-bold text-white">#{summary.rank}</span>
              </div>
              <div className="glass-card p-4 rounded-xl flex flex-col">
                <span className="text-xs text-muted-foreground mb-1">Winnings</span>
                <span className="text-2xl font-bold text-green-400">₹{summary.totalWinnings}</span>
              </div>
              <div className="glass-card p-4 rounded-xl flex flex-col col-span-2">
                <span className="text-xs text-muted-foreground mb-1">Total Points</span>
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span className="text-xl font-bold text-white">{summary.totalPoints}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Top Players */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Top Performers
            </h3>
          </div>
          
          <div className="space-y-3">
            {loadingPlayers ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl bg-white/5" />
              ))
            ) : topPlayers?.map((player) => (
              <div key={player.id} className="glass-card p-3 rounded-xl flex items-center gap-3 group cursor-pointer hover:bg-white/5">
                <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/5 group-hover:border-primary/50 transition-colors">
                  {player.avatar ? (
                    <img src={player.avatar} alt={player.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white/50">
                      {player.name.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{player.name}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    {TEAM_LOGO[player.teamCode] && (
                      <img src={TEAM_LOGO[player.teamCode]} alt={player.teamCode}
                        className="w-4 h-4 object-contain" />
                    )}
                    {player.teamCode} • {player.role}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-primary">{player.points}</div>
                  <div className="text-[10px] text-muted-foreground">pts</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Activity Feed</h3>
          
          <div className="relative border-l border-white/10 ml-3 space-y-6 pb-4">
            {loadingActivity ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="pl-6 relative">
                  <div className="absolute w-2.5 h-2.5 bg-white/20 rounded-full -left-[5.5px] top-1"></div>
                  <Skeleton className="h-4 w-3/4 bg-white/5 mb-2" />
                  <Skeleton className="h-3 w-1/2 bg-white/5" />
                </div>
              ))
            ) : activity?.map((item) => (
              <div key={item.id} className="pl-6 relative group">
                <div className="absolute w-2.5 h-2.5 bg-primary/50 rounded-full -left-[5.5px] top-1.5 ring-4 ring-background group-hover:bg-primary transition-colors"></div>
                <div className="text-sm font-medium text-white/90">{item.title}</div>
                <div className="text-xs text-muted-foreground mt-1">{item.description}</div>
                <div className="text-[10px] text-muted-foreground/70 mt-2 font-mono">
                  {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
