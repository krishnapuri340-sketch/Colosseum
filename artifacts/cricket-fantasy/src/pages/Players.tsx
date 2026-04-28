import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Search, Filter, Star, TrendingUp, Shield, Zap } from "lucide-react";

const roles = ["All", "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"];

const mockPlayers = [
  { id: 1, name: "Virat Kohli", team: "IND", teamFull: "India", role: "Batsman", credits: 10.5, points: 542, sel: 87.3, form: ["A","A","A","B","B"] },
  { id: 2, name: "Rohit Sharma", team: "IND", teamFull: "India", role: "Batsman", credits: 10.0, points: 498, sel: 72.1, form: ["A","A","B","A","B"] },
  { id: 3, name: "Babar Azam", team: "PAK", teamFull: "Pakistan", role: "Batsman", credits: 10.0, points: 534, sel: 83.7, form: ["A","A","A","A","B"] },
  { id: 4, name: "Jasprit Bumrah", team: "IND", teamFull: "India", role: "Bowler", credits: 9.5, points: 478, sel: 65.4, form: ["A","A","B","B","A"] },
  { id: 5, name: "Pat Cummins", team: "AUS", teamFull: "Australia", role: "Bowler", credits: 9.5, points: 467, sel: 63.8, form: ["A","A","B","B","A"] },
  { id: 6, name: "Hardik Pandya", team: "IND", teamFull: "India", role: "All-Rounder", credits: 9.0, points: 412, sel: 58.7, form: ["A","A","B","B","B"] },
  { id: 7, name: "Ben Stokes", team: "ENG", teamFull: "England", role: "All-Rounder", credits: 9.5, points: 487, sel: 71.2, form: ["A","A","A","B","B"] },
  { id: 8, name: "Rishabh Pant", team: "IND", teamFull: "India", role: "Wicket-Keeper", credits: 8.5, points: 389, sel: 51.2, form: ["B","A","B","A","A"] },
  { id: 9, name: "Steve Smith", team: "AUS", teamFull: "Australia", role: "Batsman", credits: 10.0, points: 521, sel: 82.4, form: ["A","A","A","B","A"] },
  { id: 10, name: "Kane Williamson", team: "NZ", teamFull: "New Zealand", role: "Batsman", credits: 9.5, points: 489, sel: 68.4, form: ["A","A","B","A","B"] },
  { id: 11, name: "Glenn Maxwell", team: "AUS", teamFull: "Australia", role: "All-Rounder", credits: 8.5, points: 376, sel: 47.9, form: ["B","A","B","B","A"] },
  { id: 12, name: "Shaheen Afridi", team: "PAK", teamFull: "Pakistan", role: "Bowler", credits: 9.5, points: 456, sel: 62.3, form: ["A","A","B","B","A"] },
];

const roleIcon = (role: string) => {
  if (role === "Batsman") return <TrendingUp size={12} />;
  if (role === "Bowler") return <Zap size={12} />;
  if (role === "Wicket-Keeper") return <Shield size={12} />;
  return <Star size={12} />;
};

const roleColor = (role: string) => {
  if (role === "Batsman") return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  if (role === "Bowler") return "text-red-400 bg-red-400/10 border-red-400/20";
  if (role === "Wicket-Keeper") return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return "text-green-400 bg-green-400/10 border-green-400/20";
};

const formColor = (f: string) => f === "A" ? "bg-green-500" : "bg-slate-600";

export default function Players() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Players</h1>
            <p className="text-sm text-slate-400 mt-1">Browse and compare cricket players</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-64">
              <Search size={14} className="text-slate-400" />
              <input
                data-testid="input-player-search"
                type="search"
                placeholder="Search players..."
                className="bg-transparent text-sm text-white placeholder:text-slate-500 outline-none w-full"
              />
            </div>
            <button
              data-testid="button-filter"
              className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/10 transition-colors"
            >
              <Filter size={14} />
              Filter
            </button>
          </div>
        </div>

        {/* Role Tabs */}
        <div className="flex gap-2 flex-wrap">
          {roles.map((role, i) => (
            <button
              key={role}
              data-testid={`tab-role-${role.toLowerCase()}`}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                i === 0
                  ? "bg-primary text-white"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {mockPlayers.map((player, i) => (
            <motion.div
              key={player.id}
              data-testid={`card-player-${player.id}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group"
            >
              {/* Avatar + Name */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/40 to-cyan-500/20 flex items-center justify-center text-white font-bold text-sm border border-white/10">
                    {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-tight">{player.name}</p>
                    <p className="text-slate-500 text-xs">{player.team} · {player.teamFull}</p>
                  </div>
                </div>
                <button
                  data-testid={`button-add-player-${player.id}`}
                  className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/40 text-xs font-bold"
                >
                  +
                </button>
              </div>

              {/* Role Badge */}
              <div className="mb-3">
                <span className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-xs font-medium ${roleColor(player.role)}`}>
                  {roleIcon(player.role)}
                  {player.role}
                </span>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="text-center">
                  <p className="text-white font-bold text-sm">{player.credits}</p>
                  <p className="text-slate-500 text-xs">Credits</p>
                </div>
                <div className="text-center">
                  <p className="text-cyan-400 font-bold text-sm">{player.points}</p>
                  <p className="text-slate-500 text-xs">Points</p>
                </div>
                <div className="text-center">
                  <p className="text-slate-300 font-bold text-sm">{player.sel}%</p>
                  <p className="text-slate-500 text-xs">Selected</p>
                </div>
              </div>

              {/* Form */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 text-xs">Form</span>
                <div className="flex gap-1">
                  {player.form.map((f, fi) => (
                    <div key={fi} className={`w-4 h-1.5 rounded-full ${formColor(f)}`} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </Layout>
  );
}
