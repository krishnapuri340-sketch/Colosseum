import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter, TrendingUp, Zap, Shield, Star } from "lucide-react";
import { IPL_2026_PLAYERS, TEAM_COLOR, ROLE_LABEL, ROLE_COLOR, ROLE_ICON } from "@/lib/ipl-constants";

const ROLES = ["All", "BAT", "BWL", "AR", "WK"];
const ROLE_DISPLAY: Record<string, string> = { All: "All", BAT: "Batsman", BWL: "Bowler", AR: "All-Rounder", WK: "Wicket-Keeper" };

const roleIcon = (role: string) => {
  if (role === "BAT") return <TrendingUp size={12} />;
  if (role === "BWL") return <Zap size={12} />;
  if (role === "WK")  return <Shield size={12} />;
  return <Star size={12} />;
};

const roleColor = (role: string) => {
  if (role === "BAT") return "text-blue-400 bg-blue-400/10 border-blue-400/20";
  if (role === "BWL") return "text-pink-400 bg-pink-400/10 border-pink-400/20";
  if (role === "WK")  return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
  return "text-green-400 bg-green-400/10 border-green-400/20";
};

// Deterministic form based on player name hash
function getForm(name: string): string[] {
  const seed = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return Array.from({ length: 5 }, (_, i) => ((seed + i * 7) % 3 === 0 ? "B" : "A"));
}

// Rough points estimate from credits
function estimatePoints(credits: number): number {
  return Math.round(credits * 47 + (credits > 10 ? 80 : 20));
}

// Selection % estimate
function estimateSel(credits: number, role: string): number {
  const base = role === "BAT" ? 72 : role === "AR" ? 61 : role === "WK" ? 54 : 58;
  return Math.min(95, Math.round(base + (credits - 8) * 4.5));
}

const formColor = (f: string) => f === "A" ? "bg-green-500" : "bg-slate-600";

export default function Players() {
  const [search, setSearch] = useState("");
  const [activeRole, setActiveRole] = useState("All");

  const filtered = IPL_2026_PLAYERS.filter(p => {
    const matchRole = activeRole === "All" || p.role === activeRole;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.team.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

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
            <p className="text-sm text-slate-400 mt-1">
              IPL 2026 player pool — {filtered.length} of {IPL_2026_PLAYERS.length} players
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-2 w-64">
              <Search size={14} className="text-slate-400" />
              <input
                data-testid="input-player-search"
                type="search"
                placeholder="Search players or teams..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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
          {ROLES.map((role) => (
            <button
              key={role}
              data-testid={`tab-role-${role.toLowerCase()}`}
              onClick={() => setActiveRole(role)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeRole === role
                  ? "bg-primary text-white"
                  : "bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {ROLE_DISPLAY[role]} {role !== "All" && `(${IPL_2026_PLAYERS.filter(p => p.role === role).length})`}
            </button>
          ))}
        </div>

        {/* Players Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((player, i) => {
            const teamColor = TEAM_COLOR[player.team] ?? "#818cf8";
            const form = getForm(player.name);
            const points = estimatePoints(player.credits);
            const sel = estimateSel(player.credits, player.role);

            return (
              <motion.div
                key={player.name}
                data-testid={`card-player-${i + 1}`}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group"
                style={{ borderTop: `2px solid ${teamColor}30` }}
              >
                {/* Avatar + Name */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border"
                      style={{ background: `${teamColor}20`, borderColor: `${teamColor}40` }}
                    >
                      {player.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm leading-tight">{player.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: teamColor }}>
                        {player.team}
                      </p>
                    </div>
                  </div>
                  <button
                    data-testid={`button-add-player-${i + 1}`}
                    className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-opacity hover:bg-primary/40 text-xs font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Role Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center gap-1 border rounded-full px-2 py-0.5 text-xs font-medium ${roleColor(player.role)}`}>
                    {roleIcon(player.role)}
                    {ROLE_LABEL[player.role] ?? player.role}
                  </span>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="text-center">
                    <p className="text-white font-bold text-sm">{player.credits}</p>
                    <p className="text-slate-500 text-xs">Credits</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-sm" style={{ color: teamColor }}>{points}</p>
                    <p className="text-slate-500 text-xs">Est. Pts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-slate-300 font-bold text-sm">{sel}%</p>
                    <p className="text-slate-500 text-xs">Selected</p>
                  </div>
                </div>

                {/* Form */}
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-xs">Form</span>
                  <div className="flex gap-1">
                    {form.map((f, fi) => (
                      <div key={fi} className={`w-4 h-1.5 rounded-full ${formColor(f)}`} />
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg font-semibold">No players found</p>
            <p className="text-sm mt-1">Try a different search or role filter</p>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
