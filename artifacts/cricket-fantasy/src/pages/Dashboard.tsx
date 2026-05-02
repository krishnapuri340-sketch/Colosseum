import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, Trophy, Flame, TrendingUp, Gavel,
  Target, Users, Zap, ChevronRight, Star, Radio,
} from "lucide-react";
import { Link } from "wouter";
import { TEAM_COLOR, TEAM_LOGO } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";

interface IplMatch {
  iplId: string; matchNumber: number;
  homeTeam: string; awayTeam: string;
  homeTeamFull: string; awayTeamFull: string;
  venue: string; city: string;
  matchDate: string; matchTime: string;
  firstInningsScore: string|null; secondInningsScore: string|null;
  result: string|null; winningTeamCode: string|null;
  isLive: boolean; isCompleted: boolean; isUpcoming: boolean;
}

const QUICK_ACTIONS = [
  { label:"Host Auction",  href:"/auction/create", icon:Gavel,  color:"#c0192c", bg:"rgba(192,25,44,0.14)", border:"rgba(192,25,44,0.28)" },
  { label:"Join Room",     href:"/auction/join",   icon:Users,  color:"#818cf8", bg:"rgba(129,140,248,0.12)", border:"rgba(129,140,248,0.25)" },
  { label:"Predictions",   href:"/predictions",    icon:Target, color:"#34d399", bg:"rgba(52,211,153,0.11)", border:"rgba(52,211,153,0.24)" },
  { label:"My Teams",      href:"/my-teams",       icon:Star,   color:"#f59e0b", bg:"rgba(245,158,11,0.11)", border:"rgba(245,158,11,0.24)" },
];

/* Cricket seam SVG — decorative overlay */
function CricketBallDecor({ size = 120, opacity = 0.12 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none"
      style={{ opacity, pointerEvents: "none" }}>
      <circle cx="60" cy="60" r="56" stroke="rgba(192,25,44,0.6)" strokeWidth="1.5" fill="rgba(192,25,44,0.05)" />
      {/* Vertical seam */}
      <path d="M60 4 C80 20, 80 100, 60 116" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
      <path d="M60 4 C40 20, 40 100, 60 116" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
      {/* Seam stitches */}
      {[25,35,45,55,65,75,85,95].map((y, i) => (
        <g key={i}>
          <line x1="52" y1={y} x2="48" y2={y + 4} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          <line x1="68" y1={y} x2="72" y2={y + 4} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

/* Stumps SVG — decorative */
function StumpsDecor({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" style={{ opacity, pointerEvents: "none" }}>
      {/* Three stumps */}
      <rect x="10" y="20" width="4" height="55" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="28" y="20" width="4" height="55" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="46" y="20" width="4" height="55" rx="2" fill="rgba(255,255,255,0.8)" />
      {/* Bails */}
      <rect x="8" y="17" width="12" height="4" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="26" y="17" width="12" height="4" rx="2" fill="rgba(255,255,255,0.8)" />
      {/* Ground line */}
      <line x1="4" y1="75" x2="56" y2="75" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
    </svg>
  );
}

const fade: Variants = {
  hidden:  { opacity:0, y:16 },
  visible: { opacity:1, y:0, transition:{ type:"spring", stiffness:280, damping:24 } },
};

function TeamLogo({ code, size=44 }: { code:string; size?:number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo) return <img src={logo} alt={code} style={{ width:size, height:size, objectFit:"contain" }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background:`${color}22`, border:`1.5px solid ${color}50`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:size*0.28, color }}>
      {code}
    </div>
  );
}

export default function Dashboard() {
  const [matches, setMatches] = useState<IplMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, totalPts, currentRank, myTeams, predAccuracy, notifications } = useApp();

  useEffect(() => {
    apiFetch("/ipl/matches")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.matches)) setMatches(d.matches); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const live      = matches.filter(m => m.isLive);
  const upcoming  = matches.filter(m => m.isUpcoming).slice(0, 3);
  const completed = matches.filter(m => m.isCompleted);

  return (
    <Layout>
      <motion.div
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible:{ transition:{ staggerChildren:0.08 } } }}
      >

        {/* ── Hero ── */}
        <motion.div variants={fade}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(192,25,44,0.20) 0%, rgba(129,140,248,0.08) 55%, rgba(7,9,26,0.9) 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 40px rgba(0,0,0,0.3)",
          }}>

          {/* Layered glow behind content */}
          <div className="absolute inset-0 pointer-events-none">
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "radial-gradient(ellipse 70% 80% at 15% 60%, rgba(192,25,44,0.22), transparent)",
            }} />
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: "50%",
              background: "radial-gradient(ellipse 80% 60% at 80% 30%, rgba(129,140,248,0.08), transparent)",
            }} />
          </div>

          {/* Cricket ball decoration — top right */}
          <div style={{ position: "absolute", top: -20, right: -20, pointerEvents: "none" }} className="ball-spin">
            <CricketBallDecor size={160} opacity={0.10} />
          </div>
          {/* Stumps decoration — bottom right */}
          <div style={{ position: "absolute", bottom: 0, right: 180, pointerEvents: "none" }}>
            <StumpsDecor opacity={0.07} />
          </div>

          <div className="relative z-10 p-7 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                {/* Live badge */}
                {live.length > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-green-400"
                      style={{
                        background: "rgba(34,197,94,0.12)",
                        border: "1px solid rgba(34,197,94,0.28)",
                        boxShadow: "0 0 16px rgba(34,197,94,0.12)",
                      }}>
                      <Radio className="w-3 h-3 animate-pulse" />
                      {live.length} Match{live.length > 1?"es":""} Live Now
                    </div>
                  </div>
                )}

                <h1 className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight" style={{ letterSpacing: "-0.02em" }}>
                  {`Welcome back, ${profile.displayName} 🏏`}
                </h1>
                <p className="text-white/50 text-sm mb-5">
                  {loading ? "Loading IPL 2026…" : (
                    <>
                      {live.length > 0 && <span className="text-green-400 font-semibold">{live.length} live · </span>}
                      <span className="text-white/60">{upcoming.length} upcoming · {completed.length} completed this season</span>
                    </>
                  )}
                </p>

                {/* Quick actions */}
                <div className="flex flex-wrap gap-2">
                  {QUICK_ACTIONS.map(a => (
                    <Link key={a.href} href={a.href}>
                      <div className="press-sm flex items-center gap-2 px-4 py-2.5 rounded-2xl cursor-pointer transition-all"
                        style={{
                          background: a.bg,
                          border: `1px solid ${a.border}`,
                          boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset",
                        }}
                        onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)"}
                        onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"}>
                        <a.icon className="w-3.5 h-3.5" style={{ color: a.color }} />
                        <span className="text-xs font-bold text-white">{a.label}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Stats cluster — desktop */}
              <div className="hidden md:flex flex-col items-end gap-2 shrink-0">
                <div className="text-xs font-bold tracking-widest uppercase text-white/30 mb-1">Season Stats</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white tabular-nums" style={{ letterSpacing: "-0.03em" }}>
                    {totalPts.toLocaleString()}
                  </span>
                  <span className="text-sm text-white/40 font-medium">pts</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white/40">Rank</span>
                  <span className="text-2xl font-black text-amber-400 tabular-nums">#{currentRank}</span>
                </div>
                <div className="text-xs text-white/25 font-medium">IPL 2026 Fantasy League</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fade}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:"Total Points",  value:totalPts.toLocaleString(), sub:"Season total",                    color:"#818cf8", icon:<Zap className="w-4.5 h-4.5" /> },
            { label:"Current Rank",  value:`#${currentRank}`,         sub:"Fantasy league",                  color:"#f59e0b", icon:<Trophy className="w-4.5 h-4.5" /> },
            { label:"Teams Active",  value:myTeams.length,            sub:`${myTeams.filter(t=>t.status==="live").length} live`, color:"#34d399", icon:<Users className="w-4.5 h-4.5" /> },
            { label:"Predictions",   value:`${predAccuracy}%`,        sub:"Accuracy this season",            color:"#f87171", icon:<Target className="w-4.5 h-4.5" /> },
          ].map(s => (
            <div key={s.label}
              className="glass-elevated rounded-2xl p-4 flex items-center gap-3.5 group cursor-default">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${s.color}20, ${s.color}10)`,
                  border: `1px solid ${s.color}28`,
                  color: s.color,
                  boxShadow: `0 4px 16px ${s.color}18`,
                }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white tabular-nums" style={{ letterSpacing: "-0.02em" }}>{s.value}</div>
                <div className="text-xs font-semibold text-white/40 leading-tight">{s.label}</div>
                <div className="text-xs text-white/22 leading-tight mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Main 2-col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Upcoming matches */}
          <motion.div variants={fade} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black flex items-center gap-2" style={{ letterSpacing: "-0.01em" }}>
                <Flame className="w-4.5 h-4.5 text-orange-500" />
                {live.length > 0 ? "Live & Upcoming" : "Upcoming Fixtures"}
              </h2>
              <Link href="/matches" className="flex items-center gap-1 text-xs font-semibold text-white/35 hover:text-white transition-colors">
                All matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2.5">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)
              ) : [...live, ...upcoming].slice(0,3).length === 0 ? (
                <div className="text-center py-12 text-white/22 text-sm">No upcoming matches</div>
              ) : (
                [...live, ...upcoming].slice(0,3).map(match => {
                  const c1 = TEAM_COLOR[match.homeTeam] ?? "#aaa";
                  const c2 = TEAM_COLOR[match.awayTeam] ?? "#aaa";
                  return (
                    <Link key={match.iplId} href="/matches">
                      <div className="match-card glass-elevated rounded-2xl p-4 cursor-pointer group"
                        style={{ "--team-color": c1 } as React.CSSProperties}
                        onMouseEnter={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = `${c1}35`;
                          el.style.transform = "translateY(-1px)";
                          el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px ${c1}20`;
                        }}
                        onMouseLeave={e => {
                          const el = e.currentTarget as HTMLDivElement;
                          el.style.borderColor = "";
                          el.style.transform = "";
                          el.style.boxShadow = "";
                        }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/35 bg-white/6 px-2 py-0.5 rounded-md"
                              style={{ border: "1px solid rgba(255,255,255,0.07)" }}>M{match.matchNumber}</span>
                            {match.isLive && (
                              <span className="text-xs font-bold text-green-400 flex items-center gap-1"
                                style={{ background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)", borderRadius: 6, padding: "1px 7px" }}>
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/28 font-medium">{match.matchDate} · {match.matchTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div style={{ filter: `drop-shadow(0 2px 8px ${c1}40)` }}>
                              <TeamLogo code={match.homeTeam} size={36} />
                            </div>
                            <div>
                              <div className="font-black text-sm" style={{ color: c1 }}>{match.homeTeam}</div>
                              {match.firstInningsScore && (
                                <div className="text-sm font-mono font-bold text-white" style={{ letterSpacing: "-0.01em" }}>
                                  {match.firstInningsScore}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{
                            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                          }}>
                            <div className="text-xs text-white/22 font-mono font-black">VS</div>
                            {/* Mini pitch strip */}
                            <div style={{
                              width: 28, height: 3, borderRadius: 9999,
                              background: "linear-gradient(90deg, transparent, rgba(34,197,94,0.35), transparent)",
                            }} />
                          </div>
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <div style={{ filter: `drop-shadow(0 2px 8px ${c2}40)` }}>
                              <TeamLogo code={match.awayTeam} size={36} />
                            </div>
                            <div className="text-right">
                              <div className="font-black text-sm" style={{ color: c2 }}>{match.awayTeam}</div>
                              {match.secondInningsScore && (
                                <div className="text-sm font-mono font-bold text-white">{match.secondInningsScore}</div>
                              )}
                            </div>
                          </div>
                        </div>
                        {match.result && (
                          <div className="mt-3 pt-2.5 border-t border-white/6 text-xs font-bold text-center"
                            style={{ color: match.winningTeamCode ? (TEAM_COLOR[match.winningTeamCode]??"#34d399") : "#34d399" }}>
                            {match.result}
                          </div>
                        )}
                        {!match.result && (
                          <div className="mt-2 text-xs text-white/22 truncate">{match.venue}</div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Differential picks placeholder */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black flex items-center gap-2" style={{ letterSpacing: "-0.01em" }}>
                  <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
                  Differential Picks
                </h2>
                <Link href="/players" className="flex items-center gap-1 text-xs font-semibold text-white/35 hover:text-white transition-colors">
                  All players <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="glass-elevated rounded-2xl p-5 text-center">
                <div className="text-sm font-semibold text-white/35">Differentials update during live matches</div>
                <div className="text-xs text-white/22 mt-1">Players outperforming average ownership appear here</div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Activity + Auction CTA */}
          <motion.div variants={fade} className="space-y-4">

            {/* No teams prompt */}
            {myTeams.length === 0 && (
              <div className="glass-elevated rounded-2xl p-5 text-center"
                style={{ border: "1px dashed rgba(255,255,255,0.10)" }}>
                <div className="text-2xl mb-2">🏏</div>
                <div className="text-sm font-bold text-white/50">No squads yet</div>
                <div className="text-xs text-white/28 mt-1">Join an auction to build your IPL squad</div>
              </div>
            )}

            {/* Activity feed */}
            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-xs font-black tracking-widest uppercase text-white/35 mb-4">Recent Activity</div>
              {notifications.length === 0 ? (
                <div className="text-center py-5">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="text-sm text-white/30 font-medium">No activity yet</div>
                  <div className="text-xs text-white/20 mt-1">Auction and match events will appear here</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0,4).map((a, i) => (
                    <div key={a.id} className="flex gap-3">
                      <div className="relative shrink-0">
                        <div className="w-2 h-2 rounded-full mt-1.5"
                          style={{ background: a.read ? "rgba(255,255,255,0.18)" : "#c0192c",
                            boxShadow: a.read ? "none" : "0 0 6px rgba(192,25,44,0.5)" }} />
                        {i < Math.min(notifications.length,4)-1 && (
                          <div className="absolute left-[3px] top-[10px] bottom-[-12px] w-px bg-white/8" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white/65 leading-tight">{a.body}</div>
                        <div className="text-xs text-white/28 mt-1">
                          {Math.floor((Date.now()-a.time)/60000) < 60
                            ? `${Math.max(1,Math.floor((Date.now()-a.time)/60000))}m ago`
                            : `${Math.floor((Date.now()-a.time)/3600000)}h ago`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Auction CTA */}
            <Link href="/auction">
              <div className="relative rounded-2xl p-5 cursor-pointer overflow-hidden group"
                style={{
                  background: "linear-gradient(135deg, rgba(192,25,44,0.22), rgba(192,25,44,0.09))",
                  border: "1px solid rgba(192,25,44,0.30)",
                  boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 24px rgba(192,25,44,0.10)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "translateY(-2px)";
                  el.style.boxShadow = "0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 32px rgba(192,25,44,0.20)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLDivElement;
                  el.style.transform = "";
                  el.style.boxShadow = "0 1px 0 rgba(255,255,255,0.06) inset, 0 4px 24px rgba(192,25,44,0.10)";
                }}>

                {/* Decorative stumps */}
                <div style={{ position: "absolute", right: 12, bottom: 0, opacity: 0.15 }}>
                  <StumpsDecor opacity={1} />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{
                        background: "rgba(192,25,44,0.25)",
                        border: "1px solid rgba(192,25,44,0.35)",
                        boxShadow: "0 4px 12px rgba(192,25,44,0.20)",
                      }}>
                      <Gavel className="w-5 h-5 text-red-400" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white">Ready to auction?</div>
                      <div className="text-xs text-white/40">250 IPL 2026 players in pool</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                    Start or join a room <ArrowRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </Link>

            {/* Cricket stat — season progress */}
            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-xs font-black tracking-widest uppercase text-white/35 mb-3">IPL 2026 Season</div>
              <div className="space-y-2.5">
                {[
                  { label: "Matches Played", value: `${completed.length}/70`, pct: (completed.length / 70) * 100, color: "#818cf8" },
                  { label: "Live Right Now",  value: `${live.length}`, pct: live.length > 0 ? 100 : 0, color: "#34d399" },
                  { label: "Your Accuracy",   value: `${predAccuracy}%`, pct: predAccuracy, color: "#f59e0b" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/45 font-medium">{item.label}</span>
                      <span className="text-xs font-black text-white tabular-nums">{item.value}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/6 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(2, Math.min(100, item.pct))}%`,
                          background: `linear-gradient(90deg, ${item.color}cc, ${item.color})`,
                          boxShadow: `0 0 8px ${item.color}60`,
                        }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
