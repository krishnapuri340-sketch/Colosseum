/**
 * LiveScore.tsx — Real-time fantasy points during live matches
 * Polls /ipl/matches every 30s for live match data
 * Shows per-player events as they happen with point increments
 * My squad players highlighted — points tick up live
 */
import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { Radio, Zap, TrendingUp, RefreshCw, Star, ChevronDown, ChevronUp, Clock } from "lucide-react";
import { TEAM_COLOR, TEAM_LOGO, TEAM_FULL_NAME, ROLE_LABEL } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";

// ── Types ─────────────────────────────────────────────────────────────
interface LiveEvent {
  id: string;
  player: string;
  team: string;
  event: string;       // "Wicket", "Six", "Four", "Fifty", "Maiden", etc.
  pts: number;
  over: string;        // "12.4"
  timestamp: number;
}

interface LivePlayerScore {
  name: string;
  team: string;
  role: string;
  runs?: number;
  balls?: number;
  wickets?: number;
  overs?: number;
  catches?: number;
  fantasyPts: number;
  isActive: boolean;   // currently batting/bowling
  events: LiveEvent[];
}

interface LiveMatch {
  iplId: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  firstInningsScore: string | null;
  secondInningsScore: string | null;
  currentOver: string;
  result: string | null;
  isLive: boolean;
  isCompleted: boolean;
}

// ── Mock live events (replace with real API) ──────────────────────────
const MOCK_EVENTS: LiveEvent[] = [];

// MY_SQUAD_NAMES derived from AppContext myTeams in component

const MOCK_PLAYERS: LivePlayerScore[] = [];

const EVENT_COLORS: Record<string,string> = {
  "Wicket (Bowled)":  "#22c55e",
  "Wicket (LBW)":     "#22c55e",
  "Wicket":           "#22c55e",
  "Maiden Over":      "#34d399",
  "Fifty":            "#f59e0b",
  "Hundred":          "#e8a020",
  "Six":              "#818cf8",
  "Four":             "#60a5fa",
  "Catch":            "#fb923c",
  "Stumping":         "#f472b6",
};

function fmtAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)  return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s/60)}m ago`;
  return `${Math.floor(s/3600)}h ago`;
}

function TeamLogo({ code, size=28 }: { code:string; size?:number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo) return <img src={logo} alt={code} style={{ width:size, height:size, objectFit:"contain" }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background:`${color}22`, border:`1.5px solid ${color}50`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:size*0.3, color }}>
      {code}
    </div>
  );
}

// ── Player score card ─────────────────────────────────────────────────
function PlayerScoreCard({ player, isMySquad }: { player:LivePlayerScore; isMySquad:boolean }) {
  const [showEvents, setShowEvents] = useState(false);
  const tc    = TEAM_COLOR[player.team] ?? "#aaa";
  const latest = player.events[player.events.length-1];

  return (
    <div style={{
      background: isMySquad ? `${tc}0c` : "rgba(255,255,255,0.03)",
      border: `1px solid ${isMySquad ? `${tc}35` : "rgba(255,255,255,0.07)"}`,
      borderRadius:13, overflow:"hidden",
      borderLeft: isMySquad ? `3px solid ${tc}` : "3px solid transparent",
    }}>
      <div style={{ padding:"0.75rem 0.85rem", display:"flex", alignItems:"center", gap:10 }}>
        {/* My squad star */}
        {isMySquad && (
          <Star size={12} style={{ color:"#f59e0b", fill:"#f59e0b", flexShrink:0 }} />
        )}

        {/* Team logo */}
        <TeamLogo code={player.team} size={24} />

        {/* Name + role */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:6 }}>
            <span style={{ fontWeight:700, fontSize:"0.85rem", color:"#fff",
              overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
              {player.name}
            </span>
            {player.isActive && (
              <span style={{ fontSize:"0.58rem", fontWeight:700, color:"#22c55e",
                background:"rgba(34,197,94,0.15)", padding:"0 5px", borderRadius:4,
                animation:"softPulse 1.5s ease-in-out infinite" }}>
                LIVE
              </span>
            )}
          </div>
          <div style={{ fontSize:"0.65rem", color:tc, fontWeight:600 }}>
            {player.team} · {ROLE_LABEL[player.role]}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"flex", gap:14, alignItems:"center", flexShrink:0 }}>
          {player.role === "BAT" || player.role === "WK" ? (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.85rem", fontWeight:700, color:"#fff", fontFamily:"monospace" }}>
                {player.runs ?? 0}<span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.4)" }}>({player.balls ?? 0})</span>
              </div>
              <div style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.3)" }}>R(B)</div>
            </div>
          ) : player.role === "BWL" ? (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.85rem", fontWeight:700, color:"#fff", fontFamily:"monospace" }}>
                {player.wickets ?? 0}/{" "}
                <span style={{ fontSize:"0.72rem" }}>{player.overs ?? 0}ov</span>
              </div>
              <div style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.3)" }}>W/OV</div>
            </div>
          ) : (
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:"0.78rem", fontWeight:700, color:"rgba(255,255,255,0.6)" }}>
                {player.runs ?? 0}r {player.wickets ?? 0}w
              </div>
            </div>
          )}

          {/* Fantasy points */}
          <div style={{ textAlign:"right", minWidth:44 }}>
            <div style={{ fontSize:"1.1rem", fontWeight:900, fontFamily:"monospace",
              color: isMySquad ? tc : "rgba(255,255,255,0.8)" }}>
              {player.fantasyPts}
            </div>
            <div style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.3)" }}>FPT</div>
          </div>

          {/* Events toggle */}
          {player.events.length > 0 && (
            <button onClick={()=>setShowEvents(v=>!v)}
              style={{ background:"none", border:"none", cursor:"pointer",
                color:"rgba(255,255,255,0.3)", padding:0 }}>
              {showEvents
                ? <ChevronUp size={13} />
                : <ChevronDown size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Latest event flash */}
      {latest && !showEvents && (
        <div style={{ padding:"0.3rem 0.85rem 0.4rem",
          borderTop:"1px solid rgba(255,255,255,0.04)",
          display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontSize:"0.65rem", fontWeight:700,
            color:EVENT_COLORS[latest.event]??"#818cf8" }}>
            +{latest.pts}
          </span>
          <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.4)" }}>
            {latest.event} · over {latest.over}
          </span>
          <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.2)", marginLeft:"auto" }}>
            {fmtAgo(latest.timestamp)}
          </span>
        </div>
      )}

      {/* All events */}
      <AnimatePresence>
        {showEvents && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.18 }}
            style={{ overflow:"hidden" }}>
            {player.events.map((ev,i) => (
              <div key={ev.id} style={{ padding:"0.3rem 0.85rem",
                borderTop:"1px solid rgba(255,255,255,0.04)",
                display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontWeight:800, fontSize:"0.72rem",
                  color:EVENT_COLORS[ev.event]??"#818cf8", minWidth:32 }}>
                  +{ev.pts}
                </span>
                <span style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.6)", flex:1 }}>
                  {ev.event}
                </span>
                <span style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.25)",
                  fontFamily:"monospace" }}>
                  {ev.over}
                </span>
                <span style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.2)" }}>
                  {fmtAgo(ev.timestamp)}
                </span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function LiveScore() {
  const { myTeams } = useApp();
  const MY_SQUAD_NAMES = new Set(myTeams.flatMap(t => t.players));
  const [liveMatches, setLiveMatches] = useState<LiveMatch[]>([]);
  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [filter, setFilter] = useState<"all"|"mysquad">("all");
  const [newEventIds, setNewEventIds] = useState<Set<string>>(new Set());
  const pollRef = useRef<ReturnType<typeof setInterval>>();

  const mySquadTotalPts = 0; // Will come from live API

  function fetchLiveData() {
    apiFetch("/ipl/matches")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.matches)) {
          setLiveMatches(d.matches.filter((m:LiveMatch) => m.isLive || m.isCompleted).slice(0,5));
          if (!selectedMatch && d.matches.find((m:LiveMatch)=>m.isLive)) {
            setSelectedMatch(d.matches.find((m:LiveMatch)=>m.isLive)?.iplId ?? null);
          }
        }
        setLastUpdated(new Date());
      })
      .catch(()=>{})
      .finally(()=>setLoading(false));
  }

  useEffect(() => {
    fetchLiveData();
    pollRef.current = setInterval(fetchLiveData, 30000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const displayedPlayers: LivePlayerScore[] = []; // Will come from live API

  const sortedPlayers = [...displayedPlayers].sort((a,b) => b.fantasyPts - a.fantasyPts);
  const sortedEvents  = [...events].sort((a,b) => b.timestamp - a.timestamp);

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }} className="space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
              <div style={{ width:10, height:10, borderRadius:"50%", background:"#22c55e",
                boxShadow:"0 0 8px #22c55e", animation:"livePulse 1.4s ease-in-out infinite" }} />
              Live Scoring
            </h1>
            <p className="text-sm text-white/40 mt-0.5">
              Fantasy points updating in real-time · refreshes every 30s
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
            <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.3)",
              display:"flex", alignItems:"center", gap:4 }}>
              <Clock size={11} />
              {lastUpdated.toLocaleTimeString([], { hour:"2-digit", minute:"2-digit" })}
            </span>
            <button onClick={fetchLiveData}
              style={{ display:"flex", alignItems:"center", gap:4, padding:"0.4rem 0.8rem",
                background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
                borderRadius:9, color:"rgba(255,255,255,0.5)", fontSize:"0.75rem",
                fontWeight:600, cursor:"pointer" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* My squad points card */}
        <div style={{ background:"linear-gradient(135deg,rgba(192,25,44,0.2),rgba(192,25,44,0.06))",
          border:"1px solid rgba(192,25,44,0.3)", borderRadius:16,
          padding:"1rem 1.25rem",
          display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:40, height:40, borderRadius:12, background:"rgba(192,25,44,0.2)",
              border:"1px solid rgba(192,25,44,0.35)",
              display:"flex", alignItems:"center", justifyContent:"center" }}>
              <Star size={18} style={{ color:"#f87171", fill:"#f87171" }} />
            </div>
            <div>
              <div style={{ fontSize:"0.72rem", fontWeight:700, color:"rgba(255,255,255,0.4)",
                textTransform:"uppercase", letterSpacing:"0.08em" }}>My Squad — This Match</div>
              <div style={{ fontSize:"0.82rem", color:"rgba(255,255,255,0.6)", marginTop:1 }}>
                {myTeams.length > 0 ? myTeams[0].name : "No teams yet"}
              </div>
            </div>
          </div>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            {[
              { label:"Fantasy Pts", value:mySquadTotalPts, color:"#c0392b" },
              { label:"Players Active", value:`${MOCK_PLAYERS.filter(p=>MY_SQUAD_NAMES.has(p.name)&&p.isActive).length}/${[...MY_SQUAD_NAMES].length}`, color:"#22c55e" },
              { label:"Rank (live)", value:"#7", color:"#f59e0b" },
            ].map(s=>(
              <div key={s.label} style={{ textAlign:"center" }}>
                <div style={{ fontSize:"1.5rem", fontWeight:900, color:s.color, fontFamily:"monospace", lineHeight:1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize:"0.6rem", color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Match selector */}
        {!loading && liveMatches.length > 0 && (
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {liveMatches.map(m=>{
              const c1=TEAM_COLOR[m.homeTeam]??"#aaa";
              const c2=TEAM_COLOR[m.awayTeam]??"#aaa";
              const isSelected=selectedMatch===m.iplId;
              return (
                <button key={m.iplId} onClick={()=>setSelectedMatch(m.iplId)}
                  style={{ padding:"0.5rem 0.9rem", borderRadius:11, cursor:"pointer",
                    background:isSelected?"rgba(255,255,255,0.09)":"rgba(255,255,255,0.04)",
                    border:`1.5px solid ${isSelected?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`,
                    display:"flex", alignItems:"center", gap:6, transition:"all 0.15s" }}>
                  {m.isLive && (
                    <div style={{ width:6, height:6, borderRadius:"50%", background:"#22c55e",
                      animation:"livePulse 1.4s ease-in-out infinite" }} />
                  )}
                  <span style={{ fontWeight:700, fontSize:"0.78rem", color:c1 }}>{m.homeTeam}</span>
                  <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.3)" }}>vs</span>
                  <span style={{ fontWeight:700, fontSize:"0.78rem", color:c2 }}>{m.awayTeam}</span>
                  {m.firstInningsScore && (
                    <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.5)",
                      fontFamily:"monospace", marginLeft:4 }}>
                      {m.firstInningsScore}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Main 2-col */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left: player scores */}
          <div className="lg:col-span-2 space-y-3">
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h2 style={{ margin:0, fontSize:"0.95rem", fontWeight:700, color:"rgba(255,255,255,0.7)" }}>
                Player Scores
              </h2>
              <div style={{ display:"flex", gap:4 }}>
                {(["all","mysquad"] as const).map(f=>(
                  <button key={f} onClick={()=>setFilter(f)}
                    style={{ padding:"0.3rem 0.75rem", borderRadius:20, fontSize:"0.72rem",
                      fontWeight:600, cursor:"pointer",
                      background:filter===f?"rgba(255,255,255,0.12)":"rgba(255,255,255,0.04)",
                      border:`1px solid ${filter===f?"rgba(255,255,255,0.2)":"rgba(255,255,255,0.08)"}`,
                      color:filter===f?"#fff":"rgba(255,255,255,0.4)" }}>
                    {f==="mysquad"?"⭐ My Squad":"All Players"}
                  </button>
                ))}
              </div>
            </div>

            {sortedPlayers.length === 0 ? (
              <div style={{ textAlign:"center", padding:"3rem 1rem",
                background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)",
                borderRadius:16 }}>
                <div style={{ fontSize:"2rem", marginBottom:"0.5rem" }}>📡</div>
                <div style={{ fontSize:"0.9rem", fontWeight:600, color:"rgba(255,255,255,0.35)" }}>
                  No live match data yet
                </div>
                <div style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.2)", marginTop:4 }}>
                  Player scores will appear here during live matches
                </div>
              </div>
            ) : sortedPlayers.map(p=>(
              <PlayerScoreCard key={p.name} player={p}
                isMySquad={MY_SQUAD_NAMES.has(p.name)} />
            ))}
          </div>

          {/* Right: live event feed */}
          <div className="space-y-3">
            <h2 style={{ margin:0, fontSize:"0.95rem", fontWeight:700, color:"rgba(255,255,255,0.7)" }}>
              Live Events
            </h2>
            <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:14, overflow:"hidden" }}>
              {sortedEvents.length === 0 && (
                <div style={{ padding:"2rem", textAlign:"center",
                  fontSize:"0.8rem", color:"rgba(255,255,255,0.2)" }}>
                  Events appear here during live matches
                </div>
              )}
              {sortedEvents.map((ev,i)=>{
                const isMyPlayer = MY_SQUAD_NAMES.has(ev.player);
                const evColor = EVENT_COLORS[ev.event] ?? "#818cf8";
                return (
                  <motion.div key={ev.id}
                    initial={{ opacity:0, x:8 }}
                    animate={{ opacity:1, x:0 }}
                    transition={{ delay:i*0.04 }}
                    style={{ padding:"0.65rem 0.9rem",
                      borderBottom: i<sortedEvents.length-1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      background: isMyPlayer ? "rgba(255,255,255,0.03)" : "transparent",
                      borderLeft: isMyPlayer ? `3px solid ${TEAM_COLOR[ev.team]??"#aaa"}` : "3px solid transparent" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:8 }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                          {isMyPlayer && <Star size={10} style={{ color:"#f59e0b", fill:"#f59e0b", flexShrink:0 }} />}
                          <span style={{ fontWeight:700, fontSize:"0.78rem", color:"#fff",
                            overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                            {ev.player}
                          </span>
                        </div>
                        <div style={{ fontSize:"0.65rem", color:evColor, fontWeight:600, marginTop:1 }}>
                          {ev.event}
                        </div>
                      </div>
                      <div style={{ textAlign:"right", flexShrink:0 }}>
                        <div style={{ fontSize:"0.88rem", fontWeight:900,
                          color:evColor, fontFamily:"monospace" }}>
                          +{ev.pts}
                        </div>
                        <div style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.25)" }}>
                          {fmtAgo(ev.timestamp)}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        @keyframes livePulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes softPulse{0%,100%{opacity:1}50%{opacity:0.5}}
      `}</style>
    </Layout>
  );
}
