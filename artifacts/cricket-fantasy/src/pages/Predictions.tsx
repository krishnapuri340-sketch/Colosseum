/**
 * Predictions.tsx — Match prediction feature
 * Users predict match outcomes, toss, top scorer, and earn prediction points.
 * Fully self-contained — wire API for real match data and persisted picks.
 */
import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { 
  Target, Trophy, Zap, TrendingUp, CheckCircle, 
  Clock, Lock, Award, ChevronDown, ChevronUp
} from "lucide-react";
import { TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO, IPL_2026_PLAYERS } from "@/lib/ipl-constants";

// ── Types ────────────────────────────────────────────────────────────
type PredStatus = "open" | "locked" | "settled";

interface MatchPrediction {
  id: string;
  matchNo: number;
  team1: string; team2: string;
  venue: string; date: string; time: string;
  status: PredStatus;
  result?: { winner: string; topScorer: string; sixesInMatch: number };
  communityPct: { t1: number; t2: number };       // % picking each team to win
  topScorerOptions: string[];
  deadlineMins: number;
}

interface UserPick {
  winner?: string;
  toss?: string;
  topScorer?: string;
  sixesBand?: string;
  marginBand?: string;
}

// ── Mock data ─────────────────────────────────────────────────────────
const PREDICTIONS: MatchPrediction[] = [
  {
    id: "m1", matchNo: 34,
    team1: "MI", team2: "RCB",
    venue: "Wankhede Stadium, Mumbai", date: "Today", time: "7:30 PM",
    status: "open", communityPct: { t1: 62, t2: 38 },
    topScorerOptions: ["Rohit Sharma", "Suryakumar Yadav", "Virat Kohli", "Hardik Pandya", "Tilak Varma"],
    deadlineMins: 47,
  },
  {
    id: "m2", matchNo: 35,
    team1: "GT", team2: "CSK",
    venue: "Narendra Modi Stadium, Ahmedabad", date: "Tomorrow", time: "3:30 PM",
    status: "open", communityPct: { t1: 55, t2: 45 },
    topScorerOptions: ["Shubman Gill", "Sai Sudharsan", "Ruturaj Gaikwad", "Rashid Khan", "Jos Buttler"],
    deadlineMins: 1127,
  },
  {
    id: "m3", matchNo: 33,
    team1: "SRH", team2: "KKR",
    venue: "Rajiv Gandhi IS, Hyderabad", date: "Yesterday", time: "7:30 PM",
    status: "settled",
    result: { winner: "SRH", topScorer: "Travis Head", sixesInMatch: 18 },
    communityPct: { t1: 48, t2: 52 },
    topScorerOptions: ["Travis Head", "Abhishek Sharma", "Sunil Narine", "Andre Russell"],
    deadlineMins: 0,
  },
  {
    id: "m4", matchNo: 32,
    team1: "RR", team2: "PBKS",
    venue: "Sawai Mansingh Stadium, Jaipur", date: "2 days ago", time: "3:30 PM",
    status: "settled",
    result: { winner: "RR", topScorer: "Yashasvi Jaiswal", sixesInMatch: 14 },
    communityPct: { t1: 58, t2: 42 },
    topScorerOptions: ["Yashasvi Jaiswal", "Shreyas Iyer", "Arshdeep Singh"],
    deadlineMins: 0,
  },
];

const SIXES_BANDS  = ["< 10", "10–14", "15–19", "20+"];
const MARGIN_BANDS = ["< 10 runs / 1-2 wkts", "11–30 runs / 3-5 wkts", "30+ runs / 6+ wkts", "Super Over"];
const TOSS_OPTIONS = (t1: string, t2: string) => [t1, t2];

const MY_STATS = { totalPreds: 28, correct: 19, streak: 4, pts: 1840, rank: 7 };

const LEADERBOARD = [
  { rank: 1, name: "BumrahOrNothing",  pts: 3210, correct: 41 },
  { rank: 2, name: "GillForPresident", pts: 3080, correct: 39 },
  { rank: 3, name: "SRH_Fanatic",      pts: 2940, correct: 37 },
  { rank: 4, name: "TravisHeadCase",   pts: 2790, correct: 35 },
  { rank: 5, name: "KingKohliFC",      pts: 2640, correct: 34 },
  { rank: 6, name: "MI_PalTan",        pts: 2510, correct: 32 },
  { rank: 7, name: "You",              pts: 1840, correct: 19 },
];

// ── Sub-components ────────────────────────────────────────────────────
function TeamLogo({ code, size = 44 }: { code: string; size?: number }) {
  const color = TEAM_COLOR[code] ?? "#aaa";
  const logo  = TEAM_LOGO[code];
  if (logo) return <img src={logo} alt={code} style={{ width: size, height: size, objectFit: "contain" }} onError={e => (e.currentTarget.style.display = "none")} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: `${color}22`, border: `1.5px solid ${color}50`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: size * 0.3, color }}>
      {code}
    </div>
  );
}

function PickButton({ label, selected, onSelect, color = "#818cf8", disabled = false }: { label: string; selected: boolean; onSelect: () => void; color?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      style={{
        padding: "0.5rem 1rem", borderRadius: 10, cursor: disabled ? "default" : "pointer",
        background: selected ? `${color}22` : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${selected ? color : "rgba(255,255,255,0.09)"}`,
        color: selected ? color : "rgba(255,255,255,0.55)",
        fontWeight: selected ? 700 : 500, fontSize: "0.82rem",
        transition: "all 0.18s", opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}

function PredictionCard({ match }: { match: MatchPrediction }) {
  const [picks, setPicks] = useState<UserPick>({});
  const [submitted, setSubmitted] = useState(match.status === "settled");
  const [expanded, setExpanded] = useState(match.status === "open");

  const c1 = TEAM_COLOR[match.team1] ?? "#aaa";
  const c2 = TEAM_COLOR[match.team2] ?? "#aaa";
  const isOpen = match.status === "open" && !submitted;
  const isSettled = match.status === "settled";

  const score = isSettled && match.result
    ? [
        picks.winner === match.result.winner ? 50 : 0,
        picks.topScorer === match.result.topScorer ? 30 : 0,
      ].reduce((a, b) => a + b, 0)
    : null;

  function handleSubmit() {
    if (!picks.winner) return;
    setSubmitted(true);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.03)",
        border: `1px solid ${isSettled ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.1)"}`,
        borderRadius: 18, overflow: "hidden",
      }}
    >
      {/* Card header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ padding: "1rem 1.25rem", cursor: "pointer", background: "rgba(255,255,255,0.02)", borderBottom: expanded ? "1px solid rgba(255,255,255,0.06)" : "none", display: "flex", alignItems: "center", gap: "0.75rem" }}
      >
        {/* Match badge */}
        <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.06)", padding: "3px 8px", borderRadius: 6 }}>M{match.matchNo}</span>

        {/* Teams */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <TeamLogo code={match.team1} size={28} />
          <span style={{ fontWeight: 700, color: c1, fontSize: "0.9rem" }}>{match.team1}</span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "0.75rem" }}>vs</span>
          <span style={{ fontWeight: 700, color: c2, fontSize: "0.9rem" }}>{match.team2}</span>
          <TeamLogo code={match.team2} size={28} />
        </div>

        {/* Status / score */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          {isSettled && score !== null && (
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: score > 0 ? "#22c55e" : "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>+{score} pts</span>
          )}
          {match.status === "open" && !submitted && (
            <span style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.7rem", color: "#f59e0b" }}>
              <Clock style={{ width: 11, height: 11 }} />
              {match.deadlineMins < 60 ? `${match.deadlineMins}m` : `${Math.floor(match.deadlineMins / 60)}h`} left
            </span>
          )}
          {submitted && !isSettled && <CheckCircle style={{ width: 15, height: 15, color: "#22c55e" }} />}
          {isSettled && <Lock style={{ width: 13, height: 13, color: "rgba(255,255,255,0.25)" }} />}
          {expanded ? <ChevronUp style={{ width: 15, height: 15, color: "rgba(255,255,255,0.3)" }} /> : <ChevronDown style={{ width: 15, height: 15, color: "rgba(255,255,255,0.3)" }} />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* Result banner */}
          {isSettled && match.result && (
            <div style={{ padding: "0.6rem 1rem", background: "rgba(255,255,255,0.04)", borderRadius: 10, display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              <div style={{ display: "flex", align: "center", gap: "0.4rem" }}>
                <Trophy style={{ width: 13, height: 13, color: "#f59e0b", marginTop: 1 }} />
                <span style={{ fontSize: "0.78rem", color: TEAM_COLOR[match.result.winner] ?? "#fff", fontWeight: 700 }}>{match.result.winner} won</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>Top scorer: <b style={{ color: "#fff" }}>{match.result.topScorer}</b></div>
              <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>Sixes: <b style={{ color: "#fff" }}>{match.result.sixesInMatch}</b></div>
            </div>
          )}

          {/* Community bar */}
          <div>
            <p style={{ margin: "0 0 0.5rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>Community Pick</p>
            <div style={{ height: 8, borderRadius: 4, overflow: "hidden", display: "flex" }}>
              <div style={{ width: `${match.communityPct.t1}%`, background: c1, transition: "width 0.4s" }} />
              <div style={{ flex: 1, background: c2 }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.25rem" }}>
              <span style={{ fontSize: "0.7rem", color: c1, fontWeight: 700 }}>{match.team1} {match.communityPct.t1}%</span>
              <span style={{ fontSize: "0.7rem", color: c2, fontWeight: 700 }}>{match.communityPct.t2}% {match.team2}</span>
            </div>
          </div>

          {/* Predictions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>

            {/* Winner */}
            <div>
              <p style={{ margin: "0 0 0.45rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Winner <span style={{ color: "#f59e0b" }}>+50 pts</span></p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {[match.team1, match.team2].map(t => (
                  <PickButton key={t} label={`${t} — ${TEAM_FULL_NAME[t]}`} selected={picks.winner === t} onSelect={() => !submitted && setPicks(p => ({ ...p, winner: t }))} color={TEAM_COLOR[t]} disabled={submitted} />
                ))}
              </div>
            </div>

            {/* Toss */}
            <div>
              <p style={{ margin: "0 0 0.45rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Toss Winner <span style={{ color: "#f59e0b" }}>+20 pts</span></p>
              <div style={{ display: "flex", gap: "0.5rem" }}>
                {TOSS_OPTIONS(match.team1, match.team2).map(t => (
                  <PickButton key={t} label={t} selected={picks.toss === t} onSelect={() => !submitted && setPicks(p => ({ ...p, toss: t }))} color={TEAM_COLOR[t]} disabled={submitted} />
                ))}
              </div>
            </div>

            {/* Top scorer */}
            <div>
              <p style={{ margin: "0 0 0.45rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Top Scorer <span style={{ color: "#f59e0b" }}>+30 pts</span></p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {match.topScorerOptions.map(p => (
                  <PickButton key={p} label={p} selected={picks.topScorer === p} onSelect={() => !submitted && setPicks(prev => ({ ...prev, topScorer: p }))} disabled={submitted} />
                ))}
              </div>
            </div>

            {/* Sixes band */}
            <div>
              <p style={{ margin: "0 0 0.45rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Total Sixes <span style={{ color: "#f59e0b" }}>+15 pts</span></p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {SIXES_BANDS.map(b => (
                  <PickButton key={b} label={b} selected={picks.sixesBand === b} onSelect={() => !submitted && setPicks(p => ({ ...p, sixesBand: b }))} disabled={submitted} />
                ))}
              </div>
            </div>

            {/* Margin */}
            <div>
              <p style={{ margin: "0 0 0.45rem", fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", color: "rgba(255,255,255,0.35)", textTransform: "uppercase" }}>Winning Margin <span style={{ color: "#f59e0b" }}>+20 pts</span></p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {MARGIN_BANDS.map(b => (
                  <PickButton key={b} label={b} selected={picks.marginBand === b} onSelect={() => !submitted && setPicks(p => ({ ...p, marginBand: b }))} disabled={submitted} />
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          {isOpen && (
            <button
              onClick={handleSubmit}
              disabled={!picks.winner}
              style={{
                padding: "0.8rem 1.8rem", borderRadius: 12, border: "none",
                background: picks.winner ? "#c0192c" : "rgba(192,25,44,0.15)",
                color: picks.winner ? "#fff" : "rgba(255,255,255,0.25)",
                fontWeight: 800, fontSize: "0.88rem",
                cursor: picks.winner ? "pointer" : "default", alignSelf: "flex-start",
                transition: "all 0.15s",
              }}
            >
              Lock Picks ⚡
            </button>
          )}

          {submitted && !isSettled && (
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.6rem 0.9rem", background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10, alignSelf: "flex-start" }}>
              <CheckCircle style={{ width: 14, height: 14, color: "#22c55e" }} />
              <span style={{ fontSize: "0.78rem", color: "#22c55e", fontWeight: 600 }}>Picks locked — good luck!</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function Predictions() {
  const [tab, setTab] = useState<"predict" | "leaderboard">("predict");

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>Predictions</h1>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.4)" }}>
              Predict match outcomes, earn points, climb the prediction board.
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {(["predict", "leaderboard"] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                style={{ padding: "0.5rem 1.1rem", borderRadius: 9, border: `1px solid ${tab === t ? "rgba(129,140,248,0.4)" : "rgba(255,255,255,0.09)"}`, background: tab === t ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.04)", color: tab === t ? "#818cf8" : "rgba(255,255,255,0.45)", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer", textTransform: "capitalize" }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* My stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.75rem" }}>
          {[
            { label: "Predictions", value: MY_STATS.totalPreds, color: "#fff", icon: <Target style={{ width: 14, height: 14 }} /> },
            { label: "Correct",     value: MY_STATS.correct,    color: "#22c55e", icon: <CheckCircle style={{ width: 14, height: 14 }} /> },
            { label: "Accuracy",    value: `${Math.round((MY_STATS.correct / MY_STATS.totalPreds) * 100)}%`, color: "#60a5fa", icon: <TrendingUp style={{ width: 14, height: 14 }} /> },
            { label: "Streak 🔥",   value: `${MY_STATS.streak}`,color: "#f59e0b", icon: <Zap style={{ width: 14, height: 14 }} /> },
            { label: "Pred. Pts",   value: MY_STATS.pts.toLocaleString(), color: "#a78bfa", icon: <Award style={{ width: 14, height: 14 }} /> },
          ].map(s => (
            <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.85rem 1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: s.color, marginBottom: "0.3rem" }}>
                {s.icon}
                <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
            </div>
          ))}
        </div>

        {tab === "predict" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>
              Upcoming &amp; Recent Matches
            </h2>
            {PREDICTIONS.map(m => <PredictionCard key={m.id} match={m} />)}
          </div>
        )}

        {tab === "leaderboard" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, overflow: "hidden" }}>
            <div style={{ padding: "0.9rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Trophy style={{ width: 15, height: 15, color: "#f59e0b" }} />
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>Prediction Leaderboard</span>
            </div>
            {LEADERBOARD.map((entry, i) => (
              <div key={entry.rank} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.04)", background: entry.name === "You" ? "rgba(129,140,248,0.06)" : "transparent", borderLeft: entry.name === "You" ? "2px solid #818cf8" : "2px solid transparent" }}>
                <span style={{ fontWeight: 800, color: i < 3 ? ["#f59e0b","#9ca3af","#d97706"][i] : "rgba(255,255,255,0.3)", minWidth: 20, fontSize: i < 3 ? "1.1rem" : "0.85rem" }}>
                  {i < 3 ? ["🥇","🥈","🥉"][i] : `#${entry.rank}`}
                </span>
                <span style={{ flex: 1, fontWeight: entry.name === "You" ? 700 : 500, color: entry.name === "You" ? "#818cf8" : "#fff", fontSize: "0.88rem" }}>{entry.name}</span>
                <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.35)", marginRight: "0.5rem" }}>{entry.correct} correct</span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#a78bfa", fontSize: "0.9rem" }}>{entry.pts.toLocaleString()} pts</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
