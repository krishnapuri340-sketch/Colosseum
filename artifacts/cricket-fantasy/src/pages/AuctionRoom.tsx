/**
 * AuctionRoom.tsx — Verbal Auction, Host-Managed v3
 *
 * KEY CHANGE: Players are NOT shown as a browsable pool by default.
 * Instead the host NOMINATES one player at a time from a search/pick overlay.
 * The centre stage shows ONE player dramatically — like a real IPL auction.
 * Once sold/unsold, the stage clears and the host picks the next.
 *
 * Classic: host picks any player in any order
 * Tier:    pool grouped T1→T4, host works through tiers
 */
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Gavel, CheckCircle, XCircle, Crown, Search,
  ChevronRight, ChevronDown, ChevronUp, RotateCcw, Plus, Minus,
  Copy, TriangleAlert, Layers, Shuffle, Zap, Users, Wallet,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_IPL_2026_PLAYERS, getPlayerTier, getTierBasePrice, TIER_CONFIG, type PlayerTier } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO, ROLE_LABEL, ROLE_ICON, ROLE_COLOR } from "@/lib/ipl-constants";

interface Player   { name:string; team:string; role:string; credits:number; nationality:string; capped:boolean; }
interface SquadEntry extends Player { price:number; tier:PlayerTier; }
interface AucTeam  { id:string; name:string; color:string; budget:number; squad:SquadEntry[]; }
interface LogEntry {
  player:Player; status:"sold"|"unsold";
  winner?:string; winnerColor?:string; price?:number;
  tier:PlayerTier; snapshot:AucTeam[];
}
type Phase     = "idle"|"revealing"|"bidding"|"sold"|"unsold";
type MobileTab = "stage"|"teams"|"log";
type AuctionMode = "classic"|"tier";

const ACCENT = "#c0192c";
const BDR    = "rgba(255,255,255,0.08)";
const CARD   = "rgba(255,255,255,0.04)";
const DIM    = "rgba(255,255,255,0.35)";
const WARN   = 10;
const BUDGET = 100;

const TIER_ORDER: PlayerTier[] = ["T1","T2","T3","T4"];
const TIER_DISPLAY = {
  T1: { emoji:"👑", label:"Marquee",   color:"#e8a020", glow:"rgba(232,160,32,0.2)"  },
  T2: { emoji:"⭐", label:"Premium",   color:"#818cf8", glow:"rgba(129,140,248,0.15)"},
  T3: { emoji:"🏏", label:"Mid-Level", color:"#34d399", glow:"rgba(52,211,153,0.12)" },
  T4: { emoji:"🌱", label:"Rookie",    color:"#94a3b8", glow:"rgba(148,163,184,0.1)" },
};

const INIT_TEAMS: AucTeam[] = [
  { id:"t1", name:"Rajveer's Army", color:"#c0392b", budget:BUDGET, squad:[] },
  { id:"t2", name:"Karan's XI",     color:"#3b82f6", budget:BUDGET, squad:[] },
  { id:"t3", name:"Arjun Plays",    color:"#a855f7", budget:BUDGET, squad:[] },
  { id:"t4", name:"Sahil FC",       color:"#f59e0b", budget:BUDGET, squad:[] },
];

function crFmt(n:number) {
  if (n===0) return "₹0";
  if (n<1)   return `₹${Math.round(n*100)}L`;
  return n%1===0 ? `₹${n}Cr` : `₹${n.toFixed(2).replace(/\.?0+$/,"")}Cr`;
}

function BudgetBar({ team, mini=false }:{ team:AucTeam; mini?:boolean }) {
  const pct = Math.max(0,(team.budget/BUDGET)*100);
  const low = team.budget<=WARN;
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
        <span style={{ fontSize:mini?"0.7rem":"0.8rem", fontWeight:700, color:team.color,
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

function TierBadge({ tier, size="sm" }:{ tier:PlayerTier; size?:"sm"|"lg" }) {
  const td  = TIER_DISPLAY[tier];
  const cfg = TIER_CONFIG[tier];
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:4,
      fontSize: size==="lg"?"0.88rem":"0.68rem", fontWeight:700, color:td.color,
      background:`${td.color}18`, border:`1px solid ${td.color}35`,
      padding: size==="lg"?"4px 12px":"2px 8px", borderRadius:20, whiteSpace:"nowrap" }}>
      {td.emoji} {td.label}
      {size==="lg" && <span style={{ opacity:0.7, fontSize:"0.75rem" }}>· Base {crFmt(cfg.basePrice)}</span>}
    </span>
  );
}

// ── Player pick overlay ────────────────────────────────────────────────
function PickOverlay({
  pool, mode, activeTier, onPick, onClose
}: {
  pool: Player[]; mode: AuctionMode; activeTier: PlayerTier;
  onPick: (p:Player)=>void; onClose:()=>void;
}) {
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("ALL");
  const [tierSel, setTierSel]   = useState<PlayerTier|"ALL">(mode==="tier" ? activeTier : "ALL");

  const filtered = useMemo(() =>
    pool
      .filter(p =>
        (roleFilter==="ALL" || p.role===roleFilter) &&
        (tierSel==="ALL" || getPlayerTier(p.credits)===tierSel) &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a,b) => b.credits - a.credits),
    [pool, roleFilter, tierSel, search]
  );

  return (
    <motion.div
      initial={{ opacity:0 }}
      animate={{ opacity:1 }}
      exit={{ opacity:0 }}
      style={{ position:"fixed", inset:0, zIndex:200,
        background:"rgba(0,0,0,0.8)", backdropFilter:"blur(6px)",
        display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale:0.93, y:20, opacity:0 }}
        animate={{ scale:1, y:0, opacity:1 }}
        exit={{ scale:0.95, y:10, opacity:0 }}
        transition={{ type:"spring", stiffness:300, damping:28 }}
        onClick={e=>e.stopPropagation()}
        style={{ width:"100%", maxWidth:620, maxHeight:"85vh",
          background:"rgba(10,11,20,0.98)", border:"1px solid rgba(255,255,255,0.12)",
          borderRadius:20, overflow:"hidden", display:"flex", flexDirection:"column",
          boxShadow:"0 30px 80px rgba(0,0,0,0.7)" }}
      >
        {/* Header */}
        <div style={{ padding:"1rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.08)",
          display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Gavel size={16} style={{ color:ACCENT }} />
            <span style={{ fontWeight:800, fontSize:"0.95rem", color:"#fff" }}>
              Nominate a Player
            </span>
            <span style={{ fontSize:"0.7rem", color:DIM }}>
              {pool.length} remaining
            </span>
          </div>
          <button onClick={onClose}
            style={{ fontSize:"1.1rem", color:DIM, background:"none", border:"none",
              cursor:"pointer", lineHeight:1 }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding:"0.75rem 1.25rem", borderBottom:"1px solid rgba(255,255,255,0.06)",
          display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1, minWidth:160 }}>
            <Search style={{ position:"absolute", left:"0.7rem", top:"50%",
              transform:"translateY(-50%)", width:13, height:13, color:DIM, pointerEvents:"none" }} />
            <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search name or team…"
              style={{ width:"100%", boxSizing:"border-box",
                padding:"0.5rem 0.7rem 0.5rem 2rem",
                background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                borderRadius:9, color:"#fff", fontSize:"0.82rem", outline:"none" }} />
          </div>
          {["ALL","BAT","AR","WK","BWL"].map(r=>(
            <button key={r} onClick={()=>setRole(r)}
              style={{ padding:"0.32rem 0.6rem", borderRadius:7, fontSize:"0.68rem",
                fontWeight:600, cursor:"pointer",
                border:`1px solid ${roleFilter===r?"rgba(255,255,255,0.2)":BDR}`,
                background:roleFilter===r?"rgba(255,255,255,0.1)":CARD,
                color:roleFilter===r?"#fff":DIM }}>
              {r}
            </button>
          ))}
          {/* Tier filter */}
          <div style={{ display:"flex", gap:4 }}>
            {(["ALL",...TIER_ORDER] as (PlayerTier|"ALL")[]).map(t=>{
              const td = t!=="ALL" ? TIER_DISPLAY[t] : null;
              return (
                <button key={t} onClick={()=>setTierSel(t)}
                  style={{ padding:"0.32rem 0.6rem", borderRadius:7, fontSize:"0.66rem",
                    fontWeight:700, cursor:"pointer",
                    background: tierSel===t ? (td?`${td.color}22`:"rgba(255,255,255,0.1)") : CARD,
                    border:`1px solid ${tierSel===t?(td?`${td.color}50`:"rgba(255,255,255,0.2)"):BDR}`,
                    color: tierSel===t ? (td?.color??"#fff") : DIM }}>
                  {t==="ALL"?"All":td?.emoji+" "+t}
                </button>
              );
            })}
          </div>
        </div>

        {/* Player list */}
        <div style={{ flex:1, overflowY:"auto" }}>
          {filtered.map((player,i)=>{
            const tc   = TEAM_COLOR[player.team]??"#aaa";
            const tier = getPlayerTier(player.credits);
            const td   = TIER_DISPLAY[tier];
            const base = getTierBasePrice(player.credits);
            return (
              <div key={i} onClick={()=>onPick(player)}
                style={{ display:"flex", alignItems:"center", gap:12,
                  padding:"0.65rem 1.25rem", cursor:"pointer",
                  borderBottom:"1px solid rgba(255,255,255,0.04)",
                  transition:"background 0.12s" }}
                onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background=`${td.color}0c`}
                onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}
              >
                <span style={{ fontSize:"1rem", width:24, textAlign:"center", flexShrink:0 }}>
                  {ROLE_ICON[player.role]??"🏏"}
                </span>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#fff",
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {player.name}
                    {!player.capped && <span style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.3)",
                      marginLeft:5 }}>UC</span>}
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:6, marginTop:2 }}>
                    <span style={{ fontSize:"0.65rem", fontWeight:700, color:tc }}>{player.team}</span>
                    <TierBadge tier={tier} size="sm" />
                  </div>
                </div>
                <div style={{ textAlign:"right", flexShrink:0 }}>
                  <div style={{ fontSize:"0.82rem", fontWeight:700, color:td.color, fontFamily:"monospace" }}>
                    {player.credits}cr
                  </div>
                  <div style={{ fontSize:"0.65rem", color:DIM }}>Base {crFmt(base)}</div>
                </div>
              </div>
            );
          })}
          {filtered.length===0&&(
            <div style={{ padding:"3rem", textAlign:"center",
              color:"rgba(255,255,255,0.2)", fontSize:"0.85rem" }}>
              No players found
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────
export default function AuctionRoom() {
  const [, navigate] = useLocation();

  const savedMode = (typeof sessionStorage!=="undefined"
    ? sessionStorage.getItem("auction_mode") : null) as AuctionMode|null;
  const [mode] = useState<AuctionMode>(savedMode??"classic");

  const [teams, setTeams]             = useState<AucTeam[]>(INIT_TEAMS);
  const soldRef                       = useRef<Set<string>>(new Set());
  const pool = useMemo(()=>ALL_IPL_2026_PLAYERS.filter(p=>!soldRef.current.has(p.name)),[teams]);

  const [activeTier, setActiveTier]   = useState<PlayerTier>("T1");
  const [phase, setPhase]             = useState<Phase>("idle");
  const [nominated, setNominated]     = useState<Player|null>(null);
  const [currentBid, setCurrentBid]   = useState(0);
  const [leadId, setLeadId]           = useState<string|null>(null);
  const [log, setLog]                 = useState<LogEntry[]>([]);
  const [showPicker, setShowPicker]   = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<string|null>(null);
  const [bidInput, setBidInput]       = useState("");
  const [bidFocused, setBidFocused]   = useState(false);
  const [mobileTab, setMobileTab]     = useState<MobileTab>("stage");

  const leadTeam = teams.find(t=>t.id===leadId)??null;
  const bidIncrement = TIER_CONFIG[nominated ? getPlayerTier(nominated.credits) : activeTier]?.increment??0.5;

  // Keyboard shortcuts
  const handleKey = useCallback((e:KeyboardEvent)=>{
    if (e.target instanceof HTMLInputElement) return;
    if (phase!=="bidding") return;
    if (e.code==="Space") { e.preventDefault(); setCurrentBid(b=>parseFloat((b+bidIncrement).toFixed(2))); }
    if (e.code==="Enter" && leadId) { e.preventDefault(); confirmSold(); }
  },[phase, leadId, bidIncrement]);
  useEffect(()=>{ window.addEventListener("keydown",handleKey); return()=>window.removeEventListener("keydown",handleKey); },[handleKey]);

  function nominate(player:Player) {
    const tier = getPlayerTier(player.credits);
    setActiveTier(tier);
    setNominated(player);
    setCurrentBid(0);
    setLeadId(null);
    setPhase("revealing");
    setShowPicker(false);
    // Dramatic reveal: after 1.8s switch to bidding
    setTimeout(()=>{ setPhase("bidding"); setCurrentBid(getTierBasePrice(player.credits)); }, 1800);
  }

  function raiseBid(d:number) {
    setCurrentBid(b=>{ const n=parseFloat((b+d).toFixed(2)); setBidInput(String(n)); return n; });
  }
  function applyInput() {
    const v=parseFloat(bidInput); if(!isNaN(v)&&v>0) setCurrentBid(v);
  }

  function confirmSold() {
    if(!nominated||!leadTeam) return;
    soldRef.current.add(nominated.name);
    const tier=getPlayerTier(nominated.credits);
    const snap=teams.map(t=>({...t,squad:[...t.squad]}));
    setTeams(prev=>prev.map(t=>
      t.id===leadId
        ?{...t, budget:parseFloat((t.budget-currentBid).toFixed(2)), squad:[...t.squad,{...nominated,price:currentBid,tier}]}
        :t
    ));
    setLog(prev=>[{player:nominated,status:"sold",winner:leadTeam.name,winnerColor:leadTeam.color,price:currentBid,tier,snapshot:snap},...prev]);
    setPhase("sold");
  }

  function confirmUnsold() {
    if(!nominated) return;
    const tier=getPlayerTier(nominated.credits);
    const snap=teams.map(t=>({...t,squad:[...t.squad]}));
    setLog(prev=>[{player:nominated,status:"unsold",tier,snapshot:snap},...prev]);
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

  const tierPools = useMemo(()=>{
    const g:Record<PlayerTier,Player[]>={T1:[],T2:[],T3:[],T4:[]};
    pool.forEach(p=>g[getPlayerTier(p.credits)].push(p));
    return g;
  },[pool]);

  // ── Centre Stage ─────────────────────────────────────────────────────

  const CentreStage = () => {
    if (phase==="idle") return (
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:"1.5rem", textAlign:"center",
        padding:"2rem" }}>
        {/* Auction header */}
        <div style={{ marginBottom:"0.5rem" }}>
          <div style={{ fontSize:"3rem", marginBottom:"0.5rem" }}>🏏</div>
          <h2 style={{ margin:0, fontSize:"1.4rem", fontWeight:900, color:"#fff",
            letterSpacing:"-0.02em" }}>
            {log.length===0 ? "Ready to Start" : "Hammer dropped"}
          </h2>
          <p style={{ margin:"0.4rem 0 0", fontSize:"0.85rem", color:DIM }}>
            {log.length===0
              ? "Nominate the first player to begin the auction"
              : `${pool.length} players remaining · ${log.filter(e=>e.status==="sold").length} sold`
            }
          </p>
        </div>

        {/* Tier progress (tier mode) */}
        {mode==="tier" && (
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", justifyContent:"center" }}>
            {TIER_ORDER.map(t=>{
              const td=TIER_DISPLAY[t];
              const total=ALL_IPL_2026_PLAYERS.filter(p=>getPlayerTier(p.credits)===t).length;
              const sold=log.filter(e=>e.tier===t&&e.status==="sold").length;
              const remaining=tierPools[t].length;
              const pct=Math.round((sold/total)*100);
              return (
                <div key={t} style={{ background:CARD, border:`1px solid ${td.color}30`,
                  borderRadius:12, padding:"0.7rem 1rem", minWidth:90, textAlign:"center" }}>
                  <div style={{ fontSize:"1.3rem" }}>{td.emoji}</div>
                  <div style={{ fontSize:"0.7rem", fontWeight:700, color:td.color, marginTop:2 }}>{td.label}</div>
                  <div style={{ fontSize:"0.65rem", color:DIM, marginTop:1 }}>{remaining} left</div>
                  <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.08)",
                    marginTop:5, overflow:"hidden" }}>
                    <div style={{ height:"100%", width:`${pct}%`, background:td.color, borderRadius:2 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={()=>setShowPicker(true)}
          style={{ display:"flex", alignItems:"center", gap:"0.6rem",
            padding:"1rem 2rem", background:ACCENT, border:"none",
            borderRadius:14, color:"#fff", fontWeight:800, fontSize:"1rem",
            cursor:"pointer", boxShadow:`0 0 30px ${ACCENT}40`,
            transition:"all 0.15s" }}>
          <Gavel size={20} />
          {log.length===0 ? "Start Auction — Nominate First Player" : "Nominate Next Player"}
        </button>

        {log.length > 0 && (
          <p style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.2)", margin:0 }}>
            or scroll the log →
          </p>
        )}
      </div>
    );

    if (phase==="revealing" && nominated) {
      const tc   = TEAM_COLOR[nominated.team]??"#aaa";
      const tier = getPlayerTier(nominated.credits);
      const td   = TIER_DISPLAY[tier];
      return (
        <div style={{ flex:1, display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", gap:"1rem",
          background:td.glow, transition:"all 0.3s" }}>
          <motion.div
            initial={{ scale:0.7, opacity:0, y:20 }}
            animate={{ scale:1, opacity:1, y:0 }}
            transition={{ type:"spring", stiffness:200, damping:18 }}
            style={{ textAlign:"center" }}
          >
            <div style={{ marginBottom:"0.5rem" }}>
              <TierBadge tier={tier} size="lg" />
            </div>
            <div style={{ fontSize:"0.75rem", fontWeight:700, color:tc,
              letterSpacing:"0.1em", marginBottom:"0.5rem" }}>
              {nominated.team} · {TEAM_FULL_NAME[nominated.team]}
            </div>
            <div style={{ fontSize:"4rem", marginBottom:"0.5rem" }}>
              {ROLE_ICON[nominated.role]??"🏏"}
            </div>
            <h1 style={{ margin:0, fontSize:"2.5rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.04em", lineHeight:1 }}>
              {nominated.name}
            </h1>
            <p style={{ margin:"0.5rem 0 0", fontSize:"0.88rem", color:DIM }}>
              {ROLE_LABEL[nominated.role]} · {nominated.credits} credits
              {!nominated.capped && " · Uncapped"}
            </p>
            <motion.div
              initial={{ opacity:0 }}
              animate={{ opacity:1 }}
              transition={{ delay:0.8 }}
              style={{ marginTop:"1rem", fontSize:"1.3rem", fontWeight:900,
                color:td.color, fontFamily:"monospace" }}>
              Base Price: {crFmt(TIER_CONFIG[tier].basePrice)}
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity:0, y:10 }}
            animate={{ opacity:0.6, y:0 }}
            transition={{ delay:1.2 }}
            style={{ fontSize:"0.78rem", color:DIM }}>
            Opening bidding shortly…
          </motion.div>
        </div>
      );
    }

    if (phase==="bidding" && nominated) {
      const tc   = TEAM_COLOR[nominated.team]??"#aaa";
      const tier = getPlayerTier(nominated.credits);
      const td   = TIER_DISPLAY[tier];
      const cfg  = TIER_CONFIG[tier];
      return (
        <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.75rem", overflow:"hidden" }}>
          {/* Player card */}
          <motion.div
            initial={{ opacity:0, scale:0.97 }}
            animate={{ opacity:1, scale:1 }}
            style={{ background: leadTeam?`${leadTeam.color}0c`:td.glow,
              border:`2px solid ${leadTeam?`${leadTeam.color}50`:`${td.color}40`}`,
              borderRadius:16, padding:"1rem 1.1rem",
              display:"flex", flexDirection:"column", alignItems:"center",
              position:"relative", overflow:"hidden", flexShrink:0,
              boxShadow:leadTeam?`0 0 40px ${leadTeam.color}12`:`0 0 24px ${td.color}10`,
              transition:"all 0.25s" }}>
            <div style={{ position:"absolute", top:0, left:0, right:0, height:3,
              background:td.color, opacity:0.9 }} />
            <div style={{ position:"absolute", top:10, left:12 }}>
              <TierBadge tier={tier} size="sm" />
            </div>
            <div style={{ position:"absolute", top:10, right:12,
              fontSize:"0.6rem", fontWeight:700, color:tc,
              background:`${tc}18`, padding:"2px 8px", borderRadius:20 }}>
              {nominated.team}
            </div>
            <div style={{ width:52, height:52, borderRadius:"50%",
              background:`${tc}20`, border:`2px solid ${tc}40`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.4rem", marginBottom:"0.6rem", marginTop:"1rem" }}>
              {ROLE_ICON[nominated.role]??"🏏"}
            </div>
            <p style={{ margin:0, fontSize:"1.35rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", textAlign:"center", lineHeight:1.1 }}>
              {nominated.name}
            </p>
            <p style={{ margin:"0.2rem 0 0.1rem", fontSize:"0.72rem", color:DIM }}>
              {ROLE_LABEL[nominated.role]} · {nominated.credits}cr
              {!nominated.capped && " · UC"}
            </p>
            <p style={{ margin:0, fontSize:"0.75rem", fontWeight:700, color:td.color }}>
              Base {crFmt(cfg.basePrice)} · +{crFmt(cfg.increment)} increments
            </p>
          </motion.div>

          {/* Bid panel */}
          <div style={{ background:CARD, border:`1px solid ${BDR}`,
            borderRadius:13, padding:"0.85rem 1rem",
            display:"flex", flexDirection:"column", gap:"0.65rem", flexShrink:0 }}>

            {/* Bid stepper */}
            <div style={{ display:"flex", alignItems:"center", gap:"0.45rem", flexWrap:"wrap" }}>
              <span style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em",
                color:DIM, textTransform:"uppercase", whiteSpace:"nowrap" }}>Current Bid</span>
              <button onClick={()=>raiseBid(-cfg.increment)}
                style={{ width:28, height:28, borderRadius:6, background:"rgba(255,255,255,0.06)",
                  border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Minus size={11} />
              </button>
              <input type="number" step={cfg.increment} min={cfg.basePrice}
                value={bidFocused?bidInput:currentBid}
                onChange={e=>setBidInput(e.target.value)}
                onFocus={()=>{ setBidFocused(true); setBidInput(String(currentBid)); }}
                onBlur={()=>{ setBidFocused(false); applyInput(); }}
                onKeyDown={e=>e.key==="Enter"&&(e.target as HTMLInputElement).blur()}
                style={{ flex:1, minWidth:55, padding:"0.32rem 0.35rem",
                  background:"rgba(255,255,255,0.07)",
                  border:`2px solid ${leadTeam?`${leadTeam.color}60`:`${td.color}40`}`,
                  borderRadius:9, color:leadTeam?.color??td.color,
                  fontSize:"1.5rem", fontWeight:900, textAlign:"center",
                  outline:"none", fontFamily:"monospace" }} />
              <button onClick={()=>raiseBid(cfg.increment)}
                style={{ width:28, height:28, borderRadius:6, background:"rgba(255,255,255,0.06)",
                  border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <Plus size={11} />
              </button>
              {[1,2,4].map(mult=>{
                const delta=parseFloat((cfg.increment*mult*4).toFixed(2));
                return (
                  <button key={mult} onClick={()=>raiseBid(delta)}
                    style={{ padding:"0.28rem 0.5rem", borderRadius:6,
                      border:`1px solid ${BDR}`, background:CARD,
                      color:DIM, fontSize:"0.62rem", fontWeight:700, cursor:"pointer" }}>
                    +{crFmt(delta)}
                  </button>
                );
              })}
            </div>

            {/* Who bid */}
            <div>
              <p style={{ margin:"0 0 0.32rem", fontSize:"0.6rem", fontWeight:700,
                letterSpacing:"0.1em", color:DIM, textTransform:"uppercase" }}>Who bid?</p>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.32rem" }}>
                {teams.map(team=>{
                  const isLead=leadId===team.id;
                  const ok=team.budget>=currentBid;
                  return (
                    <button key={team.id} onClick={()=>ok&&setLeadId(team.id)}
                      style={{ padding:"0.4rem 0.65rem", borderRadius:9,
                        border:`1.5px solid ${isLead?team.color:ok?BDR:"rgba(255,255,255,0.03)"}`,
                        background:isLead?`${team.color}20`:CARD,
                        color:isLead?team.color:ok?"#fff":"rgba(255,255,255,0.18)",
                        fontWeight:isLead?800:500, fontSize:"0.75rem",
                        cursor:ok?"pointer":"not-allowed",
                        display:"flex", alignItems:"center", gap:"0.3rem",
                        transition:"all 0.15s" }}>
                      {isLead&&<Crown size={9} style={{ flexShrink:0 }} />}
                      <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {team.name.split("'")[0]}
                      </span>
                      <span style={{ marginLeft:"auto", fontSize:"0.6rem",
                        opacity:0.55, fontFamily:"monospace" }}>
                        {crFmt(team.budget)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:"flex", gap:"0.45rem" }}>
              <button onClick={confirmSold} disabled={!leadTeam}
                style={{ flex:1, padding:"0.7rem", borderRadius:11, border:"none",
                  background:leadTeam?"#16a34a":"rgba(22,163,74,0.12)",
                  color:leadTeam?"#fff":"rgba(255,255,255,0.2)",
                  fontWeight:800, fontSize:"0.85rem",
                  cursor:leadTeam?"pointer":"not-allowed",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
                <CheckCircle size={14} />
                {leadTeam?`Sold — ${crFmt(currentBid)}`:"Sold"}
              </button>
              <button onClick={confirmUnsold}
                style={{ padding:"0.7rem 0.9rem", borderRadius:11,
                  border:`1px solid ${BDR}`, background:CARD,
                  color:DIM, fontWeight:700, fontSize:"0.8rem", cursor:"pointer",
                  display:"flex", alignItems:"center", gap:"0.32rem" }}>
                <XCircle size={12} /> Unsold
              </button>
            </div>

            <p style={{ margin:0, fontSize:"0.6rem", color:"rgba(255,255,255,0.18)", textAlign:"center" }}>
              <kbd style={{ background:"rgba(255,255,255,0.08)", padding:"1px 4px", borderRadius:3 }}>Space</kbd> +{crFmt(cfg.increment)} ·{" "}
              <kbd style={{ background:"rgba(255,255,255,0.08)", padding:"1px 4px", borderRadius:3 }}>Enter</kbd> sold
            </p>
          </div>
        </div>
      );
    }

    if (phase==="sold" && nominated && leadTeam) {
      const tier=getPlayerTier(nominated.credits);
      const td=TIER_DISPLAY[tier];
      return (
        <motion.div
          initial={{ scale:0.9, opacity:0 }}
          animate={{ scale:1, opacity:1 }}
          style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:"0.6rem" }}>
          <motion.div
            initial={{ scale:0 }}
            animate={{ scale:1 }}
            transition={{ type:"spring", stiffness:200, delay:0.1 }}
            style={{ width:64, height:64, borderRadius:"50%",
              background:"rgba(34,197,94,0.12)", border:"2px solid rgba(34,197,94,0.4)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
            <CheckCircle size={30} style={{ color:"#22c55e" }} />
          </motion.div>
          <TierBadge tier={tier} size="lg" />
          <p style={{ margin:0, fontSize:"1.6rem", fontWeight:900, color:"#fff",
            textAlign:"center", lineHeight:1.15 }}>{nominated.name}</p>
          <p style={{ margin:0, fontSize:"0.9rem", fontWeight:700, color:leadTeam.color }}>
            → {leadTeam.name}
          </p>
          <p style={{ margin:0, fontSize:"2.5rem", fontWeight:900,
            color:"#22c55e", fontFamily:"monospace" }}>{crFmt(currentBid)}</p>
          {currentBid > TIER_CONFIG[tier].basePrice && (
            <p style={{ margin:0, fontSize:"0.72rem", color:DIM }}>
              {crFmt(parseFloat((currentBid-TIER_CONFIG[tier].basePrice).toFixed(2)))} above base
            </p>
          )}
          <div style={{ display:"flex", gap:"0.6rem", marginTop:"0.5rem" }}>
            <button onClick={()=>{next();setShowPicker(true);}}
              style={{ padding:"0.75rem 1.5rem", background:ACCENT, border:"none",
                borderRadius:11, color:"#fff", fontWeight:800, fontSize:"0.9rem",
                cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <Gavel size={15} /> Nominate Next
            </button>
            <button onClick={next}
              style={{ padding:"0.75rem 1rem", background:CARD,
                border:`1px solid ${BDR}`, borderRadius:11,
                color:DIM, fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
              Review
            </button>
          </div>
        </motion.div>
      );
    }

    if (phase==="unsold" && nominated) {
      const tier=getPlayerTier(nominated.credits);
      return (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          style={{ flex:1, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:"0.55rem" }}>
          <XCircle size={48} style={{ color:"#ef4444" }} />
          <p style={{ margin:0, fontSize:"1.5rem", fontWeight:900, color:"rgba(255,255,255,0.5)" }}>
            {nominated.name}
          </p>
          <TierBadge tier={tier} size="sm" />
          <p style={{ margin:"0.1rem 0 0", fontSize:"0.82rem", color:"rgba(255,255,255,0.3)" }}>
            Unsold — returned to pool
          </p>
          <div style={{ display:"flex", gap:"0.55rem", marginTop:"0.5rem" }}>
            <button onClick={()=>{next();setShowPicker(true);}}
              style={{ padding:"0.7rem 1.4rem", background:ACCENT, border:"none",
                borderRadius:11, color:"#fff", fontWeight:800, fontSize:"0.88rem", cursor:"pointer",
                display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <Gavel size={14} /> Next Player
            </button>
            <button onClick={next}
              style={{ padding:"0.7rem 1rem", background:CARD, border:`1px solid ${BDR}`,
                borderRadius:11, color:DIM, fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
              Pause
            </button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  // ── Log entry ────────────────────────────────────────────────────────
  const LogRow = ({ entry }:{ entry:LogEntry }) => {
    const td=TIER_DISPLAY[entry.tier];
    return (
      <div style={{ background:CARD,
        border:`1px solid ${entry.status==="sold"?`${entry.winnerColor}25`:BDR}`,
        borderRadius:10, padding:"0.55rem 0.75rem", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>{entry.player.name}</span>
          {entry.status==="sold"
            ?<span style={{ fontSize:"0.72rem", fontWeight:800, color:"#22c55e", fontFamily:"monospace" }}>{crFmt(entry.price!)}</span>
            :<span style={{ fontSize:"0.62rem", color:"#ef4444", fontWeight:700 }}>UNSOLD</span>}
        </div>
        {entry.status==="sold"&&(
          <div style={{ display:"flex", alignItems:"center", gap:"0.28rem", marginTop:"0.12rem" }}>
            <Crown size={9} style={{ color:entry.winnerColor }} />
            <span style={{ fontSize:"0.65rem", color:entry.winnerColor, fontWeight:600 }}>{entry.winner}</span>
          </div>
        )}
        <div style={{ display:"flex", gap:"0.28rem", marginTop:"0.28rem", flexWrap:"wrap" }}>
          <span style={{ fontSize:"0.56rem", color:TEAM_COLOR[entry.player.team]??"#aaa",
            background:`${TEAM_COLOR[entry.player.team]??"#aaa"}18`,
            padding:"1px 4px", borderRadius:3 }}>{entry.player.team}</span>
          <span style={{ fontSize:"0.56rem", color:ROLE_COLOR[entry.player.role]??"#aaa",
            background:`${ROLE_COLOR[entry.player.role]??"#aaa"}15`,
            padding:"1px 4px", borderRadius:3 }}>{ROLE_LABEL[entry.player.role]}</span>
          <span style={{ fontSize:"0.56rem", color:td.color, background:`${td.color}15`,
            padding:"1px 4px", borderRadius:3 }}>{td.emoji}{td.label}</span>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.8rem", height:"100%", minHeight:0 }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0, gap:"0.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.7rem", minWidth:0 }}>
            <button onClick={()=>navigate("/auction")}
              style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:9,
                padding:"0.38rem 0.65rem", color:DIM, cursor:"pointer",
                display:"flex", alignItems:"center", gap:"0.3rem",
                fontSize:"0.78rem", fontWeight:600, flexShrink:0 }}>
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.15em",
                  textTransform:"uppercase", color:ACCENT }}>Verbal Auction</span>
                <span style={{ fontSize:"0.62rem", fontWeight:700,
                  color:mode==="tier"?"#e8a020":DIM,
                  background:mode==="tier"?"rgba(232,160,32,0.12)":"rgba(255,255,255,0.06)",
                  border:`1px solid ${mode==="tier"?"rgba(232,160,32,0.25)":BDR}`,
                  padding:"1px 7px", borderRadius:20 }}>
                  {mode==="tier"?"🏆 Tier":"🔀 Classic"}
                </span>
              </div>
              <h1 style={{ margin:0, fontSize:"1.2rem", fontWeight:900, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                Friday Night Draft
              </h1>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"0.45rem", flexShrink:0 }}>
            {phase==="idle" && pool.length > 0 && (
              <button onClick={()=>setShowPicker(true)}
                style={{ display:"flex", alignItems:"center", gap:"0.4rem",
                  padding:"0.42rem 0.9rem", background:ACCENT, border:"none",
                  borderRadius:9, color:"#fff", fontWeight:700, fontSize:"0.78rem",
                  cursor:"pointer" }}>
                <Gavel size={13} /> Nominate
              </button>
            )}
            {log.length>0&&(
              <button onClick={undoLast}
                style={{ display:"flex", alignItems:"center", gap:"0.28rem",
                  padding:"0.38rem 0.65rem", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.7rem", fontWeight:600, cursor:"pointer" }}>
                <RotateCcw size={10} />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}
            {log.length>0&&(
              <button onClick={()=>navigator.clipboard?.writeText(
                log.map(e=>e.status==="sold"
                  ?`[${TIER_DISPLAY[e.tier].label}] ${e.player.name} → ${e.winner} ${crFmt(e.price!)}`
                  :`[${TIER_DISPLAY[e.tier].label}] ${e.player.name} → UNSOLD`
                ).join("\n"))}
                style={{ display:"flex", alignItems:"center", gap:"0.28rem",
                  padding:"0.38rem 0.65rem", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.7rem", fontWeight:600, cursor:"pointer" }}>
                <Copy size={10} />
                <span className="hidden sm:inline">Log</span>
              </button>
            )}
            <div style={{ padding:"0.28rem 0.7rem", background:"rgba(34,197,94,0.1)",
              border:"1px solid rgba(34,197,94,0.2)", borderRadius:20,
              display:"flex", alignItems:"center", gap:"0.32rem" }}>
              <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e",
                animation:"livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize:"0.63rem", fontWeight:700, color:"#22c55e" }}>LIVE</span>
            </div>
          </div>
        </div>

        {/* ── DESKTOP 3-col ── */}
        <div className="hidden md:grid"
          style={{ gridTemplateColumns:"220px 1fr 250px", gap:"0.8rem", flex:1, minHeight:0, overflow:"hidden" }}>

          {/* Left: teams */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", overflowY:"auto" }}>
            <p style={{ margin:0, fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.12em",
              color:DIM, textTransform:"uppercase" }}>Teams</p>
            {teams.map(team=>{
              const isLead=leadId===team.id;
              const ok=team.budget>=currentBid;
              return (
                <div key={team.id}
                  onClick={()=>phase==="bidding"&&ok&&setLeadId(team.id)}
                  style={{ background:isLead?`${team.color}12`:CARD,
                    border:`1.5px solid ${isLead?team.color:BDR}`,
                    borderRadius:12, padding:"0.7rem 0.8rem",
                    cursor:phase==="bidding"&&ok?"pointer":"default",
                    opacity:phase==="bidding"&&!ok?0.4:1,
                    transition:"all 0.18s" }}>
                  <BudgetBar team={team} />
                  {phase==="bidding"&&ok&&(
                    <div style={{ display:"flex", gap:"0.28rem", marginTop:"0.45rem" }}>
                      {[1,2,4,8].map(mult=>{
                        const delta=parseFloat((bidIncrement*mult).toFixed(2));
                        const next=parseFloat((currentBid+delta).toFixed(2));
                        const can=team.budget>=next;
                        return (
                          <button key={mult}
                            onClick={e=>{e.stopPropagation();if(can){setLeadId(team.id);setCurrentBid(next);setBidInput(String(next));}}}
                            style={{ flex:1, padding:"0.22rem 0", borderRadius:5,
                              border:`1px solid ${can?`${team.color}40`:BDR}`,
                              background:can?`${team.color}14`:"transparent",
                              color:can?team.color:"rgba(255,255,255,0.15)",
                              fontSize:"0.58rem", fontWeight:700,
                              cursor:can?"pointer":"not-allowed" }}>
                            +{crFmt(delta)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isLead&&phase==="bidding"&&(
                    <div style={{ marginTop:"0.32rem", fontSize:"0.63rem",
                      color:team.color, fontWeight:700,
                      display:"flex", alignItems:"center", gap:"0.22rem" }}>
                      <Crown size={9} /> {crFmt(currentBid)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Squads */}
            <p style={{ margin:"0.35rem 0 0", fontSize:"0.6rem", fontWeight:700,
              letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Squads</p>
            {teams.map(team=>(
              <div key={team.id} style={{ background:CARD, border:`1px solid ${BDR}`,
                borderRadius:10, overflow:"hidden", marginBottom:"0.35rem" }}>
                <div onClick={()=>setExpandedTeam(expandedTeam===team.id?null:team.id)}
                  style={{ padding:"0.55rem 0.75rem", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    borderBottom:expandedTeam===team.id?`1px solid ${BDR}`:"none" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.38rem" }}>
                    <div style={{ width:6, height:6, borderRadius:"50%", background:team.color }} />
                    <span style={{ fontSize:"0.73rem", fontWeight:700, color:"#fff" }}>
                      {team.name.split("'")[0]}
                    </span>
                  </div>
                  <span style={{ fontSize:"0.6rem", color:DIM }}>
                    {team.squad.length}p · {crFmt(team.budget)}
                  </span>
                </div>
                <AnimatePresence>
                  {expandedTeam===team.id&&(
                    <motion.div initial={{ height:0 }} animate={{ height:"auto" }} exit={{ height:0 }}
                      transition={{ duration:0.18 }} style={{ overflow:"hidden" }}>
                      <div style={{ padding:"0.38rem 0.55rem", maxHeight:180, overflowY:"auto",
                        display:"flex", flexDirection:"column", gap:"0.22rem" }}>
                        {team.squad.length===0
                          ?<span style={{ fontSize:"0.67rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>Empty</span>
                          :team.squad.map((p,i)=>(
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.38rem",
                              padding:"0.22rem 0.38rem", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
                              <span style={{ fontSize:"0.55rem", color:TIER_DISPLAY[p.tier].color }}>
                                {TIER_DISPLAY[p.tier].emoji}
                              </span>
                              <span style={{ fontSize:"0.68rem", color:"#fff", flex:1,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {p.name}
                              </span>
                              <span style={{ fontSize:"0.6rem", color:DIM, fontFamily:"monospace" }}>
                                {crFmt(p.price)}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

          {/* Centre: stage */}
          <div style={{ display:"flex", flexDirection:"column", overflow:"hidden",
            background:"rgba(255,255,255,0.02)", border:`1px solid ${BDR}`,
            borderRadius:16 }}>
            <CentreStage />
          </div>

          {/* Right: mini budgets + log */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", overflowY:"auto" }}>
            <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
              padding:"0.7rem 0.8rem", flexShrink:0 }}>
              <p style={{ margin:"0 0 0.5rem", fontSize:"0.58rem", fontWeight:700,
                letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Budgets</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                {teams.map(t=><BudgetBar key={t.id} team={t} mini />)}
              </div>
            </div>
            <p style={{ margin:0, fontSize:"0.58rem", fontWeight:700,
              letterSpacing:"0.12em", color:DIM, textTransform:"uppercase", flexShrink:0 }}>
              Log ({log.length})
            </p>
            {log.length===0
              ?<p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>
                No sales yet
              </p>
              :log.map((e,i)=><LogRow key={i} entry={e} />)
            }
          </div>
        </div>

        {/* ── MOBILE ── */}
        <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden gap-3">
          <div style={{ display:"flex", gap:"0.38rem", flexShrink:0 }}>
            {(["stage","Stage"],["teams","Teams"],["log","Log"]).map ?
              ([["stage","Stage"],["teams","Teams"],["log",`Log${log.length>0?" ("+log.length+")":""}`]] as [MobileTab,string][])
              .map(([tab,lbl])=>(
                <button key={tab} onClick={()=>setMobileTab(tab)}
                  style={{ flex:1, padding:"0.42rem", borderRadius:9,
                    border:`1px solid ${mobileTab===tab?"rgba(255,255,255,0.2)":BDR}`,
                    background:mobileTab===tab?"rgba(255,255,255,0.1)":CARD,
                    color:mobileTab===tab?"#fff":DIM,
                    fontSize:"0.78rem", fontWeight:600, cursor:"pointer" }}>
                  {lbl}
                </button>
              )) : null}
          </div>
          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column",
            background:mobileTab==="stage"?"rgba(255,255,255,0.02)":"transparent",
            border:mobileTab==="stage"?`1px solid ${BDR}`:"none",
            borderRadius:mobileTab==="stage"?14:0 }}>
            {mobileTab==="stage" && <CentreStage />}
            {mobileTab==="teams" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {teams.map(team=>{
                  const isLead=leadId===team.id;
                  const ok=team.budget>=currentBid;
                  return (
                    <div key={team.id}
                      onClick={()=>phase==="bidding"&&ok&&setLeadId(team.id)}
                      style={{ background:isLead?`${team.color}12`:CARD,
                        border:`1.5px solid ${isLead?team.color:BDR}`,
                        borderRadius:12, padding:"0.85rem",
                        cursor:phase==="bidding"&&ok?"pointer":"default",
                        opacity:phase==="bidding"&&!ok?0.4:1 }}>
                      <BudgetBar team={team} />
                      {isLead&&phase==="bidding"&&(
                        <div style={{ marginTop:"0.38rem", fontSize:"0.68rem",
                          color:team.color, fontWeight:700,
                          display:"flex", alignItems:"center", gap:"0.28rem" }}>
                          <Crown size={10} /> Leading — {crFmt(currentBid)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {mobileTab==="log" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                {log.length===0
                  ?<p style={{ textAlign:"center", padding:"2rem", fontSize:"0.82rem",
                      color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No sales yet</p>
                  :log.map((e,i)=><LogRow key={i} entry={e} />)
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Player picker overlay */}
      <AnimatePresence>
        {showPicker && (
          <PickOverlay
            pool={pool} mode={mode} activeTier={activeTier}
            onPick={nominate} onClose={()=>setShowPicker(false)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.35}}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </Layout>
  );
}
