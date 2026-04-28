import { Layout } from "@/components/layout/Layout";
import { useListMatches, getListMatchesQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, MapPin, Swords } from "lucide-react";

export default function Matches() {
  const { data: matches, isLoading } = useListMatches(
    {},
    { query: { queryKey: getListMatchesQueryKey({}) } }
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const MatchCard = ({ match }: { match: any }) => {
    const isLive = match.status === 'live';
    const isUpcoming = match.status === 'upcoming';
    
    return (
      <motion.div variants={itemVariants} className="glass-card rounded-2xl overflow-hidden group hover:border-primary/40 cursor-pointer">
        <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-white">
              {match.matchType}
            </span>
            <span className={`text-xs font-bold px-2 py-1 rounded ${
              isLive ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' : 
              isUpcoming ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
              'bg-white/10 text-muted-foreground'
            }`}>
              {match.status.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(new Date(match.scheduledAt), 'MMM dd, yyyy - HH:mm')}
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground/30 hidden md:block">
              <Swords className="w-12 h-12" />
            </div>

            <div className="flex items-center gap-4 w-2/5">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center font-bold text-xl md:text-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10">
                {match.team1Code}
              </div>
              <div>
                <div className="font-bold text-lg md:text-xl truncate max-w-[150px]">{match.team1}</div>
                {match.team1Score && (
                  <div className="font-mono text-primary font-medium">{match.team1Score}</div>
                )}
              </div>
            </div>

            <div className="text-center font-mono text-lg font-bold bg-background/50 px-3 py-1 rounded-lg border border-white/5 z-10">
              VS
            </div>

            <div className="flex items-center justify-end gap-4 w-2/5 text-right">
              <div>
                <div className="font-bold text-lg md:text-xl truncate max-w-[150px]">{match.team2}</div>
                {match.team2Score && (
                  <div className="font-mono text-primary font-medium">{match.team2Score}</div>
                )}
              </div>
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-bl from-white/10 to-white/5 flex items-center justify-center font-bold text-xl md:text-2xl shadow-[inset_0_0_20px_rgba(255,255,255,0.05)] border border-white/10">
                {match.team2Code}
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-background/30 flex justify-between items-center text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            {match.venue}
          </div>
          <div className="font-medium text-primary">
            {match.contestCount} Contests
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Match Center</h1>
          <p className="text-muted-foreground">Browse all live, upcoming, and completed matches.</p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
            <TabsTrigger value="all" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All Matches</TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Live</TabsTrigger>
            <TabsTrigger value="upcoming" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Upcoming</TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Completed</TabsTrigger>
          </TabsList>

          {['all', 'live', 'upcoming', 'completed'].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-0 outline-none">
              {isLoading ? (
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
                  {matches
                    ?.filter(m => tab === 'all' || m.status === tab)
                    .map(match => (
                      <MatchCard key={match.id} match={match} />
                    ))
                  }
                  
                  {matches?.filter(m => tab === 'all' || m.status === tab).length === 0 && (
                    <div className="text-center py-20 glass-card rounded-2xl">
                      <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold mb-2">No Matches Found</h3>
                      <p className="text-muted-foreground">There are no {tab !== 'all' ? tab : ''} matches at the moment.</p>
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
