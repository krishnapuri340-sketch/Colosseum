/**
 * Watchlist.tsx
 * Star players before/during auction to track targets
 * Per-user, persisted in localStorage (wire to DB later)
 * Shows tier, base price, who else in your leagues has them
 */
import { useState, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Search, Trash2, Gavel, TrendingUp, Plus, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { ALL_IPL_2026_PLAYERS, getPlayerTier, getTierBasePrice, TIER_CONFIG, type PlayerTier } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, TEAM_LOGO, ROLE_LABEL, ROLE_COLOR, ALL_TEAMS, TEAM_FULL_NAME } from "@/lib/ipl-constants";

const TIER_DISPLAY = {
  T1:{ label:"Marquee",   color:"#e8a020" },
  T2:{ label:"Premium",   color:"#818cf8" },
  T3:{ label:"Mid-Level", color:"#34d399" },
  T4:{ label:"Rookie",    color:"#94a3b8" },
};

// Simulate others in your leagues who have same players on watchlist
const LEAGUE_WATCHERS: Record<string, string[]> = {
  "Jasprit Bumrah":    ["Karan","Priya"],
  "Virat Kohli":       ["Arjun","Sahil","Dev"],
  "Rashid Khan":       ["Karan"],
  "Yashasvi Jaiswal":  ["Nisha","Sahil"],
  "Travis Head":       ["Dev","Arjun"],
  "Tilak Varma":       ["Priya"],
};

// Watchlist state managed by AppContext

// ── Add player overlay ─────────────────────────────────────────────────
function AddPlayerOverlay({ watchlist, onToggle, onClose }:
  { watchlist:string[]; onToggle:(n:string)=>void; onClose:()=>void }) {
  const [search, setSearch] = useState("");
  const [teamFilter, setTeamFilter] = useState("ALL");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const filtered = useMemo(() => ALL_IPL_2026_PLAYERS
    .filter(p =>
      (teamFilter==="ALL"||p.team===teamFilter) &&
      (roleFilter==="ALL"||p.role===roleFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a,b)=>b.credits-a.credits),
    [search, teamFilter, roleFilter]
  );

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.94, y:16 }} animate={{ scale:1, y:0 }}
        exit={{ scale:0.95, opacity:0 }}
        transition={{ type:"spring", stiffness:300, damping:28 }}
        onClick={e=>e.stopPropagation()}
        style={{ width:"100%", maxWidth:580, maxHeight:"85vh",
          background:"rgba(10,11,20,0.98)", border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column",
          boxShadow:"0 30px 80px rgba(0,0,0,0.7)" }}>

        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.08)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontWeight:800, fontSize:"0.95rem", color:"#fff",
            display:"flex", alignItems:"center", gap:7 }}>
            <Star size={15} style={{ color:"#f59e0b", fill:"#f59e0b" }} />
            Add to Watchlist
          </span>
          <button onClick={onClose} style={{ color:"rgba(255,255,255,0.4)",
            background:"none", border:"none", cursor:"pointer", fontSize:"1.1rem" }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding:"0.65rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", gap:6, flexWrap:"wrap" }}>
          <div style={{ position:"relative", flex:1, minWidth:140 }}>
            <Search style={{ position:"absolute", left:"0.7rem", top:"50%",
              transform:"translateY(-50%)", width:12, height:12,
              color:"rgba(255,255,255,0.3)", pointerEvents:"none" }} />
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search…"
              style={{ width:"100%", boxSizing:"border-box",
                padding:"0.45rem 0.7rem 0.45rem 2rem",
                background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:8, color:"#fff", fontSize:"0.82rem", outline:"none" }} />
          </div>
          {["ALL","BAT","AR","WK","BWL"].map(r=>(
            <button key={r} onClick={()=>setRoleFilter(r)}
              style={{ padding:"0.3rem 0.55rem", borderRadius:6, fontSize:"0.67rem",
                fontWeight:600, cursor:"pointer",
                background:roleFilter===r?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.04)",
                border:`1px solid ${roleFilter===r?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`,
                color:roleFilter===r?"#fff":"rgba(255,255,255,0.4)" }}>
              {r}
            </button>
          ))}
          <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
            style={{ padding:"0.3rem 0.55rem", borderRadius:6, fontSize:"0.67rem",
              background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
              color:"rgba(255,255,255,0.7)", outline:"none" }}>
            <option value="ALL">All Teams</option>
            {ALL_TEAMS.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map((p,i)=>{
            const tc    = TEAM_COLOR[p.team]??"#aaa";
            const tier  = getPlayerTier(p.credits);
            const td    = TIER_DISPLAY[tier];
            const watching = watchlist.includes(p.name);
            return (
              <div key={i}
                style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"0.6rem 1.25rem", cursor:"pointer",
                  borderBottom:"1px solid rgba(255,255,255,0.04)",
                  background:watching?`${tc}0a`:"transparent",
                  transition:"background 0.12s" }}
                onClick={()=>onToggle(p.name)}
                onMouseEnter={e=>{ if(!watching)(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.04)"; }}
                onMouseLeave={e=>{ if(!watching)(e.currentTarget as HTMLDivElement).style.background="transparent"; }}>
                <Star size={14} style={{ color:watching?"#f59e0b":"rgba(255,255,255,0.2)",
                  fill:watching?"#f59e0b":"none", flexShrink:0, transition:"all 0.15s" }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:600, fontSize:"0.85rem", color:"#fff",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.name}
                    {!p.capped&&<span style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.3)", marginLeft:5 }}>UC</span>}
                  </div>
                  <span style={{ fontSize:"0.65rem", fontWeight:600, color:tc }}>{p.team}</span>
                </div>
                <span style={{ fontSize:"0.65rem", fontWeight:700, color:td.color,
                  background:`${td.color}18`, padding:"1px 6px", borderRadius:4 }}>
                  {td.label}
                </span>
                <span style={{ fontSize:"0.72rem", fontFamily:"monospace",
                  color:"rgba(255,255,255,0.5)" }}>{p.credits}cr</span>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Watchlist() {
  const { watchlist, toggleWatch: toggle, isWatched } = useApp();
  const [showAdd, setShowAdd] = useState(false);
  const [sortBy, setSort]     = useState<"tier"|"credits"|"name">("tier");

  const watchedPlayers = useMemo(() => {
    const players = ALL_IPL_2026_PLAYERS.filter(p => watchlist.includes(p.name));
    return [...players].sort((a,b) => {
      if (sortBy === "tier")    return getPlayerTier(a.credits).localeCompare(getPlayerTier(b.credits));
      if (sortBy === "credits") return b.credits - a.credits;
      return a.name.localeCompare(b.name);
    });
  }, [watchlist, sortBy]);

  // Group by tier
  const byTier = useMemo(() => {
    const groups: Partial<Record<PlayerTier, typeof watchedPlayers>> = {};
    watchedPlayers.forEach(p => {
      const tier = getPlayerTier(p.credits);
      if (!groups[tier]) groups[tier] = [];
      groups[tier]!.push(p);
    });
    return groups;
  }, [watchedPlayers]);

  const tiers = (["T1","T2","T3","T4"] as PlayerTier[]).filter(t => byTier[t]?.length);

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-400 fill-yellow-400" />
              Watchlist
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              {watchlist.length} players · star your auction targets
            </p>
          </div>
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <select value={sortBy} onChange={e=>setSort(e.target.value as any)}
              style={{ padding:"0.4rem 0.75rem", borderRadius:9, fontSize:"0.75rem",
                background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                color:"rgba(255,255,255,0.7)", outline:"none" }}>
              <option value="tier">Sort: Tier</option>
              <option value="credits">Sort: Credits</option>
              <option value="name">Sort: Name</option>
            </select>
            <button onClick={()=>setShowAdd(true)}
              style={{ display:"flex", alignItems:"center", gap:6,
                padding:"0.5rem 1rem", background:"#c0192c", border:"none",
                borderRadius:10, color:"#fff", fontWeight:700, fontSize:"0.82rem",
                cursor:"pointer" }}>
              <Plus size={14} /> Add Players
            </button>
          </div>
        </div>

        {watchlist.length === 0 ? (
          <div style={{ textAlign:"center", padding:"4rem 2rem",
            background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)",
            borderRadius:20 }}>
            <Star size={36} style={{ color:"rgba(255,255,255,0.1)", margin:"0 auto 1rem" }} />
            <div style={{ fontSize:"1.1rem", fontWeight:700, color:"rgba(255,255,255,0.4)" }}>
              No players on your watchlist yet
            </div>
            <div style={{ fontSize:"0.85rem", color:"rgba(255,255,255,0.25)", marginTop:6, marginBottom:"1.5rem" }}>
              Star players before or during the auction to track your targets
            </div>
            <button onClick={()=>setShowAdd(true)}
              style={{ padding:"0.7rem 1.5rem", background:"#c0192c", border:"none",
                borderRadius:10, color:"#fff", fontWeight:700, cursor:"pointer",
                display:"inline-flex", alignItems:"center", gap:6 }}>
              <Plus size={14} /> Add your first players
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {tiers.map(tier => {
              const td      = TIER_DISPLAY[tier];
              const cfg     = TIER_CONFIG[tier];
              const players = byTier[tier]!;
              return (
                <div key={tier}>
                  {/* Tier header */}
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:td.color, flexShrink:0 }} />
                    <span style={{ fontWeight:700, fontSize:"0.88rem", color:td.color }}>{td.label}</span>
                    <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.35)" }}>
                      Base {cfg.basePrice < 1 ? `₹${cfg.basePrice*100}L` : `₹${cfg.basePrice}Cr`}
                    </span>
                    <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.25)",
                      background:"rgba(255,255,255,0.06)", padding:"1px 7px", borderRadius:20 }}>
                      {players.length}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {players.map(p => {
                      const tc       = TEAM_COLOR[p.team] ?? "#aaa";
                      const watchers = LEAGUE_WATCHERS[p.name] ?? [];
                      return (
                        <motion.div key={p.name}
                          layout
                          initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
                          style={{ background:"rgba(255,255,255,0.03)",
                            border:`1px solid rgba(255,255,255,0.08)`,
                            borderLeft:`3px solid ${tc}`,
                            borderRadius:12, padding:"0.75rem 0.9rem",
                            display:"flex", alignItems:"center", gap:10 }}>
                          {/* Star / remove */}
                          <button onClick={()=>toggle(p.name)}
                            style={{ background:"none", border:"none", cursor:"pointer",
                              padding:0, flexShrink:0 }}>
                            <Star size={15} style={{ color:"#f59e0b", fill:"#f59e0b" }} />
                          </button>

                          {/* Team logo */}
                          <div style={{ flexShrink:0 }}>
                            {TEAM_LOGO[p.team]
                              ? <img src={TEAM_LOGO[p.team]} alt={p.team}
                                  style={{ width:26, height:26, objectFit:"contain" }} />
                              : <div style={{ width:26, height:26, borderRadius:"50%",
                                  background:`${tc}22`, border:`1.5px solid ${tc}50`,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontWeight:800, fontSize:"0.6rem", color:tc }}>{p.team}</div>
                            }
                          </div>

                          {/* Name + team */}
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#fff",
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {p.name}
                              {!p.capped && <span style={{ fontSize:"0.58rem",
                                color:"rgba(255,255,255,0.3)", marginLeft:5 }}>UC</span>}
                            </div>
                            <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:1 }}>
                              <span style={{ fontSize:"0.65rem", fontWeight:600, color:tc }}>{p.team}</span>
                              <span style={{ fontSize:"0.62rem", color:ROLE_COLOR[p.role]??"#aaa" }}>
                                {ROLE_LABEL[p.role]}
                              </span>
                            </div>
                          </div>

                          {/* Who else is watching (league members) */}
                          {watchers.length > 0 && (
                            <div style={{ display:"flex", alignItems:"center", gap:4,
                              flexShrink:0 }} className="hidden sm:flex">
                              <span style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.3)" }}>
                                Also watching:
                              </span>
                              {watchers.slice(0,3).map((w,wi)=>(
                                <div key={wi} style={{ width:20, height:20, borderRadius:"50%",
                                  background:`${["#3b82f6","#a855f7","#34d399"][wi%3]}30`,
                                  border:`1.5px solid ${["#3b82f6","#a855f7","#34d399"][wi%3]}`,
                                  display:"flex", alignItems:"center", justifyContent:"center",
                                  fontSize:"0.55rem", fontWeight:800, color:"#fff",
                                  marginLeft: wi>0?-6:0, zIndex:3-wi }}>
                                  {w.slice(0,2).toUpperCase()}
                                </div>
                              ))}
                              {watchers.length > 3 && (
                                <span style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.3)" }}>
                                  +{watchers.length-3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Credits + base */}
                          <div style={{ textAlign:"right", flexShrink:0 }}>
                            <div style={{ fontSize:"0.82rem", fontWeight:700,
                              color:td.color, fontFamily:"monospace" }}>
                              {p.credits}cr
                            </div>
                            <div style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.3)" }}>
                              Base {cfg.basePrice<1?`₹${cfg.basePrice*100}L`:`₹${cfg.basePrice}Cr`}
                            </div>
                          </div>

                          {/* Remove */}
                          <button onClick={()=>toggle(p.name)}
                            style={{ width:26, height:26, borderRadius:7,
                              background:"rgba(239,68,68,0.08)",
                              border:"1px solid rgba(239,68,68,0.15)",
                              display:"flex", alignItems:"center", justifyContent:"center",
                              cursor:"pointer", color:"#ef4444", flexShrink:0 }}>
                            <X size={11} />
                          </button>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showAdd && (
          <AddPlayerOverlay watchlist={watchlist} onToggle={toggle}
            onClose={()=>setShowAdd(false)} />
        )}
      </AnimatePresence>
    </Layout>
  );
}
