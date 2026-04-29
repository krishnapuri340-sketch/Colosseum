/**
 * AuctionRoom.tsx — Verbal Auction, Host-Managed
 * 
 * MODE: Classic  → random pool, all players together, sort by credits
 * MODE: Tier     → T1 Marquee → T2 Premium → T3 Mid-Level → T4 Rookie
 *                  each tier has its own base price & bid increment
 *                  host works through tiers in order
 * 
 * Base prices:
 *   T1 Marquee   ₹2.0 Cr   (+₹0.50 increments)
 *   T2 Premium   ₹1.0 Cr   (+₹0.25 increments)
 *   T3 Mid-Level ₹0.5 Cr   (+₹0.10 increments)
 *   T4 Rookie    ₹0.25 Cr  (+₹0.05 increments)
 */
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Gavel, CheckCircle, XCircle, Crown, Search,
  ChevronRight, ChevronDown, ChevronUp, RotateCcw, Plus, Minus,
  Copy, TriangleAlert, Layers, Shuffle,
} from "lucide-react";
import { ALL_IPL_2026_PLAYERS, getPlayerTier, getTierBasePrice, TIER_CONFIG, type PlayerTier } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, TEAM_FULL_NAME, ROLE_LABEL, ROLE_ICON, ROLE_COLOR } from "@/lib/ipl-constants";

// ── Types ──────────────────────────────────────────────────────────────
interface Player { name:string; team:string; role:string; credits:number; nationality:string; capped:boolean; }
interface SquadEntry extends Player { price:number; tier:PlayerTier; }
interface AucTeam { id:string; name:string; color:string; budget:number; squad:SquadEntry[]; }
interface LogEntry {
  player:Player; status:"sold"|"unsold";
  winner?:string; winnerColor?:string; price?:number;
  tier:PlayerTier; snapshot:AucTeam[];
}
type Phase     = "idle"|"nominated"|"sold"|"unsold";
type MobileTab = "pool"|"teams"|"log";
type AuctionMode = "classic"|"tier";

// ── Constants ──────────────────────────────────────────────────────────
const ACCENT  = "#c0192c";
const BDR     = "rgba(255,255,255,0.08)";
const CARD    = "rgba(255,255,255,0.04)";
const DIM     = "rgba(255,255,255,0.35)";
const WARN    = 10;
const BUDGET  = 100;

// Tier display config
const TIER_ORDER: PlayerTier[] = ["T1","T2","T3","T4"];
const TIER_DISPLAY = {
  T1: { emoji:"👑", label:"Marquee",   color:"#e8a020", glow:"rgba(232,160,32,0.15)" },
  T2: { emoji:"⭐", label:"Premium",   color:"#818cf8", glow:"rgba(129,140,248,0.12)" },
  T3: { emoji:"🏏", label:"Mid-Level", color:"#34d399", glow:"rgba(52,211,153,0.10)" },
  T4: { emoji:"🌱", label:"Rookie",    color:"#94a3b8", glow:"rgba(148,163,184,0.08)" },
};

const INIT_TEAMS: AucTeam[] = [
  { id:"t1", name:"Rajveer's Army", color:"#c0392b", budget:BUDGET, squad:[] },
  { id:"t2", name:"Karan's XI",     color:"#3b82f6", budget:BUDGET, squad:[] },
  { id:"t3", name:"Arjun Plays",    color:"#a855f7", budget:BUDGET, squad:[] },
  { id:"t4", name:"Sahil FC",       color:"#f59e0b", budget:BUDGET, squad:[] },
];

// Formats
function crFmt(n:number) {
  if (n === 0) return "₹0";
  if (n < 1)   return `₹${Math.round(n * 100)}L`;   // e.g. ₹50L, ₹25L
  return n % 1 === 0 ? `₹${n}Cr` : `₹${n.toFixed(2).replace(/\.?0+$/, "")}Cr`;
}

// ── BudgetBar ──────────────────────────────────────────────────────────
function BudgetBar({ team, mini=false }: { team:AucTeam; mini?:boolean }) {
  const pct = Math.max(0, (team.budget / BUDGET) * 100);
  const low = team.budget <= WARN;
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

// ── TierBadge ─────────────────────────────────────────────────────────
function TierBadge({ tier, size="sm" }: { tier:PlayerTier; size?:"xs"|"sm"|"lg" }) {
  const t   = TIER_DISPLAY[tier];
  const cfg = TIER_CONFIG[tier];
  const fs  = size==="xs"?"0.58rem": size==="lg"?"0.9rem":"0.68rem";
  const px  = size==="xs"?"4px": size==="lg"?"10px":"6px";
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.25rem",
      fontSize:fs, fontWeight:700, color:t.color,
      background:`${t.color}18`, border:`1px solid ${t.color}35`,
      padding:`2px ${px}`, borderRadius:20, whiteSpace:"nowrap" }}>
      {t.emoji} {t.label}
      {size==="lg" && <span style={{ opacity:0.7, fontSize:"0.75rem" }}>· Base {crFmt(cfg.basePrice)}</span>}
    </span>
  );
}

// ── Main Component ─────────────────────────────────────────────────────
export default function AuctionRoom() {
  const [, navigate]    = useLocation();

  // Read mode from sessionStorage (set by CreateAuction)
  const savedMode = (typeof sessionStorage !== "undefined" ? sessionStorage.getItem("auction_mode") : null) as AuctionMode | null;
  const [mode]          = useState<AuctionMode>(savedMode ?? "classic");

  const [teams, setTeams]             = useState<AucTeam[]>(INIT_TEAMS);
  const soldRef                       = useRef<Set<string>>(new Set());

  // Pool derived from mode
  const pool = useMemo(() =>
    ALL_IPL_2026_PLAYERS.filter(p => !soldRef.current.has(p.name)),
    // eslint-disable-next-line
    [teams]
  );

  // For tier mode: which tier is currently being auctioned
  const [activeTier, setActiveTier]   = useState<PlayerTier>("T1");
  const [collapsedTiers, setCollapsedTiers] = useState<Set<PlayerTier>>(new Set(["T2","T3","T4"]));

  // Phase
  const [phase, setPhase]             = useState<Phase>("idle");
  const [nominated, setNominated]     = useState<Player|null>(null);
  const [currentBid, setCurrentBid]   = useState(0);
  const [leadId, setLeadId]           = useState<string|null>(null);
  const [log, setLog]                 = useState<LogEntry[]>([]);

  // Filters (classic mode)
  const [search, setSearch]           = useState("");
  const [roleFilter, setRoleFilter]   = useState("ALL");
  const [expandedTeam, setExpandedTeam] = useState<string|null>(null);

  // Bid input
  const [bidInput, setBidInput]       = useState("");
  const [bidFocused, setBidFocused]   = useState(false);

  // Mobile
  const [mobileTab, setMobileTab]     = useState<MobileTab>("pool");

  const leadTeam = teams.find(t => t.id === leadId) ?? null;

  // Current bid increment based on active tier
  const bidIncrement = TIER_CONFIG[activeTier]?.increment ?? 0.5;

  // Keyboard shortcuts
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    if (phase !== "nominated") return;
    if (e.code === "Space") {
      e.preventDefault();
      setCurrentBid(b => parseFloat((b + bidIncrement).toFixed(2)));
    }
    if (e.code === "Enter" && leadId) {
      e.preventDefault();
      confirmSold();
    }
  }, [phase, leadId, bidIncrement]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Actions ─────────────────────────────────────────────────────────
  function nominate(player: Player) {
    const tier      = getPlayerTier(player.credits);
    const basePrice = getTierBasePrice(player.credits);
    setActiveTier(tier);
    setNominated(player);
    setCurrentBid(basePrice);
    setBidInput(String(basePrice));
    setLeadId(null);
    setPhase("nominated");
    setSearch("");
    setMobileTab("pool");
  }

  function raiseBid(delta: number) {
    setCurrentBid(b => {
      const n = parseFloat((b + delta).toFixed(2));
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
    const tier = getPlayerTier(nominated.credits);
    const snap = teams.map(t => ({ ...t, squad:[...t.squad] }));
    setTeams(prev => prev.map(t =>
      t.id === leadId
        ? { ...t, budget: parseFloat((t.budget - currentBid).toFixed(2)), squad:[...t.squad, { ...nominated, price:currentBid, tier }] }
        : t
    ));
    setLog(prev => [{ player:nominated, status:"sold", winner:leadTeam.name, winnerColor:leadTeam.color, price:currentBid, tier, snapshot:snap }, ...prev]);
    setPhase("sold");
  }

  function confirmUnsold() {
    if (!nominated) return;
    const tier = getPlayerTier(nominated.credits);
    const snap = teams.map(t => ({ ...t, squad:[...t.squad] }));
    setLog(prev => [{ player:nominated, status:"unsold", tier, snapshot:snap }, ...prev]);
    setPhase("unsold");
  }

  function undoLast() {
    if (!log.length) return;
    const [last, ...rest] = log;
    if (last.status === "sold") soldRef.current.delete(last.player.name);
    setTeams(last.snapshot.map(t => ({ ...t, squad:[...t.squad] })));
    setLog(rest);
    setPhase("idle");
    setNominated(null);
    setLeadId(null);
  }

  function next() {
    setNominated(null);
    setLeadId(null);
    setCurrentBid(0);
    setPhase("idle");
  }

  // Filtered pool — classic mode
  const filteredClassic = pool
    .filter(p =>
      (roleFilter === "ALL" || p.role === roleFilter) &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => b.credits - a.credits);

  // Tier pool — group by tier
  const tierPools = useMemo(() => {
    const groups: Record<PlayerTier, Player[]> = { T1:[], T2:[], T3:[], T4:[] };
    pool.forEach(p => groups[getPlayerTier(p.credits)].push(p));
    Object.values(groups).forEach(arr => arr.sort((a,b) => b.credits - a.credits));
    return groups;
  }, [pool]);

  // Tier progress stats
  const tierStats = useMemo(() => {
    const total = ALL_IPL_2026_PLAYERS;
    const stats: Record<PlayerTier, { total:number; sold:number; remaining:number }> = {} as any;
    TIER_ORDER.forEach(t => {
      const totalInTier  = total.filter(p => getPlayerTier(p.credits) === t).length;
      const soldInTier   = log.filter(e => e.tier === t && e.status === "sold").length;
      const remaining    = tierPools[t].length;
      stats[t] = { total:totalInTier, sold:soldInTier, remaining };
    });
    return stats;
  }, [log, tierPools]);

  // ── Pool display components ──────────────────────────────────────────

  function PlayerCard({ player, onClick }: { player:Player; onClick:()=>void }) {
    const tc   = TEAM_COLOR[player.team] ?? "#aaa";
    const tier = getPlayerTier(player.credits);
    const td   = TIER_DISPLAY[tier];
    const base = getTierBasePrice(player.credits);
    return (
      <div onClick={onClick}
        style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
          padding:"0.7rem", cursor:"pointer", transition:"all 0.15s",
          display:"flex", flexDirection:"column", gap:"0.3rem",
          position:"relative", overflow:"hidden" }}
        onMouseEnter={e => { const d=e.currentTarget as HTMLDivElement; d.style.borderColor=`${td.color}50`; d.style.background=td.glow; }}
        onMouseLeave={e => { const d=e.currentTarget as HTMLDivElement; d.style.borderColor=BDR; d.style.background=CARD; }}>
        {/* Tier colour strip */}
        <div style={{ position:"absolute", top:0, left:0, right:0, height:2,
          background:td.color, opacity:0.6 }} />
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginTop:2 }}>
          <span style={{ fontSize:"0.6rem", fontWeight:800, color:tc }}>{player.team}</span>
          <TierBadge tier={tier} size="xs" />
        </div>
        <div style={{ fontSize:"0.8rem", fontWeight:700, color:"#fff", lineHeight:1.2 }}>{player.name}</div>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <span style={{ fontSize:"0.6rem", color:ROLE_COLOR[player.role]??"#aaa",
            background:`${ROLE_COLOR[player.role]??"#aaa"}15`,
            padding:"1px 4px", borderRadius:3, fontWeight:700 }}>
            {player.role}
          </span>
          <span style={{ fontSize:"0.65rem", fontFamily:"monospace", color:td.color, fontWeight:700 }}>
            Base {crFmt(base)}
          </span>
        </div>
        {!player.capped && (
          <div style={{ fontSize:"0.55rem", color:"rgba(255,255,255,0.3)", fontWeight:600, letterSpacing:"0.05em" }}>
            UNCAPPED
          </div>
        )}
      </div>
    );
  }

  function ClassicPool() {
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.65rem", overflow:"hidden" }}>
        {/* Search + role filter */}
        <div style={{ display:"flex", gap:"0.4rem", flexShrink:0, flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:140, position:"relative" }}>
            <Search style={{ position:"absolute", left:"0.7rem", top:"50%", transform:"translateY(-50%)",
              width:12, height:12, color:DIM, pointerEvents:"none" }} />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search player or team…"
              style={{ width:"100%", boxSizing:"border-box",
                padding:"0.5rem 0.7rem 0.5rem 1.9rem",
                background:CARD, border:`1px solid ${BDR}`, borderRadius:9,
                color:"#fff", fontSize:"0.82rem", outline:"none" }} />
          </div>
          {["ALL","BAT","AR","WK","BWL"].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              style={{ padding:"0.38rem 0.55rem", borderRadius:7,
                border:`1px solid ${roleFilter===r?"rgba(255,255,255,0.2)":BDR}`,
                background:roleFilter===r?"rgba(255,255,255,0.1)":CARD,
                color:roleFilter===r?"#fff":DIM,
                fontSize:"0.66rem", fontWeight:600, cursor:"pointer" }}>
              {r}
            </button>
          ))}
        </div>

        <div style={{ flex:1, overflowY:"auto",
          display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(135px,1fr))",
          gap:"0.45rem", alignContent:"start" }}>
          {filteredClassic.map((player, i) => (
            <PlayerCard key={i} player={player} onClick={() => nominate(player)} />
          ))}
          {filteredClassic.length === 0 && (
            <div style={{ gridColumn:"1/-1", textAlign:"center",
              padding:"2rem", color:"rgba(255,255,255,0.2)", fontSize:"0.82rem" }}>
              No players found
            </div>
          )}
        </div>
      </div>
    );
  }

  function TierPool() {
    return (
      <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
        {TIER_ORDER.map(tier => {
          const td      = TIER_DISPLAY[tier];
          const cfg     = TIER_CONFIG[tier];
          const players = tierPools[tier];
          const stats   = tierStats[tier];
          const isActive = activeTier === tier;
          const isCollapsed = collapsedTiers.has(tier);

          return (
            <div key={tier} style={{
              background: isActive ? td.glow : CARD,
              border:`1.5px solid ${isActive ? `${td.color}50` : BDR}`,
              borderRadius:14, overflow:"hidden",
              transition:"all 0.2s",
              boxShadow: isActive ? `0 0 24px ${td.color}15` : "none"
            }}>
              {/* Tier header */}
              <div
                onClick={() => {
                  setActiveTier(tier);
                  setCollapsedTiers(prev => {
                    const next = new Set(prev);
                    if (next.has(tier)) next.delete(tier); else next.add(tier);
                    return next;
                  });
                }}
                style={{ padding:"0.85rem 1rem", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"space-between",
                  borderBottom: isCollapsed ? "none" : `1px solid ${td.color}25` }}>

                <div style={{ display:"flex", alignItems:"center", gap:"0.65rem" }}>
                  <span style={{ fontSize:"1.3rem" }}>{td.emoji}</span>
                  <div>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                      <span style={{ fontSize:"0.9rem", fontWeight:800, color:td.color }}>
                        {td.label}
                      </span>
                      {isActive && (
                        <span style={{ fontSize:"0.62rem", fontWeight:700,
                          color:td.color, background:`${td.color}20`,
                          padding:"1px 7px", borderRadius:20, letterSpacing:"0.08em" }}>
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize:"0.68rem", color:DIM, marginTop:2 }}>
                      Base {crFmt(cfg.basePrice)} · +{crFmt(cfg.increment)} increments
                    </div>
                  </div>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:"0.7rem" }}>
                  {/* Progress */}
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:"0.72rem", fontWeight:700, color:td.color }}>
                      {stats.remaining} left
                    </div>
                    <div style={{ fontSize:"0.6rem", color:DIM }}>
                      {stats.sold}/{stats.total} sold
                    </div>
                  </div>
                  {/* Mini progress bar */}
                  <div style={{ width:48, height:4, borderRadius:2, background:"rgba(255,255,255,0.08)", overflow:"hidden" }}>
                    <div style={{ height:"100%", borderRadius:2, width:`${Math.round((stats.sold/Math.max(stats.total,1))*100)}%`, background:td.color, transition:"width 0.4s" }} />
                  </div>
                  {isCollapsed
                    ? <ChevronDown style={{ width:14, height:14, color:DIM }} />
                    : <ChevronUp   style={{ width:14, height:14, color:DIM }} />}
                </div>
              </div>

              {/* Player grid */}
              {!isCollapsed && (
                <div style={{ padding:"0.75rem",
                  display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",
                  gap:"0.45rem" }}>
                  {players.length === 0 ? (
                    <div style={{ gridColumn:"1/-1", textAlign:"center",
                      padding:"1rem", fontSize:"0.78rem",
                      color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>
                      All {td.label} players sold ✓
                    </div>
                  ) : players.map((player, i) => (
                    <PlayerCard key={i} player={player} onClick={() => nominate(player)} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Nominated player stage ───────────────────────────────────────────
  function NominatedStage() {
    if (!nominated) return null;
    const tier = getPlayerTier(nominated.credits);
    const td   = TIER_DISPLAY[tier];
    const cfg  = TIER_CONFIG[tier];
    const tc   = TEAM_COLOR[nominated.team] ?? "#aaa";

    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.75rem", overflow:"hidden" }}>

        {/* Player card */}
        <div style={{ background:leadTeam ? `${leadTeam.color}0a` : td.glow,
          border:`2px solid ${leadTeam ? `${leadTeam.color}50` : `${td.color}50`}`,
          borderRadius:16, padding:"1.1rem 1rem",
          display:"flex", flexDirection:"column", alignItems:"center",
          position:"relative", overflow:"hidden", flexShrink:0,
          boxShadow: leadTeam ? `0 0 40px ${leadTeam.color}12` : `0 0 30px ${td.color}10`,
          transition:"all 0.25s" }}>

          {/* Tier colour strip */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:td.color, opacity:0.9 }} />

          {/* Tier badge + team */}
          <div style={{ position:"absolute", top:10, left:12 }}>
            <TierBadge tier={tier} size="sm" />
          </div>
          <div style={{ position:"absolute", top:10, right:12,
            fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.08em",
            color:tc, background:`${tc}18`, padding:"2px 8px", borderRadius:20 }}>
            {nominated.team} · {TEAM_FULL_NAME[nominated.team] ?? ""}
          </div>

          {/* Role icon */}
          <div style={{ width:56, height:56, borderRadius:"50%",
            background:`${tc}20`, border:`2px solid ${tc}40`,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:"1.5rem", marginBottom:"0.65rem", marginTop:"1.2rem" }}>
            {ROLE_ICON[nominated.role] ?? "🏏"}
          </div>

          <p style={{ margin:0, fontSize:"1.4rem", fontWeight:900, color:"#fff",
            letterSpacing:"-0.03em", textAlign:"center", lineHeight:1.1 }}>
            {nominated.name}
          </p>
          <p style={{ margin:"0.25rem 0 0.1rem", fontSize:"0.72rem", color:DIM }}>
            {ROLE_LABEL[nominated.role]} · {nominated.credits} credits
            {!nominated.capped && " · Uncapped"}
          </p>
          <p style={{ margin:0, fontSize:"0.8rem", fontWeight:700, color:td.color }}>
            Base Price: {crFmt(cfg.basePrice)} · Increment: +{crFmt(cfg.increment)}
          </p>
        </div>

        {/* Bid panel */}
        <div style={{ background:CARD, border:`1px solid ${BDR}`,
          borderRadius:14, padding:"0.85rem 1rem",
          display:"flex", flexDirection:"column", gap:"0.65rem", flexShrink:0 }}>

          {/* Bid stepper */}
          <div style={{ display:"flex", alignItems:"center", gap:"0.45rem", flexWrap:"wrap" }}>
            <span style={{ fontSize:"0.6rem", fontWeight:700, letterSpacing:"0.1em",
              color:DIM, textTransform:"uppercase", whiteSpace:"nowrap" }}>Bid</span>
            <button onClick={() => raiseBid(-cfg.increment)}
              style={{ width:28, height:28, borderRadius:6, background:"rgba(255,255,255,0.06)",
                border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Minus style={{ width:11, height:11 }} />
            </button>
            <input type="number" step={cfg.increment} min={cfg.basePrice}
              value={bidFocused ? bidInput : currentBid}
              onChange={e => setBidInput(e.target.value)}
              onFocus={() => { setBidFocused(true); setBidInput(String(currentBid)); }}
              onBlur={() => { setBidFocused(false); applyInput(); }}
              onKeyDown={e => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              style={{ flex:1, minWidth:55, padding:"0.32rem 0.35rem",
                background:"rgba(255,255,255,0.07)",
                border:`2px solid ${leadTeam ? `${leadTeam.color}60` : `${td.color}40`}`,
                borderRadius:9, color: leadTeam?.color ?? td.color,
                fontSize:"1.35rem", fontWeight:900, textAlign:"center",
                outline:"none", fontFamily:"monospace" }} />
            <button onClick={() => raiseBid(cfg.increment)}
              style={{ width:28, height:28, borderRadius:6, background:"rgba(255,255,255,0.06)",
                border:`1px solid ${BDR}`, color:DIM, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <Plus style={{ width:11, height:11 }} />
            </button>
            {/* Quick jump presets — tier-aware */}
            {[1, 2, 5].map(mult => {
              const delta = parseFloat((cfg.increment * mult * 4).toFixed(2));
              return (
                <button key={mult} onClick={() => raiseBid(delta)}
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
              {teams.map(team => {
                const isLead = leadId === team.id;
                const ok     = team.budget >= currentBid;
                return (
                  <button key={team.id} onClick={() => ok && setLeadId(team.id)}
                    style={{ padding:"0.4rem 0.65rem", borderRadius:9,
                      border:`1.5px solid ${isLead ? team.color : ok ? BDR : "rgba(255,255,255,0.03)"}`,
                      background: isLead ? `${team.color}20` : CARD,
                      color: isLead ? team.color : ok ? "#fff" : "rgba(255,255,255,0.18)",
                      fontWeight: isLead ? 800 : 500, fontSize:"0.75rem",
                      cursor: ok ? "pointer" : "not-allowed",
                      display:"flex", alignItems:"center", gap:"0.3rem",
                      transition:"all 0.15s", overflow:"hidden" }}>
                    {isLead && <Crown style={{ width:9, height:9, flexShrink:0 }} />}
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

          {/* Action buttons */}
          <div style={{ display:"flex", gap:"0.45rem" }}>
            <button onClick={confirmSold} disabled={!leadTeam}
              style={{ flex:1, padding:"0.7rem", borderRadius:11, border:"none",
                background: leadTeam ? "#16a34a" : "rgba(22,163,74,0.12)",
                color: leadTeam ? "#fff" : "rgba(255,255,255,0.2)",
                fontWeight:800, fontSize:"0.85rem",
                cursor: leadTeam ? "pointer" : "not-allowed",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
              <CheckCircle style={{ width:14, height:14 }} />
              {leadTeam ? `Sold — ${crFmt(currentBid)}` : "Sold"}
            </button>
            <button onClick={confirmUnsold}
              style={{ padding:"0.7rem 0.9rem", borderRadius:11,
                border:`1px solid ${BDR}`, background:CARD,
                color:DIM, fontWeight:700, fontSize:"0.8rem", cursor:"pointer",
                display:"flex", alignItems:"center", gap:"0.32rem" }}>
              <XCircle style={{ width:12, height:12 }} /> Unsold
            </button>
          </div>

          <p style={{ margin:0, fontSize:"0.62rem", color:"rgba(255,255,255,0.18)", textAlign:"center" }}>
            <kbd style={{ background:"rgba(255,255,255,0.08)", padding:"1px 4px", borderRadius:3, fontFamily:"monospace" }}>Space</kbd> +{crFmt(cfg.increment)}&nbsp;·&nbsp;
            <kbd style={{ background:"rgba(255,255,255,0.08)", padding:"1px 4px", borderRadius:3, fontFamily:"monospace" }}>Enter</kbd> confirm sold
          </p>
        </div>
      </div>
    );
  }

  // ── Sold/Unsold screens ──────────────────────────────────────────────
  function SoldScreen() {
    if (!nominated || !leadTeam) return null;
    const tier = getPlayerTier(nominated.credits);
    const td   = TIER_DISPLAY[tier];
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:"0.6rem" }}>
        <div style={{ width:60, height:60, borderRadius:"50%",
          background:"rgba(34,197,94,0.12)", border:"2px solid #22c55e50",
          display:"flex", alignItems:"center", justifyContent:"center" }}>
          <CheckCircle style={{ width:30, height:30, color:"#22c55e" }} />
        </div>
        <TierBadge tier={tier} size="lg" />
        <p style={{ margin:0, fontSize:"1.55rem", fontWeight:900, color:"#fff", textAlign:"center", lineHeight:1.15 }}>
          {nominated.name}
        </p>
        <p style={{ margin:0, fontSize:"0.9rem", fontWeight:700, color:leadTeam.color }}>
          → {leadTeam.name}
        </p>
        <p style={{ margin:0, fontSize:"2.2rem", fontWeight:900,
          color:"#22c55e", fontFamily:"monospace" }}>
          {crFmt(currentBid)}
        </p>
        <div style={{ fontSize:"0.72rem", color:DIM }}>
          Base was {crFmt(getTierBasePrice(nominated.credits))}
          {currentBid > getTierBasePrice(nominated.credits) &&
            ` · paid ${crFmt(parseFloat((currentBid - getTierBasePrice(nominated.credits)).toFixed(2)))} above base`
          }
        </div>
        <button onClick={next}
          style={{ marginTop:"0.35rem", padding:"0.7rem 1.5rem",
            background:ACCENT, border:"none", borderRadius:11,
            color:"#fff", fontWeight:800, fontSize:"0.88rem", cursor:"pointer",
            display:"flex", alignItems:"center", gap:"0.4rem" }}>
          Next Player <ChevronRight style={{ width:14, height:14 }} />
        </button>
      </div>
    );
  }

  function UnsoldScreen() {
    if (!nominated) return null;
    const tier = getPlayerTier(nominated.credits);
    return (
      <div style={{ flex:1, display:"flex", flexDirection:"column",
        alignItems:"center", justifyContent:"center", gap:"0.55rem" }}>
        <XCircle style={{ width:48, height:48, color:"#ef4444" }} />
        <TierBadge tier={tier} size="sm" />
        <p style={{ margin:0, fontSize:"1.5rem", fontWeight:900, color:"rgba(255,255,255,0.5)" }}>
          {nominated.name}
        </p>
        <p style={{ margin:"0.1rem 0 0", fontSize:"0.82rem", color:"rgba(255,255,255,0.3)" }}>
          Unsold — returned to pool
        </p>
        <button onClick={next}
          style={{ marginTop:"0.4rem", padding:"0.7rem 1.5rem",
            background:"rgba(255,255,255,0.07)", border:`1px solid ${BDR}`,
            borderRadius:11, color:"#fff", fontWeight:700, fontSize:"0.88rem", cursor:"pointer" }}>
          Continue
        </button>
      </div>
    );
  }

  // ── Stage (idle prompt + mode-aware pool) ────────────────────────────
  function Stage() {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem", height:"100%", minHeight:0 }}>
        {phase === "idle" && (
          <>
            {/* Header prompt */}
            <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:13,
              padding:"0.85rem 1.1rem", flexShrink:0, textAlign:"center" }}>
              <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", marginBottom:4 }}>
                {mode === "tier"
                  ? <Layers style={{ width:18, height:18, color:TIER_DISPLAY[activeTier].color }} />
                  : <Shuffle style={{ width:18, height:18, color:"rgba(255,255,255,0.3)" }} />}
                <span style={{ fontSize:"0.75rem", fontWeight:700,
                  color: mode==="tier" ? TIER_DISPLAY[activeTier].color : "rgba(255,255,255,0.45)" }}>
                  {mode === "tier" ? `${TIER_DISPLAY[activeTier].label} Round — ${pool.length} players remaining` : `Open Pool — ${pool.length} players remaining`}
                </span>
              </div>
              <p style={{ margin:0, fontSize:"0.72rem", color:"rgba(255,255,255,0.22)" }}>
                {mode === "tier"
                  ? "Select from the active tier below, or open any tier"
                  : "Search or pick any player — call bids verbally"}
              </p>
            </div>
            {mode === "classic" ? <ClassicPool /> : <TierPool />}
          </>
        )}
        {phase === "nominated" && <NominatedStage />}
        {phase === "sold"      && <SoldScreen />}
        {phase === "unsold"    && <UnsoldScreen />}
      </div>
    );
  }

  // ── Log entry ────────────────────────────────────────────────────────
  function LogEntry_({ entry }: { entry: LogEntry }) {
    const td = TIER_DISPLAY[entry.tier];
    return (
      <div style={{ background:CARD,
        border:`1px solid ${entry.status==="sold" ? `${entry.winnerColor}25` : BDR}`,
        borderRadius:10, padding:"0.55rem 0.75rem", flexShrink:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
          <span style={{ fontSize:"0.78rem", fontWeight:700, color:"#fff" }}>{entry.player.name}</span>
          {entry.status === "sold"
            ? <span style={{ fontSize:"0.72rem", fontWeight:800, color:"#22c55e", fontFamily:"monospace" }}>{crFmt(entry.price!)}</span>
            : <span style={{ fontSize:"0.62rem", color:"#ef4444", fontWeight:700 }}>UNSOLD</span>}
        </div>
        {entry.status === "sold" && (
          <div style={{ display:"flex", alignItems:"center", gap:"0.28rem", marginTop:"0.12rem" }}>
            <Crown style={{ width:9, height:9, color:entry.winnerColor }} />
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
          <span style={{ fontSize:"0.56rem", color:td.color,
            background:`${td.color}15`, padding:"1px 4px", borderRadius:3 }}>
            {td.emoji}{td.label}
          </span>
        </div>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.8rem", height:"100%", minHeight:0 }}>

        {/* Topbar */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
          flexShrink:0, gap:"0.5rem" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.7rem", minWidth:0 }}>
            <button onClick={() => navigate("/auction")}
              style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:9,
                padding:"0.38rem 0.65rem", color:DIM, cursor:"pointer",
                display:"flex", alignItems:"center", gap:"0.3rem",
                fontSize:"0.78rem", fontWeight:600, flexShrink:0 }}>
              <ArrowLeft style={{ width:12, height:12 }} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div style={{ minWidth:0 }}>
              <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                <span style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.15em",
                  textTransform:"uppercase", color:ACCENT }}>Verbal Auction</span>
                <span style={{ fontSize:"0.62rem", fontWeight:700,
                  color: mode==="tier" ? "#e8a020" : DIM,
                  background: mode==="tier" ? "rgba(232,160,32,0.12)" : "rgba(255,255,255,0.06)",
                  border:`1px solid ${mode==="tier" ? "rgba(232,160,32,0.25)" : BDR}`,
                  padding:"1px 7px", borderRadius:20, letterSpacing:"0.06em" }}>
                  {mode === "tier" ? "🏆 Tier Mode" : "🔀 Classic"}
                </span>
              </div>
              <h1 style={{ margin:0, fontSize:"1.25rem", fontWeight:900, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                Friday Night Draft
              </h1>
            </div>
          </div>

          <div style={{ display:"flex", alignItems:"center", gap:"0.45rem", flexShrink:0 }}>
            {log.length > 0 && (
              <button onClick={undoLast}
                style={{ display:"flex", alignItems:"center", gap:"0.28rem",
                  padding:"0.38rem 0.65rem", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.7rem", fontWeight:600, cursor:"pointer" }}>
                <RotateCcw style={{ width:10, height:10 }} />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}
            {log.length > 0 && (
              <button onClick={() => navigator.clipboard?.writeText(
                log.map(e => e.status==="sold"
                  ? `[${TIER_DISPLAY[e.tier].label}] ${e.player.name} → ${e.winner} ${crFmt(e.price!)}`
                  : `[${TIER_DISPLAY[e.tier].label}] ${e.player.name} → UNSOLD`
                ).join("\n")
              )}
                style={{ display:"flex", alignItems:"center", gap:"0.28rem",
                  padding:"0.38rem 0.65rem", background:"rgba(255,255,255,0.05)",
                  border:`1px solid ${BDR}`, borderRadius:9,
                  color:DIM, fontSize:"0.7rem", fontWeight:600, cursor:"pointer" }}>
                <Copy style={{ width:10, height:10 }} />
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
          style={{ gridTemplateColumns:"230px 1fr 255px", gap:"0.8rem", flex:1, minHeight:0, overflow:"hidden" }}>

          {/* LEFT: Teams + squads */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", overflowY:"auto" }}>
            {teams.map(team => {
              const isLead = leadId === team.id;
              const ok     = team.budget >= currentBid;
              return (
                <div key={team.id}
                  onClick={() => phase==="nominated" && ok && setLeadId(team.id)}
                  style={{ background: isLead ? `${team.color}12` : CARD,
                    border:`1.5px solid ${isLead ? team.color : BDR}`,
                    borderRadius:12, padding:"0.7rem 0.8rem",
                    cursor: phase==="nominated" && ok ? "pointer" : "default",
                    opacity: phase==="nominated" && !ok ? 0.4 : 1,
                    transition:"all 0.18s" }}>
                  <BudgetBar team={team} />
                  {phase==="nominated" && ok && (
                    <div style={{ display:"flex", gap:"0.28rem", marginTop:"0.45rem" }}>
                      {[1,2,4,8].map(mult => {
                        const delta = parseFloat((bidIncrement * mult).toFixed(2));
                        const next  = parseFloat((currentBid + delta).toFixed(2));
                        const can   = team.budget >= next;
                        return (
                          <button key={mult}
                            onClick={e => { e.stopPropagation(); if(can){ setLeadId(team.id); setCurrentBid(next); setBidInput(String(next)); }}}
                            style={{ flex:1, padding:"0.22rem 0", borderRadius:5,
                              border:`1px solid ${can?`${team.color}40`:BDR}`,
                              background: can ? `${team.color}14` : "transparent",
                              color: can ? team.color : "rgba(255,255,255,0.15)",
                              fontSize:"0.58rem", fontWeight:700,
                              cursor: can ? "pointer" : "not-allowed" }}>
                            +{crFmt(delta)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isLead && phase==="nominated" && (
                    <div style={{ marginTop:"0.32rem", fontSize:"0.63rem",
                      color:team.color, fontWeight:700,
                      display:"flex", alignItems:"center", gap:"0.22rem" }}>
                      <Crown style={{ width:9, height:9 }} /> {crFmt(currentBid)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Squads */}
            <div style={{ marginTop:"0.15rem" }}>
              {teams.map(team => (
                <div key={team.id} style={{ background:CARD, border:`1px solid ${BDR}`,
                  borderRadius:10, overflow:"hidden", marginBottom:"0.38rem" }}>
                  <div onClick={() => setExpandedTeam(expandedTeam===team.id?null:team.id)}
                    style={{ padding:"0.55rem 0.75rem", cursor:"pointer",
                      display:"flex", alignItems:"center", justifyContent:"space-between",
                      borderBottom:expandedTeam===team.id?`1px solid ${BDR}`:"none" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.38rem" }}>
                      <div style={{ width:6, height:6, borderRadius:"50%", background:team.color }} />
                      <span style={{ fontSize:"0.73rem", fontWeight:700, color:"#fff" }}>{team.name.split("'")[0]}</span>
                    </div>
                    <span style={{ fontSize:"0.6rem", color:DIM }}>{team.squad.length}p · {crFmt(team.budget)}</span>
                  </div>
                  {expandedTeam===team.id && (
                    <div style={{ padding:"0.38rem 0.55rem", maxHeight:180, overflowY:"auto",
                      display:"flex", flexDirection:"column", gap:"0.22rem" }}>
                      {team.squad.length===0
                        ? <span style={{ fontSize:"0.67rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No players yet</span>
                        : team.squad.map((p,i) => (
                          <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.38rem",
                            padding:"0.22rem 0.38rem", borderRadius:6, background:"rgba(255,255,255,0.03)" }}>
                            <span style={{ fontSize:"0.55rem", color:TIER_DISPLAY[p.tier].color }}>{TIER_DISPLAY[p.tier].emoji}</span>
                            <span style={{ fontSize:"0.58rem", fontWeight:700,
                              color:ROLE_COLOR[p.role]??"#aaa",
                              background:`${ROLE_COLOR[p.role]??"#aaa"}15`,
                              padding:"1px 3px", borderRadius:3, minWidth:22, textAlign:"center" }}>
                              {p.role}
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
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CENTRE: Stage */}
          <div style={{ display:"flex", flexDirection:"column", overflow:"hidden" }}>
            <Stage />
          </div>

          {/* RIGHT: Mini budgets + log */}
          <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem", overflowY:"auto" }}>
            <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
              padding:"0.7rem 0.8rem", flexShrink:0 }}>
              <p style={{ margin:"0 0 0.5rem", fontSize:"0.58rem", fontWeight:700,
                letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Budgets</p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.45rem" }}>
                {teams.map(t => <BudgetBar key={t.id} team={t} mini />)}
              </div>
            </div>

            {/* Tier progress (tier mode only) */}
            {mode === "tier" && (
              <div style={{ background:CARD, border:`1px solid ${BDR}`, borderRadius:11,
                padding:"0.7rem 0.8rem", flexShrink:0 }}>
                <p style={{ margin:"0 0 0.5rem", fontSize:"0.58rem", fontWeight:700,
                  letterSpacing:"0.12em", color:DIM, textTransform:"uppercase" }}>Tier Progress</p>
                <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                  {TIER_ORDER.map(tier => {
                    const td    = TIER_DISPLAY[tier];
                    const stats = tierStats[tier];
                    const pct   = stats.total ? Math.round((stats.sold / stats.total) * 100) : 0;
                    return (
                      <div key={tier}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:2 }}>
                          <span style={{ fontSize:"0.62rem", fontWeight:700, color:td.color }}>
                            {td.emoji} {td.label}
                          </span>
                          <span style={{ fontSize:"0.6rem", color:DIM }}>
                            {stats.sold}/{stats.total}
                          </span>
                        </div>
                        <div style={{ height:3, borderRadius:2, background:"rgba(255,255,255,0.07)", overflow:"hidden" }}>
                          <div style={{ height:"100%", borderRadius:2, width:`${pct}%`,
                            background:td.color, transition:"width 0.4s" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p style={{ margin:0, fontSize:"0.58rem", fontWeight:700,
              letterSpacing:"0.12em", color:DIM, textTransform:"uppercase", flexShrink:0 }}>
              Log ({log.length})
            </p>
            {log.length === 0
              ? <p style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No sales yet</p>
              : log.map((e, i) => <LogEntry_ key={i} entry={e} />)
            }
          </div>
        </div>

        {/* ── MOBILE: tabs ── */}
        <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden gap-3">
          <div style={{ display:"flex", gap:"0.38rem", flexShrink:0 }}>
            {(["pool","Stage"],["teams","Teams"],["log","Log"] as unknown as [MobileTab,string][]).map ?
              ([["pool","Stage"],["teams","Teams"],["log","Log"]] as [MobileTab,string][]).map(([tab,lbl]) => (
                <button key={tab} onClick={() => setMobileTab(tab)}
                  style={{ flex:1, padding:"0.42rem", borderRadius:9,
                    border:`1px solid ${mobileTab===tab?"rgba(255,255,255,0.2)":BDR}`,
                    background:mobileTab===tab?"rgba(255,255,255,0.1)":CARD,
                    color:mobileTab===tab?"#fff":DIM,
                    fontSize:"0.78rem", fontWeight:600, cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center", gap:"0.28rem" }}>
                  {tab==="log"&&log.length>0&&(
                    <span style={{ background:ACCENT, color:"#fff", borderRadius:20,
                      fontSize:"0.58rem", fontWeight:700, padding:"0px 5px" }}>{log.length}</span>
                  )}
                  {lbl}
                </button>
              )) : null}
          </div>

          <div style={{ flex:1, overflow:"hidden", display:"flex", flexDirection:"column" }}>
            {mobileTab==="pool" && <Stage />}
            {mobileTab==="teams" && (
              <div style={{ flex:1, overflowY:"auto", display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {teams.map(team => {
                  const isLead=leadId===team.id;
                  const ok=team.budget>=currentBid;
                  return (
                    <div key={team.id}
                      onClick={()=>phase==="nominated"&&ok&&setLeadId(team.id)}
                      style={{ background:isLead?`${team.color}12`:CARD,
                        border:`1.5px solid ${isLead?team.color:BDR}`,
                        borderRadius:12, padding:"0.8rem",
                        cursor:phase==="nominated"&&ok?"pointer":"default",
                        opacity:phase==="nominated"&&!ok?0.4:1 }}>
                      <BudgetBar team={team} />
                      {phase==="nominated"&&ok&&(
                        <div style={{ display:"flex", gap:"0.32rem", marginTop:"0.5rem" }}>
                          {[1,2,4,8].map(mult => {
                            const delta=parseFloat((bidIncrement*mult).toFixed(2));
                            const next=parseFloat((currentBid+delta).toFixed(2));
                            const can=team.budget>=next;
                            return (
                              <button key={mult}
                                onClick={e=>{e.stopPropagation();if(can){setLeadId(team.id);setCurrentBid(next);setBidInput(String(next));}}}
                                style={{ flex:1, padding:"0.3rem 0", borderRadius:6,
                                  border:`1px solid ${can?`${team.color}40`:BDR}`,
                                  background:can?`${team.color}14`:"transparent",
                                  color:can?team.color:"rgba(255,255,255,0.15)",
                                  fontSize:"0.62rem", fontWeight:700, cursor:can?"pointer":"not-allowed" }}>
                                +{crFmt(delta)}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {isLead&&(
                        <div style={{ marginTop:"0.38rem", fontSize:"0.66rem",
                          color:team.color, fontWeight:700,
                          display:"flex", alignItems:"center", gap:"0.28rem" }}>
                          <Crown style={{ width:9, height:9 }} /> Leading — {crFmt(currentBid)}
                        </div>
                      )}
                      {team.squad.length>0&&(
                        <div style={{ marginTop:"0.55rem", paddingTop:"0.5rem",
                          borderTop:`1px solid ${BDR}`, display:"flex", flexDirection:"column", gap:"0.22rem" }}>
                          {team.squad.slice(0,4).map((p,i)=>(
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.38rem" }}>
                              <span style={{ fontSize:"0.55rem", color:TIER_DISPLAY[p.tier].color }}>{TIER_DISPLAY[p.tier].emoji}</span>
                              <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.7)", flex:1,
                                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                                {p.name}
                              </span>
                              <span style={{ fontSize:"0.6rem", color:DIM, fontFamily:"monospace" }}>{crFmt(p.price)}</span>
                            </div>
                          ))}
                          {team.squad.length>4&&<span style={{ fontSize:"0.6rem", color:DIM }}>+{team.squad.length-4} more</span>}
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
                  ? <p style={{ textAlign:"center", padding:"2rem", fontSize:"0.82rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>No sales yet</p>
                  : log.map((e,i) => <LogEntry_ key={i} entry={e} />)
                }
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.35}}
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
      `}</style>
    </Layout>
  );
}
