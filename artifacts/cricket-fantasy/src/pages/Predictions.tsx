import { useState, useMemo, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Trophy, Zap, TrendingUp, CheckCircle,
  Clock, Lock, Award, ChevronDown, ChevronUp,
  Flame, Users, ChevronRight, Star, Loader2, RefreshCw,
} from "lucide-react";
import { TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO } from "@/lib/ipl-constants";
import { ALL_IPL_2026_PLAYERS } from "@/lib/ipl-players-2026";

// ── Types ──────────────────────────────────────────────────────────────────────
type PredStatus = "open" | "live" | "settled";

interface OtherPick {
  userId: number;
  name:     string;
  initials: string;
  color:    string;
  winner?:  string;
  mom?:     string;
  sixes?:   string;
}

interface ApiMatch {
  matchId:          string;
  matchNumber:      number;
  team1:            string;
  team2:            string;
  venue:            string;
  date:             string;
  time:             string;
  status:           PredStatus;
  result:           { winner: string; mom: string; sixes: number } | null;
  community:        { t1: number; t2: number };
  allPicks:         OtherPick[];
  totalPickers:     number;
  myPick:           { winner: string | null; mom: string | null; sixes: string | null } | null;
  alreadySubmitted: boolean;
}

interface MyStats {
  total:    number;
  correct:  number;
  streak:   number;
  pts:      number;
  accuracy: number;
}

interface Pick {
  winner?: string;
  mom?:    string;
  sixes?:  string;
}

const SIXES_BANDS = ["< 10", "10–14", "15–19", "20+"];

// ── Helpers ────────────────────────────────────────────────────────────────────
function computeDeadlineMins(date: string, time: string): number {
  try {
    const dt = new Date(`${date}T${time.replace(".", ":")}:00+05:30`);
    return Math.max(0, Math.round((dt.getTime() - Date.now()) / 60_000));
  } catch {
    return 0;
  }
}

function fmtDeadline(mins: number): string {
  if (mins <= 0)    return "started";
  if (mins < 60)    return `${mins}m`;
  if (mins < 1440)  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  return `${Math.floor(mins / 1440)}d`;
}

// ── API fetchers ───────────────────────────────────────────────────────────────
async function fetchPredMatches(): Promise<{ matches: ApiMatch[]; myStats: MyStats }> {
  const r = await fetch("/api/predictions/matches", { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json();
}

async function submitPrediction(matchId: string, pick: Pick): Promise<void> {
  const r = await fetch("/api/predictions", {
    method:      "POST",
    credentials: "include",
    headers:     { "Content-Type": "application/json" },
    body:        JSON.stringify({ matchId, ...pick }),
  });
  if (!r.ok) throw new Error(`${r.status}`);
}

async function fetchLeaderboard(): Promise<any[]> {
  const r = await fetch("/api/predictions/leaderboard", { credentials: "include" });
  if (!r.ok) throw new Error(`${r.status}`);
  const d = await r.json();
  return d.leaderboard ?? [];
}

// ── Sub-components ────────────────────────────────────────────────────────────
function TeamLogo({ code, size = 32 }: { code: string; size?: number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo)
    return (
      <img src={logo} alt={code}
        style={{ width: size, height: size, objectFit: "contain" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%",
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
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
    <div style={{ position: "relative" }}
      onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: `${color}30`, border: `2px solid ${color}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: size * 0.33, fontWeight: 800, color: "#fff",
        cursor: "default", userSelect: "none", flexShrink: 0,
      }}>
        {initials}
      </div>
      {show && tooltip && (
        <div style={{
          position: "absolute", bottom: size + 6, left: "50%", transform: "translateX(-50%)",
          background: "rgba(15,16,30,0.96)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 8, padding: "4px 10px", fontSize: "0.68rem",
          fontWeight: 600, color: "#fff", whiteSpace: "nowrap", zIndex: 50,
          pointerEvents: "none",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

// Stacked avatar row showing who picked what
function PickRow({
  label, picks, field, myValue, settled, correct,
}: {
  label:    string;
  picks:    OtherPick[];
  field:    "winner" | "mom" | "sixes";
  myValue?: string;
  settled:  boolean;
  correct?: boolean;
}) {
  const groups = picks.reduce<Record<string, OtherPick[]>>((acc, fp) => {
    const v = fp[field];
    if (!v) return acc;
    if (!acc[v]) acc[v] = [];
    acc[v].push(fp);
    return acc;
  }, {});

  if (Object.keys(groups).length === 0) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
        color: "rgba(255,255,255,0.25)", textTransform: "uppercase" }}>
        Others picked — {label}
      </div>
      {Object.entries(groups).map(([choice, friends]) => {
        const isMine  = myValue === choice;
        const isWrong = settled && isMine && !correct;
        const isRight = settled && isMine &&  correct;
        const choiceColor = isRight ? "#22c55e" : isWrong ? "#ef4444" : "rgba(255,255,255,0.5)";
        return (
          <div key={choice} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "5px 10px", borderRadius: 9,
            background: isMine
              ? isRight ? "rgba(34,197,94,0.07)" : isWrong ? "rgba(239,68,68,0.07)" : "rgba(129,140,248,0.07)"
              : "rgba(255,255,255,0.025)",
            border: `1px solid ${isMine
              ? isRight ? "rgba(34,197,94,0.2)" : isWrong ? "rgba(239,68,68,0.2)" : "rgba(129,140,248,0.15)"
              : "rgba(255,255,255,0.05)"}`,
          }}>
            <div style={{ display: "flex", marginRight: 2 }}>
              {friends.map((f, fi) => (
                <div key={fi} style={{ marginLeft: fi === 0 ? 0 : -8, zIndex: friends.length - fi }}>
                  <Avatar name={f.name} initials={f.initials} color={f.color}
                    size={24} tooltip={f.name} />
                </div>
              ))}
            </div>
            <span style={{ fontSize: "0.75rem", fontWeight: isMine ? 700 : 500, color: choiceColor,
              flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {choice}
              {isMine && <span style={{ fontSize: "0.62rem", marginLeft: 5, opacity: 0.6 }}>(You)</span>}
            </span>
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>
              {friends.length} {friends.length === 1 ? "pick" : "picks"}
            </span>
            {isRight && <CheckCircle size={13} style={{ color: "#22c55e", flexShrink: 0 }} />}
          </div>
        );
      })}
    </div>
  );
}

// MOM dropdown
function MomDropdown({
  team1, team2, value, onChange, disabled,
}: {
  team1: string; team2: string;
  value: string; onChange: (v: string) => void;
  disabled: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ]       = useState("");

  const players = useMemo(() =>
    ALL_IPL_2026_PLAYERS
      .filter(p => p.team === team1 || p.team === team2)
      .sort((a, b) => b.credits - a.credits),
    [team1, team2]
  );

  const filtered = q
    ? players.filter(p => p.name.toLowerCase().includes(q.toLowerCase()))
    : players;

  const c1 = TEAM_COLOR[team1] ?? "#aaa";
  const c2 = TEAM_COLOR[team2] ?? "#aaa";
  const roleIcon: Record<string, string> = { BAT: "🏏", BWL: "🎯", AR: "⚡", WK: "🧤" };

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          width: "100%", padding: "0.55rem 0.85rem",
          background: value ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
          border: `1.5px solid ${value ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.09)"}`,
          borderRadius: 11, color: value ? "#fff" : "rgba(255,255,255,0.35)",
          fontSize: "0.85rem", fontWeight: value ? 600 : 400,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          cursor: disabled ? "default" : "pointer", textAlign: "left",
          transition: "all 0.15s", opacity: disabled ? 0.6 : 1,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
          {value || `Pick Man of the Match…`}
        </span>
        <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.3)", flexShrink: 0, marginLeft: 6,
          transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
      </button>

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
            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {[team1, team2].map(team => {
                const tc   = team === team1 ? c1 : c2;
                const list = filtered.filter(p => p.team === team);
                if (list.length === 0) return null;
                return (
                  <div key={team}>
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

      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99 }}
          onClick={() => { setOpen(false); setQ(""); }} />
      )}
    </div>
  );
}

// ── Match card ─────────────────────────────────────────────────────────────────
function MatchCard({ match, onPickSaved }: { match: ApiMatch; onPickSaved?: () => void }) {
  const initialPick: Pick = {
    winner: match.myPick?.winner ?? undefined,
    mom:    match.myPick?.mom    ?? undefined,
    sixes:  match.myPick?.sixes  ?? undefined,
  };

  const [picks, setPicks]     = useState<Pick>(initialPick);
  const [submitted, setSub]   = useState(match.alreadySubmitted);
  const [submitting, setSubm] = useState(false);
  const [open, setOpen]       = useState(match.status !== "settled");
  const [error, setError]     = useState<string | null>(null);

  const c1 = TEAM_COLOR[match.team1] ?? "#aaa";
  const c2 = TEAM_COLOR[match.team2] ?? "#aaa";

  const isOpen    = match.status !== "settled" && !submitted;
  const isSettled = match.status === "settled";
  const isLive    = match.status === "live";

  const deadlineMins = computeDeadlineMins(match.date, match.time);

  const pts = isSettled && match.result
    ? (picks.winner === match.result.winner ? 50 : 0) +
      (picks.mom    === match.result.mom    ? 30 : 0)
    : null;

  const friendWinnerPct = useMemo(() => {
    const picks2 = match.allPicks;
    if (picks2.length === 0) return null;
    const t1 = picks2.filter(f => f.winner === match.team1).length;
    return Math.round((t1 / picks2.length) * 100);
  }, [match.allPicks, match.team1]);

  const canSubmit = !!picks.winner && !!picks.mom;

  async function handleLockPicks() {
    if (!canSubmit || submitting) return;
    setSubm(true);
    setError(null);
    try {
      await submitPrediction(match.matchId, picks);
      setSub(true);
      onPickSaved?.();
    } catch {
      setError("Failed to save — please try again.");
    } finally {
      setSubm(false);
    }
  }

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>

      {/* Header */}
      <div
        onClick={() => setOpen(o => !o)}
        style={{
          padding: "0.9rem 1.1rem", cursor: "pointer",
          borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none",
          background: "rgba(255,255,255,0.015)",
          display: "flex", alignItems: "center", gap: 10,
        }}
      >
        <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
          background: "rgba(255,255,255,0.07)", padding: "2px 7px", borderRadius: 6, flexShrink: 0 }}>
          M{match.matchNumber}
        </span>

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

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {match.allPicks.length > 0 && (
            <div style={{ display: "flex", alignItems: "center" }}>
              {match.allPicks.slice(0, 4).map((f, fi) => (
                <div key={fi} style={{ marginLeft: fi === 0 ? 0 : -7, zIndex: 4 - fi }}>
                  <Avatar name={f.name} initials={f.initials} color={f.color} size={22} />
                </div>
              ))}
              {match.allPicks.length > 4 && (
                <div style={{ width: 22, height: 22, borderRadius: "50%", marginLeft: -7, zIndex: 0,
                  background: "rgba(255,255,255,0.1)", border: "2px solid rgba(255,255,255,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.6)" }}>
                  +{match.allPicks.length - 4}
                </div>
              )}
            </div>
          )}

          {isSettled && pts !== null && (
            <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.82rem",
              color: pts > 0 ? "#22c55e" : "rgba(255,255,255,0.2)" }}>
              +{pts}pts
            </span>
          )}

          {isLive && !submitted && (
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#ef4444",
              display: "flex", alignItems: "center", gap: 3 }}>
              🔴 LIVE
            </span>
          )}

          {match.status === "open" && !submitted && deadlineMins > 0 && (
            <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#f59e0b",
              display: "flex", alignItems: "center", gap: 3 }}>
              <Clock size={11} /> {fmtDeadline(deadlineMins)}
            </span>
          )}

          {submitted && !isSettled && <CheckCircle size={14} style={{ color: "#22c55e" }} />}
          {isSettled && <Lock size={13} style={{ color: "rgba(255,255,255,0.2)" }} />}
          {open
            ? <ChevronUp   size={14} style={{ color: "rgba(255,255,255,0.25)" }} />
            : <ChevronDown size={14} style={{ color: "rgba(255,255,255,0.25)" }} />}
        </div>
      </div>

      {/* Expanded body */}
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
                  {match.result.mom && (
                    <span style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)" }}>
                      MOM: <b style={{ color: "#fff" }}>{match.result.mom}</b>
                    </span>
                  )}
                  {pts !== null && pts > 0 && (
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#22c55e",
                      marginLeft: "auto", fontFamily: "monospace" }}>
                      You scored +{pts} pts ✓
                    </span>
                  )}
                </div>
              )}

              {/* Community + Others bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem" }}>
                {/* Global community % */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c1 }}>
                      {match.team1} {match.community.t1}%
                    </span>
                    <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)",
                      display: "flex", alignItems: "center", gap: 4 }}>
                      <Users size={10} /> All predictors ({match.totalPickers})
                    </span>
                    <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c2 }}>
                      {match.community.t2}% {match.team2}
                    </span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, overflow: "hidden", display: "flex",
                    background: "rgba(255,255,255,0.05)" }}>
                    <div style={{ width: `${match.community.t1}%`,
                      background: `linear-gradient(90deg, ${c1}, ${c1}90)`,
                      transition: "width 0.4s", borderRadius: 3 }} />
                    <div style={{ flex: 1,
                      background: `linear-gradient(90deg, ${c2}90, ${c2})`,
                      borderRadius: 3 }} />
                  </div>
                </div>

                {/* League / others picker bar */}
                {match.allPicks.length > 0 && friendWinnerPct !== null && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: "0.62rem", fontWeight: 700, color: c1 }}>
                        {match.team1} {friendWinnerPct}%
                      </span>
                      <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)",
                        display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={10} /> Others in the app
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
                    <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", gap: 3 }}>
                        {match.allPicks.filter(f => f.winner === match.team1).map((f, fi) => (
                          <Avatar key={fi} name={f.name} initials={f.initials} color={f.color}
                            size={26} tooltip={`${f.name} → ${f.winner}`} />
                        ))}
                      </div>
                      {match.allPicks.filter(f => f.winner === match.team1).length > 0 &&
                       match.allPicks.filter(f => f.winner === match.team2).length > 0 && (
                        <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} />
                      )}
                      <div style={{ display: "flex", gap: 3 }}>
                        {match.allPicks.filter(f => f.winner === match.team2).map((f, fi) => (
                          <Avatar key={fi} name={f.name} initials={f.initials} color={f.color}
                            size={26} tooltip={`${f.name} → ${f.winner}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Prediction inputs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>

                {/* Winner */}
                <div>
                  <div style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em",
                    color: "rgba(255,255,255,0.3)", textTransform: "uppercase", marginBottom: 8 }}>
                    Match Winner <span style={{ color: "#f59e0b" }}>+50 pts</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {[match.team1, match.team2].map(t => {
                      const tc  = TEAM_COLOR[t] ?? "#aaa";
                      const sel = picks.winner === t;
                      return (
                        <button key={t}
                          onClick={() => !submitted && setPicks(p => ({ ...p, winner: t }))}
                          disabled={submitted}
                          style={{
                            padding: "0.7rem 1rem", borderRadius: 11, cursor: submitted ? "default" : "pointer",
                            background: sel ? `${tc}20` : "rgba(255,255,255,0.04)",
                            border: `2px solid ${sel ? tc : "rgba(255,255,255,0.09)"}`,
                            display: "flex", alignItems: "center", gap: 8, transition: "all 0.15s",
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
                  {match.allPicks.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <PickRow label="winner" picks={match.allPicks} field="winner"
                        myValue={picks.winner} settled={isSettled}
                        correct={isSettled && picks.winner === match.result?.winner} />
                    </div>
                  )}
                </div>

                {/* MOM */}
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
                  {match.allPicks.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <PickRow label="MOM" picks={match.allPicks} field="mom"
                        myValue={picks.mom} settled={isSettled}
                        correct={isSettled && picks.mom === match.result?.mom} />
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
                  {match.allPicks.length > 0 && (
                    <div style={{ marginTop: 8 }}>
                      <PickRow label="sixes" picks={match.allPicks} field="sixes"
                        myValue={picks.sixes} settled={isSettled}
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

              {/* Venue + submit */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>
                  📍 {match.venue}
                </span>

                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  {error && (
                    <span style={{ fontSize: "0.72rem", color: "#ef4444" }}>{error}</span>
                  )}
                  {isOpen && (
                    <button
                      onClick={handleLockPicks}
                      disabled={!canSubmit || submitting}
                      style={{
                        padding: "0.65rem 1.6rem", borderRadius: 11, border: "none",
                        background: canSubmit ? "#c0192c" : "rgba(192,25,44,0.15)",
                        color: canSubmit ? "#fff" : "rgba(255,255,255,0.2)",
                        fontWeight: 800, fontSize: "0.85rem",
                        cursor: canSubmit && !submitting ? "pointer" : "default",
                        transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      {submitting
                        ? <><Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> Saving…</>
                        : "⚡ Lock Picks"}
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
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Predictions() {
  const [tab, setTab]       = useState<"predict" | "leaderboard">("predict");
  const [matches, setMatches]   = useState<ApiMatch[]>([]);
  const [myStats, setMyStats]   = useState<MyStats>({ total: 0, correct: 0, streak: 0, pts: 0, accuracy: 0 });
  const [leaders, setLeaders]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [predData, lbData] = await Promise.all([
        fetchPredMatches(),
        fetchLeaderboard(),
      ]);
      setMatches(predData.matches);
      setMyStats(predData.myStats);
      setLeaders(lbData);
    } catch (e: any) {
      setError("Failed to load predictions. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const openMatches    = matches.filter(m => m.status === "open" || m.status === "live");
  const settledMatches = matches.filter(m => m.status === "settled");

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-5"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-white">Predictions</h1>
            <p className="text-sm text-white/40 mt-0.5">
              Pick winners · name the MOM · see what others think
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              style={{
                width: 34, height: 34, borderRadius: 9,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "rgba(255,255,255,0.4)",
              }}
            >
              <RefreshCw size={14} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
            </button>
            <div className="flex gap-1.5 shrink-0">
              {(["predict", "leaderboard"] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  style={{
                    padding: "0.45rem 1rem", borderRadius: 10,
                    background: tab === t ? "rgba(129,140,248,0.15)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${tab === t ? "rgba(129,140,248,0.35)" : "rgba(255,255,255,0.08)"}`,
                    color: tab === t ? "#818cf8" : "rgba(255,255,255,0.45)",
                    fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                    textTransform: "capitalize",
                  }}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* My stats */}
        <div className="grid grid-cols-5 gap-2.5">
          {[
            { label: "Made",     value: myStats.total,                     color: "#fff",    icon: <Target size={13} /> },
            { label: "Correct",  value: myStats.correct,                   color: "#22c55e", icon: <CheckCircle size={13} /> },
            { label: "Accuracy", value: `${myStats.accuracy}%`,            color: "#60a5fa", icon: <TrendingUp size={13} /> },
            { label: "Streak",   value: `${myStats.streak}🔥`,            color: "#f59e0b", icon: <Zap size={13} /> },
            { label: "Pts",      value: myStats.pts.toLocaleString(),      color: "#a78bfa", icon: <Award size={13} /> },
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

        {/* Loading / error */}
        {loading && (
          <div style={{ textAlign: "center", padding: "4rem 2rem",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            <Loader2 size={28} style={{ color: "rgba(255,255,255,0.2)", animation: "spin 1s linear infinite" }} />
            <span style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.25)" }}>Loading matches…</span>
          </div>
        )}

        {error && !loading && (
          <div style={{ textAlign: "center", padding: "2rem",
            background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 16, color: "#ef4444", fontSize: "0.85rem" }}>
            {error}
          </div>
        )}

        {/* Predict tab */}
        {!loading && !error && tab === "predict" && (
          <>
            {/* Open matches */}
            {openMatches.length > 0 && (
              <div className="space-y-2.5">
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <Flame size={15} style={{ color: "#fb923c" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.55)" }}>
                    Open for predictions
                  </span>
                </div>
                {openMatches.map(m => (
                  <MatchCard key={m.matchId} match={m} onPickSaved={() => loadData(true)} />
                ))}
              </div>
            )}

            {openMatches.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem 2rem",
                background: "rgba(255,255,255,0.02)", border: "1px dashed rgba(255,255,255,0.08)",
                borderRadius: 20 }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>🎯</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>
                  No open matches right now
                </div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.25)", marginTop: 6 }}>
                  Check back when the next fixture is scheduled
                </div>
              </div>
            )}

            {/* Settled matches */}
            {settledMatches.length > 0 && (
              <div className="space-y-2.5">
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 8, marginBottom: 4 }}>
                  <Lock size={13} style={{ color: "rgba(255,255,255,0.2)" }} />
                  <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "rgba(255,255,255,0.35)" }}>
                    Settled results
                  </span>
                </div>
                {settledMatches.map(m => (
                  <MatchCard key={m.matchId} match={m} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Leaderboard tab */}
        {!loading && !error && tab === "leaderboard" && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18, overflow: "hidden" }}>
            <div style={{ padding: "0.85rem 1.2rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
              display: "flex", alignItems: "center", gap: 8 }}>
              <Trophy size={15} style={{ color: "#f59e0b" }} />
              <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff" }}>
                Prediction Leaderboard
              </span>
              <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>
                {leaders.length} predictor{leaders.length !== 1 ? "s" : ""}
              </span>
            </div>

            {leaders.length === 0 && (
              <div style={{ padding: "3rem 2rem", textAlign: "center" }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🏆</div>
                <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.25)" }}>
                  Leaderboard builds once predictions are submitted and settled
                </div>
              </div>
            )}

            {leaders.map((e, i) => (
              <div key={e.userId}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "0.8rem 1.2rem",
                  borderBottom: i < leaders.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  background: e.isMe ? "rgba(129,140,248,0.06)" : "transparent",
                  borderLeft: e.isMe ? "2px solid #818cf8" : "2px solid transparent",
                }}
              >
                <span style={{ fontWeight: 800, minWidth: 24, textAlign: "center",
                  color: i === 0 ? "#f59e0b" : i === 1 ? "#9ca3af" : i === 2 ? "#d97706" : "rgba(255,255,255,0.3)",
                  fontSize: i < 3 ? "1.1rem" : "0.85rem" }}>
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${e.rank}`}
                </span>
                <div style={{ width: 30, height: 30, borderRadius: "50%",
                  background: e.isMe ? "rgba(129,140,248,0.2)" : `${e.color}20`,
                  border: `1px solid ${e.isMe ? "rgba(129,140,248,0.35)" : e.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "0.68rem", fontWeight: 700,
                  color: e.isMe ? "#818cf8" : "#fff", flexShrink: 0 }}>
                  {e.initials}
                </div>
                <span style={{ flex: 1, fontWeight: e.isMe ? 700 : 500,
                  color: e.isMe ? "#818cf8" : "#fff", fontSize: "0.85rem" }}>
                  {e.name}{e.isMe && " (You)"}
                </span>
                <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", marginRight: 6 }}>
                  {e.correct}/{e.total} correct
                </span>
                <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#a78bfa", fontSize: "0.88rem" }}>
                  {Number(e.pts).toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </Layout>
  );
}
