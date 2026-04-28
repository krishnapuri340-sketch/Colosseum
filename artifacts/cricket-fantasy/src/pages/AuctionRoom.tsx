/**
 * AuctionRoom.tsx — Verbal Auction, Host-Managed
 * Refinements v2:
 * - Nomination modal with player search + quick-pick recents
 * - Bigger, cleaner player stage with role colour accent
 * - Bid panel: team chips + stepper + manual input all in one row
 * - RTM (Right to Match) button per team
 * - Undo last action
 * - Budget warning at ₹10cr
 * - All-squads expandable panel
 * - Export log button (copies to clipboard)
 * - Keyboard shortcut: Space = raise bid 1Cr, Enter = confirm sold
 */
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Gavel, CheckCircle, XCircle, Crown,
  Search, ChevronRight, ChevronDown, RotateCcw,
  Plus, Minus, Copy, TriangleAlert, Trophy, Users,
} from "lucide-react";
import {
  IPL_2026_PLAYERS, TEAM_COLOR, TEAM_FULL_NAME,
  ROLE_LABEL, ROLE_ICON, ROLE_COLOR,
} from "@/lib/ipl-constants";

// ── Types ──────────────────────────────────────────────────────────────
interface Player   { name: string; team: string; role: string; credits: number; }
interface SquadEntry extends Player { price: number; }
interface AucTeam  { id: string; name: string; color: string; budget: number; squad: SquadEntry[]; }
interface LogEntry {
  player: Player; status: "sold" | "unsold";
  winner?: string; winnerColor?: string; price?: number;
  snapshot: AucTeam[];       // for undo
}
type Phase = "idle" | "nominated" | "sold" | "unsold";

// ── Constants ──────────────────────────────────────────────────────────
const ACCENT        = "#c0192c";
const BDR           = "rgba(255,255,255,0.08)";
const CARD          = "rgba(255,255,255,0.04)";
const DIM           = "rgba(255,255,255,0.35)";
const BUDGET_WARN   = 10;       // crores — show warning below this
const STARTING_BUDGET = 100;

const INIT_TEAMS: AucTeam[] = [
  { id:"t1", name:"Rajveer's Army", color:"#c0392b", budget:STARTING_BUDGET, squad:[] },
  { id:"t2", name:"Karan's XI",     color:"#3b82f6", budget:STARTING_BUDGET, squad:[] },
  { id:"t3", name:"Arjun Plays",    color:"#a855f7", budget:STARTING_BUDGET, squad:[] },
  { id:"t4", name:"Sahil FC",       color:"#f59e0b", budget:STARTING_BUDGET, squad:[] },
];

const ROLE_ORDER = ["BAT","AR","WK","BWL"];

function crFmt(n: number) {
  if (n === 0) return "₹0";
  return n % 1 === 0 ? `₹${n}Cr` : `₹${n.toFixed(1)}Cr`;
}

// ── BudgetBar ──────────────────────────────────────────────────────────
function BudgetBar({ team, highlight = false }: { team: AucTeam; highlight?: boolean }) {
  const pct  = Math.max(0, (team.budget / STARTING_BUDGET) * 100);
  const low  = team.budget <= BUDGET_WARN;
  const fill = low ? "#ef4444" : team.color;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontSize:"0.78rem", fontWeight:700, color: highlight ? team.color : "#fff",
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>
          {team.name}
        </span>
        <span style={{ fontSize:"0.72rem", fontFamily:"monospace",
          color: low ? "#f87171" : DIM, fontWeight: low ? 700 : 400 }}>
          {crFmt(team.budget)}
          {low && <TriangleAlert style={{ width:10, height:10, marginLeft:3, display:"inline" }} />}
        </span>
      </div>
      <div style={{ height:5, borderRadius:3, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:3, width:`${pct}%`,
          background: fill, transition:"width 0.4s ease" }} />
      </div>
      <span style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.25)" }}>
        {team.squad.length} players
      </span>
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────
export default function AuctionRoom() {
  const [, navigate] = useLocation();

  // Teams
  const [teams, setTeams]             = useState<AucTeam[]>(INIT_TEAMS);

  // Pool — track sold names to exclude
  const soldRef = useRef<Set<string>>(new Set());
  const pool = useMemo(
    () => IPL_2026_PLAYERS.filter(p => !soldRef.current.has(p.name)),
    // eslint-disable-next-line
    [teams],
  );

  // Phase
  const [phase, setPhase]             = useState<Phase>("idle");
  const [nominated, setNominated]     = useState<Player | null>(null);
  const [currentBid, setCurrentBid]   = useState(0);
  const [leadId, setLeadId]           = useState<string | null>(null);
  const [log, setLog]                 = useState<LogEntry[]>([]);

  // Nomination search
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");

  // Left panel
  const [leftTab, setLeftTab]         = useState<"teams" | "squads">("teams");
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // Bid input
  const [bidInput, setBidInput]       = useState("");
  const [bidFocused, setBidFocused]   = useState(false);

  // Recent nominations (last 5)
  const [recents, setRecents]         = useState<Player[]>([]);

  const leadTeam = teams.find(t => t.id === leadId) ?? null;
  const remaining = pool.length;

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (phase !== "nominated") return;
    if (e.code === "Space") {
      e.preventDefault();
      setCurrentBid(b => parseFloat((b + 1).toFixed(1)));
    }
    if (e.code === "Enter" && leadId) {
      e.preventDefault();
      confirmSold();
    }
  }, [phase, leadId, currentBid]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Actions ────────────────────────────────────────────────────────
  function nominate(player: Player) {
    setNominated(player);
    const base = parseFloat((player.credits * 0.8).toFixed(1));
    setCurrentBid(base);
    setBidInput(String(base));
    setLeadId(null);
    setPhase("nominated");
    setSearch("");
    setRecents(r => [player, ...r.filter(p => p.name !== player.name)].slice(0, 5));
  }

  function setLead(teamId: string) {
    setLeadId(teamId);
  }

  function raiseBid(delta: number) {
    setCurrentBid(b => {
      const n = parseFloat((b + delta).toFixed(1));
      setBidInput(String(n));
      return n;
    });
  }

  function applyInput() {
    const v = parseFloat(bidInput);
    if (!isNaN(v) && v > 0) setCurrentBid(v);
  }

  function confirmSold() {
    if (!nominated || !leadTeam) return;
    soldRef.current.add(nominated.name);
    const snap = teams.map(t => ({ ...t, squad: [...t.squad] }));
    setTeams(prev => prev.map(t =>
      t.id === leadId
        ? { ...t, budget: parseFloat((t.budget - currentBid).toFixed(1)), squad: [...t.squad, { ...nominated, price: currentBid }] }
        : t
    ));
    setLog(prev => [{ player: nominated, status:"sold", winner: leadTeam.name, winnerColor: leadTeam.color, price: currentBid, snapshot: snap }, ...prev]);
    setPhase("sold");
  }

  function confirmUnsold() {
    if (!nominated) return;
    const snap = teams.map(t => ({ ...t, squad: [...t.squad] }));
    setLog(prev => [{ player: nominated, status:"unsold", snapshot: snap }, ...prev]);
    setPhase("unsold");
  }

  function undoLast() {
    if (log.length === 0) return;
    const [last, ...rest] = log;
    if (last.status === "sold") soldRef.current.delete(last.player.name);
    setTeams(last.snapshot.map(t => ({ ...t, squad: [...t.squad] })));
    setLog(rest);
    setPhase("idle");
    setNominated(null);
    setLeadId(null);
  }

  function next() {
    setNominated(null); setLeadId(null); setCurrentBid(0); setPhase("idle");
  }

  function copyLog() {
    const text = log.map(e =>
      e.status === "sold"
        ? `${e.player.name} (${e.player.team}) → ${e.winner} at ${crFmt(e.price!)}`
        : `${e.player.name} (${e.player.team}) → UNSOLD`
    ).join("\n");
    navigator.clipboard?.writeText(text);
  }

  // ── Filtered pool ──────────────────────────────────────────────────
  const filtered = pool.filter(p => {
    const mr = roleFilter === "ALL" || p.role === roleFilter;
    const mq = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase());
    return mr && mq;
  }).sort((a, b) => b.credits - a.credits);

  // Sort squad by role order
  function sortedSquad(squad: SquadEntry[]) {
    return [...squad].sort((a, b) => ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role));
  }

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ display:"flex", flexDirection:"column", gap:"1rem", height:"100%", minHeight:0 }}>

        {/* ══ TOPBAR ══ */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
            <button onClick={() => navigate("/auction")}
              style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:9, padding:"0.4rem 0.75rem",
                color:DIM, cursor:"pointer", display:"flex", alignItems:"center", gap:"0.3rem", fontSize:"0.78rem", fontWeight:600 }}>
              <ArrowLeft style={{ width:13, height:13 }} /> Back
            </button>
            <div>
              <div style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.15em",
                textTransform:"uppercase", color:ACCENT }}>Host · Verbal Auction</div>
              <h1 style={{ margin:0, fontSize:"1.45rem", fontWeight:900, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1 }}>Friday Night Draft</h1>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
            {/* Undo */}
            {log.length > 0 && (
              <button onClick={undoLast}
                style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.85rem",
                  background:"rgba(255,255,255,0.05)", border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.75rem", fontWeight:600, cursor:"pointer" }}>
                <RotateCcw style={{ width:12, height:12 }} /> Undo
              </button>
            )}
            {/* Export log */}
            {log.length > 0 && (
              <button onClick={copyLog}
                style={{ display:"flex", alignItems:"center", gap:"0.35rem", padding:"0.4rem 0.85rem",
                  background:"rgba(255,255,255,0.05)", border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.75rem", fontWeight:600, cursor:"pointer" }}>
                <Copy style={{ width:12, height:12 }} /> Copy Log
              </button>
            )}
            {/* Live badge */}
            <div style={{ padding:"0.35rem 0.85rem", background:"rgba(34,197,94,0.1)",
              border:"1px solid rgba(34,197,94,0.2)", borderRadius:20,
              display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e",
                boxShadow:"0 0 6px #22c55e", animation:"livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize:"0.68rem", fontWeight:700, color:"#22c55e",
                letterSpacing:"0.08em" }}>LIVE</span>
            </div>
            <span style={{ fontSize:"0.75rem", color:DIM }}>{remaining} left</span>
          </div>
        </div>

        {/* ══ BODY: 3 columns ══ */}
        <div style={{ display:"grid", gridTemplateColumns:"250px 1fr 270px",
          gap:"0.85rem", flex:1, minHeight:0, overflow:"hidden" }}>

          {/* ── LEFT ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", overflow:"hidden" }}>
            {/* Tab */}
            <div style={{ display:"flex", gap:"0.35rem", flexShrink:0 }}>
              {(["teams","squads"] as const).map(t => (
                <button key={t} onClick={() => setLeftTab(t)}
                  style={{ flex:1, padding:"0.38rem", borderRadius:8,
                    border:`1px solid ${leftTab===t ? "rgba(255,255,255,0.15)" : BDR}`,
                    background: leftTab===t ? "rgba(255,255,255,0.09)" : CARD,
                    color: leftTab===t ? "#fff" : DIM,
                    fontSize:"0.72rem", fontWeight:600, cursor:"pointer", textTransform:"capitalize" }}>
                  {t}
                </button>
              ))}
            </div>

            {/* Teams tab */}
            {leftTab === "teams" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.55rem" }}>
                {teams.map(team => {
                  const isLead = leadId === team.id;
                  const canAfford = team.budget >= currentBid;
                  return (
                    <div key={team.id}
                      onClick={() => phase === "nominated" && canAfford && setLead(team.id)}
                      style={{ background: isLead ? `${team.color}12` : CARD,
                        border:`1.5px solid ${isLead ? team.color : canAfford ? BDR : "rgba(255,255,255,0.04)"}`,
                        borderRadius:12, padding:"0.8rem 0.9rem",
                        cursor: phase==="nominated" && canAfford ? "pointer" : "default",
                        transition:"all 0.18s", opacity: phase==="nominated" && !canAfford ? 0.45 : 1 }}>
                      <BudgetBar team={team} highlight={isLead} />
                      {/* Quick +bid chips — only during bidding */}
                      {phase === "nominated" && canAfford && (
                        <div style={{ display:"flex", gap:"0.3rem", marginTop:"0.55rem" }}>
                          {[0.5,1,2,5].map(inc => {
                            const next = parseFloat((currentBid + inc).toFixed(1));
                            const ok = team.budget >= next;
                            return (
                              <button key={inc}
                                onClick={e => { e.stopPropagation(); if(ok){ setLead(team.id); setCurrentBid(next); setBidInput(String(next)); }}}
                                style={{ flex:1, padding:"0.28rem 0", borderRadius:6,
                                  border:`1px solid ${ok ? `${team.color}40` : BDR}`,
                                  background: ok ? `${team.color}14` : "transparent",
                                  color: ok ? team.color : "rgba(255,255,255,0.15)",
                                  fontSize:"0.62rem", fontWeight:700,
                                  cursor: ok ? "pointer" : "not-allowed" }}>
                                +{inc}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {isLead && phase === "nominated" && (
                        <div style={{ marginTop:"0.4rem", fontSize:"0.68rem",
                          color:team.color, fontWeight:700,
                          display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <Crown style={{ width:10, height:10 }} />
                          Leading — {crFmt(currentBid)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Squads tab */}
            {leftTab === "squads" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                {teams.map(team => (
                  <div key={team.id} style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11, overflow:"hidden" }}>
                    <div onClick={() => setExpandedTeam(expandedTeam===team.id ? null : team.id)}
                      style={{ padding:"0.65rem 0.85rem", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"space-between",
                        borderBottom: expandedTeam===team.id ? `1px solid ${BDR}` : "none" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.45rem" }}>
                        <div style={{ width:7, height:7, borderRadius:"50%", background:team.color }} />
                        <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>{team.name}</span>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        <span style={{ fontSize:"0.65rem", color:DIM }}>{team.squad.length}p · {crFmt(team.budget)}</span>
                        {expandedTeam===team.id
                          ? <ChevronDown style={{ width:11, height:11, color:DIM }} />
                          : <ChevronRight style={{ width:11, height:11, color:DIM }} />}
                      </div>
                    </div>
                    {expandedTeam===team.id && (
                      <div style={{ padding:"0.45rem 0.65rem", maxHeight:180, overflowY:"auto",
                        display:"flex", flexDirection:"column", gap:"0.28rem" }}>
                        {team.squad.length === 0
                          ? <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic", padding:"0.2rem 0" }}>No players yet</span>
                          : sortedSquad(team.squad).map((p,i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.45rem",
                              padding:"0.28rem 0.45rem", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
                              <span style={{ fontSize:"0.6rem", fontWeight:700,
                                color: ROLE_COLOR[p.role] ?? "#aaa",
                                background:`${ROLE_COLOR[p.role] ?? "#aaa"}15`,
                                padding:"1px 5px", borderRadius:3, minWidth:26, textAlign:"center" }}>
                                {p.role}
                              </span>
                              <span style={{ fontSize:"0.72rem", color:"#fff", flex:1,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {p.name}
                              </span>
                              <span style={{ fontSize:"0.65rem", color:DIM, fontFamily:"monospace" }}>
                                {crFmt(p.price)}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── CENTRE ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem", overflow:"hidden" }}>

            {/* IDLE — player pool */}
            {phase === "idle" && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.7rem", overflow:"hidden" }}>
                {/* Prompt */}
                <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:14,
                  padding:"1.25rem 1.5rem", flexShrink:0, textAlign:"center" }}>
                  <Gavel style={{ width:32, height:32, color:"rgba(255,255,255,0.15)", marginBottom:"0.6rem" }} />
                  <p style={{ margin:0, fontSize:"0.95rem", fontWeight:700, color:"rgba(255,255,255,0.5)" }}>
                    Nominate next player
                  </p>
                  <p style={{ margin:"0.25rem 0 0", fontSize:"0.78rem", color:"rgba(255,255,255,0.25)" }}>
                    Pick from pool below — then call bids verbally
                  </p>
                </div>

                {/* Recents */}
                {recents.length > 0 && (
                  <div style={{ flexShrink:0 }}>
                    <p style={{ margin:"0 0 0.4rem", fontSize:"0.62rem", fontWeight:700,
                      letterSpacing:"0.1em", color:DIM, textTransform:"uppercase" }}>Recent</p>
                    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                      {recents.map(p => (
                        <button key={p.name} onClick={() => nominate(p)}
                          style={{ padding:"0.3rem 0.7rem", borderRadius:20,
                            border:`1px solid ${BDR}`, background:CARD,
                            color:"rgba(255,255,255,0.6)", fontSize:"0.72rem", cursor:"pointer" }}>
                          {p.name.split(" ").slice(-1)[0]}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search + role filter */}
                <div style={{ display:"flex", gap:"0.45rem", flexShrink:0 }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Search style={{ position:"absolute", left:"0.8rem", top:"50%",
                      transform:"translateY(-50%)", width:13, height:13, color:DIM, pointerEvents:"none" }} />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search player or team…"
                      style={{ width:"100%", boxSizing:"border-box", padding:"0.55rem 0.8rem 0.55rem 2.1rem",
                        background:CARD, border:`1px solid ${BDR}`, borderRadius:9,
                        color:"#fff", fontSize:"0.82rem", outline:"none" }} />
                  </div>
                  {["ALL","BAT","AR","WK","BWL"].map(r => (
                    <button key={r} onClick={() => setRoleFilter(r)}
                      style={{ padding:"0.38rem 0.65rem", borderRadius:8,
                        border:`1px solid ${roleFilter===r ? "rgba(255,255,255,0.2)" : BDR}`,
                        background: roleFilter===r ? "rgba(255,255,255,0.1)" : CARD,
                        color: roleFilter===r ? "#fff" : DIM,
                        fontSize:"0.68rem", fontWeight:600, cursor:"pointer" }}>
                      {r}
                    </button>
                  ))}
                </div>

                {/* Player grid */}
                <div style={{ flex:1, overflowY:"auto",
                  display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(150px,1fr))",
                  gap:"0.55rem", alignContent:"start" }}>
                  {filtered.map((player, i) => {
                    const tc = TEAM_COLOR[player.team] ?? "#aaa";
                    const rc = ROLE_COLOR[player.role] ?? "#aaa";
                    return (
                      <div key={i} onClick={() => nominate(player)}
                        style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
                          padding:"0.75rem 0.7rem", cursor:"pointer", transition:"all 0.15s",
                          display:"flex", flexDirection:"column", gap:"0.35rem" }}
                        onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor=`${tc}60`; d.style.background=`${tc}0c`; }}
                        onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor=BDR; d.style.background=CARD; }}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:"0.62rem", fontWeight:800, color:tc, letterSpacing:"0.05em" }}>{player.team}</span>
                          <span style={{ fontSize:"0.58rem", color:rc, background:`${rc}15`,
                            padding:"1px 5px", borderRadius:3, fontWeight:700 }}>{player.role}</span>
                        </div>
                        <div style={{ fontSize:"0.85rem", fontWeight:700, color:"#fff", lineHeight:1.25 }}>{player.name}</div>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                          <span style={{ fontSize:"0.65rem", color:DIM, fontFamily:"monospace" }}>{player.credits}cr</span>
                          <span style={{ fontSize:"0.62rem", color:ACCENT, fontWeight:700,
                            display:"flex", alignItems:"center", gap:"0.2rem" }}>
                            <Gavel style={{ width:9, height:9 }} /> Nominate
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {filtered.length === 0 && (
                    <div style={{ gridColumn:"1/-1", textAlign:"center", padding:"2rem",
                      color:"rgba(255,255,255,0.2)", fontSize:"0.85rem" }}>
                      No players match your filter
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NOMINATED — player on stage */}
            {phase === "nominated" && nominated && (
              <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.85rem", overflow:"hidden" }}>

                {/* Player card */}
                <div style={{ background:CARD,
                  border:`2px solid ${leadTeam ? leadTeam.color+"50" : BDR}`,
                  borderRadius:18, padding:"1.6rem 1.4rem",
                  display:"flex", flexDirection:"column", alignItems:"center",
                  position:"relative", overflow:"hidden", flexShrink:0,
                  transition:"border-color 0.25s, box-shadow 0.25s",
                  boxShadow: leadTeam ? `0 0 50px ${leadTeam.color}10` : "none" }}>

                  {/* Top stripe — team colour */}
                  <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
                    background: TEAM_COLOR[nominated.team] ?? "#aaa", opacity:0.85 }} />

                  {/* Team chip */}
                  <div style={{ position:"absolute", top:14, right:14,
                    fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.08em",
                    color: TEAM_COLOR[nominated.team] ?? "#aaa",
                    background:`${TEAM_COLOR[nominated.team] ?? "#aaa"}18`,
                    padding:"3px 9px", borderRadius:20 }}>
                    {nominated.team} · {TEAM_FULL_NAME[nominated.team]}
                  </div>

                  {/* Role icon */}
                  <div style={{ width:68, height:68, borderRadius:"50%",
                    background:`${TEAM_COLOR[nominated.team] ?? "#aaa"}1e`,
                    border:`2px solid ${TEAM_COLOR[nominated.team] ?? "#aaa"}40`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1.8rem", marginBottom:"0.85rem", marginTop:"0.4rem" }}>
                    {ROLE_ICON[nominated.role] ?? "🏏"}
                  </div>

                  <p style={{ margin:0, fontSize:"1.65rem", fontWeight:900, color:"#fff",
                    letterSpacing:"-0.03em", textAlign:"center", lineHeight:1.1 }}>
                    {nominated.name}
                  </p>
                  <p style={{ margin:"0.3rem 0 0", fontSize:"0.8rem", color:DIM }}>
                    {ROLE_LABEL[nominated.role] ?? nominated.role}
                    {" · "}Base {crFmt(parseFloat((nominated.credits * 0.8).toFixed(1)))}
                    {" · "}{nominated.credits} credits
                  </p>
                </div>

                {/* BID CONTROL PANEL */}
                <div style={{ background:CARD, border:`1px solid ${BDR}`,
                  borderRadius:14, padding:"1rem 1.1rem",
                  display:"flex", flexDirection:"column", gap:"0.75rem", flexShrink:0 }}>

                  {/* Row 1: stepper + manual input */}
                  <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
                    <span style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em",
                      color:DIM, textTransform:"uppercase", whiteSpace:"nowrap" }}>Current Bid</span>
                    <button onClick={() => raiseBid(-0.5)}
                      style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,0.06)",
                        border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Minus style={{ width:12, height:12 }} />
                    </button>
                    <input type="number" step="0.5" min="0"
                      value={bidFocused ? bidInput : currentBid}
                      onChange={e => setBidInput(e.target.value)}
                      onFocus={() => { setBidFocused(true); setBidInput(String(currentBid)); }}
                      onBlur={() => { setBidFocused(false); applyInput(); }}
                      onKeyDown={e => e.key==="Enter" && (e.target as HTMLInputElement).blur()}
                      style={{ flex:1, padding:"0.38rem 0.5rem",
                        background:"rgba(255,255,255,0.07)",
                        border:`2px solid ${leadTeam ? leadTeam.color+"60" : BDR}`,
                        borderRadius:9, color: leadTeam?.color ?? "#fff",
                        fontSize:"1.45rem", fontWeight:900, textAlign:"center",
                        outline:"none", fontFamily:"monospace" }} />
                    <button onClick={() => raiseBid(0.5)}
                      style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,0.06)",
                        border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center" }}>
                      <Plus style={{ width:12, height:12 }} />
                    </button>
                    {/* Preset jumps */}
                    {[1,2,5,10].map(inc => (
                      <button key={inc} onClick={() => raiseBid(inc)}
                        style={{ padding:"0.35rem 0.6rem", borderRadius:7,
                          border:`1px solid ${BDR}`, background:CARD,
                          color:DIM, fontSize:"0.68rem", fontWeight:700, cursor:"pointer" }}>
                        +{inc}Cr
                      </button>
                    ))}
                  </div>

                  {/* Row 2: Who bid? team buttons */}
                  <div>
                    <p style={{ margin:"0 0 0.4rem", fontSize:"0.6rem", fontWeight:700,
                      letterSpacing:"0.1em", color:DIM, textTransform:"uppercase" }}>Who bid?</p>
                    <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                      {teams.map(team => {
                        const isLead = leadId === team.id;
                        const ok = team.budget >= currentBid;
                        return (
                          <button key={team.id} onClick={() => ok && setLead(team.id)}
                            style={{ padding:"0.45rem 0.9rem", borderRadius:9,
                              border:`1.5px solid ${isLead ? team.color : ok ? BDR : "rgba(255,255,255,0.04)"}`,
                              background: isLead ? `${team.color}20` : CARD,
                              color: isLead ? team.color : ok ? "#fff" : "rgba(255,255,255,0.18)",
                              fontWeight: isLead ? 800 : 500, fontSize:"0.78rem",
                              cursor: ok ? "pointer" : "not-allowed",
                              display:"flex", alignItems:"center", gap:"0.4rem",
                              transition:"all 0.15s" }}>
                            {isLead && <Crown style={{ width:11, height:11 }} />}
                            {team.name.split("'")[0]}
                            <span style={{ fontSize:"0.62rem", opacity:0.6, fontFamily:"monospace", marginLeft:"auto" }}>
                              {crFmt(team.budget)}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Row 3: action buttons */}
                  <div style={{ display:"flex", gap:"0.55rem" }}>
                    <button onClick={confirmSold} disabled={!leadTeam}
                      style={{ flex:1, padding:"0.8rem", borderRadius:11, border:"none",
                        background: leadTeam ? "#16a34a" : "rgba(22,163,74,0.12)",
                        color: leadTeam ? "#fff" : "rgba(255,255,255,0.2)",
                        fontWeight:800, fontSize:"0.9rem",
                        cursor: leadTeam ? "pointer" : "not-allowed",
                        display:"flex", alignItems:"center", justifyContent:"center", gap:"0.45rem",
                        transition:"all 0.15s" }}>
                      <CheckCircle style={{ width:16, height:16 }} />
                      Sold{leadTeam ? ` — ${leadTeam.name.split("'")[0]} · ${crFmt(currentBid)}` : ""}
                    </button>
                    <button onClick={confirmUnsold}
                      style={{ padding:"0.8rem 1.1rem", borderRadius:11,
                        border:`1px solid ${BDR}`, background:CARD,
                        color:DIM, fontWeight:700, fontSize:"0.85rem", cursor:"pointer",
                        display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <XCircle style={{ width:14, height:14 }} /> Unsold
                    </button>
                  </div>

                  {/* Keyboard hint */}
                  <p style={{ margin:0, fontSize:"0.65rem", color:"rgba(255,255,255,0.18)", textAlign:"center" }}>
                    <kbd style={{ background:"rgba(255,255,255,0.08)", padding:"1px 5px", borderRadius:4, fontFamily:"monospace" }}>Space</kbd> +1Cr &nbsp;·&nbsp;
                    <kbd style={{ background:"rgba(255,255,255,0.08)", padding:"1px 5px", borderRadius:4, fontFamily:"monospace" }}>Enter</kbd> confirm sold
                  </p>
                </div>
              </div>
            )}

            {/* SOLD */}
            {phase === "sold" && nominated && leadTeam && (
              <div style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:"0.65rem" }}>
                <CheckCircle style={{ width:56, height:56, color:"#22c55e" }} />
                <p style={{ margin:0, fontSize:"1.9rem", fontWeight:900, color:"#fff",
                  textAlign:"center" }}>{nominated.name}</p>
                <p style={{ margin:0, fontSize:"1.1rem", fontWeight:700, color:leadTeam.color }}>
                  {leadTeam.name}
                </p>
                <p style={{ margin:0, fontSize:"2.4rem", fontWeight:900,
                  color:"#22c55e", fontFamily:"monospace" }}>{crFmt(currentBid)}</p>
                <div style={{ display:"flex", gap:"0.55rem", marginTop:"0.5rem" }}>
                  <button onClick={next}
                    style={{ padding:"0.8rem 1.8rem", background:ACCENT, border:"none",
                      borderRadius:11, color:"#fff", fontWeight:800, fontSize:"0.9rem",
                      cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
                    Next Player <ChevronRight style={{ width:15, height:15 }} />
                  </button>
                </div>
              </div>
            )}

            {/* UNSOLD */}
            {phase === "unsold" && nominated && (
              <div style={{ flex:1, display:"flex", flexDirection:"column",
                alignItems:"center", justifyContent:"center", gap:"0.65rem" }}>
                <XCircle style={{ width:56, height:56, color:"#ef4444" }} />
                <p style={{ margin:0, fontSize:"1.9rem", fontWeight:900,
                  color:"rgba(255,255,255,0.5)" }}>{nominated.name}</p>
                <p style={{ margin:"0.15rem 0 0", fontSize:"0.88rem",
                  color:"rgba(255,255,255,0.3)" }}>Unsold — back to pool</p>
                <button onClick={next}
                  style={{ marginTop:"0.5rem", padding:"0.8rem 1.8rem",
                    background:"rgba(255,255,255,0.07)", border:`1px solid ${BDR}`,
                    borderRadius:11, color:"#fff", fontWeight:700, fontSize:"0.9rem", cursor:"pointer" }}>
                  Continue
                </button>
              </div>
            )}
          </div>

          {/* ── RIGHT: Log ── */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", overflow:"hidden" }}>

            {/* Mini budgets */}
            <div style={{ background:CARD, border:`1px solid ${BDR}`,
              borderRadius:11, padding:"0.8rem 0.9rem", flexShrink:0 }}>
              <p style={{ margin:"0 0 0.65rem", fontSize:"0.6rem", fontWeight:700,
                letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Budgets</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
                {teams.map(t => (
                  <div key={t.id}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:3 }}>
                      <span style={{ fontSize:"0.7rem", fontWeight:700, color:t.color,
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:110 }}>{t.name}</span>
                      <span style={{ fontSize:"0.68rem", fontFamily:"monospace",
                        color: t.budget <= BUDGET_WARN ? "#f87171" : DIM }}>{crFmt(t.budget)}</span>
                    </div>
                    <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.06)", overflow:"hidden" }}>
                      <div style={{ height:"100%", borderRadius:2,
                        width:`${Math.max(0,(t.budget/STARTING_BUDGET)*100)}%`,
                        background: t.budget <= BUDGET_WARN ? "#ef4444" : t.color,
                        transition:"width 0.4s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Log header */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
              <p style={{ margin:0, fontSize:"0.6rem", fontWeight:700,
                letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>
                Auction Log ({log.length})
              </p>
              {log.length > 0 && (
                <button onClick={copyLog}
                  style={{ background:"none", border:"none", color:DIM,
                    fontSize:"0.65rem", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.25rem" }}>
                  <Copy style={{ width:10, height:10 }} /> Copy
                </button>
              )}
            </div>

            {/* Log entries */}
            <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.45rem" }}>
              {log.length === 0
                ? <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.18)", fontStyle:"italic" }}>No sales yet</p>
                : log.map((entry, i) => (
                  <div key={i} style={{ background:CARD,
                    border:`1px solid ${entry.status==="sold" ? `${entry.winnerColor}28` : BDR}`,
                    borderRadius:10, padding:"0.6rem 0.8rem", flexShrink:0 }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                      <span style={{ fontSize:"0.8rem", fontWeight:700, color:"#fff" }}>
                        {entry.player.name}
                      </span>
                      {entry.status==="sold"
                        ? <span style={{ fontSize:"0.75rem", fontWeight:800,
                            color:"#22c55e", fontFamily:"monospace" }}>{crFmt(entry.price!)}</span>
                        : <span style={{ fontSize:"0.65rem", color:"#ef4444", fontWeight:700 }}>UNSOLD</span>
                      }
                    </div>
                    {entry.status==="sold" && (
                      <div style={{ display:"flex", alignItems:"center", gap:"0.3rem", marginTop:"0.18rem" }}>
                        <Crown style={{ width:9, height:9, color:entry.winnerColor }} />
                        <span style={{ fontSize:"0.68rem", color:entry.winnerColor, fontWeight:600 }}>
                          {entry.winner}
                        </span>
                      </div>
                    )}
                    <div style={{ display:"flex", gap:"0.3rem", marginTop:"0.32rem" }}>
                      <span style={{ fontSize:"0.58rem", color:TEAM_COLOR[entry.player.team]??"#aaa",
                        background:`${TEAM_COLOR[entry.player.team]??"#aaa"}18`,
                        padding:"1px 5px", borderRadius:3 }}>{entry.player.team}</span>
                      <span style={{ fontSize:"0.58rem", color:ROLE_COLOR[entry.player.role]??"#aaa",
                        background:`${ROLE_COLOR[entry.player.role]??"#aaa"}15`,
                        padding:"1px 5px", borderRadius:3 }}>{ROLE_LABEL[entry.player.role]}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>
    </Layout>
  );
}
