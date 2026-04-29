import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Gavel, CheckCircle, XCircle, Crown, Search,
  ChevronRight, ChevronDown, RotateCcw, Plus, Minus,
  Copy, TriangleAlert, History,
} from "lucide-react";
import { ALL_IPL_2026_PLAYERS as IPL_2026_PLAYERS } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, TEAM_FULL_NAME, ROLE_LABEL, ROLE_ICON, ROLE_COLOR } from "@/lib/ipl-constants";

interface Player   { name:string; team:string; role:string; credits:number; }
interface SquadEntry extends Player { price:number; }
interface AucTeam  { id:string; name:string; color:string; budget:number; squad:SquadEntry[]; }
interface LogEntry { player:Player; status:"sold"|"unsold"; winner?:string; winnerColor?:string; price?:number; snapshot:AucTeam[]; }
type Phase = "idle"|"nominated"|"sold"|"unsold";
type MobileTab = "pool"|"teams"|"log";

const ACCENT = "#c0192c";
const BDR    = "rgba(255,255,255,0.08)";
const CARD   = "rgba(255,255,255,0.04)";
const DIM    = "rgba(255,255,255,0.35)";
const WARN   = 10;
const BUDGET = 100;

const INIT_TEAMS: AucTeam[] = [
  { id:"t1", name:"Rajveer's Army", color:"#c0392b", budget:BUDGET, squad:[] },
  { id:"t2", name:"Karan's XI",     color:"#3b82f6", budget:BUDGET, squad:[] },
  { id:"t3", name:"Arjun Plays",    color:"#a855f7", budget:BUDGET, squad:[] },
  { id:"t4", name:"Sahil FC",       color:"#f59e0b", budget:BUDGET, squad:[] },
];

const crFmt = (n:number) => n===0 ? "₹0" : n%1===0 ? `₹${n}Cr` : `₹${n.toFixed(1)}Cr`;

function BudgetBar({ team, mini=false }:{ team:AucTeam; mini?:boolean }) {
  const pct = Math.max(0,(team.budget/BUDGET)*100);
  const low = team.budget <= WARN;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontSize: mini?"0.7rem":"0.8rem", fontWeight:700, color:team.color,
          overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:130 }}>
          {team.name}
        </span>
        <span style={{ fontSize:"0.7rem", fontFamily:"monospace",
          color:low?"#f87171":DIM, fontWeight:low?700:400 }}>
          {crFmt(team.budget)}
          {low && <TriangleAlert style={{ width:9,height:9,marginLeft:2,display:"inline" }} />}
        </span>
      </div>
      <div style={{ height:mini?3:4, borderRadius:2, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
        <div style={{ height:"100%", borderRadius:2, width:`${pct}%`,
          background:low?"#ef4444":team.color, transition:"width 0.4s" }} />
      </div>
      {!mini && <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.25)" }}>{team.squad.length} players</span>}
    </div>
  );
}

export default function AuctionRoom() {
  const [, navigate] = useLocation();
  const [teams, setTeams]           = useState<AucTeam[]>(INIT_TEAMS);
  const soldRef = useRef<Set<string>>(new Set());
  const pool    = useMemo(() => IPL_2026_PLAYERS.filter(p=>!soldRef.current.has(p.name)),[teams]);

  const [phase, setPhase]           = useState<Phase>("idle");
  const [nominated, setNominated]   = useState<Player|null>(null);
  const [currentBid, setCurrentBid] = useState(0);
  const [leadId, setLeadId]         = useState<string|null>(null);
  const [log, setLog]               = useState<LogEntry[]>([]);
  const [search, setSearch]         = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [expandedTeam, setExpandedTeam] = useState<string|null>(null);
  const [bidInput, setBidInput]     = useState("");
  const [bidFocused, setBidFocused] = useState(false);
  const [recents, setRecents]       = useState<Player[]>([]);
  const [mobileTab, setMobileTab]   = useState<MobileTab>("pool");
  const [showLog, setShowLog]       = useState(false);

  const leadTeam = teams.find(t=>t.id===leadId)??null;

  const handleKey = useCallback((e:KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (phase!=="nominated") return;
    if (e.code==="Space") { e.preventDefault(); setCurrentBid(b=>parseFloat((b+1).toFixed(1))); }
    if (e.code==="Enter" && leadId) { e.preventDefault(); confirmSold(); }
  },[phase,leadId,currentBid]);

  useEffect(() => {
    window.addEventListener("keydown",handleKey);
    return ()=>window.removeEventListener("keydown",handleKey);
  },[handleKey]);

  function nominate(player:Player) {
    setNominated(player);
    const base = parseFloat((player.credits*0.8).toFixed(1));
    setCurrentBid(base); setBidInput(String(base));
    setLeadId(null); setPhase("nominated"); setSearch("");
    setRecents(r=>[player,...r.filter(p=>p.name!==player.name)].slice(0,5));
    setMobileTab("pool"); // show stage on mobile
  }

  function raiseBid(d:number) {
    setCurrentBid(b=>{ const n=parseFloat((b+d).toFixed(1)); setBidInput(String(n)); return n; });
  }

  function applyInput() {
    const v=parseFloat(bidInput); if(!isNaN(v)&&v>0) setCurrentBid(v);
  }

  function confirmSold() {
    if(!nominated||!leadTeam) return;
    soldRef.current.add(nominated.name);
    const snap = teams.map(t=>({...t,squad:[...t.squad]}));
    setTeams(prev=>prev.map(t=>
      t.id===leadId
        ? {...t, budget:parseFloat((t.budget-currentBid).toFixed(1)), squad:[...t.squad,{...nominated,price:currentBid}]}
        : t
    ));
    setLog(prev=>[{player:nominated,status:"sold",winner:leadTeam.name,winnerColor:leadTeam.color,price:currentBid,snapshot:snap},...prev]);
    setPhase("sold");
  }

  function confirmUnsold() {
    if(!nominated) return;
    const snap=teams.map(t=>({...t,squad:[...t.squad]}));
    setLog(prev=>[{player:nominated,status:"unsold",snapshot:snap},...prev]);
    setPhase("unsold");
  }

  function undoLast() {
    if(!log.length) return;
    const [last,...rest]=log;
    if(last.status==="sold") soldRef.current.delete(last.player.name);
    setTeams(last.snapshot.map(t=>({...t,squad:[...t.squad]})));
    setLog(rest); setPhase("idle"); setNominated(null); setLeadId(null);
  }

  function next() { setNominated(null);setLeadId(null);setCurrentBid(0);setPhase("idle"); }

  const filtered = pool
    .filter(p=>(roleFilter==="ALL"||p.role===roleFilter)&&(!search||p.name.toLowerCase().includes(search.toLowerCase())||p.team.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>b.credits-a.credits);

  // ── STAGE (shared between desktop centre and mobile) ──────────────
  const Stage = () => (
    <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem", height:"100%", minHeight:0 }}>

      {/* IDLE */}
      {phase==="idle" && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.65rem", overflow:"hidden" }}>
          <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:14,
            padding:"1rem 1.25rem", flexShrink:0, textAlign:"center" }}>
            <Gavel style={{ width:28, height:28, color:"rgba(255,255,255,0.15)", marginBottom:"0.5rem" }} />
            <p style={{ margin:0, fontSize:"0.9rem", fontWeight:700, color:"rgba(255,255,255,0.45)" }}>
              Nominate next player
            </p>
            <p style={{ margin:"0.2rem 0 0", fontSize:"0.75rem", color:"rgba(255,255,255,0.22)" }}>
              Search below, then call bids verbally
            </p>
          </div>

          {recents.length>0 && (
            <div style={{ flexShrink:0 }}>
              <p style={{ margin:"0 0 0.35rem", fontSize:"0.6rem", fontWeight:700,
                letterSpacing:"0.1em", color:DIM, textTransform:"uppercase" }}>Recent</p>
              <div style={{ display:"flex", gap:"0.35rem", flexWrap:"wrap" }}>
                {recents.map(p=>(
                  <button key={p.name} onClick={()=>nominate(p)}
                    style={{ padding:"0.28rem 0.65rem", borderRadius:20,
                      border:`1px solid ${BDR}`, background:CARD,
                      color:"rgba(255,255,255,0.6)", fontSize:"0.72rem", cursor:"pointer" }}>
                    {p.name.split(" ").slice(-1)[0]}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ display:"flex", gap:"0.4rem", flexShrink:0, flexWrap:"wrap" }}>
            <div style={{ flex:1, minWidth:160, position:"relative" }}>
              <Search style={{ position:"absolute", left:"0.75rem", top:"50%",
                transform:"translateY(-50%)", width:13, height:13, color:DIM, pointerEvents:"none" }} />
              <input value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search player or team…"
                style={{ width:"100%", boxSizing:"border-box",
                  padding:"0.55rem 0.75rem 0.55rem 2rem",
                  background:CARD, border:`1px solid ${BDR}`, borderRadius:9,
                  color:"#fff", fontSize:"0.82rem", outline:"none" }} />
            </div>
            <div style={{ display:"flex", gap:"0.3rem", flexWrap:"wrap" }}>
              {["ALL","BAT","AR","WK","BWL"].map(r=>(
                <button key={r} onClick={()=>setRoleFilter(r)}
                  style={{ padding:"0.4rem 0.55rem", borderRadius:7,
                    border:`1px solid ${roleFilter===r?"rgba(255,255,255,0.2)":BDR}`,
                    background:roleFilter===r?"rgba(255,255,255,0.1)":CARD,
                    color:roleFilter===r?"#fff":DIM,
                    fontSize:"0.68rem", fontWeight:600, cursor:"pointer" }}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex:1, overflowY:"auto",
            display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",
            gap:"0.5rem", alignContent:"start" }}>
            {filtered.map((player,i)=>{
              const tc=TEAM_COLOR[player.team]??"#aaa";
              const rc=ROLE_COLOR[player.role]??"#aaa";
              return (
                <div key={i} onClick={()=>nominate(player)}
                  style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
                    padding:"0.7rem", cursor:"pointer", transition:"all 0.15s",
                    display:"flex", flexDirection:"column", gap:"0.3rem" }}
                  onMouseEnter={e=>{ const d=e.currentTarget as HTMLDivElement; d.style.borderColor=`${tc}60`; d.style.background=`${tc}0c`; }}
                  onMouseLeave={e=>{ const d=e.currentTarget as HTMLDivElement; d.style.borderColor=BDR; d.style.background=CARD; }}>
                  <div style={{ display:"flex", justifyContent:"space-between" }}>
                    <span style={{ fontSize:"0.6rem", fontWeight:800, color:tc }}>{player.team}</span>
                    <span style={{ fontSize:"0.58rem", color:rc, background:`${rc}15`,
                      padding:"1px 4px", borderRadius:3, fontWeight:700 }}>{player.role}</span>
                  </div>
                  <div style={{ fontSize:"0.82rem", fontWeight:700, color:"#fff", lineHeight:1.2 }}>{player.name}</div>
                  <div style={{ fontSize:"0.62rem", color:DIM, fontFamily:"monospace" }}>{player.credits}cr</div>
                </div>
              );
            })}
            {filtered.length===0 && (
              <div style={{ gridColumn:"1/-1", textAlign:"center",
                padding:"2rem", color:"rgba(255,255,255,0.2)", fontSize:"0.82rem" }}>
                No players found
              </div>
            )}
          </div>
        </div>
      )}

      {/* NOMINATED */}
      {phase==="nominated" && nominated && (
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.75rem", overflow:"hidden" }}>
          {/* Player card */}
          <div style={{ background:CARD,
            border:`2px solid ${leadTeam?leadTeam.color+"50":BDR}`,
            borderRadius:16, padding:"1.25rem 1.1rem",
            display:"flex", flexDirection:"column", alignItems:"center",
            position:"relative", overflow:"hidden", flexShrink:0,
            boxShadow:leadTeam?`0 0 40px ${leadTeam.color}10`:"none",
            transition:"border-color 0.25s, box-shadow 0.25s" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:4,
              background:TEAM_COLOR[nominated.team]??"#aaa", opacity:0.85 }} />
            <div style={{ position:"absolute", top:10, right:12,
              fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em",
              color:TEAM_COLOR[nominated.team]??"#aaa",
              background:`${TEAM_COLOR[nominated.team]??"#aaa"}18`,
              padding:"2px 8px", borderRadius:20 }}>
              {nominated.team}
            </div>
            <div style={{ width:60, height:60, borderRadius:"50%",
              background:`${TEAM_COLOR[nominated.team]??"#aaa"}1e`,
              border:`2px solid ${TEAM_COLOR[nominated.team]??"#aaa"}40`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.6rem", marginBottom:"0.7rem", marginTop:"0.3rem" }}>
              {ROLE_ICON[nominated.role]??"🏏"}
            </div>
            <p style={{ margin:0, fontSize:"1.4rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", textAlign:"center", lineHeight:1.1 }}>
              {nominated.name}
            </p>
            <p style={{ margin:"0.25rem 0 0", fontSize:"0.75rem", color:DIM }}>
              {ROLE_LABEL[nominated.role]} · Base {crFmt(parseFloat((nominated.credits*0.8).toFixed(1)))}
            </p>
          </div>

          {/* Bid panel */}
          <div style={{ background:CARD, border:`1px solid ${BDR}`,
            borderRadius:14, padding:"0.85rem 1rem",
            display:"flex", flexDirection:"column", gap:"0.7rem", flexShrink:0 }}>

            {/* Stepper row */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexWrap:"wrap" }}>
              <span style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em",
                color:DIM, textTransform:"uppercase", whiteSpace:"nowrap" }}>Bid</span>
              <button onClick={()=>raiseBid(-0.5)}
                style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,0.06)",
                  border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Minus style={{ width:12, height:12 }} />
              </button>
              <input type="number" step="0.5" min="0"
                value={bidFocused?bidInput:currentBid}
                onChange={e=>setBidInput(e.target.value)}
                onFocus={()=>{ setBidFocused(true); setBidInput(String(currentBid)); }}
                onBlur={()=>{ setBidFocused(false); applyInput(); }}
                onKeyDown={e=>e.key==="Enter"&&(e.target as HTMLInputElement).blur()}
                style={{ flex:1, minWidth:60, padding:"0.35rem 0.4rem",
                  background:"rgba(255,255,255,0.07)",
                  border:`2px solid ${leadTeam?leadTeam.color+"60":BDR}`,
                  borderRadius:9, color:leadTeam?.color??"#fff",
                  fontSize:"1.4rem", fontWeight:900, textAlign:"center",
                  outline:"none", fontFamily:"monospace" }} />
              <button onClick={()=>raiseBid(0.5)}
                style={{ width:30, height:30, borderRadius:7, background:"rgba(255,255,255,0.06)",
                  border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Plus style={{ width:12, height:12 }} />
              </button>
              {[1,2,5].map(inc=>(
                <button key={inc} onClick={()=>raiseBid(inc)}
                  style={{ padding:"0.32rem 0.55rem", borderRadius:7,
                    border:`1px solid ${BDR}`, background:CARD,
                    color:DIM, fontSize:"0.65rem", fontWeight:700, cursor:"pointer" }}>
                  +{inc}
                </button>
              ))}
            </div>

            {/* Who bid row */}
            <div>
              <p style={{ margin:"0 0 0.35rem", fontSize:"0.6rem", fontWeight:700,
                letterSpacing:"0.1em", color:DIM, textTransform:"uppercase" }}>Who bid?</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.35rem" }}>
                {teams.map(team=>{
                  const isLead=leadId===team.id;
                  const ok=team.budget>=currentBid;
                  return (
                    <button key={team.id} onClick={()=>ok&&setLeadId(team.id)}
                      style={{ padding:"0.42rem 0.7rem", borderRadius:9,
                        border:`1.5px solid ${isLead?team.color:ok?BDR:"rgba(255,255,255,0.03)"}`,
                        background:isLead?`${team.color}20`:CARD,
                        color:isLead?team.color:ok?"#fff":"rgba(255,255,255,0.18)",
                        fontWeight:isLead?800:500, fontSize:"0.75rem",
                        cursor:ok?"pointer":"not-allowed",
                        display:"flex", alignItems:"center", gap:"0.3rem",
                        transition:"all 0.15s", overflow:"hidden" }}>
                      {isLead&&<Crown style={{ width:10, height:10, flexShrink:0 }} />}
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {team.name.split("'")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display:"flex", gap:"0.5rem" }}>
              <button onClick={confirmSold} disabled={!leadTeam}
                style={{ flex:1, padding:"0.75rem", borderRadius:11, border:"none",
                  background:leadTeam?"#16a34a":"rgba(22,163,74,0.12)",
                  color:leadTeam?"#fff":"rgba(255,255,255,0.2)",
                  fontWeight:800, fontSize:"0.85rem",
                  cursor:leadTeam?"pointer":"not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
                <CheckCircle style={{ width:15, height:15 }} />
                {leadTeam?`Sold — ${crFmt(currentBid)}`:"Sold"}
              </button>
              <button onClick={confirmUnsold}
                style={{ padding:"0.75rem 1rem", borderRadius:11,
                  border:`1px solid ${BDR}`, background:CARD,
                  color:DIM, fontWeight:700, fontSize:"0.82rem", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:"0.35rem" }}>
                <XCircle style={{ width:13, height:13 }} /> Unsold
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOLD */}
      {phase==="sold" && nominated && leadTeam && (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:"0.6rem" }}>
          <CheckCircle style={{ width:52, height:52, color:"#22c55e" }} />
          <p style={{ margin:0, fontSize:"1.6rem", fontWeight:900, color:"#fff", textAlign:"center" }}>{nominated.name}</p>
          <p style={{ margin:0, fontSize:"1rem", fontWeight:700, color:leadTeam.color }}>{leadTeam.name}</p>
          <p style={{ margin:0, fontSize:"2rem", fontWeight:900, color:"#22c55e", fontFamily:"monospace" }}>{crFmt(currentBid)}</p>
          <button onClick={next}
            style={{ marginTop:"0.5rem", padding:"0.75rem 1.6rem",
              background:ACCENT, border:"none", borderRadius:11,
              color:"#fff", fontWeight:800, fontSize:"0.88rem", cursor:"pointer",
              display:"flex", alignItems:"center", gap:"0.4rem" }}>
            Next Player <ChevronRight style={{ width:14, height:14 }} />
          </button>
        </div>
      )}

      {/* UNSOLD */}
      {phase==="unsold" && nominated && (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:"0.6rem" }}>
          <XCircle style={{ width:52, height:52, color:"#ef4444" }} />
          <p style={{ margin:0, fontSize:"1.6rem", fontWeight:900, color:"rgba(255,255,255,0.5)" }}>{nominated.name}</p>
          <p style={{ margin:"0.15rem 0 0", fontSize:"0.85rem", color:"rgba(255,255,255,0.3)" }}>Back to pool</p>
          <button onClick={next}
            style={{ marginTop:"0.5rem", padding:"0.75rem 1.6rem",
              background:"rgba(255,255,255,0.07)", border:`1px solid ${BDR}`,
              borderRadius:11, color:"#fff", fontWeight:700, fontSize:"0.88rem", cursor:"pointer" }}>
            Continue
          </button>
        </div>
      )}
    </div>
  );

  return (
    <Layout>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem", height:"100%", minHeight:0 }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexShrink:0, gap:"0.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", minWidth:0 }}>
            <button onClick={()=>navigate("/auction")}
              style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:9,
                padding:"0.4rem 0.7rem", color:DIM, cursor:"pointer",
                display:"flex", alignItems:"center", gap:"0.3rem",
                fontSize:"0.78rem", fontWeight:600, flexShrink:0 }}>
              <ArrowLeft style={{ width:13, height:13 }} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.15em",
                textTransform:"uppercase", color:ACCENT }}>Verbal Auction</div>
              <h1 style={{ margin:0, fontSize:"1.3rem", fontWeight:900, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                Friday Night Draft
              </h1>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", flexShrink:0 }}>
            {log.length>0 && (
              <button onClick={undoLast}
                style={{ display:"flex", alignItems:"center", gap:"0.3rem",
                  padding:"0.4rem 0.7rem", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.72rem", fontWeight:600, cursor:"pointer" }}>
                <RotateCcw style={{ width:11, height:11 }} />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}
            {log.length>0 && (
              <button onClick={()=>navigator.clipboard?.writeText(
                log.map(e=>e.status==="sold"?`${e.player.name} → ${e.winner} ${crFmt(e.price!)}`:`${e.player.name} → UNSOLD`).join("\n")
              )}
                style={{ display:"flex", alignItems:"center", gap:"0.3rem",
                  padding:"0.4rem 0.7rem", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.72rem", fontWeight:600, cursor:"pointer" }}>
                <Copy style={{ width:11, height:11 }} />
                <span className="hidden sm:inline">Log</span>
              </button>
            )}
            <div style={{ padding:"0.3rem 0.75rem", background:"rgba(34,197,94,0.1)",
              border:"1px solid rgba(34,197,94,0.2)", borderRadius:20,
              display:"flex", alignItems:"center", gap:"0.35rem" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e",
                animation:"livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize:"0.65rem", fontWeight:700, color:"#22c55e" }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP 3-col ── */}
        <div className="hidden md:grid" style={{
          gridTemplateColumns:"240px 1fr 260px",
          gap:"0.85rem", flex:1, minHeight:0, overflow:"hidden",
        }}>
          {/* Left: teams */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem", overflowY:"auto" }}>
            {teams.map(team=>{
              const isLead=leadId===team.id;
              const ok=team.budget>=currentBid;
              return (
                <div key={team.id}
                  onClick={()=>phase==="nominated"&&ok&&setLeadId(team.id)}
                  style={{ background:isLead?`${team.color}12`:CARD,
                    border:`1.5px solid ${isLead?team.color:BDR}`,
                    borderRadius:12, padding:"0.75rem 0.85rem",
                    cursor:phase==="nominated"&&ok?"pointer":"default",
                    opacity:phase==="nominated"&&!ok?0.4:1,
                    transition:"all 0.18s" }}>
                  <BudgetBar team={team} />
                  {phase==="nominated"&&ok&&(
                    <div style={{ display:"flex", gap:"0.3rem", marginTop:"0.5rem" }}>
                      {[0.5,1,2,5].map(inc=>{
                        const next=parseFloat((currentBid+inc).toFixed(1));
                        const can=team.budget>=next;
                        return (
                          <button key={inc}
                            onClick={e=>{e.stopPropagation();if(can){setLeadId(team.id);setCurrentBid(next);setBidInput(String(next));}}}
                            style={{ flex:1, padding:"0.25rem 0", borderRadius:5,
                              border:`1px solid ${can?`${team.color}40`:BDR}`,
                              background:can?`${team.color}14`:"transparent",
                              color:can?team.color:"rgba(255,255,255,0.15)",
                              fontSize:"0.6rem", fontWeight:700,
                              cursor:can?"pointer":"not-allowed" }}>
                            +{inc}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isLead&&phase==="nominated"&&(
                    <div style={{ marginTop:"0.35rem", fontSize:"0.65rem",
                      color:team.color, fontWeight:700,
                      display:"flex", alignItems:"center", gap:"0.25rem" }}>
                      <Crown style={{ width:9, height:9 }} /> {crFmt(currentBid)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Squad expand */}
            <div style={{ marginTop:"0.25rem" }}>
              {teams.map(team=>(
                <div key={team.id} style={{ background:CARD, border:`1px solid ${BDR}`,
                  borderRadius:10, overflow:"hidden", marginBottom:"0.4rem" }}>
                  <div onClick={()=>setExpandedTeam(expandedTeam===team.id?null:team.id)}
                    style={{ padding:"0.6rem 0.8rem", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      borderBottom:expandedTeam===team.id?`1px solid ${BDR}`:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:team.color }} />
                      <span style={{ fontSize:"0.75rem", fontWeight:700, color:"#fff" }}>{team.name.split("'")[0]}</span>
                    </div>
                    <span style={{ fontSize:"0.62rem", color:DIM }}>{team.squad.length}p</span>
                  </div>
                  {expandedTeam===team.id&&(
                    <div style={{ padding:"0.4rem 0.6rem", maxHeight:160, overflowY:"auto",
                      display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                      {team.squad.length===0
                        ? <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No players yet</span>
                        : team.squad.map((p,i)=>(
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.4rem",
                            padding:"0.25rem 0.4rem", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
                            <span style={{ fontSize:"0.58rem", fontWeight:700,
                              color:ROLE_COLOR[p.role]??"#aaa",
                              background:`${ROLE_COLOR[p.role]??"#aaa"}15`,
                              padding:"1px 4px", borderRadius:3, minWidth:24, textAlign:"center" }}>
                              {p.role}
                            </span>
                            <span style={{ fontSize:"0.7rem", color:"#fff", flex:1,
                              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                              {p.name}
                            </span>
                            <span style={{ fontSize:"0.62rem", color:DIM, fontFamily:"monospace" }}>
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
          </div>

          {/* Centre: stage */}
          <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <Stage />
          </div>

          {/* Right: log */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem", overflowY:"auto" }}>
            <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
              padding:"0.75rem 0.85rem", flexShrink:0 }}>
              <p style={{ margin:"0 0 0.55rem", fontSize:"0.6rem", fontWeight:700,
                letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Budgets</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {teams.map(t=><BudgetBar key={t.id} team={t} mini />)}
              </div>
            </div>
            <p style={{ margin:0, fontSize:"0.6rem", fontWeight:700,
              letterSpacing:"0.12em", color:DIM, textTransform:"uppercase", flexShrink:0 }}>
              Log ({log.length})
            </p>
            {log.length===0
              ? <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No sales yet</p>
              : log.map((e,i)=>(
                <div key={i} style={{ background:CARD,
                  border:`1px solid ${e.status==="sold"?`${e.winnerColor}25`:BDR}`,
                  borderRadius:10, padding:"0.55rem 0.75rem", flexShrink:0 }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                    <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>{e.player.name}</span>
                    {e.status==="sold"
                      ? <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#22c55e", fontFamily:"monospace" }}>{crFmt(e.price!)}</span>
                      : <span style={{ fontSize:"0.62rem", color:"#ef4444", fontWeight:700 }}>UNSOLD</span>}
                  </div>
                  {e.status==="sold"&&(
                    <div style={{ display:"flex", alignItems:"center", gap:"0.28rem", marginTop:"0.15rem" }}>
                      <Crown style={{ width:9, height:9, color:e.winnerColor }} />
                      <span style={{ fontSize:"0.65rem", color:e.winnerColor, fontWeight:600 }}>{e.winner}</span>
                    </div>
                  )}
                  <div style={{ display:"flex", gap:"0.28rem", marginTop:"0.28rem" }}>
                    <span style={{ fontSize:"0.56rem", color:TEAM_COLOR[e.player.team]??"#aaa",
                      background:`${TEAM_COLOR[e.player.team]??"#aaa"}18`,
                      padding:"1px 4px", borderRadius:3 }}>{e.player.team}</span>
                    <span style={{ fontSize:"0.56rem", color:ROLE_COLOR[e.player.role]??"#aaa",
                      background:`${ROLE_COLOR[e.player.role]??"#aaa"}15`,
                      padding:"1px 4px", borderRadius:3 }}>{ROLE_LABEL[e.player.role]}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* ── MOBILE: tab bar + single-pane ── */}
        <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden gap-3">
          {/* Tab switcher */}
          <div style={{ display:"flex", gap:"0.4rem", flexShrink:0 }}>
            {([["pool","Stage"],["teams","Teams"],["log","Log"]] as [MobileTab,string][]).map(([tab,lbl])=>(
              <button key={tab} onClick={()=>setMobileTab(tab)}
                style={{ flex:1, padding:"0.45rem", borderRadius:9,
                  border:`1px solid ${mobileTab===tab?"rgba(255,255,255,0.2)":BDR}`,
                  background:mobileTab===tab?"rgba(255,255,255,0.1)":CARD,
                  color:mobileTab===tab?"#fff":DIM,
                  fontSize:"0.78rem", fontWeight:600, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"0.3rem" }}>
                {tab==="log"&&log.length>0&&(
                  <span style={{ background:ACCENT, color:"#fff", borderRadius:20,
                    fontSize:"0.6rem", fontWeight:700, padding:"0px 5px" }}>{log.length}</span>
                )}
                {lbl}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {mobileTab==="pool" && <Stage />}

            {mobileTab==="teams" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.55rem" }}>
                {teams.map(team=>{
                  const isLead=leadId===team.id;
                  const ok=team.budget>=currentBid;
                  return (
                    <div key={team.id}
                      onClick={()=>phase==="nominated"&&ok&&setLeadId(team.id)}
                      style={{ background:isLead?`${team.color}12`:CARD,
                        border:`1.5px solid ${isLead?team.color:BDR}`,
                        borderRadius:12, padding:"0.85rem",
                        cursor:phase==="nominated"&&ok?"pointer":"default",
                        opacity:phase==="nominated"&&!ok?0.4:1 }}>
                      <BudgetBar team={team} />
                      {phase==="nominated"&&ok&&(
                        <div style={{ display:"flex", gap:"0.35rem", marginTop:"0.55rem" }}>
                          {[0.5,1,2,5].map(inc=>{
                            const next=parseFloat((currentBid+inc).toFixed(1));
                            const can=team.budget>=next;
                            return (
                              <button key={inc}
                                onClick={e=>{e.stopPropagation();if(can){setLeadId(team.id);setCurrentBid(next);setBidInput(String(next));}}}
                                style={{ flex:1, padding:"0.32rem 0", borderRadius:6,
                                  border:`1px solid ${can?`${team.color}40`:BDR}`,
                                  background:can?`${team.color}14`:"transparent",
                                  color:can?team.color:"rgba(255,255,255,0.15)",
                                  fontSize:"0.65rem", fontWeight:700, cursor:can?"pointer":"not-allowed" }}>
                                +{inc}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {isLead&&(
                        <div style={{ marginTop:"0.4rem", fontSize:"0.68rem",
                          color:team.color, fontWeight:700,
                          display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <Crown style={{ width:10, height:10 }} /> Leading — {crFmt(currentBid)}
                        </div>
                      )}
                      {/* Squad */}
                      {team.squad.length>0&&(
                        <div style={{ marginTop:"0.6rem", paddingTop:"0.55rem",
                          borderTop:`1px solid ${BDR}`, display:"flex", flexDirection:"column", gap:"0.25rem" }}>
                          {team.squad.slice(0,3).map((p,i)=>(
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
                              <span style={{ fontSize:"0.58rem", fontWeight:700,
                                color:ROLE_COLOR[p.role]??"#aaa" }}>{p.role}</span>
                              <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.7)", flex:1,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {p.name}
                              </span>
                              <span style={{ fontSize:"0.62rem", color:DIM, fontFamily:"monospace" }}>
                                {crFmt(p.price)}
                              </span>
                            </div>
                          ))}
                          {team.squad.length>3&&(
                            <span style={{ fontSize:"0.62rem", color:DIM }}>
                              +{team.squad.length-3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {mobileTab==="log" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                {log.length===0
                  ? <p style={{ textAlign:"center", padding:"2rem", fontSize:"0.82rem",
                      color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No sales yet</p>
                  : log.map((e,i)=>(
                    <div key={i} style={{ background:CARD,
                      border:`1px solid ${e.status==="sold"?`${e.winnerColor}25`:BDR}`,
                      borderRadius:10, padding:"0.65rem 0.85rem" }}>
                      <div style={{ display:"flex", justifyContent:"space-between" }}>
                        <span style={{ fontSize:"0.82rem", fontWeight:700, color:"#fff" }}>{e.player.name}</span>
                        {e.status==="sold"
                          ? <span style={{ fontSize:"0.75rem", fontWeight:800, color:"#22c55e", fontFamily:"monospace" }}>{crFmt(e.price!)}</span>
                          : <span style={{ fontSize:"0.65rem", color:"#ef4444", fontWeight:700 }}>UNSOLD</span>}
                      </div>
                      {e.status==="sold"&&(
                        <div style={{ fontSize:"0.7rem", color:e.winnerColor, fontWeight:600, marginTop:"0.15rem" }}>
                          → {e.winner}
                        </div>
                      )}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.35}} input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0} input[type=number]{-moz-appearance:textfield}`}</style>
    </Layout>
  );
}
