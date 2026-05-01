import { Layout } from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import {
  ArrowRight, Trophy, Flame, TrendingUp, Gavel,
  Target, Users, Zap, ChevronRight, Star, Radio,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { TEAM_COLOR, TEAM_LOGO, TEAM_FULL_NAME } from "@/lib/ipl-constants";
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

// Chart data will come from API

const QUICK_ACTIONS = [
  { label:"Host Auction",  href:"/auction/create", icon:Gavel,  color:"#c0192c", bg:"rgba(192,25,44,0.12)" },
  { label:"Join Room",     href:"/auction/join",   icon:Users,  color:"#818cf8", bg:"rgba(129,140,248,0.12)" },
  { label:"Predictions",  href:"/predictions",    icon:Target, color:"#34d399", bg:"rgba(52,211,153,0.12)" },
  { label:"My Teams",     href:"/my-teams",       icon:Star,   color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
];





const fade = {
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
        className="space-y-6"
        initial="hidden"
        animate="visible"
        variants={{ visible:{ transition:{ staggerChildren:0.08 } } }}
      >

        {/* ── Hero ── */}
        <motion.div variants={fade}
          className="relative rounded-3xl overflow-hidden p-7 md:p-8"
          style={{ background:"linear-gradient(135deg, rgba(192,25,44,0.18) 0%, rgba(129,140,248,0.1) 60%, rgba(6,7,14,0.8) 100%)", border:"1px solid rgba(255,255,255,0.08)" }}>

          <div className="absolute inset-0 opacity-30 pointer-events-none"
            style={{ background:"radial-gradient(ellipse 80% 60% at 20% 50%, rgba(192,25,44,0.25), transparent)" }} />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex-1">
              {/* Live badge */}
              {live.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-green-400"
                    style={{ background:"rgba(34,197,94,0.12)", border:"1px solid rgba(34,197,94,0.25)" }}>
                    <Radio className="w-3 h-3 animate-pulse" />
                    {live.length} Match{live.length > 1?"es":""} Live Now
                  </div>
                </div>
              )}

              <h1 className="text-3xl md:text-4xl font-black text-white mb-1 tracking-tight">
                {`Good ${new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, ${profile.displayName}`}
              </h1>
              <p className="text-white/50 text-base mb-5">
                {loading ? "Loading IPL 2026…" : (
                  <>
                    {live.length > 0 && <span className="text-green-400 font-semibold">{live.length} live · </span>}
                    <span className="text-white/70">{upcoming.length} upcoming · {completed.length} completed</span>
                  </>
                )}
              </p>

              {/* Quick actions */}
              <div className="flex flex-wrap gap-2.5">
                {QUICK_ACTIONS.map(a => (
                  <Link key={a.href} href={a.href}>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.03]"
                      style={{ background:a.bg, border:`1px solid ${a.color}30` }}>
                      <a.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color:a.color }} />
                      <span className="text-xs sm:text-sm font-semibold text-white">{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sparkline */}
            <div className="hidden md:block w-72 shrink-0">
              <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-2">Fantasy Points — Season</div>
              <div style={{ height:90, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.2)" }}>
                  Points chart builds as you play
                </span>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white">{totalPts.toLocaleString()}</span>
                <span className="text-xs text-white/40">pts · Rank</span>
                <span className="text-lg font-bold text-yellow-400">#{currentRank}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fade}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:"Total Points",  value:totalPts.toLocaleString(), sub:"Season total",       color:"#818cf8", icon:<Zap className="w-5 h-5" /> },
            { label:"Current Rank",  value:`#${currentRank}`,            sub:"Fantasy league",     color:"#f59e0b", icon:<Trophy className="w-5 h-5" /> },
            { label:"Teams Active",  value:myTeams.length,               sub:`${myTeams.filter(t=>t.status==="live").length} live now`, color:"#34d399", icon:<Users className="w-5 h-5" /> },
            { label:"Predictions",   value:`${predAccuracy}%`,           sub:"Accuracy this season",color:"#f87171", icon:<Target className="w-5 h-5" /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3.5"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background:`${s.color}18`, color:s.color }}>
                {s.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xl font-black text-white tabular-nums">{s.value}</div>
                <div className="text-xs font-medium text-white/35 leading-tight">{s.label}</div>
                <div className="text-xs text-white/25 leading-tight mt-0.5">{s.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* ── Main 2-col ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Upcoming matches (2/3 width) */}
          <motion.div variants={fade} className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-500" />
                {live.length > 0 ? "Live & Upcoming" : "Upcoming Fixtures"}
              </h2>
              <Link href="/matches" className="flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors">
                All matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-28 rounded-2xl bg-white/5" />)
              ) : [...live, ...upcoming].slice(0,3).length === 0 ? (
                <div className="text-center py-12 text-white/25 text-sm">No upcoming matches</div>
              ) : (
                [...live, ...upcoming].slice(0,3).map(match => {
                  const c1 = TEAM_COLOR[match.homeTeam] ?? "#aaa";
                  const c2 = TEAM_COLOR[match.awayTeam] ?? "#aaa";
                  return (
                    <Link key={match.iplId} href="/matches">
                      <div className="rounded-2xl p-4 cursor-pointer hover:bg-white/5 transition-all group"
                        style={{ background:"rgba(255,255,255,0.03)", border:`1px solid rgba(255,255,255,0.07)` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white/40 bg-white/8 px-2 py-0.5 rounded-md">M{match.matchNumber}</span>
                            {match.isLive && (
                              <span className="text-xs font-bold text-green-400 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
                                LIVE
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-white/30">{match.matchDate} · {match.matchTime}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <TeamLogo code={match.homeTeam} size={36} />
                            <div>
                              <div className="font-bold text-sm" style={{ color:c1 }}>{match.homeTeam}</div>
                              {match.firstInningsScore && <div className="text-sm font-mono font-bold text-white">{match.firstInningsScore}</div>}
                            </div>
                          </div>
                          <div className="text-xs text-white/25 font-mono font-bold px-3">VS</div>
                          <div className="flex items-center gap-3 flex-row-reverse">
                            <TeamLogo code={match.awayTeam} size={36} />
                            <div className="text-right">
                              <div className="font-bold text-sm" style={{ color:c2 }}>{match.awayTeam}</div>
                              {match.secondInningsScore && <div className="text-sm font-mono font-bold text-white">{match.secondInningsScore}</div>}
                            </div>
                          </div>
                        </div>
                        {match.result && (
                          <div className="mt-3 pt-2.5 border-t border-white/5 text-xs font-semibold text-center"
                            style={{ color: match.winningTeamCode ? (TEAM_COLOR[match.winningTeamCode]??"#34d399") : "#34d399" }}>
                            {match.result}
                          </div>
                        )}
                        {!match.result && (
                          <div className="mt-2 text-xs text-white/25 truncate">{match.venue}</div>
                        )}
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* Differentials — populated when live scoring is available */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Differential Picks
                </h2>
                <Link href="/players" className="flex items-center gap-1 text-sm text-white/40 hover:text-white transition-colors">
                  All players <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="rounded-2xl p-6 text-center"
                style={{ background:"rgba(255,255,255,0.02)", border:"1px dashed rgba(255,255,255,0.08)" }}>
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-semibold text-white/40">Differentials update during live matches</div>
                <div className="text-xs text-white/25 mt-1">Players performing above average ownership will appear here</div>
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Activity + weekly chart */}
          <motion.div variants={fade} className="space-y-4">
            {/* Weekly chart — shows when you have teams playing */}
            {myTeams.length === 0 && (
              <div className="rounded-2xl p-5 text-center"
                style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
                <div className="text-2xl mb-2">⚡</div>
                <div className="text-sm font-semibold text-white/40">No teams yet</div>
                <div className="text-xs text-white/25 mt-1">Build a team or join an auction to see your points</div>
              </div>
            )}

            {/* Activity feed — driven by real notifications */}
            <div className="rounded-2xl p-4"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-sm font-bold text-white/60 mb-4">Recent Activity</div>
              {notifications.length === 0 ? (
                <div className="text-center py-4">
                  <div className="text-2xl mb-2">🔔</div>
                  <div className="text-sm text-white/30">No activity yet</div>
                  <div className="text-xs text-white/20 mt-1">Auction and match events will appear here</div>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.slice(0,4).map((a, i) => (
                    <div key={a.id} className="flex gap-3">
                      <div className="relative shrink-0">
                        <div className="w-2 h-2 rounded-full mt-1.5"
                          style={{ background: a.read ? "rgba(255,255,255,0.2)" : "#c0192c" }} />
                        {i < Math.min(notifications.length,4)-1 && (
                          <div className="absolute left-[3px] top-[10px] bottom-[-12px] w-px bg-white/8" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white/70 leading-tight">{a.body}</div>
                        <div className="text-xs text-white/30 mt-1">
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
              <div className="rounded-2xl p-4 cursor-pointer hover:scale-[1.02] transition-all"
                style={{ background:"linear-gradient(135deg, rgba(192,25,44,0.2), rgba(192,25,44,0.08))", border:"1px solid rgba(192,25,44,0.3)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background:"rgba(192,25,44,0.2)" }}>
                    <Gavel className="w-4.5 h-4.5 text-red-400" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">Ready to auction?</div>
                    <div className="text-xs text-white/40">250 IPL 2026 players in pool</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                  Start or join a room <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </Layout>
  );
}
