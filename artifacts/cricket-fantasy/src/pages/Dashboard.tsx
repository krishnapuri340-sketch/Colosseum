import { Layout } from "@/components/layout/Layout";
import { useState, useEffect, useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight, Trophy, Flame, TrendingUp, Gavel,
  Target, Users, Zap, ChevronRight, Star, Radio,
  Sparkles, UserPlus, SlidersHorizontal, Calendar,
  ArrowUpRight, Plus,
} from "lucide-react";
import { Link } from "wouter";
import { TEAM_COLOR, TEAM_LOGO } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";
import { useApp } from "@/context/AppContext";
import { AnimatedNumber } from "@/components/effects/AnimatedNumber";
import { SpotlightCard } from "@/components/effects/SpotlightCard";

/** Convert "#aabbcc" or "rgb(a,b,c)" to "r,g,b" for the spotlight var. */
function toRgbCsv(hex: string): string {
  if (hex.startsWith("rgb")) {
    return hex.replace(/rgba?\(([^)]+)\)/, "$1").split(",").slice(0,3).map(s => s.trim()).join(",");
  }
  const h = hex.replace("#","");
  const v = h.length === 3
    ? h.split("").map(c => parseInt(c+c, 16))
    : [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  return `${v[0]},${v[1]},${v[2]}`;
}

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

type FilterKey = "all" | "live" | "upcoming" | "completed";
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all",       label: "All matches" },
  { key: "live",      label: "Live" },
  { key: "upcoming",  label: "Upcoming" },
  { key: "completed", label: "Completed" },
];

const QUICK_ACTIONS = [
  { label:"Join Room",     href:"/auction/join",   icon:Users,  color:"#818cf8", bg:"rgba(129,140,248,0.12)", border:"rgba(129,140,248,0.25)" },
  { label:"Predictions",   href:"/predictions",    icon:Target, color:"#34d399", bg:"rgba(52,211,153,0.11)", border:"rgba(52,211,153,0.24)" },
  { label:"My Teams",      href:"/my-teams",       icon:Star,   color:"#f59e0b", bg:"rgba(245,158,11,0.11)", border:"rgba(245,158,11,0.24)" },
];

/* Decorative cricket ball with seam */
function CricketBallDecor({ size = 120, opacity = 0.12 }: { size?: number; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 120 120" fill="none"
      style={{ opacity, pointerEvents: "none" }}>
      <circle cx="60" cy="60" r="56" stroke="rgba(192,25,44,0.6)" strokeWidth="1.5" fill="rgba(192,25,44,0.05)" />
      <path d="M60 4 C80 20, 80 100, 60 116" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
      <path d="M60 4 C40 20, 40 100, 60 116" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" fill="none" />
      {[25,35,45,55,65,75,85,95].map((y, i) => (
        <g key={i}>
          <line x1="52" y1={y} x2="48" y2={y + 4} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
          <line x1="68" y1={y} x2="72" y2={y + 4} stroke="rgba(255,255,255,0.35)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

function StumpsDecor({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <svg width="60" height="80" viewBox="0 0 60 80" fill="none" style={{ opacity, pointerEvents: "none" }}>
      <rect x="10" y="20" width="4" height="55" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="28" y="20" width="4" height="55" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="46" y="20" width="4" height="55" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="8" y="17" width="12" height="4" rx="2" fill="rgba(255,255,255,0.8)" />
      <rect x="26" y="17" width="12" height="4" rx="2" fill="rgba(255,255,255,0.8)" />
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

/** Mock "rivals" avatar stack — renders top 3 most-popular team colors as initial bubbles */
const RIVAL_AVATARS = [
  { initial: "RK", color: "#fcd34d" },
  { initial: "AS", color: "#a78bfa" },
  { initial: "MJ", color: "#34d399" },
];

function AvatarBubble({ initial, color, size = 32 }: { initial: string; color: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `linear-gradient(135deg, ${color}, ${color}88)`,
      color: "#0b0e1f",
      fontSize: size * 0.4, fontWeight: 900,
      display: "flex", alignItems: "center", justifyContent: "center",
      letterSpacing: "-0.02em",
    }}>
      {initial}
    </div>
  );
}

function StatusPill({ status }: { status: "live" | "upcoming" | "completed" }) {
  const cls = `status-pill status-pill-${status}`;
  const label = status === "live" ? "Live" : status === "upcoming" ? "Upcoming" : "Completed";
  return <span className={cls}>{label}</span>;
}

function todayLabel() {
  const d = new Date();
  return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
}

export default function Dashboard() {
  const [matches, setMatches] = useState<IplMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<FilterKey>("all");
  const { profile, totalPts, currentRank, myTeams, predAccuracy, notifications } = useApp();

  useEffect(() => {
    apiFetch("/ipl/matches")
      .then(r => r.json())
      .then(d => { if (Array.isArray(d.matches)) setMatches(d.matches); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const live      = matches.filter(m => m.isLive);
  const upcoming  = matches.filter(m => m.isUpcoming);
  const completed = matches.filter(m => m.isCompleted);

  const featured = live[0] ?? upcoming[0] ?? null;

  const filtered = useMemo<IplMatch[]>(() => {
    const list =
      filter === "live"      ? live
      : filter === "upcoming" ? upcoming
      : filter === "completed" ? completed
      : [...live, ...upcoming, ...completed];
    // Drop the featured card from the list to avoid duplication
    return list.filter(m => m.iplId !== featured?.iplId).slice(0, 4);
  }, [filter, live, upcoming, completed, featured]);

  const filterCount = (k: FilterKey) =>
    k === "live" ? live.length :
    k === "upcoming" ? upcoming.length :
    k === "completed" ? completed.length :
    matches.length;

  return (
    <Layout>
      <motion.div
        className="space-y-5"
        initial="hidden"
        animate="visible"
        variants={{ visible:{ transition:{ staggerChildren:0.07 } } }}
      >

        {/* ═════════ HERO ═════════ */}
        <motion.div variants={fade}
          className="relative rounded-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(192,25,44,0.20) 0%, rgba(129,140,248,0.08) 55%, rgba(7,9,26,0.92) 100%)",
            border: "1px solid rgba(255,255,255,0.10)",
            boxShadow: "0 1px 0 rgba(255,255,255,0.07) inset, 0 8px 40px rgba(0,0,0,0.32)",
          }}>

          {/* Background glows */}
          <div className="absolute inset-0 pointer-events-none">
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: "radial-gradient(ellipse 70% 80% at 12% 60%, rgba(192,25,44,0.24), transparent)",
            }} />
            <div style={{
              position: "absolute", top: 0, right: 0, bottom: 0,
              width: "55%",
              background: "radial-gradient(ellipse 80% 60% at 80% 20%, rgba(129,140,248,0.10), transparent)",
            }} />
          </div>

          {/* Decorative cricket ball */}
          <div style={{ position: "absolute", top: -30, right: -30, pointerEvents: "none" }} className="ball-spin">
            <CricketBallDecor size={180} opacity={0.10} />
          </div>

          <div className="relative z-10 p-6 md:p-8">
            {/* Top chip row — Today + date */}
            <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="chip chip-today">Today</span>
                <span className="chip">
                  <Calendar className="w-3 h-3" />
                  {todayLabel()}
                </span>
                {live.length > 0 && (
                  <span className="status-pill status-pill-live">
                    {live.length} match{live.length > 1 ? "es" : ""} live
                  </span>
                )}
              </div>

              {/* Avatar stack + Invite */}
              <div className="flex items-center gap-3">
                <div className="avatar-stack">
                  {RIVAL_AVATARS.map(r => (
                    <AvatarBubble key={r.initial} initial={r.initial} color={r.color} size={30} />
                  ))}
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 11, fontWeight: 800,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    letterSpacing: "-0.02em",
                  }}>+12</div>
                </div>
                <button className="chip" style={{ background: "rgba(255,255,255,0.06)" }}>
                  <UserPlus className="w-3 h-3" />
                  Invite
                </button>
              </div>
            </div>

            {/* Big split gradient headline */}
            <h1
              className="font-black mb-2 leading-[1.05]"
              style={{
                fontSize: "clamp(2.1rem, 4.6vw, 3.6rem)",
                letterSpacing: "-0.035em",
              }}
            >
              <span className="headline-grad-crimson">Welcome back,</span>
              <span className="text-white"> {profile.displayName}</span>
              <span className="inline-block ml-2" style={{ transform: "translateY(-4px)" }}>🏏</span>
            </h1>
            <p className="text-white/55 text-[0.92rem] mb-6 max-w-xl">
              {loading
                ? "Loading IPL 2026 fixtures…"
                : "Your fantasy command center. Track live action, host an auction, and outsmart your league."}
            </p>

            {/* Filter chips + sort */}
            <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
              <div role="group" aria-label="Filter matches by status" className="flex items-center gap-1.5 flex-wrap">
                {FILTERS.map(f => (
                  <button
                    key={f.key}
                    onClick={() => setFilter(f.key)}
                    aria-pressed={filter === f.key}
                    aria-label={`${f.label}, ${filterCount(f.key)} matches`}
                    className={"chip " + (filter === f.key ? "chip-active" : "")}
                  >
                    {f.label}
                    <span aria-hidden="true" style={{
                      marginLeft: 4,
                      padding: "1px 7px",
                      borderRadius: 9999,
                      fontSize: "0.62rem",
                      fontWeight: 800,
                      background: filter === f.key ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.07)",
                      color: filter === f.key ? "#fff" : "rgba(255,255,255,0.5)",
                    }}>{filterCount(f.key)}</span>
                  </button>
                ))}
                <button className="chip" aria-label="Sort and filter options" title="Sort & filter">
                  <SlidersHorizontal className="w-3 h-3" />
                </button>
              </div>

              {/* Big primary CTA — "New task" equivalent */}
              <Link href="/auction/create">
                <button
                  className="press-sm flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold text-white"
                  style={{
                    background: "linear-gradient(135deg, #c0192c 0%, #8b1020 100%)",
                    border: "1px solid rgba(255,120,140,0.4)",
                    boxShadow: "0 8px 24px rgba(192,25,44,0.35), 0 1px 0 rgba(255,255,255,0.18) inset",
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  <Gavel className="w-4 h-4" />
                  Host Auction
                </button>
              </Link>
            </div>

            {/* Quick action pills (secondary) */}
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map(a => (
                <Link key={a.href} href={a.href}>
                  <SpotlightCard
                    color={toRgbCsv(a.color)}
                    radius={220}
                    className="press-sm flex items-center gap-2 px-3.5 py-2 rounded-full cursor-pointer transition-transform"
                    style={{
                      background: a.bg,
                      border: `1px solid ${a.border}`,
                    }}
                  >
                    <a.icon className="w-3 h-3" style={{ color: a.color }} />
                    <span className="text-xs font-bold text-white/90">{a.label}</span>
                  </SpotlightCard>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═════════ STATS — featured + 3 mini ═════════ */}
        <motion.div variants={fade}
          className="grid grid-cols-2 md:grid-cols-4 gap-3">

          {/* Featured big stat — Total Points (spans 2 cols on mobile for impact) */}
          <Link href="/leaderboard" className="col-span-2 md:col-span-1">
            <div className="featured-card relative rounded-2xl p-5 cursor-pointer"
              style={{
                background: "linear-gradient(135deg, rgba(192,25,44,0.32) 0%, rgba(123,16,36,0.18) 60%, rgba(9,12,30,0.85) 100%)",
                boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 8px 32px rgba(192,25,44,0.18)",
                minHeight: 132,
              }}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-[0.66rem] font-black tracking-widest uppercase text-white/55 mb-1">Season Points</div>
                  <div className="text-xs text-white/40">IPL 2026 fantasy</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/40" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-white tabular-nums leading-none"
                  style={{ letterSpacing: "-0.04em" }}>
                  <AnimatedNumber value={totalPts} />
                </span>
                <span className="text-sm text-white/45 font-bold">pts</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-white/8 overflow-hidden">
                  <div className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, (totalPts / 5000) * 100)}%`,
                      background: "linear-gradient(90deg, #ff3854, #c0192c)",
                      boxShadow: "0 0 10px rgba(192,25,44,0.6)",
                    }} />
                </div>
                <span className="text-xs text-white/35 font-bold">Goal 5K</span>
              </div>
            </div>
          </Link>

          {[
            { label:"Current Rank",  value:<><span>#</span><AnimatedNumber value={currentRank} /></>, sub:"Fantasy league", color:"#f59e0b", icon:<Trophy className="w-4 h-4" /> },
            { label:"Teams Active",  value:<AnimatedNumber value={myTeams.length} />, sub:`${myTeams.filter(t=>t.status==="live").length} live`, color:"#34d399", icon:<Users className="w-4 h-4" /> },
            { label:"Predictions",   value:<><AnimatedNumber value={predAccuracy} /><span>%</span></>, sub:"Accuracy",  color:"#818cf8", icon:<Target className="w-4 h-4" /> },
          ].map(s => (
            <SpotlightCard
              key={s.label}
              color={toRgbCsv(s.color)}
              radius={300}
              className="glass-elevated rounded-2xl p-4 flex flex-col justify-between cursor-default"
              style={{ minHeight: 132 }}
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{
                    background: `linear-gradient(135deg, ${s.color}26, ${s.color}10)`,
                    border: `1px solid ${s.color}30`,
                    color: s.color,
                  }}>
                  {s.icon}
                </div>
                <Sparkles className="w-3 h-3 text-white/15" />
              </div>
              <div>
                <div className="text-2xl font-black text-white tabular-nums leading-none"
                  style={{ letterSpacing: "-0.025em" }}>{s.value}</div>
                <div className="text-xs font-bold text-white/55 mt-1.5">{s.label}</div>
                <div className="text-[0.66rem] text-white/30 mt-0.5">{s.sub}</div>
              </div>
            </SpotlightCard>
          ))}
        </motion.div>

        {/* ═════════ MAIN GRID ═════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT/MIDDLE — featured match + filtered list */}
          <motion.div variants={fade} className="lg:col-span-2 space-y-4">

            {/* Section header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black flex items-center gap-2" style={{ letterSpacing: "-0.01em" }}>
                <Flame className="w-4.5 h-4.5 text-orange-500" />
                Match Centre
              </h2>
              <Link href="/matches" className="flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-white transition-colors">
                All matches <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Featured match — gradient hero card (G.Take "Design System" pattern) */}
            {loading ? (
              <Skeleton className="h-44 rounded-2xl bg-white/5" />
            ) : featured ? (
              <FeaturedMatch match={featured} />
            ) : (
              <div className="glass-elevated rounded-2xl p-8 text-center">
                <div className="text-4xl mb-2">🏟️</div>
                <div className="text-sm font-bold text-white/50">No matches scheduled</div>
                <div className="text-xs text-white/28 mt-1">Check back soon for IPL 2026 fixtures</div>
              </div>
            )}

            {/* Filtered match list */}
            <div className="space-y-2.5">
              {loading ? (
                [1,2,3].map(i => <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />)
              ) : filtered.length === 0 ? (
                <div className="glass-elevated rounded-2xl p-8 text-center">
                  <div className="text-sm text-white/40 font-medium">
                    No {filter === "all" ? "additional" : filter} matches
                  </div>
                </div>
              ) : (
                filtered.map(match => (
                  <MatchRow key={match.iplId} match={match} />
                ))
              )}
            </div>
          </motion.div>

          {/* RIGHT RAIL — Today spotlight, My Squads, Activity (G.Take pattern) */}
          <motion.div variants={fade} className="space-y-4">

            {/* Today's spotlight — like G.Take "Today note" */}
            <div className="glass-elevated rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[0.7rem] font-black tracking-widest uppercase text-white/55">
                  Today's Spotlight
                </div>
                <div className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background: "rgba(192,25,44,0.18)",
                    border: "1px solid rgba(192,25,44,0.32)",
                  }}>
                  <Flame className="w-3.5 h-3.5 text-red-400" />
                </div>
              </div>
              {featured ? (
                <>
                  <div className="text-sm text-white/85 font-semibold leading-snug mb-3">
                    {featured.isLive ? "Live now: " : "Up next: "}
                    <span className="text-white font-black">{featured.homeTeam}</span>
                    <span className="text-white/35 mx-1.5">vs</span>
                    <span className="text-white font-black">{featured.awayTeam}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[0.7rem] text-white/45 mb-4">
                    <Calendar className="w-3 h-3" />
                    {featured.matchDate} · {featured.matchTime}
                    <span className="text-white/15">·</span>
                    <span className="truncate">{featured.city}</span>
                  </div>
                  <Link href="/predictions">
                    <button className="press-sm w-full flex items-center justify-center gap-2 px-4 py-2 rounded-full text-xs font-bold text-white"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        cursor: "pointer", fontFamily: "inherit",
                      }}>
                      <Target className="w-3.5 h-3.5" />
                      Lock prediction
                    </button>
                  </Link>
                </>
              ) : (
                <div className="text-sm text-white/40 py-3">No active fixture today.</div>
              )}
            </div>

            {/* My Squads — like "My files" empty/list */}
            <div className="glass-elevated rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[0.7rem] font-black tracking-widest uppercase text-white/55">
                  My Squads
                </div>
                <Link href="/auction/create">
                  <button className="press-sm flex items-center gap-1 px-2.5 py-1 rounded-full text-[0.66rem] font-bold text-white/60"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    <Plus className="w-3 h-3" /> New
                  </button>
                </Link>
              </div>

              {myTeams.length === 0 ? (
                <div className="text-center py-3">
                  <div className="w-12 h-12 mx-auto mb-2 rounded-2xl flex items-center justify-center"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px dashed rgba(255,255,255,0.12)",
                    }}>
                    <span className="text-xl">🏏</span>
                  </div>
                  <div className="text-sm font-bold text-white/55">No squads yet</div>
                  <div className="text-[0.7rem] text-white/30 mt-0.5">Host or join an auction to build one</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {myTeams.slice(0, 3).map(t => (
                    <div key={t.id} className="flex items-center gap-3 p-2 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                        style={{
                          background: "rgba(192,25,44,0.18)",
                          border: "1px solid rgba(192,25,44,0.30)",
                          color: "#ff7a8a",
                        }}>
                        {t.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-white truncate">{t.name}</div>
                        <div className="text-[0.66rem] text-white/35">{t.captain ?? "No captain"}</div>
                      </div>
                      <StatusPill status={t.status === "live" ? "live" : "upcoming"} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Activity mini — sparkline progress */}
            <div className="glass-elevated rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[0.7rem] font-black tracking-widest uppercase text-white/55">Activity</div>
                  <div className="text-xs text-white/40 mt-0.5">{notifications.length} events this week</div>
                </div>
                <Link href="/leaderboard">
                  <button className="press-sm flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[0.7rem] font-bold text-white"
                    style={{
                      background: "linear-gradient(135deg, rgba(192,25,44,0.85), rgba(155,19,35,0.7))",
                      border: "1px solid rgba(255,120,140,0.32)",
                      boxShadow: "0 4px 12px rgba(192,25,44,0.25)",
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                    Get the report <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>

              {/* Mini bar sparkline (deterministic mock by week-day) */}
              <div className="flex items-end gap-1.5 h-14 mb-2">
                {[40, 65, 35, 80, 50, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t-md"
                    style={{
                      height: `${h}%`,
                      background: i === 5
                        ? "linear-gradient(180deg, #ff3854, #c0192c)"
                        : "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.06))",
                      boxShadow: i === 5 ? "0 0 12px rgba(192,25,44,0.5)" : "none",
                    }} />
                ))}
              </div>
              <div className="flex justify-between text-[0.62rem] text-white/30 font-bold tracking-wider">
                {["M","T","W","T","F","S","S"].map((d, i) => (
                  <span key={i} style={{ color: i === 5 ? "rgba(255,255,255,0.7)" : undefined }}>{d}</span>
                ))}
              </div>
            </div>

            {/* Season progress — kept from previous version */}
            <div className="glass-elevated rounded-2xl p-4">
              <div className="text-[0.7rem] font-black tracking-widest uppercase text-white/55 mb-3">IPL 2026 Season</div>
              <div className="space-y-2.5">
                {[
                  { label: "Matches Played", value: `${completed.length}/70`, pct: (completed.length / 70) * 100, color: "#818cf8" },
                  { label: "Live Right Now",  value: `${live.length}`, pct: live.length > 0 ? 100 : 0, color: "#34d399" },
                  { label: "Your Accuracy",   value: `${predAccuracy}%`, pct: predAccuracy, color: "#f59e0b" },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-white/50 font-medium">{item.label}</span>
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

        {/* ═════════ DIFFERENTIAL PICKS — bottom strip ═════════ */}
        <motion.div variants={fade}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black flex items-center gap-2" style={{ letterSpacing: "-0.01em" }}>
              <TrendingUp className="w-4.5 h-4.5 text-emerald-400" />
              Differential Picks
            </h2>
            <Link href="/players" className="flex items-center gap-1 text-xs font-semibold text-white/40 hover:text-white transition-colors">
              All players <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="glass-elevated rounded-2xl p-6 text-center"
            style={{ border: "1px dashed rgba(255,255,255,0.10)" }}>
            <div className="text-sm font-semibold text-white/45">Differentials update during live matches</div>
            <div className="text-xs text-white/25 mt-1">Players outperforming average ownership appear here</div>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}

/* ═════════════════════════════════════════════════════════════
   FEATURED MATCH CARD — gradient hero (G.Take "Design System")
   ═════════════════════════════════════════════════════════════ */
function FeaturedMatch({ match }: { match: IplMatch }) {
  const c1 = TEAM_COLOR[match.homeTeam] ?? "#aaa";
  const c2 = TEAM_COLOR[match.awayTeam] ?? "#aaa";
  const status = match.isLive ? "live" : match.isUpcoming ? "upcoming" : "completed";
  return (
    <Link href="/matches">
      <div className="featured-card rounded-2xl p-5 cursor-pointer relative overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${c1}28 0%, rgba(7,9,26,0.6) 50%, ${c2}24 100%)`,
          boxShadow: "0 1px 0 rgba(255,255,255,0.08) inset, 0 12px 40px rgba(0,0,0,0.35)",
          minHeight: 175,
        }}>

        {/* Top row: status + match meta */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <StatusPill status={status} />
            <span className="text-[0.7rem] font-bold text-white/45 px-2 py-0.5 rounded-md"
              style={{ background: "rgba(255,255,255,0.06)" }}>
              Match {match.matchNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[0.72rem] text-white/55 font-medium">
            <Calendar className="w-3 h-3" />
            {match.matchDate} · {match.matchTime}
          </div>
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <div className="shrink-0" style={{ filter: `drop-shadow(0 4px 14px ${c1}55)` }}>
              <TeamLogo code={match.homeTeam} size={48} />
            </div>
            <div className="min-w-0">
              <div className="text-xl font-black truncate" style={{ color: c1, letterSpacing: "-0.02em" }}>
                {match.homeTeam}
              </div>
              {match.firstInningsScore && (
                <div className="text-base font-mono font-bold text-white tabular-nums leading-tight">
                  {match.firstInningsScore}
                </div>
              )}
              {!match.firstInningsScore && (
                <div className="text-xs text-white/40 truncate">{match.homeTeamFull}</div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className="text-xs text-white/30 font-mono font-black tracking-widest">VS</div>
            <div style={{
              width: 44, height: 3, borderRadius: 9999,
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent)",
            }} />
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 flex-row-reverse">
            <div className="shrink-0" style={{ filter: `drop-shadow(0 4px 14px ${c2}55)` }}>
              <TeamLogo code={match.awayTeam} size={48} />
            </div>
            <div className="min-w-0 text-right">
              <div className="text-xl font-black truncate" style={{ color: c2, letterSpacing: "-0.02em" }}>
                {match.awayTeam}
              </div>
              {match.secondInningsScore && (
                <div className="text-base font-mono font-bold text-white tabular-nums leading-tight">
                  {match.secondInningsScore}
                </div>
              )}
              {!match.secondInningsScore && (
                <div className="text-xs text-white/40 truncate">{match.awayTeamFull}</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer: result OR predict CTA + "predicting" stack */}
        <div className="mt-5 pt-4 flex items-center justify-between gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          {match.result ? (
            <div className="text-xs font-bold" style={{
              color: match.winningTeamCode ? (TEAM_COLOR[match.winningTeamCode] ?? "#34d399") : "#34d399",
            }}>
              🏆 {match.result}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-white/55">
              <div className="avatar-stack">
                {RIVAL_AVATARS.slice(0, 3).map(r => (
                  <AvatarBubble key={r.initial} initial={r.initial} color={r.color} size={22} />
                ))}
              </div>
              <span><span className="text-white font-bold">+128</span> predicting</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs font-bold text-white">
            View match centre
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ═════════════════════════════════════════════════════════════
   COMPACT MATCH ROW — for the filtered list
   ═════════════════════════════════════════════════════════════ */
function MatchRow({ match }: { match: IplMatch }) {
  const c1 = TEAM_COLOR[match.homeTeam] ?? "#aaa";
  const c2 = TEAM_COLOR[match.awayTeam] ?? "#aaa";
  const status = match.isLive ? "live" : match.isUpcoming ? "upcoming" : "completed";
  return (
    <Link href="/matches">
      <div className="glass-elevated rounded-2xl p-3.5 cursor-pointer transition-all hover:-translate-y-px"
        style={{ "--team-color": c1 } as React.CSSProperties}>
        <div className="flex items-center gap-3">
          {/* Left: status + match number */}
          <div className="flex flex-col items-center gap-1 shrink-0 w-14">
            <StatusPill status={status} />
            <div className="text-[0.62rem] text-white/30 font-bold">M{match.matchNumber}</div>
          </div>

          {/* Middle: teams */}
          <div className="flex-1 min-w-0 flex items-center gap-2.5">
            <TeamLogo code={match.homeTeam} size={28} />
            <div className="min-w-0">
              <div className="text-sm font-black truncate" style={{ color: c1 }}>{match.homeTeam}</div>
              {match.firstInningsScore && (
                <div className="text-[0.7rem] font-mono text-white/70 truncate">{match.firstInningsScore}</div>
              )}
            </div>
            <span className="text-[0.62rem] text-white/22 font-mono mx-1">vs</span>
            <TeamLogo code={match.awayTeam} size={28} />
            <div className="min-w-0">
              <div className="text-sm font-black truncate" style={{ color: c2 }}>{match.awayTeam}</div>
              {match.secondInningsScore && (
                <div className="text-[0.7rem] font-mono text-white/70 truncate">{match.secondInningsScore}</div>
              )}
            </div>
          </div>

          {/* Right: time/venue */}
          <div className="text-right shrink-0 hidden sm:block">
            <div className="text-[0.7rem] text-white/55 font-bold">{match.matchTime}</div>
            <div className="text-[0.62rem] text-white/28 truncate max-w-[110px]">{match.city}</div>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-white/25 shrink-0" />
        </div>
      </div>
    </Link>
  );
}
