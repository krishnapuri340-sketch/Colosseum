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

const chartData = [
  { w:"W1", pts:187, rank:18 }, { w:"W2", pts:312, rank:12 },
  { w:"W3", pts:245, rank:15 }, { w:"W4", pts:418, rank:9 },
  { w:"W5", pts:376, rank:11 }, { w:"W6", pts:502, rank:7 },
  { w:"W7", pts:489, rank:7 },
];

const QUICK_ACTIONS = [
  { label:"Host Auction",  href:"/auction/create", icon:Gavel,  color:"#c0192c", bg:"rgba(192,25,44,0.12)" },
  { label:"Join Room",     href:"/auction/join",   icon:Users,  color:"#818cf8", bg:"rgba(129,140,248,0.12)" },
  { label:"Predictions",  href:"/predictions",    icon:Target, color:"#34d399", bg:"rgba(52,211,153,0.12)" },
  { label:"My Teams",     href:"/my-teams",       icon:Star,   color:"#f59e0b", bg:"rgba(245,158,11,0.12)" },
];

const DIFFERENTIALS = [
  { name:"Vaibhav Suryavanshi", team:"RR",  role:"BAT", sel:"14%", pts:387, trend:"+23%" },
  { name:"Washington Sundar",   team:"GT",  role:"AR",  sel:"22%", pts:342, trend:"+18%" },
  { name:"Mayank Yadav",        team:"LSG", role:"BWL", sel:"29%", pts:318, trend:"+31%" },
];

const RECENT_ACTIVITY = [
  { text:"Your auction 'Friday Night Draft' is live",    time:"2m ago",  color:"#22c55e", dot:"#22c55e" },
  { text:"Jasprit Bumrah scored 47 pts vs DC",           time:"1h ago",  color:"#818cf8", dot:"#818cf8" },
  { text:"Prediction locked — MI vs RCB",                time:"3h ago",  color:"#f59e0b", dot:"#f59e0b" },
  { text:"Tilak Varma added to watchlist",               time:"5h ago",  color:"rgba(255,255,255,0.4)", dot:"rgba(255,255,255,0.2)" },
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
                Good evening, Strategist
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
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl cursor-pointer transition-all hover:scale-[1.03]"
                      style={{ background:a.bg, border:`1px solid ${a.color}30` }}>
                      <a.icon className="w-4 h-4" style={{ color:a.color }} />
                      <span className="text-sm font-semibold text-white">{a.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Sparkline */}
            <div className="hidden md:block w-72 shrink-0">
              <div className="text-xs text-white/30 font-semibold uppercase tracking-widest mb-2">Fantasy Points — Season</div>
              <div style={{ height:90 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="pg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#c0192c" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#c0192c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="w" tick={{ fontSize:9, fill:"rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background:"#0f1220", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontSize:11 }}
                      formatter={(v:number) => [`${v} pts`, "Points"]}
                    />
                    <Area type="monotone" dataKey="pts" stroke="#c0192c" strokeWidth={2.5}
                      fillOpacity={1} fill="url(#pg)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-2xl font-black text-white">2,529</span>
                <span className="text-xs text-white/40">pts · Rank</span>
                <span className="text-lg font-bold text-yellow-400">#7</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stats strip ── */}
        <motion.div variants={fade}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label:"Total Points",  value:"2,529",  sub:"Season total",    color:"#818cf8", icon:<Zap className="w-5 h-5" /> },
            { label:"Current Rank",  value:"#7",     sub:"↑ 2 from last wk",color:"#f59e0b", icon:<Trophy className="w-5 h-5" /> },
            { label:"Teams Active",  value:"3",      sub:"Across 3 contests",color:"#34d399", icon:<Users className="w-5 h-5" /> },
            { label:"Predictions",   value:"19/28",  sub:"68% accuracy",    color:"#f87171", icon:<Target className="w-5 h-5" /> },
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

            {/* Differentials */}
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
              <div className="space-y-2">
                {DIFFERENTIALS.map(p => {
                  const color = TEAM_COLOR[p.team] ?? "#818cf8";
                  return (
                    <div key={p.name} className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)", borderLeft:`3px solid ${color}` }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0"
                        style={{ background:`${color}20`, color }}>
                        {p.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{p.name}</div>
                        <div className="text-xs" style={{ color }}>{p.team} · {p.role} · {p.sel} owned</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-bold text-cyan-400">{p.pts} pts</div>
                        <div className="text-xs text-emerald-400 font-semibold">{p.trend}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* RIGHT: Activity + weekly chart */}
          <motion.div variants={fade} className="space-y-4">
            {/* Weekly bar chart */}
            <div className="rounded-2xl p-4"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-sm font-bold text-white/60 mb-3">Weekly Fantasy Points</div>
              <div style={{ height:120 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} barCategoryGap="35%">
                    <XAxis dataKey="w" tick={{ fontSize:9, fill:"rgba(255,255,255,0.3)" }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background:"#0f1220", border:"1px solid rgba(255,255,255,0.1)", borderRadius:8, fontSize:11 }}
                      formatter={(v:number) => [`${v} pts`]}
                    />
                    <Bar dataKey="pts" fill="#818cf8" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Activity feed */}
            <div className="rounded-2xl p-4"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="text-sm font-bold text-white/60 mb-4">Recent Activity</div>
              <div className="space-y-4">
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="relative shrink-0">
                      <div className="w-2 h-2 rounded-full mt-1.5" style={{ background:a.dot }} />
                      {i < RECENT_ACTIVITY.length-1 && (
                        <div className="absolute left-[3px] top-[10px] bottom-[-12px] w-px bg-white/8" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-white/70 leading-tight">{a.text}</div>
                      <div className="text-xs text-white/30 mt-1">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
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
