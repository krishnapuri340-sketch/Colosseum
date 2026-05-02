import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { useLocation } from "wouter";
import { Plus, Users, Star, ChevronRight, Pencil, Trash2, X, Search, CheckCircle, Gavel } from "lucide-react";
import { TEAM_COLOR } from "@/lib/ipl-constants";
import { useApp } from "@/context/AppContext";
import { ALL_IPL_2026_PLAYERS } from "@/lib/ipl-players-2026";

const ROLE_LIMITS = { BAT: [3,6], BWL: [3,6], AR: [1,4], WK: [1,4] };
const MAX_OVERSEAS = 4;
const SQUAD_SIZE   = 11;
const BUDGET       = 100;

const ROLE_COLOR_MAP: Record<string,string> = {
  BAT:"text-blue-400 bg-blue-400/10 border-blue-400/20",
  BWL:"text-pink-400 bg-pink-400/10 border-pink-400/20",
  AR:"text-green-400 bg-green-400/10 border-green-400/20",
  WK:"text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
};


const statusStyle = (s:string) => ({
  live:      "bg-green-500/20 text-green-400 border-green-500/30",
  upcoming:  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  completed: "bg-slate-500/20 text-slate-400 border-slate-500/30",
}[s] ?? "");

type SortKey = "credits"|"role"|"team";

export default function MyTeams() {
  const { myTeams: contextTeams, addTeam, removeTeam, updateTeamCVC, myAuctions } = useApp();
  const [, navigate] = useLocation();
  const [showBuilder, setShowBuilder] = useState(false);
  const [selected, setSelected]       = useState<typeof ALL_IPL_2026_PLAYERS>([]);
  const [captain, setCaptain]         = useState<string|null>(null);
  const [vc, setVc]                   = useState<string|null>(null);
  const [teamName, setTeamName]       = useState("");
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [teamFilter, setTeamFilter]   = useState("ALL");
  const [sortBy, setSortBy]           = useState<SortKey>("credits");

  const creditsUsed = selected.reduce((s,p) => s + p.credits, 0);
  const creditsLeft = parseFloat((BUDGET - creditsUsed).toFixed(1));
  const overseas    = selected.filter(p => p.nationality === "OVS").length;

  const roleCounts = selected.reduce((acc, p) => {
    acc[p.role] = (acc[p.role] || 0) + 1;
    return acc;
  }, {} as Record<string,number>);

  const canAdd = (p: typeof ALL_IPL_2026_PLAYERS[0]) => {
    if (selected.length >= SQUAD_SIZE) return false;
    if (selected.find(s => s.name === p.name)) return false;
    if (p.nationality === "OVS" && overseas >= MAX_OVERSEAS) return false;
    if (creditsLeft < p.credits) return false;
    const [,max] = ROLE_LIMITS[p.role as keyof typeof ROLE_LIMITS] ?? [0,99];
    if ((roleCounts[p.role]||0) >= max) return false;
    return true;
  };

  function toggle(p: typeof ALL_IPL_2026_PLAYERS[0]) {
    if (selected.find(s => s.name === p.name)) {
      setSelected(sel => sel.filter(s => s.name !== p.name));
      if (captain === p.name) setCaptain(null);
      if (vc === p.name) setVc(null);
    } else if (canAdd(p)) {
      setSelected(sel => [...sel, p]);
    }
  }

  const allTeams = [...new Set(ALL_IPL_2026_PLAYERS.map(p => p.team))].sort();

  const pool = ALL_IPL_2026_PLAYERS
    .filter(p =>
      (roleFilter === "ALL" || p.role === roleFilter) &&
      (teamFilter === "ALL" || p.team === teamFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a,b) => {
      if (sortBy === "credits") return b.credits - a.credits;
      if (sortBy === "role") return a.role.localeCompare(b.role);
      return a.team.localeCompare(b.team);
    });

  const isValid = selected.length === SQUAD_SIZE && captain && vc && teamName.trim();

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4 }} className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">My Teams</h1>
            <p className="text-sm text-slate-400 mt-1">Manage your IPL 2026 fantasy squads</p>
          </div>
          <button onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors">
            <Plus size={16} /> Build Team
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label:"Teams",      value:contextTeams.length, color:"text-white" },
            { label:"Avg Points", value:"—",               color:"text-white/30" },
            { label:"Best Rank",  value:"—",               color:"text-white/30" },
          ].map(s => (
            <div key={s.label} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-slate-500 text-xs mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Teams */}
        <div className="space-y-3">
          {contextTeams.map((team, i) => {
            const c1 = TEAM_COLOR[team.teams[0]] ?? "#818cf8";
            const c2 = TEAM_COLOR[team.teams[1]] ?? "#818cf8";
            return (
              <motion.div key={team.id} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 hover:bg-white/[0.06] hover:border-white/20 transition-all group"
                style={{ borderLeft:`3px solid ${c1}` }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background:`linear-gradient(135deg, ${c1}30, ${c2}20)`, border:`1px solid ${c1}30` }}>
                      <Users size={20} style={{ color:c1 }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-white font-bold">{team.name}</h3>
                        <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${statusStyle(team.status)}`}>
                          {team.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm mb-3">{team.matchId}</p>
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
                          <Star size={10} className="text-slate-400" />
                          <span className="text-xs text-white font-medium">{team.vc}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      {team.points !== null
                        ? <><p className="text-2xl font-bold text-cyan-400">{team.points}</p><p className="text-xs text-slate-500">Points</p></>
                        : <p className="text-xs text-slate-500">Pending</p>}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-primary/20 flex items-center justify-center text-slate-400 hover:text-primary transition-colors"><Pencil size={13} /></button>
                      <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-red-500/20 flex items-center justify-center text-slate-400 hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                      <button className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors"><ChevronRight size={13} /></button>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-6">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500"><Users size={11} /><span>{team.players} players</span></div>
                  <div className="text-xs text-slate-500"><span className="text-slate-300">{team.credits}</span>/100 credits</div>
                  <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width:`${team.credits}%`, background:`linear-gradient(90deg, ${c1}, ${c2})` }} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* My Leagues */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">My Leagues</h2>
            <button onClick={() => navigate("/auction")}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
              <Plus size={12} /> New
            </button>
          </div>
          {myAuctions.length === 0 ? (
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
              <Gavel size={22} className="text-white/20 mx-auto mb-2" />
              <p className="text-sm text-white/30">No leagues yet</p>
              <p className="text-xs text-white/20 mt-1">Create or join an auction to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myAuctions.map(a => (
                <div key={a.id}
                  onClick={() => navigate("/auction/room")}
                  className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 flex items-center gap-3 hover:bg-white/[0.06] hover:border-white/20 transition-all cursor-pointer group">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                    <Gavel size={15} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-white truncate">{a.name}</div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {a.format === "tier" ? "Tier" : "Classic"} · ₹{a.budget}Cr · {a.role}
                    </div>
                  </div>
                  <span style={{
                    fontSize: "0.62rem", fontWeight: 700, padding: "2px 8px", borderRadius: 20,
                    color: a.status === "live" ? "#22c55e" : a.status === "lobby" ? "#f59e0b" : "rgba(255,255,255,0.3)",
                    background: a.status === "live" ? "rgba(34,197,94,0.1)" : a.status === "lobby" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.06)",
                  }}>
                    {a.status === "lobby" ? "LOBBY" : a.status === "live" ? "LIVE" : "DONE"}
                  </span>
                  <ChevronRight size={13} className="text-white/20 group-hover:text-white/50 transition-colors shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Build Team Modal */}
        <AnimatePresence>
          {showBuilder && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              style={{ position:"fixed", inset:0, zIndex:100, background:"rgba(0,0,0,0.75)", backdropFilter:"blur(4px)", display:"flex", alignItems:"stretch" }}>

              {/* Left: selected players */}
              <div style={{ width:280, background:"rgba(7,8,15,0.98)", borderRight:"1px solid rgba(255,255,255,0.08)", display:"flex", flexDirection:"column", padding:"1.25rem", gap:"0.75rem", overflowY:"auto" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <div style={{ fontSize:"0.75rem", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.4)", textTransform:"uppercase" }}>Your Squad</div>
                  <button onClick={() => setShowBuilder(false)} style={{ width:28, height:28, borderRadius:7, background:"rgba(255,255,255,0.07)", border:"1px solid rgba(255,255,255,0.1)", display:"flex", alignItems:"center", justifyContent:"center", cursor:"pointer", color:"rgba(255,255,255,0.5)" }}>
                    <X size={14} />
                  </button>
                </div>

                {/* Team name input */}
                <input value={teamName} onChange={e=>setTeamName(e.target.value)} placeholder="Team name…"
                  style={{ padding:"0.6rem 0.75rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#fff", fontSize:"0.85rem", outline:"none" }} />

                {/* Budget bar */}
                <div>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                    <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.4)" }}>{selected.length}/{SQUAD_SIZE} players</span>
                    <span style={{ fontSize:"0.65rem", fontFamily:"monospace", color: creditsLeft < 10 ? "#f87171" : "#22c55e" }}>₹{creditsLeft.toFixed(1)} cr left</span>
                  </div>
                  <div style={{ height:4, borderRadius:2, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:2, width:`${(creditsUsed/BUDGET)*100}%`, background:"linear-gradient(90deg,#818cf8,#c0392b)", transition:"width 0.3s" }} />
                  </div>
                  <div style={{ display:"flex", gap:4, marginTop:6, flexWrap:"wrap" }}>
                    {Object.entries(ROLE_LIMITS).map(([role,[min]]) => (
                      <span key={role} style={{ fontSize:"0.58rem", padding:"1px 6px", borderRadius:4, background:"rgba(255,255,255,0.05)", color: (roleCounts[role]||0) >= min ? "#22c55e" : "rgba(255,255,255,0.3)" }}>
                        {role} {roleCounts[role]||0}/{min}+
                      </span>
                    ))}
                    <span style={{ fontSize:"0.58rem", padding:"1px 6px", borderRadius:4, background:"rgba(255,255,255,0.05)", color: overseas >= 1 ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.3)" }}>
                      OVS {overseas}/{MAX_OVERSEAS}
                    </span>
                  </div>
                </div>

                {/* Selected list */}
                <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                  {selected.length === 0 && (
                    <div style={{ textAlign:"center", padding:"1.5rem 0", fontSize:"0.8rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>
                      Pick 11 players from the pool
                    </div>
                  )}
                  {selected.map(p => {
                    const tc = TEAM_COLOR[p.team] ?? "#aaa";
                    const isCap = captain === p.name;
                    const isVC  = vc === p.name;
                    return (
                      <div key={p.name} style={{ background:"rgba(255,255,255,0.04)", border:`1px solid rgba(255,255,255,0.07)`, borderRadius:9, padding:"0.5rem 0.65rem", display:"flex", alignItems:"center", gap:7 }}>
                        <div style={{ width:6, height:6, borderRadius:"50%", background:tc, flexShrink:0 }} />
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:"0.75rem", fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                          <div style={{ fontSize:"0.6rem", color:tc }}>{p.team} · {p.role}</div>
                        </div>
                        <button onClick={() => { setCaptain(isCap?null:p.name); if(p.name===vc) setVc(null); }}
                          style={{ width:22, height:22, borderRadius:5, fontSize:"0.6rem", fontWeight:700, cursor:"pointer", border:`1px solid ${isCap?"#e8a020":"rgba(255,255,255,0.12)"}`, background:isCap?"rgba(232,160,32,0.2)":"rgba(255,255,255,0.04)", color:isCap?"#e8a020":"rgba(255,255,255,0.35)" }}>C</button>
                        <button onClick={() => { setVc(isVC?null:p.name); if(p.name===captain) setCaptain(null); }}
                          style={{ width:22, height:22, borderRadius:5, fontSize:"0.6rem", fontWeight:700, cursor:"pointer", border:`1px solid ${isVC?"#818cf8":"rgba(255,255,255,0.12)"}`, background:isVC?"rgba(129,140,248,0.2)":"rgba(255,255,255,0.04)", color:isVC?"#818cf8":"rgba(255,255,255,0.35)" }}>V</button>
                        <button onClick={() => toggle(p)} style={{ width:22, height:22, borderRadius:5, border:"1px solid rgba(239,68,68,0.3)", background:"rgba(239,68,68,0.1)", color:"#ef4444", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <X size={10} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <button disabled={!isValid}
                  style={{ padding:"0.8rem", borderRadius:11, border:"none", background:isValid?"#c0392b":"rgba(192,57,43,0.15)", color:isValid?"#fff":"rgba(255,255,255,0.25)", fontWeight:800, fontSize:"0.88rem", cursor:isValid?"pointer":"not-allowed" }}>
                  {isValid ? "Save Team ✓" : `${SQUAD_SIZE-selected.length} more needed`}
                </button>
              </div>

              {/* Right: player pool */}
              <div style={{ flex:1, display:"flex", flexDirection:"column", padding:"1.25rem", gap:"0.75rem", overflow:"hidden" }}>
                <div style={{ fontWeight:700, fontSize:"1rem", color:"#fff", flexShrink:0 }}>Player Pool — {pool.length} of {ALL_IPL_2026_PLAYERS.length}</div>

                {/* Filters */}
                <div style={{ display:"flex", gap:6, flexWrap:"wrap", flexShrink:0 }}>
                  <div style={{ position:"relative", flex:1, minWidth:160 }}>
                    <Search style={{ position:"absolute", left:"0.7rem", top:"50%", transform:"translateY(-50%)", width:13, height:13, color:"rgba(255,255,255,0.35)", pointerEvents:"none" }} />
                    <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search…"
                      style={{ width:"100%", boxSizing:"border-box", padding:"0.5rem 0.7rem 0.5rem 2rem", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)", borderRadius:9, color:"#fff", fontSize:"0.82rem", outline:"none" }} />
                  </div>
                  {["ALL","BAT","BWL","AR","WK"].map(r => (
                    <button key={r} onClick={()=>setRoleFilter(r)}
                      style={{ padding:"0.38rem 0.65rem", borderRadius:8, border:`1px solid ${roleFilter===r?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`, background:roleFilter===r?"rgba(255,255,255,0.1)":"rgba(255,255,255,0.03)", color:roleFilter===r?"#fff":"rgba(255,255,255,0.45)", fontSize:"0.7rem", fontWeight:600, cursor:"pointer" }}>
                      {r}
                    </button>
                  ))}
                  <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)}
                    style={{ padding:"0.38rem 0.65rem", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.6)", fontSize:"0.7rem", cursor:"pointer", outline:"none" }}>
                    <option value="ALL">All Teams</option>
                    {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <select value={sortBy} onChange={e=>setSortBy(e.target.value as SortKey)}
                    style={{ padding:"0.38rem 0.65rem", borderRadius:8, border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.03)", color:"rgba(255,255,255,0.6)", fontSize:"0.7rem", cursor:"pointer", outline:"none" }}>
                    <option value="credits">Sort: Credits</option>
                    <option value="role">Sort: Role</option>
                    <option value="team">Sort: Team</option>
                  </select>
                </div>

                {/* Grid */}
                <div style={{ flex:1, overflowY:"auto", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:"0.5rem", alignContent:"start" }}>
                  {pool.map(p => {
                    const isIn  = !!selected.find(s => s.name === p.name);
                    const canPick = canAdd(p);
                    const tc    = TEAM_COLOR[p.team] ?? "#aaa";
                    return (
                      <div key={p.name} onClick={() => toggle(p)}
                        style={{ background: isIn ? `${tc}12` : "rgba(255,255,255,0.03)", border:`1.5px solid ${isIn ? tc : canPick ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.03)"}`, borderRadius:11, padding:"0.7rem", cursor:canPick||isIn?"pointer":"not-allowed", opacity:canPick||isIn?1:0.38, transition:"all 0.15s", position:"relative" }}>
                        {isIn && (
                          <div style={{ position:"absolute", top:7, right:7 }}>
                            <CheckCircle size={13} style={{ color:"#22c55e" }} />
                          </div>
                        )}
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                          <span style={{ fontSize:"0.6rem", fontWeight:800, color:tc }}>{p.team}</span>
                          <span style={{ fontSize:"0.58rem", padding:"1px 4px", borderRadius:3, background:"rgba(255,255,255,0.08)", color:"rgba(255,255,255,0.5)" }}>
                            {p.nationality}
                          </span>
                        </div>
                        <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#fff", lineHeight:1.25, marginBottom:4 }}>{p.name}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:"0.62rem", padding:"1px 5px", borderRadius:4, ...(ROLE_COLOR_MAP[p.role]?{} : {}) }} className={ROLE_COLOR_MAP[p.role]}>
                            {p.role}
                          </span>
                          <span style={{ fontSize:"0.7rem", fontFamily:"monospace", fontWeight:700, color: isIn ? tc : "rgba(255,255,255,0.5)" }}>
                            {p.credits}cr
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Layout>
  );
}
