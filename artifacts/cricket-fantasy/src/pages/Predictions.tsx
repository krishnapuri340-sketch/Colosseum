import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Trophy, Zap, TrendingUp, CheckCircle,
  Clock, Lock, Award, ChevronDown, ChevronUp, Flame,
} from "lucide-react";
import { TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO } from "@/lib/ipl-constants";

type PredStatus = "open" | "locked" | "settled";
interface MatchPred {
  id: string; matchNo: number;
  team1: string; team2: string;
  venue: string; date: string; time: string;
  status: PredStatus;
  result?: { winner: string; topScorer: string; sixes: number };
  community: { t1: number; t2: number };
  scorers: string[];
  deadlineMins: number;
}
interface Pick { winner?:string; toss?:string; scorer?:string; sixes?:string; margin?:string; }

const MATCHES: MatchPred[] = [
  { id:"m1", matchNo:35, team1:"MI",  team2:"RCB", venue:"Wankhede Stadium, Mumbai",
    date:"Today", time:"7:30 PM", status:"open", community:{t1:62,t2:38}, deadlineMins:47,
    scorers:["Rohit Sharma","Suryakumar Yadav","Virat Kohli","Hardik Pandya","Tilak Varma"] },
  { id:"m2", matchNo:36, team1:"GT",  team2:"CSK", venue:"Narendra Modi Stadium, Ahmedabad",
    date:"Tomorrow", time:"3:30 PM", status:"open", community:{t1:55,t2:45}, deadlineMins:1127,
    scorers:["Shubman Gill","Sai Sudharsan","Ruturaj Gaikwad","Rashid Khan","MS Dhoni"] },
  { id:"m3", matchNo:34, team1:"SRH", team2:"KKR", venue:"Rajiv Gandhi IS, Hyderabad",
    date:"Yesterday", time:"7:30 PM", status:"settled",
    result:{ winner:"SRH", topScorer:"Travis Head", sixes:18 },
    community:{t1:48,t2:52}, deadlineMins:0,
    scorers:["Travis Head","Abhishek Sharma","Sunil Narine","Varun Chakravarthy"] },
  { id:"m4", matchNo:33, team1:"RR",  team2:"PBKS", venue:"Sawai Mansingh Stadium, Jaipur",
    date:"2 days ago", time:"3:30 PM", status:"settled",
    result:{ winner:"RR", topScorer:"Yashasvi Jaiswal", sixes:14 },
    community:{t1:58,t2:42}, deadlineMins:0,
    scorers:["Yashasvi Jaiswal","Riyan Parag","Arshdeep Singh","Shreyas Iyer"] },
  { id:"m5", matchNo:37, team1:"DC",  team2:"LSG", venue:"Arun Jaitley Stadium, Delhi",
    date:"Sat 3 May", time:"7:30 PM", status:"open", community:{t1:52,t2:48}, deadlineMins:3200,
    scorers:["KL Rahul","Axar Patel","Rishabh Pant","Mayank Yadav","Mitchell Starc"] },
];

const SIXES  = ["< 10","10–14","15–19","20+"];
const MARGIN = ["< 10 runs / 1–2 wkts","11–30 runs / 3–5 wkts","30+ runs / 6+ wkts","Super Over"];

const MY_STATS = { total:28, correct:19, streak:4, pts:1840, rank:7, accuracy:68 };

const LEADERS = [
  { rank:1, name:"BumrahOrNothing",   pts:3210, correct:41 },
  { rank:2, name:"GillForPresident",  pts:3080, correct:39 },
  { rank:3, name:"SRH_Fanatic",       pts:2940, correct:37 },
  { rank:4, name:"TravisHeadCase",    pts:2790, correct:35 },
  { rank:5, name:"KingKohliFC",       pts:2640, correct:34 },
  { rank:6, name:"MI_PalTan",         pts:2510, correct:32 },
  { rank:7, name:"You",               pts:1840, correct:19, isMe:true },
];

function TeamLogo({ code, size=36 }: { code:string; size?:number }) {
  const logo = TEAM_LOGO[code];
  const col  = TEAM_COLOR[code] ?? "#aaa";
  if (logo) return <img src={logo} alt={code} style={{ width:size, height:size, objectFit:"contain" }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%",
      background:`${col}22`, border:`1.5px solid ${col}50`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:size*0.28, color:col }}>
      {code}
    </div>
  );
}

function Chip({ label, selected, color="#818cf8", onClick, disabled=false }:
  { label:string; selected:boolean; color?:string; onClick:()=>void; disabled?:boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ padding:"0.45rem 0.9rem", borderRadius:10,
        cursor: disabled ? "default" : "pointer",
        background: selected ? `${color}20` : "rgba(255,255,255,0.04)",
        border:`1.5px solid ${selected ? color : "rgba(255,255,255,0.09)"}`,
        color: selected ? color : "rgba(255,255,255,0.5)",
        fontWeight: selected ? 700 : 500, fontSize:"0.8rem",
        transition:"all 0.15s", opacity: disabled ? 0.5 : 1 }}>
      {label}
    </button>
  );
}

function MatchCard({ match }: { match:MatchPred }) {
  const [picks, setPicks]   = useState<Pick>({});
  const [submitted, setSub] = useState(match.status === "settled");
  const [open, setOpen]     = useState(match.status === "open");

  const c1 = TEAM_COLOR[match.team1] ?? "#aaa";
  const c2 = TEAM_COLOR[match.team2] ?? "#aaa";
  const isOpen     = match.status === "open" && !submitted;
  const isSettled  = match.status === "settled";

  const pts = isSettled && match.result ? (
    (picks.winner === match.result.winner ? 50 : 0) +
    (picks.scorer === match.result.topScorer ? 30 : 0)
  ) : null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>

      {/* Card header — always visible, clickable */}
      <div onClick={() => setOpen(o=>!o)} className="cursor-pointer"
        style={{ padding:"1rem 1.25rem", borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none",
          background:"rgba(255,255,255,0.02)" }}>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-white/35 bg-white/8 px-2 py-0.5 rounded-md">M{match.matchNo}</span>

          <div className="flex items-center gap-2 flex-1 min-w-0">
            <TeamLogo code={match.team1} size={26} />
            <span className="font-bold text-sm truncate" style={{ color:c1 }}>{match.team1}</span>
            <span className="text-white/20 text-xs">vs</span>
            <span className="font-bold text-sm truncate" style={{ color:c2 }}>{match.team2}</span>
            <TeamLogo code={match.team2} size={26} />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {isSettled && pts !== null && (
              <span className="text-sm font-bold" style={{ color: pts>0?"#22c55e":"rgba(255,255,255,0.25)", fontFamily:"monospace" }}>
                +{pts}pts
              </span>
            )}
            {match.status==="open" && !submitted && (
              <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {match.deadlineMins < 60 ? `${match.deadlineMins}m` : `${Math.floor(match.deadlineMins/60)}h`}
              </span>
            )}
            {submitted && !isSettled && <CheckCircle className="w-4 h-4 text-green-400" />}
            {isSettled && <Lock className="w-3.5 h-3.5 text-white/25" />}
            {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }}
            exit={{ height:0, opacity:0 }} transition={{ duration:0.2 }}
            style={{ overflow:"hidden" }}>
            <div style={{ padding:"1.1rem 1.25rem", display:"flex", flexDirection:"column", gap:"1rem" }}>

              {/* Result banner */}
              {isSettled && match.result && (
                <div style={{ padding:"0.6rem 1rem", background:"rgba(255,255,255,0.04)", borderRadius:10,
                  display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                  <span style={{ fontSize:"0.78rem", color:TEAM_COLOR[match.result.winner]??"#34d399", fontWeight:700 }}>
                    🏆 {match.result.winner} won
                  </span>
                  <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.45)" }}>
                    Top scorer: <b style={{ color:"#fff" }}>{match.result.topScorer}</b>
                  </span>
                  <span style={{ fontSize:"0.78rem", color:"rgba(255,255,255,0.45)" }}>
                    Sixes: <b style={{ color:"#fff" }}>{match.result.sixes}</b>
                  </span>
                </div>
              )}

              {/* Community bar */}
              <div>
                <div className="flex justify-between mb-1.5">
                  <span style={{ fontSize:"0.68rem", fontWeight:700, color:c1 }}>{match.team1} {match.community.t1}%</span>
                  <span style={{ fontSize:"0.65rem", color:"rgba(255,255,255,0.3)" }}>Community Pick</span>
                  <span style={{ fontSize:"0.68rem", fontWeight:700, color:c2 }}>{match.community.t2}% {match.team2}</span>
                </div>
                <div style={{ height:7, borderRadius:4, overflow:"hidden", display:"flex" }}>
                  <div style={{ width:`${match.community.t1}%`, background:c1, transition:"width 0.4s" }} />
                  <div style={{ flex:1, background:c2 }} />
                </div>
              </div>

              {/* Picks */}
              <div style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
                <div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:"0.45rem" }}>
                    Winner <span style={{ color:"#f59e0b" }}>+50 pts</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                    {[match.team1, match.team2].map(t => (
                      <Chip key={t} label={`${t} — ${TEAM_FULL_NAME[t]}`}
                        selected={picks.winner===t} color={TEAM_COLOR[t]}
                        onClick={() => !submitted && setPicks(p=>({...p,winner:t}))} disabled={submitted} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:"0.45rem" }}>
                    Toss <span style={{ color:"#f59e0b" }}>+20 pts</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    {[match.team1, match.team2].map(t => (
                      <Chip key={t} label={t} selected={picks.toss===t} color={TEAM_COLOR[t]}
                        onClick={() => !submitted && setPicks(p=>({...p,toss:t}))} disabled={submitted} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:"0.45rem" }}>
                    Top Scorer <span style={{ color:"#f59e0b" }}>+30 pts</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                    {match.scorers.map(p => (
                      <Chip key={p} label={p} selected={picks.scorer===p}
                        onClick={() => !submitted && setPicks(prev=>({...prev,scorer:p}))} disabled={submitted} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:"0.45rem" }}>
                    Total Sixes <span style={{ color:"#f59e0b" }}>+15 pts</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                    {SIXES.map(b => (
                      <Chip key={b} label={b} selected={picks.sixes===b}
                        onClick={() => !submitted && setPicks(p=>({...p,sixes:b}))} disabled={submitted} />
                    ))}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em", color:"rgba(255,255,255,0.3)", textTransform:"uppercase", marginBottom:"0.45rem" }}>
                    Winning Margin <span style={{ color:"#f59e0b" }}>+20 pts</span>
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem", flexWrap:"wrap" }}>
                    {MARGIN.map(b => (
                      <Chip key={b} label={b} selected={picks.margin===b}
                        onClick={() => !submitted && setPicks(p=>({...p,margin:b}))} disabled={submitted} />
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit */}
              {isOpen && (
                <button onClick={() => picks.winner && setSub(true)} disabled={!picks.winner}
                  style={{ padding:"0.8rem 1.8rem", borderRadius:12, border:"none", alignSelf:"flex-start",
                    background: picks.winner ? "#c0192c" : "rgba(192,25,44,0.15)",
                    color: picks.winner ? "#fff" : "rgba(255,255,255,0.25)",
                    fontWeight:800, fontSize:"0.88rem",
                    cursor: picks.winner ? "pointer" : "default" }}>
                  ⚡ Lock Picks
                </button>
              )}
              {submitted && !isSettled && (
                <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", padding:"0.6rem 0.9rem",
                  background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)",
                  borderRadius:10, alignSelf:"flex-start" }}>
                  <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  <span style={{ fontSize:"0.78rem", color:"#22c55e", fontWeight:600 }}>Picks locked — good luck!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function Predictions() {
  const [tab, setTab] = useState<"predict"|"leaderboard">("predict");

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }} className="space-y-6">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">Predictions</h1>
            <p className="text-sm text-white/40 mt-0.5">Predict match outcomes · earn points · top the board</p>
          </div>
          <div className="flex gap-1.5 shrink-0">
            {(["predict","leaderboard"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold transition-all capitalize"
                style={{ background: tab===t?"rgba(129,140,248,0.15)":"rgba(255,255,255,0.05)",
                  border:`1px solid ${tab===t?"rgba(129,140,248,0.35)":"rgba(255,255,255,0.08)"}`,
                  color: tab===t?"#818cf8":"rgba(255,255,255,0.45)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label:"Predictions", value:MY_STATS.total,    color:"#fff",   icon:<Target className="w-3.5 h-3.5" /> },
            { label:"Correct",     value:MY_STATS.correct,  color:"#22c55e",icon:<CheckCircle className="w-3.5 h-3.5" /> },
            { label:"Accuracy",    value:`${MY_STATS.accuracy}%`, color:"#60a5fa",icon:<TrendingUp className="w-3.5 h-3.5" /> },
            { label:"Streak 🔥",   value:MY_STATS.streak,   color:"#f59e0b",icon:<Zap className="w-3.5 h-3.5" /> },
            { label:"Pred Pts",    value:MY_STATS.pts.toLocaleString(), color:"#a78bfa",icon:<Award className="w-3.5 h-3.5" /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-3.5"
              style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              <div className="flex items-center gap-1.5 mb-1.5" style={{ color:s.color }}>
                {s.icon}
                <span className="text-xs font-bold uppercase tracking-wide opacity-70">{s.label}</span>
              </div>
              <div className="text-xl font-black" style={{ color:s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        {tab === "predict" && (
          <div className="space-y-3">
            {/* Open matches first */}
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-sm font-bold text-white/60">Open for predictions</span>
            </div>
            {MATCHES.filter(m=>m.status==="open").map(m => <MatchCard key={m.id} match={m} />)}
            <div className="flex items-center gap-2 mt-4 mb-1">
              <Lock className="w-4 h-4 text-white/25" />
              <span className="text-sm font-bold text-white/40">Settled</span>
            </div>
            {MATCHES.filter(m=>m.status==="settled").map(m => <MatchCard key={m.id} match={m} />)}
          </div>
        )}

        {tab === "leaderboard" && (
          <div className="rounded-2xl overflow-hidden"
            style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-white/6">
              <Trophy className="w-4 h-4 text-yellow-400" />
              <span className="font-bold text-sm text-white">Prediction Leaderboard</span>
            </div>
            {LEADERS.map((e, i) => (
              <div key={e.rank}
                style={{ display:"flex", alignItems:"center", gap:"0.75rem",
                  padding:"0.85rem 1.25rem",
                  borderBottom: i<LEADERS.length-1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: (e as any).isMe ? "rgba(129,140,248,0.06)" : "transparent",
                  borderLeft: (e as any).isMe ? "2px solid #818cf8" : "2px solid transparent" }}>
                <span style={{ fontWeight:800, minWidth:22, textAlign:"center",
                  color: i===0?"#f59e0b":i===1?"#9ca3af":i===2?"#d97706":"rgba(255,255,255,0.3)",
                  fontSize: i<3?"1.1rem":"0.85rem" }}>
                  {i<3 ? ["🥇","🥈","🥉"][i] : `#${e.rank}`}
                </span>
                <div style={{ width:32, height:32, borderRadius:"50%",
                  background:"rgba(129,140,248,0.15)", border:"1px solid rgba(129,140,248,0.2)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"0.7rem", fontWeight:700, color:"#818cf8", flexShrink:0 }}>
                  {e.name.slice(0,2).toUpperCase()}
                </div>
                <span style={{ flex:1, fontWeight:(e as any).isMe?700:500,
                  color:(e as any).isMe?"#818cf8":"#fff", fontSize:"0.88rem" }}>
                  {e.name}{(e as any).isMe && " (You)"}
                </span>
                <span style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.3)", marginRight:"0.5rem" }}>
                  {e.correct} correct
                </span>
                <span style={{ fontFamily:"monospace", fontWeight:700, color:"#a78bfa", fontSize:"0.9rem" }}>
                  {e.pts.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
