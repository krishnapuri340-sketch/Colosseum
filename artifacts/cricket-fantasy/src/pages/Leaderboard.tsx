import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Trophy, Medal, TrendingUp, Users } from "lucide-react";

const mockLeaderboard = [
  { rank: 1, username: "CricketKing99", points: 8542, winnings: 125000, teams: 48 },
  { rank: 2, username: "FantasyMaster", points: 7891, winnings: 98000, teams: 42 },
  { rank: 3, username: "SixHitter", points: 7234, winnings: 75000, teams: 37 },
  { rank: 4, username: "PitchPerfect", points: 6987, winnings: 62000, teams: 35 },
  { rank: 5, username: "WicketWizard", points: 6543, winnings: 48000, teams: 31 },
  { rank: 6, username: "BoundaryBlaster", points: 6012, winnings: 35000, teams: 28 },
  { rank: 7, username: "SpinMaster", points: 5834, winnings: 27500, teams: 25 },
  { rank: 8, username: "PowerPlay", points: 5421, winnings: 21000, teams: 22 },
  { rank: 9, username: "LegBreak", points: 4987, winnings: 15000, teams: 19 },
  { rank: 10, username: "SlipCordons", points: 4512, winnings: 10000, teams: 16 },
];

const rankStyle = (rank: number) => {
  if (rank === 1) return "text-yellow-400";
  if (rank === 2) return "text-slate-300";
  if (rank === 3) return "text-amber-600";
  return "text-slate-500";
};

const rankBg = (rank: number) => {
  if (rank === 1) return "bg-yellow-400/10 border-yellow-400/20";
  if (rank === 2) return "bg-slate-300/10 border-slate-300/20";
  if (rank === 3) return "bg-amber-600/10 border-amber-600/20";
  return "bg-white/[0.03] border-white/10";
};

export default function Leaderboard() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
          <p className="text-sm text-slate-400 mt-1">Global fantasy cricket rankings</p>
        </div>

        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-4">
          {mockLeaderboard.slice(0, 3).map((entry, i) => {
            const order = i === 0 ? 1 : i === 1 ? 0 : 2;
            const heights = ["h-32", "h-28", "h-24"];
            return (
              <motion.div
                key={entry.rank}
                data-testid={`card-podium-${entry.rank}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: order * 0.1 }}
                style={{ order }}
                className={`flex flex-col items-center justify-end rounded-2xl border p-4 ${rankBg(entry.rank)} ${heights[order]}`}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-cyan-500/20 flex items-center justify-center text-white font-bold text-sm border border-white/10 mb-2">
                  {entry.username.slice(0, 2).toUpperCase()}
                </div>
                <p className="text-white font-semibold text-sm text-center leading-tight">{entry.username}</p>
                <p className={`text-xs font-bold mt-0.5 ${rankStyle(entry.rank)}`}>{entry.points.toLocaleString()} pts</p>
                {entry.rank <= 3 && (
                  <Medal size={16} className={`mt-1 ${rankStyle(entry.rank)}`} />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Full Table */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-white/10 text-xs text-slate-500 font-medium uppercase tracking-wider">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5">Player</div>
            <div className="col-span-2 text-right">Points</div>
            <div className="col-span-2 text-right">Winnings</div>
            <div className="col-span-2 text-right">Teams</div>
          </div>

          {/* Rows */}
          {mockLeaderboard.map((entry, i) => (
            <motion.div
              key={entry.rank}
              data-testid={`row-leaderboard-${entry.rank}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 last:border-0 hover:bg-white/[0.04] transition-colors ${
                entry.rank <= 3 ? "bg-white/[0.02]" : ""
              }`}
            >
              <div className="col-span-1">
                <span className={`text-lg font-bold ${rankStyle(entry.rank)}`}>
                  {entry.rank <= 3 ? (
                    <Trophy size={16} className={rankStyle(entry.rank)} />
                  ) : (
                    `#${entry.rank}`
                  )}
                </span>
              </div>

              <div className="col-span-5 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-cyan-500/10 flex items-center justify-center text-white text-xs font-bold border border-white/10 shrink-0">
                  {entry.username.slice(0, 2).toUpperCase()}
                </div>
                <span className="text-white font-medium text-sm">{entry.username}</span>
              </div>

              <div className="col-span-2 text-right">
                <span className="text-cyan-400 font-semibold text-sm">{entry.points.toLocaleString()}</span>
              </div>

              <div className="col-span-2 text-right">
                <span className="text-green-400 font-semibold text-sm">
                  ₹{entry.winnings.toLocaleString()}
                </span>
              </div>

              <div className="col-span-2 text-right flex items-center justify-end gap-1 text-slate-400 text-sm">
                <Users size={12} />
                {entry.teams}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Players", value: "1,24,892", icon: <Users size={16} className="text-primary" /> },
            { label: "Prize Distributed", value: "₹4.8Cr", icon: <Trophy size={16} className="text-yellow-400" /> },
            { label: "Avg Points", value: "3,210", icon: <TrendingUp size={16} className="text-green-400" /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center">
                {stat.icon}
              </div>
              <div>
                <p className="text-white font-bold text-lg">{stat.value}</p>
                <p className="text-slate-500 text-xs">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
