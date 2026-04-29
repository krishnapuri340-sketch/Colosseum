import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { Plus, Users, Star, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { TEAM_COLOR } from "@/lib/ipl-constants";

const mockTeams = [
  {
    id: 1,
    name: "Bumrah Leads",
    match: "MI vs RCB — Wankhede Stadium",
    captain: "Jasprit Bumrah",
    viceCaptain: "Rohit Sharma",
    players: 11,
    credits: 99.0,
    points: 487,
    status: "live",
    teams: ["MI", "RCB"],
  },
  {
    id: 2,
    name: "Gill Power",
    match: "GT vs CSK — Narendra Modi Stadium",
    captain: "Shubman Gill",
    viceCaptain: "Rashid Khan",
    players: 11,
    credits: 98.5,
    points: null,
    status: "upcoming",
    teams: ["GT", "CSK"],
  },
  {
    id: 3,
    name: "Pant Effect",
    match: "LSG vs KKR — BRSABV Ekana Stadium",
    captain: "Rishabh Pant",
    viceCaptain: "Andre Russell",
    players: 11,
    credits: 97.5,
    points: 412,
    status: "completed",
    teams: ["LSG", "KKR"],
  },
];

const statusStyle = (status: string) => {
  if (status === "live")      return "bg-green-500/20 text-green-400 border-green-500/30";
  if (status === "upcoming")  return "bg-blue-500/20 text-blue-400 border-blue-500/30";
  return "bg-slate-500/20 text-slate-400 border-slate-500/30";
};

export default function MyTeams() {
  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Teams</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your IPL 2026 fantasy teams</p>
          </div>
          <button
            data-testid="button-create-team"
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <Plus size={16} />
            Create Team
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Teams Created",  value: mockTeams.length.toString(), color: "text-white" },
            { label: "Avg Points",     value: "450",                       color: "text-cyan-400" },
            { label: "Best Rank",      value: "#2",                        color: "text-yellow-400" },
          ].map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Teams List */}
        <div className="space-y-3">
          {mockTeams.map((team, i) => {
            const c1 = TEAM_COLOR[team.teams[0]] ?? "#818cf8";
            const c2 = TEAM_COLOR[team.teams[1]] ?? "#818cf8";
            return (
              <motion.div
                key={team.id}
                data-testid={`card-team-${team.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                style={{ borderLeft: `3px solid ${c1}` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    {/* Team colour pair indicator */}
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${c1}30, ${c2}20)`, border: `1px solid ${c1}30` }}
                    >
                      <Users size={20} style={{ color: c1 }} />
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold">{team.name}</h3>
                        <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${statusStyle(team.status)}`}>
                          {team.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{team.match}</p>

                      {/* Captain / VC */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">C</span>
                          <div className="w-5 h-5 rounded-full bg-yellow-400/20 border border-yellow-400/30 flex items-center justify-center">
                            <Star size={10} className="text-yellow-400 fill-yellow-400" />
                          </div>
                          <span className="text-xs text-white font-medium">{team.captain}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs text-slate-500">VC</span>
                          <div className="w-5 h-5 rounded-full bg-slate-400/10 border border-slate-400/20 flex items-center justify-center">
                            <Star size={10} className="text-slate-400" />
                          </div>
                          <span className="text-xs text-white font-medium">{team.viceCaptain}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Points + Actions */}
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      {team.points !== null ? (
                        <>
                          <p className="text-2xl font-bold text-cyan-400">{team.points}</p>
                          <p className="text-xs text-slate-500">Points</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Match pending</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        data-testid={`button-edit-team-${team.id}`}
                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 hover:border-primary/30 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        data-testid={`button-delete-team-${team.id}`}
                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/30 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        data-testid={`button-view-team-${team.id}`}
                        className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bottom Stats */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Users size={11} />
                    <span>{team.players} players</span>
                  </div>
                  <div className="text-xs text-slate-500">
                    <span className="text-slate-300">{team.credits}</span>/100 credits used
                  </div>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${team.credits}%`,
                        background: `linear-gradient(90deg, ${c1}, ${c2})`,
                      }}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty state hint */}
        <div className="text-center py-6 border border-dashed border-white/10 rounded-2xl">
          <Plus size={24} className="text-slate-600 mx-auto mb-2" />
          <p className="text-slate-500 text-sm">Create more teams to join more contests</p>
          <button
            data-testid="button-create-team-empty"
            className="mt-3 text-primary text-sm font-medium hover:underline"
          >
            Create new team
          </button>
        </div>
      </motion.div>
    </Layout>
  );
}
