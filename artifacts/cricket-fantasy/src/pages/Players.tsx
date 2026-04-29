import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { ALL_IPL_2026_PLAYERS, getPlayerTier, TIER_CONFIG, type PlayerTier } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, ROLE_LABEL, ROLE_COLOR, ROLE_ICON, ALL_TEAMS, TEAM_FULL_NAME } from "@/lib/ipl-constants";

const TIERS: PlayerTier[] = ["T1","T2","T3","T4"];
const TIER_LABELS: Record<PlayerTier,string> = { T1:"👑 Marquee", T2:"⭐ Premium", T3:"🏏 Mid-Level", T4:"🌱 Rookie" };
const TIER_COLORS: Record<PlayerTier,string> = { T1:"#e8a020", T2:"#818cf8", T3:"#34d399", T4:"#94a3b8" };

type SortKey = "credits"|"name"|"team";

function estimatePoints(credits: number) {
  return Math.round(credits * 48 + (credits >= 10 ? 85 : credits >= 8 ? 30 : 10));
}
function estimateSel(credits: number, role: string) {
  const base = role==="BAT"?70:role==="AR"?60:role==="WK"?52:56;
  return Math.min(96, Math.round(base + (credits - 8) * 5));
}
function getForm(name: string) {
  const seed = name.split("").reduce((a,c) => a + c.charCodeAt(0), 0);
  return Array.from({ length:5 }, (_,i) => ((seed + i*7) % 3 === 0 ? "B" : "A"));
}

export default function Players() {
  const [search, setSearch]       = useState("");
  const [roleFilter, setRole]     = useState("ALL");
  const [teamFilter, setTeam]     = useState("ALL");
  const [tierFilter, setTier]     = useState<PlayerTier|"ALL">("ALL");
  const [sortBy, setSort]         = useState<SortKey>("credits");
  const [showFilters, setShowF]   = useState(false);
  const [capFilter, setCap]       = useState<"all"|"capped"|"uncapped">("all");

  const filtered = useMemo(() => {
    return ALL_IPL_2026_PLAYERS
      .filter(p => {
        if (roleFilter !== "ALL" && p.role !== roleFilter) return false;
        if (teamFilter !== "ALL" && p.team !== teamFilter) return false;
        if (tierFilter !== "ALL" && getPlayerTier(p.credits) !== tierFilter) return false;
        if (capFilter === "capped"   && !p.capped)  return false;
        if (capFilter === "uncapped" &&  p.capped)  return false;
        if (search) {
          const q = search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a,b) => {
        if (sortBy === "credits") return b.credits - a.credits;
        if (sortBy === "name")    return a.name.localeCompare(b.name);
        return a.team.localeCompare(b.team);
      });
  }, [search, roleFilter, teamFilter, tierFilter, sortBy, capFilter]);

  const activeFilters = [
    roleFilter !== "ALL" && `Role: ${roleFilter}`,
    teamFilter !== "ALL" && `Team: ${teamFilter}`,
    tierFilter !== "ALL" && TIER_LABELS[tierFilter],
    capFilter  !== "all"  && capFilter,
  ].filter(Boolean);

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
        className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Players</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {filtered.length} of {ALL_IPL_2026_PLAYERS.length} · IPL 2026 official squads
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search name or team…"
                className="w-full pl-9 pr-3 py-2 text-sm text-white rounded-xl outline-none"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }} />
            </div>
            {/* Filter toggle */}
            <button onClick={() => setShowF(v=>!v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: showFilters ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${showFilters ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.09)"}`,
                color: showFilters ? "#818cf8" : "rgba(255,255,255,0.5)" }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilters.length > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background:"#818cf8", color:"#fff" }}>{activeFilters.length}</span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
            className="rounded-2xl p-4 space-y-4"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Role */}
              <div>
                <div className="text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Role</div>
                <div className="flex flex-wrap gap-1.5">
                  {["ALL","BAT","BWL","AR","WK"].map(r => (
                    <button key={r} onClick={() => setRole(r)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: roleFilter===r ? ROLE_COLOR[r]??"rgba(255,255,255,0.15)" : "rgba(255,255,255,0.05)",
                        color: roleFilter===r ? "#fff" : "rgba(255,255,255,0.45)",
                        border:`1px solid ${roleFilter===r ? (ROLE_COLOR[r]??"rgba(255,255,255,0.3)") : "rgba(255,255,255,0.08)"}` }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              {/* Tier */}
              <div>
                <div className="text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Tier</div>
                <div className="flex flex-wrap gap-1.5">
                  <button onClick={() => setTier("ALL")}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                    style={{ background: tierFilter==="ALL"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)",
                      color: tierFilter==="ALL"?"#fff":"rgba(255,255,255,0.45)",
                      border:`1px solid ${tierFilter==="ALL"?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}` }}>
                    All
                  </button>
                  {TIERS.map(t => (
                    <button key={t} onClick={() => setTier(t)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all"
                      style={{ background: tierFilter===t?`${TIER_COLORS[t]}22`:"rgba(255,255,255,0.05)",
                        color: tierFilter===t ? TIER_COLORS[t] : "rgba(255,255,255,0.45)",
                        border:`1px solid ${tierFilter===t?`${TIER_COLORS[t]}45`:"rgba(255,255,255,0.08)"}` }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              {/* Team */}
              <div>
                <div className="text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Team</div>
                <select value={teamFilter} onChange={e => setTeam(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                  style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                  <option value="ALL">All Teams</option>
                  {ALL_TEAMS.map(t => <option key={t} value={t}>{t} — {TEAM_FULL_NAME[t]}</option>)}
                </select>
              </div>
              {/* Capped / Sort */}
              <div className="space-y-2">
                <div>
                  <div className="text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Status</div>
                  <div className="flex gap-1.5">
                    {(["all","capped","uncapped"] as const).map(c => (
                      <button key={c} onClick={() => setCap(c)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all capitalize"
                        style={{ background: capFilter===c?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)",
                          color: capFilter===c?"#fff":"rgba(255,255,255,0.4)",
                          border:`1px solid ${capFilter===c?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}` }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-white/35 uppercase tracking-wider mb-2">Sort</div>
                  <select value={sortBy} onChange={e => setSort(e.target.value as SortKey)}
                    className="w-full px-2.5 py-1.5 rounded-lg text-xs text-white outline-none"
                    style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}>
                    <option value="credits">Credits (High-Low)</option>
                    <option value="name">Name (A-Z)</option>
                    <option value="team">Team (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
            {/* Active filter chips */}
            {activeFilters.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-white/6">
                <span className="text-xs text-white/30">Active:</span>
                {activeFilters.map((f,i) => (
                  <span key={i} className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background:"rgba(129,140,248,0.15)", color:"#818cf8", border:"1px solid rgba(129,140,248,0.2)" }}>
                    {f}
                  </span>
                ))}
                <button onClick={() => { setRole("ALL"); setTeam("ALL"); setTier("ALL"); setCap("all"); }}
                  className="flex items-center gap-1 text-xs text-white/35 hover:text-white transition-colors ml-1">
                  <X className="w-3 h-3" /> Clear all
                </button>
              </div>
            )}
          </motion.div>
        )}

        {/* Role tabs (quick) */}
        {!showFilters && (
          <div className="flex gap-2 flex-wrap">
            {["ALL","BAT","BWL","AR","WK"].map(r => (
              <button key={r} onClick={() => setRole(r)}
                className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{ background: roleFilter===r ? (ROLE_COLOR[r]??"rgba(255,255,255,0.15)") : "rgba(255,255,255,0.05)",
                  color: roleFilter===r ? "#fff" : "rgba(255,255,255,0.45)",
                  border:`1px solid ${roleFilter===r ? (ROLE_COLOR[r]??"rgba(255,255,255,0.2)") : "rgba(255,255,255,0.08)"}` }}>
                {r === "ALL" ? `All (${ALL_IPL_2026_PLAYERS.length})` : `${ROLE_LABEL[r]} (${ALL_IPL_2026_PLAYERS.filter(p=>p.role===r).length})`}
              </button>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {filtered.map((player, i) => {
            const tc    = TEAM_COLOR[player.team] ?? "#aaa";
            const tier  = getPlayerTier(player.credits);
            const tc2   = TIER_COLORS[tier];
            const form  = getForm(player.name);
            const pts   = estimatePoints(player.credits);
            const sel   = estimateSel(player.credits, player.role);
            const base  = TIER_CONFIG[tier].basePrice;

            return (
              <motion.div key={player.name}
                initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: Math.min(i * 0.015, 0.4) }}
                className="rounded-2xl p-3.5 cursor-pointer hover:scale-[1.02] transition-all group relative overflow-hidden"
                style={{ background:"rgba(255,255,255,0.03)", border:`1px solid rgba(255,255,255,0.08)`,
                  borderTop:`2px solid ${tc}40` }}>

                {/* Tier pip */}
                <div className="absolute top-2.5 right-2.5 text-xs font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background:`${tc2}18`, color:tc2, border:`1px solid ${tc2}30`, fontSize:"0.6rem" }}>
                  {tier}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-2.5"
                  style={{ background:`${tc}18`, color:tc, border:`1px solid ${tc}30` }}>
                  {player.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>

                <div className="font-bold text-sm text-white leading-tight truncate mb-0.5">{player.name}</div>
                <div className="text-xs font-semibold mb-2.5" style={{ color:tc }}>{player.team}
                  {!player.capped && <span className="ml-1 text-white/25 font-normal text-xs">UC</span>}
                </div>

                {/* Role + base */}
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold px-1.5 py-0.5 rounded-md"
                    style={{ background:`${ROLE_COLOR[player.role]??"#aaa"}15`, color:ROLE_COLOR[player.role]??"#aaa" }}>
                    {player.role}
                  </span>
                  <span className="text-xs font-semibold" style={{ color:tc2 }}>
                    Base {base < 1 ? `₹${base*100}L` : `₹${base}Cr`}
                  </span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-1 text-center mb-2.5">
                  <div>
                    <div className="text-sm font-black text-white">{player.credits}</div>
                    <div className="text-white/30" style={{ fontSize:"0.55rem" }}>CR</div>
                  </div>
                  <div>
                    <div className="text-sm font-black" style={{ color:tc }}>{pts}</div>
                    <div className="text-white/30" style={{ fontSize:"0.55rem" }}>PTS</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-white/70">{sel}%</div>
                    <div className="text-white/30" style={{ fontSize:"0.55rem" }}>SEL</div>
                  </div>
                </div>

                {/* Form dots */}
                <div className="flex items-center gap-1">
                  <span className="text-white/25" style={{ fontSize:"0.55rem" }}>FORM</span>
                  <div className="flex gap-0.5 ml-1">
                    {form.map((f,fi) => (
                      <div key={fi} className="w-3.5 h-1 rounded-full"
                        style={{ background: f==="A"?"#22c55e":"#334155" }} />
                    ))}
                  </div>
                </div>

                {/* Add button */}
                <button className="absolute bottom-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background:`${tc}30`, color:tc, border:`1px solid ${tc}50` }}>
                  +
                </button>
              </motion.div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-white/25">
            <div className="text-3xl mb-3">🏏</div>
            <div className="text-base font-semibold">No players match your filters</div>
            <div className="text-sm mt-1">Try adjusting the role, tier, or team</div>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
