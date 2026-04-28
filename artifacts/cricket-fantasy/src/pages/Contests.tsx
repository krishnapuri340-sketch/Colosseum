import { Layout } from "@/components/layout/Layout";
import { useListContests, getListContestsQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Trophy, Users, Zap, IndianRupee } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Contests() {
  const { data: contests, isLoading } = useListContests(
    {},
    { query: { queryKey: getListContestsQueryKey({}) } }
  );

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  };

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'mega': return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
      case 'head-to-head': return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
      case 'small': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
      default: return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contests</h1>
            <p className="text-muted-foreground">Join contests, build your strategy, win big.</p>
          </div>
          
          <div className="flex gap-2">
            {['All', 'Mega', 'H2H', 'Small'].map((filter) => (
              <button key={filter} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'All' ? 'bg-primary text-primary-foreground' : 'bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white border border-white/10'}`}>
                {filter}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 w-full rounded-2xl bg-white/5" />)}
          </div>
        ) : (
          <motion.div 
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {contests?.map((contest) => {
              const fillPercentage = (contest.filledSpots / contest.totalSpots) * 100;
              
              return (
                <motion.div key={contest.id} variants={itemVariants} className="glass-card rounded-2xl overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
                    <div className="text-sm font-medium text-muted-foreground truncate max-w-[60%]">
                      {contest.matchName}
                    </div>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${getTypeColor(contest.type)}`}>
                      {contest.type.toUpperCase()}
                    </span>
                  </div>

                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Prize Pool</div>
                        <div className="text-3xl font-bold text-white flex items-center gap-1">
                          <IndianRupee className="w-6 h-6 text-primary" />
                          {contest.prizePool.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Entry Fee</div>
                        <button className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-xl font-bold shadow-[0_0_15px_-3px_rgba(34,197,94,0.4)] transition-all transform hover:scale-105 active:scale-95">
                          ₹{contest.entryFee}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400 font-medium">{contest.totalSpots - contest.filledSpots} spots left</span>
                        <span className="text-muted-foreground">{contest.totalSpots} spots</span>
                      </div>
                      <Progress value={fillPercentage} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-orange-500 to-red-500" />
                    </div>
                  </div>

                  <div className="px-6 py-4 bg-background/40 border-t border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-white">₹{contest.firstPrize.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        Up to 20 teams
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-primary text-sm font-medium">
                      <Zap className="w-4 h-4" />
                      Guaranteed
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </Layout>
  );
}
