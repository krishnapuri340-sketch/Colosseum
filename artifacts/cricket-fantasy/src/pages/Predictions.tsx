import { useState, useMemo } from “react”;
import { Layout } from “@/components/layout/Layout”;
import { motion, AnimatePresence } from “framer-motion”;
import {
Target, Trophy, Zap, TrendingUp, CheckCircle,
Clock, Lock, Award, ChevronDown, ChevronUp,
Flame, Users, ChevronRight, Star,
} from “lucide-react”;
import { TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO } from “@/lib/ipl-constants”;
import { ALL_IPL_2026_PLAYERS } from “@/lib/ipl-players-2026”;

// ── Types ──────────────────────────────────────────────────────────────────────
type PredStatus = “open” | “settled”;

interface FriendPick {
name: string;        // friend’s display name
initials: string;   // 2-char avatar initials
color: string;       // avatar bg colour
league: string;      // which league they’re in
winner?: string;
mom?: string;
sixes?: string;
}

interface MatchPred {
id: string;
matchNo: number;
team1: string;
team2: string;
venue: string;
date: string;
time: string;
status: PredStatus;
result?: { winner: string; mom: string; sixes: number };
community: { t1: number; t2: number };        // global % picking each winner
momOptions?: string[];                          // overrides; otherwise pulls from player DB
deadlineMins: number;
friendPicks: FriendPick[];                     // per-match friend picks
}

interface Pick {
winner?: string;
mom?: string;
sixes?: string;
}

// ── Mock leagues the user is in ───────────────────────────────────────────────
const MY_LEAGUES = [
{ id: “l1”, name: “Friday Night Draft”,  color: “#c0392b” },
{ id: “l2”, name: “Office League S2”,    color: “#3b82f6” },
{ id: “l3”, name: “Cousins Cup”,         color: “#a855f7” },
];

// ── Match data ─────────────────────────────────────────────────────────────────
// friendPicks deliberately covers multiple leagues so the filter works
const MATCHES: MatchPred[] = [
{
id: “m1”, matchNo: 35, team1: “MI”, team2: “RCB”,
venue: “Wankhede Stadium, Mumbai”, date: “Today”, time: “7:30 PM”,
status: “open”, community: { t1: 62, t2: 38 }, deadlineMins: 47,
friendPicks: [
{ name: “Rajveer”, initials: “RJ”, color: “#c0392b”, league: “l1”, winner: “MI”,  mom: “Jasprit Bumrah”,    sixes: “10–14” },
{ name: “Karan”,   initials: “KA”, color: “#3b82f6”, league: “l1”, winner: “MI”,  mom: “Rohit Sharma”,      sixes: “15–19” },
{ name: “Arjun”,   initials: “AR”, color: “#a855f7”, league: “l1”, winner: “RCB”, mom: “Virat Kohli”,       sixes: “15–19” },
{ name: “Sahil”,   initials: “SA”, color: “#f59e0b”, league: “l2”, winner: “MI”,  mom: “Tilak Varma”,       sixes: “10–14” },
{ name: “Priya”,   initials: “PR”, color: “#34d399”, league: “l2”, winner: “RCB”, mom: “Phil Salt”,         sixes: “< 10”  },
{ name: “Dev”,     initials: “DV”, color: “#818cf8”, league: “l3”, winner: “MI”,  mom: “Hardik Pandya”,     sixes: “15–19” },
{ name: “Nisha”,   initials: “NI”, color: “#f472b6”, league: “l3”, winner: “MI”,  mom: “Suryakumar Yadav”,  sixes: “20+”   },
],
},
{
id: “m2”, matchNo: 36, team1: “GT”, team2: “CSK”,
venue: “Narendra Modi Stadium, Ahmedabad”, date: “Tomorrow”, time: “3:30 PM”,
status: “open”, community: { t1: 55, t2: 45 }, deadlineMins: 1127,
friendPicks: [
{ name: “Rajveer”, initials: “RJ”, color: “#c0392b”, league: “l1”, winner: “GT”,  mom: “Shubman Gill”,    sixes: “10–14” },
{ name: “Karan”,   initials: “KA”, color: “#3b82f6”, league: “l1”, winner: “CSK”, mom: “MS Dhoni”,        sixes: “< 10”  },
{ name: “Sahil”,   initials: “SA”, color: “#f59e0b”, league: “l2”, winner: “GT”,  mom: “Rashid Khan”,     sixes: “10–14” },
{ name: “Dev”,     initials: “DV”, color: “#818cf8”, league: “l3”, winner: “GT”,  mom: “Sai Sudharsan”,   sixes: “15–19” },
],
},
{
id: “m3”, matchNo: 34, team1: “SRH”, team2: “KKR”,
venue: “Rajiv Gandhi IS, Hyderabad”, date: “Yesterday”, time: “7:30 PM”,
status: “settled”,
result: { winner: “SRH”, mom: “Travis Head”, sixes: 18 },
community: { t1: 48, t2: 52 }, deadlineMins: 0,
friendPicks: [
{ name: “Rajveer”, initials: “RJ”, color: “#c0392b”, league: “l1”, winner: “KKR”, mom: “Sunil Narine”,        sixes: “15–19” },
{ name: “Karan”,   initials: “KA”, color: “#3b82f6”, league: “l1”, winner: “SRH”, mom: “Travis Head”,         sixes: “15–19” },
{ name: “Arjun”,   initials: “AR”, color: “#a855f7”, league: “l1”, winner: “KKR”, mom: “Varun Chakravarthy”,  sixes: “10–14” },
{ name: “Sahil”,   initials: “SA”, color: “#f59e0b”, league: “l2”, winner: “SRH”, mom: “Travis Head”,         sixes: “20+”   },
{ name: “Nisha”,   initials: “NI”, color: “#f472b6”, league: “l3”, winner: “KKR”, mom: “Andre Russell”,       sixes: “20+”   },
],
},
{
id: “m4”, matchNo: 33, team1: “RR”, team2: “PBKS”,
venue: “Sawai Mansingh Stadium, Jaipur”, date: “2 days ago”, time: “3:30 PM”,
status: “settled”,
result: { winner: “RR”, mom: “Yashasvi Jaiswal”, sixes: 14 },
community: { t1: 58, t2: 42 }, deadlineMins: 0,
friendPicks: [
{ name: “Rajveer”, initials: “RJ”, color: “#c0392b”, league: “l1”, winner: “RR”,   mom: “Yashasvi Jaiswal”, sixes: “10–14” },
{ name: “Sahil”,   initials: “SA”, color: “#f59e0b”, league: “l2”, winner: “PBKS”, mom: “Arshdeep Singh”,   sixes: “10–14” },
{ name: “Dev”,     initials: “DV”, color: “#818cf8”, league: “l3”, winner: “RR”,   mom: “Riyan Parag”,      sixes: “15–19” },
],
},
{
id: “m5”, matchNo: 37, team1: “DC”, team2: “LSG”,
venue: “Arun Jaitley Stadium, Delhi”, date: “Sat 3 May”, time: “7:30 PM”,
status: “open”, community: { t1: 52, t2: 48 }, deadlineMins: 3200,
friendPicks: [
{ name: “Karan”,   initials: “KA”, color: “#3b82f6”, league: “l1”, winner: “LSG”, mom: “Rishabh Pant”,     sixes: “10–14” },
{ name: “Priya”,   initials: “PR”, color: “#34d399”, league: “l2”, winner: “DC”,  mom: “Axar Patel”,       sixes: “< 10”  },
{ name: “Nisha”,   initials: “NI”, color: “#f472b6”, league: “l3”, winner: “LSG”, mom: “Mohammed Shami”,   sixes: “< 10”  },
],
},
];

const SIXES_BANDS = [”< 10”, “10–14”, “15–19”, “20+”];
const MY_STATS    = { total: 28, correct: 19, streak: 4, pts: 1840, accuracy: 68 };

const PRED_LEADERS = [
{ rank: 1, name: “BumrahOrNothing”,  pts: 3210, correct: 41 },
{ rank: 2, name: “GillForPresident”, pts: 3080, correct: 39 },
{ rank: 3, name: “SRH_Fanatic”,      pts: 2940, correct: 37 },
{ rank: 4, name: “TravisHeadCase”,   pts: 2790, correct: 35 },
{ rank: 5, name: “You”,              pts: 1840, correct: 19, isMe: true },
];

// ── Helpers ────────────────────────────────────────────────────────────────────
function fmtDeadline(mins: number): string {
if (mins < 60)   return `${mins}m`;
if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
return `${Math.floor(mins / 1440)}d`;
}

function avatarColor(name: string): string {
const palette = [”#c0392b”,”#3b82f6”,”#a855f7”,”#f59e0b”,”#34d399”,”#818cf8”,”#f472b6”,”#60a5fa”,”#fb923c”];
const seed    = name.split(””).reduce((a, c) => a + c.charCodeAt(0), 0);
return palette[seed % palette.length];
}

// ── Sub-components ────────────────────────────────────────────────────────────

function TeamLogo({ code, size = 32 }: { code: string; size?: number }) {
const logo  = TEAM_LOGO[code];
const color = TEAM_COLOR[code] ?? “#aaa”;
if (logo)
return (
<img src={logo} alt={code}
style={{ width: size, height: size, objectFit: “contain” }}
onError={e => { (e.target as HTMLImageElement).style.display = “none”; }}
/>
);
return (
<div style={{
width: size, height: size, borderRadius: “50%”,
background: `${color}22`, border: `1.5px solid ${color}50`,
display: “flex”, alignItems: “center”, justifyContent: “center”,
fontWeight: 800, fontSize: size * 0.28, color,
}}>
{code}
</div>
);
}

function Avatar({ name, initials, color, size = 28, tooltip }:
{ name: string; initials: string; color: string; size?: number; tooltip?: string }) {
const [show, setShow] = useState(false);
return (
<div style={{ position: “relative” }}
onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
<div style={{
width: size, height: size, borderRadius: “50%”,
background: `${color}30`, border: `2px solid ${color}`,
display: “flex”, alignItems: “center”, justifyContent: “center”,
fontSize: size * 0.33, fontWeight: 800, color: “#fff”,
cursor: “default”, userSelect: “none”, flexShrink: 0,
}}>
{initials}
</div>
{show && tooltip && (
<div style={{
position: “absolute”, bottom: size + 6, left: “50%”, transform: “translateX(-50%)”,
background: “rgba(15,16,30,0.96)”, border: “1px solid rgba(255,255,255,0.12)”,
borderRadius: 8, padding: “4px 10px”, fontSize: “0.68rem”,
fontWeight: 600, color: “#fff”, whiteSpace: “nowrap”, zIndex: 50,
pointerEvents: “none”,
}}>
{tooltip}
</div>
)}
</div>
);
}

// ── Stacked avatar row showing who picked what ────────────────────────────────
function FriendPickRow({
label, picks, field, value, settled, correct,
}: {
label: string;
picks: FriendPick[];
field: keyof Pick | “winner” | “mom” | “sixes”;
value?: string;          // the user’s own pick for this field
settled: boolean;
correct?: boolean;       // whether user’s pick was correct
}) {
// Group friend picks by what they picked
const groups = picks.reduce<Record<string, FriendPick[]>>((acc, fp) => {
const v = fp[field as keyof FriendPick] as string | undefined;
if (!v) return acc;
if (!acc[v]) acc[v] = [];
acc[v].push(fp);
return acc;
}, {});

if (Object.keys(groups).length === 0) return null;

return (
<div style={{ display: “flex”, flexDirection: “column”, gap: 6 }}>
<div style={{ fontSize: “0.6rem”, fontWeight: 700, letterSpacing: “0.1em”,
color: “rgba(255,255,255,0.25)”, textTransform: “uppercase” }}>
Friends picked — {label}
</div>
{Object.entries(groups).map(([choice, friends]) => {
const isMine     = value === choice;
const isWrong    = settled && isMine && !correct;
const isRight    = settled && isMine && correct;
const choiceColor = isRight ? “#22c55e” : isWrong ? “#ef4444” : “rgba(255,255,255,0.5)”;
return (
<div key={choice} style={{
display: “flex”, alignItems: “center”, gap: 8,
padding: “5px 10px”, borderRadius: 9,
background: isMine
? isRight ? “rgba(34,197,94,0.07)” : isWrong ? “rgba(239,68,68,0.07)” : “rgba(129,140,248,0.07)”
: “rgba(255,255,255,0.025)”,
border: `1px solid ${isMine ? isRight ? "rgba(34,197,94,0.2)" : isWrong ? "rgba(239,68,68,0.2)" : "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)"}`,
}}>
{/* Stacked avatars */}
<div style={{ display: “flex”, marginRight: 2 }}>
{friends.map((f, fi) => (
<div key={fi} style={{ marginLeft: fi === 0 ? 0 : -8, zIndex: friends.length - fi }}>
<Avatar name={f.name} initials={f.initials} color={f.color}
size={24} tooltip={`${f.name} · ${f.league}`} />
</div>
))}
</div>
<span style={{ fontSize: “0.75rem”, fontWeight: isMine ? 700 : 500, color: choiceColor, flex: 1, minWidth: 0, overflow: “hidden”, textOverflow: “ellipsis”, whiteSpace: “nowrap” }}>
{choice}
{isMine && <span style={{ fontSize: “0.62rem”, marginLeft: 5, opacity: 0.6 }}>(You)</span>}
</span>
<span style={{ fontSize: “0.68rem”, fontWeight: 700, color: “rgba(255,255,255,0.3)”, flexShrink: 0 }}>
{friends.length} {friends.length === 1 ? “pick” : “picks”}
</span>
{isRight && <CheckCircle size={13} style={{ color: “#22c55e”, flexShrink: 0 }} />}
</div>
);
})}
</div>
);
}

// ── MOM dropdown ──────────────────────────────────────────────────────────────
function MomDropdown({
team1, team2, value, onChange, disabled,
}: {
team1: string; team2: string;
value: string; onChange: (v: string) => void;
disabled: boolean;
}) {
const [open, setOpen] = useState(false);
const [q, setQ]       = useState(””);

// Pull real squad for both teams from player DB, sorted by credits desc
const players = useMemo(() =>
ALL_IPL_2026_PLAYERS
.filter(p => p.team === team1 || p.team === team2)
.sort((a, b) => b.credits - a.credits),
[team1, team2]
);

const filtered = q
? players.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
: players;

const c1 = TEAM_COLOR[team1] ?? “#aaa”;
const c2 = TEAM_COLOR[team2] ?? “#aaa”;

const roleIcon: Record<string, string> = { BAT:“🏏”, BWL:“🎯”, AR:“⚡”, WK:“🧤” };

return (
<div style={{ position: “relative” }}>
{/* Trigger */}
<button
onClick={() => !disabled && setOpen(o => !o)}
disabled={disabled}
style={{
width: “100%”, padding: “0.55rem 0.85rem”,
background: value ? “rgba(255,255,255,0.07)” : “rgba(255,255,255,0.04)”,
border: `1.5px solid ${value ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.09)"}`,
borderRadius: 11, color: value ? “#fff” : “rgba(255,255,255,0.35)”,
fontSize: “0.85rem”, fontWeight: value ? 600 : 400,
display: “flex”, alignItems: “center”, justifyContent: “space-between”,
cursor: disabled ? “default” : “pointer”, textAlign: “left”,
transition: “all 0.15s”, opacity: disabled ? 0.6 : 1,
}}
>
<span style={{ overflow: “hidden”, textOverflow: “ellipsis”, whiteSpace: “nowrap”, flex: 1 }}>
{value || `Pick Man of the Match…`}
</span>
<ChevronDown size={14} style={{ color: “rgba(255,255,255,0.3)”, flexShrink: 0, marginLeft: 6,
transform: open ? “rotate(180deg)” : “none”, transition: “transform 0.2s” }} />
</button>

```
  {/* Dropdown panel */}
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, y: -6, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.98 }}
        transition={{ duration: 0.15 }}
        style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
          background: "rgba(12,13,22,0.98)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 14, zIndex: 100, overflow: "hidden",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
        }}
      >
        {/* Search */}
        <div style={{ padding: "0.55rem 0.75rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <input
            autoFocus
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search player…"
            style={{
              width: "100%", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              padding: "0.4rem 0.7rem", color: "#fff", fontSize: "0.82rem",
              outline: "none", boxSizing: "border-box",
            }}
          />
        </div>

        {/* Team headers + player list */}
        <div style={{ maxHeight: 300, overflowY: "auto" }}>
          {[team1, team2].map(team => {
            const tc   = team === team1 ? c1 : c2;
            const list = filtered.filter(p => p.team === team);
            if (list.length === 0) return null;
            return (
              <div key={team}>
                {/* Team header */}
                <div style={{
                  padding: "0.45rem 0.85rem",
                  background: `${tc}0f`,
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  display: "flex", alignItems: "center", gap: 7,
                }}>
                  <TeamLogo code={team} size={18} />
                  <span style={{ fontSize: "0.68rem", fontWeight: 800,
                    color: tc, letterSpacing: "0.06em" }}>
                    {team} — {TEAM_FULL_NAME[team]}
                  </span>
                </div>
                {/* Players */}
                {list.map(p => {
                  const selected = value === p.name;
                  return (
                    <div key={p.name}
                      onClick={() => { onChange(p.name); setOpen(false); setQ(""); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        padding: "0.5rem 0.85rem", cursor: "pointer",
                        background: selected ? `${tc}14` : "transparent",
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                        transition: "background 0.12s",
                      }}
                      onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
                      onMouseLeave={e => { if (!selected) (e.currentTarget as HTMLDivElement).style.background = "transparent"; }}
                    >
                      {/* Role icon */}
                      <span style={{ fontSize: "0.9rem", width: 18, textAlign: "center", flexShrink: 0 }}>
                        {roleIcon[p.role] ?? "🏏"}
                      </span>
                      <span style={{ flex: 1, fontSize: "0.82rem", fontWeight: selected ? 700 : 500,
                        color: selected ? tc : "rgba(255,255,255,0.75)",
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.name}
                      </span>
                      <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)",
                        flexShrink: 0, fontFamily: "monospace" }}>
                        {p.credits}cr
                      </span>
                      {!p.capped && (
                        <span style={{ fontSize: "0.55rem", color: "rgba(255,255,255,0.25)",
                          background: "rgba(255,255,255,0.06)", padding: "1px 4px",
                          borderRadius: 3, flexShrink: 0 }}>UC</span>
                      )}
                      {selected && <CheckCircle size={13} style={{ color: tc, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div style={{ padding: "1rem", textAlign: "center",
              fontSize: "0.8rem", color: "rgba(255,255,255,0.25)" }}>
              No players found
            </div>
          )}
        </div>
      </motion.div>
    )}
  </AnimatePresence>

  {/* Backdrop */}
  {open && (
    <div style={{ position: "fixed", inset: 0, zIndex: 99 }}
      onClick={() => { setOpen(false); setQ(""); }} />
  )}
</div>
```

);
}

// ── Match card ─────────────────────────────────────────────────────────────────
function MatchCard({ match, leagueFilter }: { match: MatchPred; leagueFilter: string }) {
const [picks, setPicks]   = useState<Pick>({});
const [submitted, setSub] = useState(match.status === “settled”);
const [open, setOpen]     = useState(match.status === “open”);
const [showFriends, setShowFriends] = useState(true);

const c1 = TEAM_COLOR[match.team1] ?? “#aaa”;
const c2 = TEAM_COLOR[match.team2] ?? “#aaa”;
const isOpen    = match.status === “open” && !submitted;
const isSettled = match.status === “settled”;

// Score calculation
const pts = isSettled && match.result
? (picks.winner === match.result.winner ? 50 : 0) +
(picks.mom    === match.result.mom    ? 30 : 0)
: null;

// Filter friends by selected league
const visibleFriends = leagueFilter === “all”
? match.friendPicks
: match.friendPicks.filter(f => f.league === leagueFilter);

// Community % for friends’ winner picks
const friendWinnerPct = useMemo(() => {
if (visibleFriends.length === 0) return null;
const t1 = visibleFriends.filter(f => f.winner === match.team1).length;
return Math.round((t1 / visibleFriends.length) * 100);
}, [visibleFriends, match.team1]);

const canSubmit = !!picks.winner && !!picks.mom;

return (
<div className=“rounded-2xl overflow-hidden”
style={{ background: “rgba(255,255,255,0.03)”, border: “1px solid rgba(255,255,255,0.08)” }}>

```
  {/* ── Card header ── */}
  <div
    onClick={() => setOpen(o => !o)}
    style={{
      padding: "0.9rem 1.1rem", cursor: "pointer",
      borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none",
      background: "rgba(255,255,255,0.015)",
      display: "flex", alignItems: "center", gap: 10,
    }}
  >
    {/* Match badge */}
    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
      background: "rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>
      M{match.matchNo}
    </span>

    {/* Teams */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
      <TeamLogo code={match.team1} size={24} />
      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: c1 }}>{match.team1}</span>
      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.2)" }}>vs</span>
      <span style={{ fontWeight: 700, fontSize: "0.88rem", color: c2 }}>{match.team2}</span>
      <TeamLogo code={match.team2} size={24} />
      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
        className="hidden sm:block">
        · {match.date}, {match.time}
      </span>
    </div>

    {/* Right status */}
    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
      {/* Friend avatars preview */}
      {visibleFriends.length > 0 && (
        <div style={{ display: "flex", alignItems: "center" }}>
          {visibleFriends.slice(0, 4).map((f, fi) => (
            <div key={fi} style={{ marginLeft: fi === 0 ? 0 : -7, zIndex: 4 - fi }}>
              <Avatar name={f.name} initials={f.initials} color={f.color} size={22} />
            </div>
          ))}
          {visibleFriends.length > 4 && (
            <div style={{ width: 22, height: 22, borderRadius: "50%", marginLeft: -7, zIndex: 0,
              background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
              +{visibleFriends.length - 4}
            </div>
          )}
        </div>
      )}

      {/* Points earned */}
      {isSettled && pts !== null && (
        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.82rem",
          color: pts > 0 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>
          +{pts}pts
        </span>
      )}

      {/* Deadline */}
      {match.status === "open" && !submitted && (
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b",
          display: "flex", alignItems: "center", gap: 3 }}>
          <Clock size={11} /> {fmtDeadline(match.deadlineMins)}
        </span>
      )}

      {submitted && !isSettled && <CheckCircle size={14} style={{ color: "#22c55e" }} />}
      {isSettled && <Lock size={13} style={{ color: "rgba(255,255,255,0.2)" }} />}
      {open
        ? <ChevronUp  size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
        : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.25)" }} />}
    </div>
  </div>

  {/* ── Expanded body ── */}
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
        style={{ overflow: "hidden" }}
      >
        <div style={{ padding: "1rem 1.1rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>

          {/* Result banner */}
          {isSettled && match.result && (
            <div style={{ padding: "0.6rem 0.9rem", background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
              display: "flex", gap: "1.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", fontWeight: 700,
                color: TEAM_COLOR[match.result.winner] ?? "#34d399" }}>
                🏆 {match.result.winner} won
              </span>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                MOM: <b style={{ color: "#fff" }}>{match.result.mom}</b>
              </span>
              <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                Sixes: <b style={{ color: "#fff" }}>{match.result.sixes}</b>
              </span>
              {pts !== null && pts > 0 && (
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22c55e",
                  marginLeft: "auto", fontFamily: "monospace" }}>
                  You scored +{pts} pts ✓
                </span>
              )}
            </div>
          )}

          {/* ── Community + Friends bars ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>

            {/* Global community */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c1 }}>
                  {match.team1} {match.community.t1}%
                </span>
                <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)",
                  display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={10} /> Global picks
                </span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c2 }}>
                  {match.community.t2}% {match.team2}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, overflow: "hidden", display: "flex" }}>
                <div style={{ width: `${match.community.t1}%`, background: c1, transition: "width 0.4s" }} />
                <div style={{ flex: 1, background: c2 }} />
              </div>
            </div>

            {/* Friends in league */}
            {visibleFriends.length > 0 && friendWinnerPct !== null && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c1 }}>
                    {match.team1} {friendWinnerPct}%
                  </span>
                  <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)",
                    display: "flex", alignItems: "center", gap: 4 }}>
                    <Star size={10} /> Your league
                    {leagueFilter !== "all" && (
                      <span style={{ color: MY_LEAGUES.find(l => l.id === leagueFilter)?.color ?? "#aaa" }}>
                        {" "}· {MY_LEAGUES.find(l => l.id === leagueFilter)?.name}
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c2 }}>
                    {100 - friendWinnerPct}% {match.team2}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, overflow: "hidden", display: "flex",
                  background: "rgba(255,255,255,0.05)" }}>
                  <div style={{ width: `${friendWinnerPct}%`,
                    background: `linear-gradient(90deg, ${c1}, ${c1}90)`,
                    transition: "width 0.4s", borderRadius: 3 }} />
                  <div style={{ flex: 1,
                    background: `linear-gradient(90deg, ${c2}90, ${c2})`,
                    borderRadius: 3 }} />
                </div>

                {/* Avatar row */}
                <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ display: "flex", gap: 3 }}>
                    {/* Team1 pickers */}
                    {visibleFriends.filter(f => f.winner === match.team1).map((f, fi) => (
                      <Avatar key={fi} name={f.name} initials={f.initials} color={f.color}
                        size={26} tooltip={`${f.name} → ${f.winner}`} />
                    ))}
                  </div>
                  {visibleFriends.filter(f => f.winner === match.team1).length > 0 &&
                   visibleFriends.filter(f => f.winner === match.team2).length > 0 && (
                    <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                  )}
                  <div style={{ display: "flex", gap: 3 }}>
                    {/* Team2 pickers */}
                    {visibleFriends.filter(f => f.winner === match.team2).map((f, fi) => (
                      <Avatar key={fi} name={f.name} initials={f.initials} color={f.color}
                        size={26} tooltip={`${f.name} → ${f.winner}`} />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Prediction inputs ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>

            {/* Winner */}
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                Match Winner <span style={{ color: "#f59e0b" }}>+50 pts</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[match.team1, match.team2].map(t => {
                  const tc   = TEAM_COLOR[t] ?? "#aaa";
                  const sel  = picks.winner === t;
                  return (
                    <button key={t}
                      onClick={() => !submitted && setPicks(p => ({ ...p, winner: t }))}
                      disabled={submitted}
                      style={{
                        padding: "0.7rem 1rem", borderRadius: 11, cursor: submitted ? "default" : "pointer",
                        background: sel ? `${tc}20` : "rgba(255,255,255,0.04)",
                        border: `2px solid ${sel ? tc : "rgba(255,255,255,0.09)"}`,
                        display: "flex", alignItems: "center", gap: 8,
                        transition: "all 0.15s",
                      }}
                    >
                      <TeamLogo code={t} size={28} />
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem", color: sel ? tc : "#fff" }}>{t}</div>
                        <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>
                          {TEAM_FULL_NAME[t]}
                        </div>
                      </div>
                      {sel && <CheckCircle size={14} style={{ color: tc, marginLeft: "auto" }} />}
                    </button>
                  );
                })}
              </div>

              {/* Winner friend picks breakdown */}
              {visibleFriends.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <FriendPickRow label="winner" picks={visibleFriends} field="winner"
                    value={picks.winner} settled={isSettled}
                    correct={isSettled && picks.winner === match.result?.winner} />
                </div>
              )}
            </div>

            {/* MOM — searchable dropdown */}
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                Man of the Match <span style={{ color: "#f59e0b" }}>+30 pts</span>
              </div>
              <MomDropdown
                team1={match.team1} team2={match.team2}
                value={picks.mom ?? ""}
                onChange={v => !submitted && setPicks(p => ({ ...p, mom: v }))}
                disabled={submitted}
              />
              {visibleFriends.length > 0 && picks.mom && (
                <div style={{ marginTop: 8 }}>
                  <FriendPickRow label="MOM" picks={visibleFriends} field="mom"
                    value={picks.mom} settled={isSettled}
                    correct={isSettled && picks.mom === match.result?.mom} />
                </div>
              )}
              {visibleFriends.length > 0 && !picks.mom && (
                <div style={{ marginTop: 8 }}>
                  <FriendPickRow label="MOM" picks={visibleFriends} field="mom"
                    settled={isSettled} />
                </div>
              )}
            </div>

            {/* Total Sixes */}
            <div>
              <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                Total Sixes <span style={{ color: "#f59e0b" }}>+15 pts</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {SIXES_BANDS.map(b => {
                  const sel = picks.sixes === b;
                  return (
                    <button key={b}
                      onClick={() => !submitted && setPicks(p => ({ ...p, sixes: b }))}
                      disabled={submitted}
                      style={{
                        padding: "0.45rem 0.9rem", borderRadius: 9,
                        cursor: submitted ? "default" : "pointer",
                        background: sel ? "rgba(129,140,248,0.18)" : "rgba(255,255,255,0.04)",
                        border: `1.5px solid ${sel ? "#818cf8" : "rgba(255,255,255,0.09)"}`,
                        color: sel ? "#818cf8" : "rgba(255,255,255,0.5)",
                        fontWeight: sel ? 700 : 500, fontSize: "0.82rem",
                        transition: "all 0.15s",
                      }}
                    >
                      {b}
                    </button>
                  );
                })}
              </div>
              {visibleFriends.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <FriendPickRow label="sixes" picks={visibleFriends} field="sixes"
                    value={picks.sixes} settled={isSettled}
                    correct={isSettled && match.result
                      ? picks.sixes === (match.result.sixes < 10 ? "< 10"
                        : match.result.sixes <= 14 ? "10–14"
                        : match.result.sixes <= 19 ? "15–19" : "20+")
                      : false}
                  />
                </div>
              )}
            </div>
          </div>

          {/* ── Venue + submit ── */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>
              📍 {match.venue}
            </span>

            {isOpen && (
              <button
                onClick={() => canSubmit && setSub(true)}
                disabled={!canSubmit}
                style={{
                  padding: "0.65rem 1.6rem", borderRadius: 11, border: "none",
                  background: canSubmit ? "#c0192c" : "rgba(192,25,44,0.15)",
                  color: canSubmit ? "#fff" : "rgba(255,255,255,0.2)",
                  fontWeight: 800, fontSize: "0.85rem",
                  cursor: canSubmit ? "pointer" : "default",
                  transition: "all 0.15s",
                }}
              >
                ⚡ Lock Picks
              </button>
            )}

            {submitted && !isSettled && (
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                padding: "0.5rem 0.85rem", background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)", borderRadius: 10 }}>
                <CheckCircle size={13} style={{ color: "#22c55e" }} />
                <span style={{ fontSize: "0.76rem", color: "#22c55e", fontWeight: 600 }}>
                  Picks locked — good luck!
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
</div>
```

);
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Predictions() {
const [tab, setTab]           = useState<“predict” | “leaderboard”>(“predict”);
const [leagueFilter, setLeague] = useState(“all”);

return (
<Layout>
<motion.div
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.3 }}
className=“space-y-5”
>
{/* ── Header ── */}
<div className="flex items-start justify-between gap-4 flex-wrap">
<div>
<h1 className="text-2xl font-black text-white">Predictions</h1>
<p className="text-sm text-white/40 mt-0.5">
Pick winners · name the MOM · see what your leagues think
</p>
</div>
<div className="flex gap-1.5 shrink-0">
{([“predict”, “leaderboard”] as const).map(t => (
<button key={t} onClick={() => setTab(t)}
style={{
padding: “0.45rem 1rem”, borderRadius: 10,
background: tab === t ? “rgba(129,140,248,0.15)” : “rgba(255,255,255,0.05)”,
border: `1px solid ${tab === t ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.08)"}`,
color: tab === t ? “#818cf8” : “rgba(255,255,255,0.45)”,
fontSize: “0.82rem”, fontWeight: 600, cursor: “pointer”,
textTransform: “capitalize”,
}}>
{t}
</button>
))}
</div>
</div>

```
    {/* ── My stats ── */}
    <div className="grid grid-cols-5 gap-2.5">
      {[
        { label: "Made",     value: MY_STATS.total,                       color: "#fff",    icon: <Target size={13} /> },
        { label: "Correct",  value: MY_STATS.correct,                     color: "#22c55e", icon: <CheckCircle size={13} /> },
        { label: "Accuracy", value: `${MY_STATS.accuracy}%`,              color: "#60a5fa", icon: <TrendingUp size={13} /> },
        { label: "Streak",   value: `${MY_STATS.streak}🔥`,              color: "#f59e0b", icon: <Zap size={13} /> },
        { label: "Pts",      value: MY_STATS.pts.toLocaleString(),        color: "#a78bfa", icon: <Award size={13} /> },
      ].map(s => (
        <div key={s.label}
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14, padding: "0.75rem 0.9rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: s.color, marginBottom: 5 }}>
            {s.icon}
            <span style={{ fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: "0.08em", opacity: 0.7 }}>{s.label}</span>
          </div>
          <div style={{ fontSize: "1.25rem", fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
        </div>
      ))}
    </div>

    {tab === "predict" && (
      <>
        {/* ── League filter ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>
            League view
          </span>
          {/* All */}
          <button
            onClick={() => setLeague("all")}
            style={{
              padding: "0.3rem 0.8rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
              cursor: "pointer", transition: "all 0.15s",
              background: leagueFilter === "all" ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${leagueFilter === "all" ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"}`,
              color: leagueFilter === "all" ? "#fff" : "rgba(255,255,255,0.4)",
            }}>
            All Leagues
          </button>
          {MY_LEAGUES.map(l => (
            <button key={l.id} onClick={() => setLeague(l.id)}
              style={{
                padding: "0.3rem 0.8rem", borderRadius: 20, fontSize: "0.75rem", fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: leagueFilter === l.id ? `${l.color}20` : "rgba(255,255,255,0.04)",
                border: `1px solid ${leagueFilter === l.id ? `${l.color}50` : "rgba(255,255,255,0.08)"}`,
                color: leagueFilter === l.id ? l.color : "rgba(255,255,255,0.4)",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: l.color }} />
              {l.name}
            </button>
          ))}
        </div>

        {/* ── Match lists ── */}
        <div className="space-y-2.5">
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
            <Flame size={15} style={{ color: "#fb923c" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
              Open for predictions
            </span>
          </div>
          {MATCHES.filter(m => m.status === "open").map(m => (
            <MatchCard key={m.id} match={m} leagueFilter={leagueFilter} />
          ))}

          <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 16, marginBottom: 4 }}>
            <Lock size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
              Settled
            </span>
          </div>
          {MATCHES.filter(m => m.status === "settled").map(m => (
            <MatchCard key={m.id} match={m} leagueFilter={leagueFilter} />
          ))}
        </div>
      </>
    )}

    {/* ── Leaderboard tab ── */}
    {tab === "leaderboard" && (
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 18, overflow: "hidden" }}>
        <div style={{ padding: "0.85rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", gap: 8 }}>
          <Trophy size={15} style={{ color: "#f59e0b" }} />
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>
            Prediction Leaderboard
          </span>
        </div>
        {PRED_LEADERS.map((e, i) => (
          <div key={e.rank}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "0.8rem 1.2rem",
              borderBottom: i < PRED_LEADERS.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
              background: (e as any).isMe ? "rgba(129,140,248,0.06)" : "transparent",
              borderLeft: (e as any).isMe ? "2px solid #818cf8" : "2px solid transparent",
            }}
          >
            <span style={{ fontWeight: 800, minWidth: 24, textAlign: "center",
              color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#d97706" : "rgba(255,255,255,0.3)",
              fontSize: i < 3 ? "1.1rem" : "0.85rem" }}>
              {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${e.rank}`}
            </span>
            <div style={{ width: 30, height: 30, borderRadius: "50%",
              background: (e as any).isMe ? "rgba(129,140,248,0.2)" : "rgba(255,255,255,0.08)",
              border: `1px solid ${(e as any).isMe ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.12)"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.68rem", fontWeight: 700,
              color: (e as any).isMe ? "#818cf8" : "rgba(255,255,255,0.6)", flexShrink: 0 }}>
              {e.name.slice(0, 2).toUpperCase()}
            </div>
            <span style={{ flex: 1, fontWeight: (e as any).isMe ? 700 : 500,
              color: (e as any).isMe ? "#818cf8" : "#fff", fontSize: "0.85rem" }}>
              {e.name}{(e as any).isMe && " (You)"}
            </span>
            <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginRight: 6 }}>
              {e.correct} correct
            </span>
            <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#a78bfa", fontSize: "0.88rem" }}>
              {e.pts.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    )}
  </motion.div>
</Layout>
```

);
}
