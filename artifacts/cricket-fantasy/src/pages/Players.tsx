import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, Users } from "lucide-react";
import { ALL_IPL_2026_PLAYERS, getPlayerTier, TIER_CONFIG, type PlayerTier } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, TEAM_LOGO, ROLE_LABEL, ROLE_COLOR, ALL_TEAMS, TEAM_FULL_NAME } from "@/lib/ipl-constants";

const TIERS: PlayerTier[] = ["T1","T2","T3","T4"];
const TIER_LABELS: Record<PlayerTier,string> = { T1:"Marquee", T2:"Premium", T3:"Mid-Level", T4:"Rookie" };
const TIER_COLORS: Record<PlayerTier,string> = { T1:"#e8a020", T2:"#818cf8", T3:"#34d399", T4:"#94a3b8" };
const ROLE_ICON: Record<string,string> = { BAT:"BAT", BWL:"BWL", AR:"AR", WK:"WK" };

type SortKey   = "credits"|"name"|"role";
type ViewMode  = "teams"|"all";

// ── Compact player row (used inside team cards) ───────────────────────
function PlayerRow({ player }: { player: typeof ALL_IPL_2026_PLAYERS[0] }) {
  const tc   = TEAM_COLOR[player.team] ?? "#aaa";
  const tier = getPlayerTier(player.credits);
  const tc2  = TIER_COLORS[tier];
  const base = TIER_CONFIG[tier].basePrice;

  return (
    <div
      style={{
        display:"flex", alignItems:"center", gap:10,
        padding:"0.55rem 0.85rem",
        borderBottom:"1px solid rgba(255,255,255,0.04)",
        transition:"background 0.12s",
      }}
      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.04)"}
      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}
    >
      {/* Role icon */}
      <span style={{ fontSize:"0.9rem", width:22, textAlign:"center", flexShrink:0 }}>
        {ROLE_ICON[player.role]}
      </span>

      {/* Name + badges */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
          <span style={{ fontSize:"0.82rem", fontWeight:600, color:"#fff",
            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
            {player.name}
          </span>
          {!player.capped && (
            <span style={{ fontSize:"0.55rem", fontWeight:700, color:"rgba(255,255,255,0.3)",
              background:"rgba(255,255,255,0.06)", padding:"0 4px", borderRadius:3, flexShrink:0 }}>
              UC
            </span>
          )}
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:4, marginTop:1 }}>
          <span style={{ fontSize:"0.62rem", fontWeight:700, color:tc2,
            background:`${tc2}18`, padding:"0px 5px", borderRadius:3 }}>
            {tier}
          </span>
          <span style={{ fontSize:"0.62rem", color:ROLE_COLOR[player.role]??"#aaa" }}>
            {ROLE_LABEL[player.role]}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:"flex", gap:12, flexShrink:0 }}>
        <div style={{ textAlign:"right" }}>
          <div style={{ fontSize:"0.8rem", fontWeight:700, color:tc2, fontFamily:"monospace" }}>
            {player.credits}
          </div>
          <div style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.25)" }}>CR</div>
        </div>
        <div style={{ textAlign:"right", minWidth:40 }} className="hidden md:block">
          <div style={{ fontSize:"0.72rem", fontWeight:600, color:"rgba(255,255,255,0.35)",
            fontFamily:"monospace" }}>
            {base < 1 ? `₹${base*100}L` : `₹${base}Cr`}
          </div>
          <div style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.2)" }}>BASE</div>
        </div>
      </div>
    </div>
  );
}

// ── Team card (expanded/collapsed) ───────────────────────────────────
function TeamCard({
  team, players, defaultOpen,
  search, roleFilter, tierFilter, capFilter
}: {
  team: string;
  players: typeof ALL_IPL_2026_PLAYERS;
  defaultOpen?: boolean;
  search: string;
  roleFilter: string;
  tierFilter: PlayerTier | "ALL";
  capFilter: "all"|"capped"|"uncapped";
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const tc    = TEAM_COLOR[team] ?? "#aaa";
  const logo  = TEAM_LOGO[team];

  const filtered = useMemo(() => players
    .filter(p => {
      if (roleFilter !== "ALL" && p.role !== roleFilter) return false;
      if (tierFilter !== "ALL" && getPlayerTier(p.credits) !== tierFilter) return false;
      if (capFilter === "capped" && !p.capped) return false;
      if (capFilter === "uncapped" && p.capped) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!p.name.toLowerCase().includes(q)) return false;
      }
      return true;
    })
    .sort((a,b) => b.credits - a.credits),
    [players, roleFilter, tierFilter, capFilter, search]
  );

  // If search/filters active and no match, hide card
  if ((search || roleFilter !== "ALL" || tierFilter !== "ALL" || capFilter !== "all") && filtered.length === 0) {
    return null;
  }

  const displayPlayers = (search || roleFilter !== "ALL" || tierFilter !== "ALL" || capFilter !== "all")
    ? filtered
    : players.slice().sort((a,b) => b.credits - a.credits);

  const roleCounts = players.reduce((acc, p) => {
    acc[p.role] = (acc[p.role]||0)+1; return acc;
  }, {} as Record<string,number>);

  return (
    <motion.div
      initial={{ opacity:0, y:8 }}
      animate={{ opacity:1, y:0 }}
      style={{
        background:"rgba(255,255,255,0.03)",
        border:`1px solid rgba(255,255,255,0.08)`,
        borderTop:`2px solid ${tc}`,
        borderRadius:16, overflow:"hidden",
      }}
    >
      {/* Team header — clickable */}
      <div
        onClick={() => setOpen(o=>!o)}
        style={{
          padding:"0.85rem 1rem", cursor:"pointer",
          display:"flex", alignItems:"center", gap:12,
          background: open ? `${tc}0a` : "transparent",
          borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none",
          transition:"background 0.15s",
        }}
      >
        {/* Logo */}
        {logo
          ? <img src={logo} alt={team} style={{ width:36, height:36, objectFit:"contain", flexShrink:0 }}
              onError={e=>(e.target as HTMLImageElement).style.display="none"} />
          : <div style={{ width:36, height:36, borderRadius:"50%", flexShrink:0,
              background:`${tc}22`, border:`1.5px solid ${tc}50`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontWeight:800, fontSize:"0.75rem", color:tc }}>{team}</div>
        }

        {/* Team name */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:800, fontSize:"0.95rem", color:"#fff" }}>{team}</div>
          <div style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.4)" }}>{TEAM_FULL_NAME[team]}</div>
        </div>

        {/* Role breakdown chips */}
        <div className="hidden sm:flex items-center gap-1.5">
          {Object.entries(roleCounts).map(([role, count]) => (
            <span key={role} style={{ fontSize:"0.62rem", fontWeight:700,
              color:ROLE_COLOR[role]??"#aaa",
              background:`${ROLE_COLOR[role]??"#aaa"}15`,
              padding:"2px 6px", borderRadius:4 }}>
              {ROLE_ICON[role]}{count}
            </span>
          ))}
        </div>

        {/* Player count */}
        <div style={{ display:"flex", alignItems:"center", gap:4, flexShrink:0 }}>
          <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.5)",
            fontWeight:600 }}>
            {displayPlayers.length}/{players.length}
          </span>
          {open
            ? <ChevronUp size={15} style={{ color:"rgba(255,255,255,0.3)" }} />
            : <ChevronDown size={15} style={{ color:"rgba(255,255,255,0.3)" }} />
          }
        </div>
      </div>

      {/* Player list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height:0, opacity:0 }}
            animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }}
            transition={{ duration:0.2, ease:"easeInOut" }}
            style={{ overflow:"hidden" }}
          >
            {displayPlayers.map(p => <PlayerRow key={p.name} player={p} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Players() {
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("ALL");
  const [tierFilter, setTier]   = useState<PlayerTier|"ALL">("ALL");
  const [sortBy, setSort]       = useState<SortKey>("credits");
  const [showFilters, setShowF] = useState(false);
  const [capFilter, setCap]     = useState<"all"|"capped"|"uncapped">("all");
  const [viewMode, setView]     = useState<ViewMode>("teams");

  // "All players" flat list
  const flatFiltered = useMemo(() => {
    return ALL_IPL_2026_PLAYERS
      .filter(p => {
        if (roleFilter !== "ALL" && p.role !== roleFilter) return false;
        if (tierFilter !== "ALL" && getPlayerTier(p.credits) !== tierFilter) return false;
        if (capFilter === "capped"   && !p.capped) return false;
        if (capFilter === "uncapped" &&  p.capped) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a,b) => {
        if (sortBy === "credits") return b.credits - a.credits;
        if (sortBy === "name")    return a.name.localeCompare(b.name);
        return a.role.localeCompare(b.role);
      });
  }, [search, roleFilter, tierFilter, sortBy, capFilter]);

  // Team-grouped data
  const teamGroups = useMemo(() =>
    ALL_TEAMS.map(team => ({
      team,
      players: ALL_IPL_2026_PLAYERS.filter(p => p.team === team),
    })),
    []
  );

  const activeFilterCount = [
    roleFilter !== "ALL",
    tierFilter !== "ALL",
    capFilter  !== "all",
    !!search,
  ].filter(Boolean).length;

  // Auto-expand teams when search/filters active
  const hasActiveFilter = !!(search || roleFilter !== "ALL" || tierFilter !== "ALL" || capFilter !== "all");

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }} className="space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-black text-white">Players</h1>
            <p className="text-sm text-white/40 mt-0.5">
              {viewMode === "teams"
                ? `${ALL_TEAMS.length} teams · ${ALL_IPL_2026_PLAYERS.length} players · IPL 2026`
                : `${flatFiltered.length} of ${ALL_IPL_2026_PLAYERS.length} players`
              }
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View toggle */}
            <div style={{ display:"flex", background:"rgba(255,255,255,0.05)",
              border:"1px solid rgba(255,255,255,0.09)", borderRadius:10, padding:2 }}>
              {(["teams","all"] as ViewMode[]).map(v => (
                <button key={v} onClick={() => setView(v)}
                  style={{ padding:"0.35rem 0.8rem", borderRadius:8, fontSize:"0.78rem",
                    fontWeight:600, cursor:"pointer", transition:"all 0.15s",
                    background: viewMode===v ? "rgba(255,255,255,0.12)" : "transparent",
                    color: viewMode===v ? "#fff" : "rgba(255,255,255,0.4)",
                    border:"none" }}>
                  {v === "teams" ? "By Team" : "All Players"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search players…"
                className="w-full pl-9 pr-3 py-2 text-sm text-white rounded-xl outline-none"
                style={{ background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)" }} />
            </div>

            {/* Filter button */}
            <button onClick={() => setShowF(v=>!v)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
              style={{ background: showFilters ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)",
                border:`1px solid ${showFilters?"rgba(129,140,248,0.35)":"rgba(255,255,255,0.09)"}`,
                color: showFilters ? "#818cf8" : "rgba(255,255,255,0.5)" }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Filters</span>
              {activeFilterCount > 0 && (
                <span style={{ width:16, height:16, borderRadius:"50%", background:"#818cf8",
                  color:"#fff", fontSize:"0.6rem", fontWeight:700,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-8 }} transition={{ duration:0.15 }}
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:16, padding:"1rem 1.1rem" }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Role */}
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em",
                    color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:6 }}>Role</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    {["ALL","BAT","BWL","AR","WK"].map(r => (
                      <button key={r} onClick={() => setRole(r)}
                        style={{ padding:"3px 9px", borderRadius:6, fontSize:"0.72rem",
                          fontWeight:600, cursor:"pointer", transition:"all 0.12s",
                          background: roleFilter===r ? (ROLE_COLOR[r]??"rgba(255,255,255,0.15)") : "rgba(255,255,255,0.05)",
                          color: roleFilter===r ? "#fff" : "rgba(255,255,255,0.45)",
                          border:`1px solid ${roleFilter===r?(ROLE_COLOR[r]??"rgba(255,255,255,0.2)"):"rgba(255,255,255,0.08)"}` }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tier */}
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em",
                    color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:6 }}>Tier</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:4 }}>
                    <button onClick={() => setTier("ALL")}
                      style={{ padding:"3px 9px", borderRadius:6, fontSize:"0.72rem",
                        fontWeight:600, cursor:"pointer",
                        background:tierFilter==="ALL"?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)",
                        color:tierFilter==="ALL"?"#fff":"rgba(255,255,255,0.4)",
                        border:`1px solid ${tierFilter==="ALL"?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}` }}>
                      All
                    </button>
                    {TIERS.map(t => (
                      <button key={t} onClick={() => setTier(t)}
                        style={{ padding:"3px 9px", borderRadius:6, fontSize:"0.72rem",
                          fontWeight:600, cursor:"pointer",
                          background:tierFilter===t?`${TIER_COLORS[t]}22`:"rgba(255,255,255,0.05)",
                          color:tierFilter===t?TIER_COLORS[t]:"rgba(255,255,255,0.4)",
                          border:`1px solid ${tierFilter===t?`${TIER_COLORS[t]}45`:"rgba(255,255,255,0.08)"}` }}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em",
                    color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:6 }}>Status</div>
                  <div style={{ display:"flex", gap:4 }}>
                    {(["all","capped","uncapped"] as const).map(cap => (
                      <button key={cap} onClick={() => setCap(cap)}
                        style={{ padding:"3px 9px", borderRadius:6, fontSize:"0.72rem",
                          fontWeight:600, cursor:"pointer", textTransform:"capitalize",
                          background:capFilter===cap?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.05)",
                          color:capFilter===cap?"#fff":"rgba(255,255,255,0.4)",
                          border:`1px solid ${capFilter===cap?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}` }}>
                        {cap}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort (All view only) */}
                <div>
                  <div style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em",
                    color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:6 }}>Sort</div>
                  <select value={sortBy} onChange={e => setSort(e.target.value as SortKey)}
                    style={{ padding:"4px 10px", borderRadius:8, fontSize:"0.75rem",
                      background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                      color:"rgba(255,255,255,0.7)", outline:"none" }}>
                    <option value="credits">Credits ↓</option>
                    <option value="name">Name A–Z</option>
                    <option value="role">Role</option>
                  </select>
                </div>
              </div>

              {/* Clear */}
              {activeFilterCount > 0 && (
                <div style={{ marginTop:"0.75rem", paddingTop:"0.75rem",
                  borderTop:"1px solid rgba(255,255,255,0.06)",
                  display:"flex", alignItems:"center", gap:8 }}>
                  <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.3)" }}>Active filters:</span>
                  {roleFilter !== "ALL" && <span style={{ fontSize:"0.7rem", color:"#818cf8",
                    background:"rgba(129,140,248,0.12)", padding:"1px 8px", borderRadius:20 }}>
                    Role: {roleFilter}</span>}
                  {tierFilter !== "ALL" && <span style={{ fontSize:"0.7rem", color:TIER_COLORS[tierFilter],
                    background:`${TIER_COLORS[tierFilter]}18`, padding:"1px 8px", borderRadius:20 }}>
                    {TIER_LABELS[tierFilter]}</span>}
                  {capFilter !== "all" && <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.6)",
                    background:"rgba(255,255,255,0.08)", padding:"1px 8px", borderRadius:20 }}>
                    {capFilter}</span>}
                  <button onClick={() => { setRole("ALL"); setTier("ALL"); setCap("all"); setSearch(""); }}
                    style={{ display:"flex", alignItems:"center", gap:3, fontSize:"0.7rem",
                      color:"rgba(255,255,255,0.35)", cursor:"pointer", background:"none",
                      border:"none", marginLeft:4 }}>
                    <X size={11} /> Clear all
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── BY TEAM view ── */}
        {viewMode === "teams" && (
          <div className="space-y-3">
            {teamGroups.map(({ team, players }) => (
              <TeamCard
                key={team} team={team} players={players}
                defaultOpen={hasActiveFilter}
                search={search} roleFilter={roleFilter}
                tierFilter={tierFilter} capFilter={capFilter}
              />
            ))}
          </div>
        )}

        {/* ── ALL PLAYERS flat view ── */}
        {viewMode === "all" && (
          <>
            {/* Role quick pills */}
            <div className="flex gap-2 flex-wrap">
              {["ALL","BAT","BWL","AR","WK"].map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-semibold transition-all"
                  style={{ background: roleFilter===r?(ROLE_COLOR[r]??"rgba(255,255,255,0.15)"):"rgba(255,255,255,0.05)",
                    color: roleFilter===r?"#fff":"rgba(255,255,255,0.45)",
                    border:`1px solid ${roleFilter===r?(ROLE_COLOR[r]??"rgba(255,255,255,0.2)"):"rgba(255,255,255,0.08)"}` }}>
                  {r === "ALL" ? `All (${ALL_IPL_2026_PLAYERS.length})` : `${r} (${ALL_IPL_2026_PLAYERS.filter(p=>p.role===r).length})`}
                </button>
              ))}
            </div>

            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:14, overflow:"hidden" }}>
              {/* Column header */}
              <div style={{ display:"grid", gridTemplateColumns:"22px 1fr auto auto auto",
                gap:10, padding:"0.5rem 0.85rem",
                borderBottom:"1px solid rgba(255,255,255,0.07)",
                fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em",
                color:"rgba(255,255,255,0.25)", textTransform:"uppercase" }}>
                <span />
                <span>Player</span>
                <span className="hidden sm:block">Form</span>
                <span style={{ textAlign:"right" }}>CR</span>
                <span style={{ textAlign:"right" }} className="hidden sm:block">PTS</span>
              </div>
              {flatFiltered.map(p => <PlayerRow key={p.name} player={p} />)}
              {flatFiltered.length === 0 && (
                <div style={{ padding:"3rem", textAlign:"center",
                  color:"rgba(255,255,255,0.25)", fontSize:"0.85rem" }}>
                  No players match your filters
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
