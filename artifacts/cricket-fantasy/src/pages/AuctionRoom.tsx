/**
 * AuctionRoom.tsx v4
 *
 * Stage flow:
 *   "prep"     → optional watchlist prep stage (host can skip)
 *   "lobby"    → waiting for host to start
 *   "auction"  → main auction
 *
 * Auction flow:
 *   idle → revealing (1.8s) → bidding → sold | unsold → next player (auto)
 *
 * Player order:
 *   Classic: full pool shuffled randomly once on start
 *   Tier:    T1 shuffled → T2 shuffled → T3 shuffled → T4 shuffled
 *
 * Bid input:
 *   - Replaced glitchy controlled number input with a clean text-based approach
 *   - ₹ prefix display, raw string on focus, parse+validate on blur/Enter
 *   - Increment/decrement buttons always work without touching input state
 *   - Manual price entry always wins on confirm
 */
import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  ArrowLeft, Gavel, CheckCircle, XCircle, Crown, Search,
  ChevronDown, ChevronUp, RotateCcw, Plus, Minus,
  Copy, TriangleAlert, Star, Clock, Users, Play,
  SkipForward, BookOpen, ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ALL_IPL_2026_PLAYERS, getPlayerTier, getTierBasePrice,
  TIER_CONFIG, type PlayerTier
} from "@/lib/ipl-players-2026";
import {
  TEAM_COLOR, TEAM_FULL_NAME, ROLE_LABEL, ROLE_ICON, ROLE_COLOR
} from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────
interface Player {
  name: string; team: string; role: string;
  credits: number; nationality: string; capped: boolean;
}
interface SquadEntry extends Player { price: number; tier: PlayerTier; }
interface AucTeam { id: string; name: string; color: string; budget: number; squad: SquadEntry[]; }
interface LogEntry {
  player: Player; status: "sold" | "unsold";
  winner?: string; winnerColor?: string; price?: number;
  tier: PlayerTier; snapshot: AucTeam[];
}
type AucPhase  = "idle" | "revealing" | "bidding" | "sold" | "unsold";
type RoomStage = "prep" | "auction";
type MobileTab = "stage" | "teams" | "log";
type AuctionMode = "classic" | "tier";

// ── Constants ────────────────────────────────────────────────────────
const ACCENT = "#c0192c";
const BDR    = "rgba(255,255,255,0.08)";
const CARD   = "rgba(255,255,255,0.04)";
const DIM    = "rgba(255,255,255,0.35)";
const WARN_PCT = 0.1; // warn when < 10% budget left
const REVEAL_MS = 1800;

const TIER_ORDER: PlayerTier[] = ["T1", "T2", "T3", "T4"];
const TD = {
  T1: { label: "Marquee",   color: "#e8a020", glow: "rgba(232,160,32,0.18)"  },
  T2: { label: "Premium",   color: "#818cf8", glow: "rgba(129,140,248,0.14)" },
  T3: { label: "Mid-Level", color: "#34d399", glow: "rgba(52,211,153,0.11)"  },
  T4: { label: "Rookie",    color: "#94a3b8", glow: "rgba(148,163,184,0.09)" },
};

// ── Auction config (persisted from CreateAuction / JoinAuction) ───────
const AUCTION_CONFIG_KEY = "colosseum_auction_config";
interface AuctionConfig { name:string; budget:number; maxPlayers:number; format:AuctionMode; topScoring:boolean; topScoringCount:number; captainVC:boolean; roomCode?:string; }
const DEFAULT_CONFIG: AuctionConfig = { name:"Auction", budget:100, maxPlayers:11, format:"classic", topScoring:false, topScoringCount:11, captainVC:true };
function loadAuctionConfig(): AuctionConfig {
  try { const r = localStorage.getItem(AUCTION_CONFIG_KEY); if (r) return { ...DEFAULT_CONFIG, ...JSON.parse(r) }; } catch {}
  return DEFAULT_CONFIG;
}

interface RegisteredTeam { id: number; roomCode: string; teamName: string; color: string; isHost: boolean; }

function makeInitTeams(startBudget: number, registered: RegisteredTeam[]): AucTeam[] {
  return registered.map((t, i) => ({
    id:     `t${i + 1}`,
    name:   t.teamName,
    color:  t.color,
    budget: startBudget,
    squad:  [],
  }));
}

// ── Helpers ──────────────────────────────────────────────────────────
function crFmt(n: number) {
  if (n === 0) return "₹0";
  if (n < 1)   return `₹${Math.round(n * 100)}L`;
  return n % 1 === 0 ? `₹${n}Cr` : `₹${n.toFixed(2).replace(/\.?0+$/, "")}Cr`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(mode: AuctionMode): Player[] {
  if (mode === "classic") return shuffle([...ALL_IPL_2026_PLAYERS]);
  return TIER_ORDER.flatMap(tier =>
    shuffle(ALL_IPL_2026_PLAYERS.filter(p => getPlayerTier(p.credits) === tier))
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function BudgetBar({ team, mini = false, startBudget = 100 }: { team: AucTeam; mini?: boolean; startBudget?: number }) {
  const pct = Math.max(0, (team.budget / startBudget) * 100);
  const low = team.budget <= startBudget * WARN_PCT;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: mini ? "0.7rem" : "0.8rem", fontWeight: 700, color: team.color,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 130 }}>
          {team.name}
        </span>
        <span style={{ fontSize: "0.7rem", fontFamily: "monospace",
          color: low ? "#f87171" : DIM, fontWeight: low ? 700 : 400 }}>
          {crFmt(team.budget)}
          {low && <TriangleAlert style={{ width: 9, height: 9, marginLeft: 2, display: "inline" }} />}
        </span>
      </div>
      <div style={{ height: mini ? 3 : 4, borderRadius: 2,
        background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`,
          background: low ? "#ef4444" : team.color, transition: "width 0.4s" }} />
      </div>
      {!mini && <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)" }}>{team.squad.length} players</span>}
    </div>
  );
}

function TierBadge({ tier, size = "sm" }: { tier: PlayerTier; size?: "sm" | "lg" }) {
  const td = TD[tier];
  const cfg = TIER_CONFIG[tier];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4,
      fontSize: size === "lg" ? "0.88rem" : "0.68rem", fontWeight: 700, color: td.color,
      background: `${td.color}18`, border: `1px solid ${td.color}35`,
      padding: size === "lg" ? "4px 12px" : "2px 8px", borderRadius: 20, whiteSpace: "nowrap" }}>
      {td.label}
      {size === "lg" && <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>· Base {crFmt(cfg.basePrice)}</span>}
    </span>
  );
}

// ── Watchlist panel (used in prep stage) ─────────────────────────────
const WATCHLIST_KEY = "colosseum_watchlist";
function loadWL(): string[] {
  try { return JSON.parse(localStorage.getItem(WATCHLIST_KEY) ?? "[]"); } catch { return []; }
}
function saveWL(names: string[]) {
  try { localStorage.setItem(WATCHLIST_KEY, JSON.stringify(names)); } catch {}
}

function WatchlistPanel({ onClose }: { onClose: () => void }) {
  const [wl, setWl]       = useState<string[]>(loadWL);
  const [search, setSearch] = useState("");
  const [roleF, setRoleF]   = useState("ALL");
  const [tab, setTab]       = useState<"watched" | "browse">("watched");

  function toggle(name: string) {
    setWl(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      saveWL(next); return next;
    });
  }

  const browsed = useMemo(() =>
    ALL_IPL_2026_PLAYERS
      .filter(p =>
        (roleF === "ALL" || p.role === roleF) &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) || p.team.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => b.credits - a.credits),
    [search, roleF]
  );

  const watchedPlayers = ALL_IPL_2026_PLAYERS.filter(p => wl.includes(p.name))
    .sort((a, b) => b.credits - a.credits);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        onClick={e => e.stopPropagation()}
        style={{ width: "100%", maxWidth: 580, maxHeight: "88vh",
          background: "rgba(8,9,18,0.99)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff",
            display: "flex", alignItems: "center", gap: 7 }}>
            <Star size={15} style={{ color: "#f59e0b", fill: "#f59e0b" }} />
            My Watchlist · Prep Stage
          </span>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: DIM, fontSize: "1.1rem" }}>✕</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", padding: "0.5rem 1.25rem 0", gap: 4 }}>
          {(["watched", "browse"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: "0.35rem 0.85rem", borderRadius: "8px 8px 0 0",
                border: "1px solid rgba(255,255,255,0.08)",
                borderBottom: tab === t ? "1px solid rgba(8,9,18,0.99)" : "1px solid rgba(255,255,255,0.08)",
                background: tab === t ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.02)",
                color: tab === t ? "#fff" : DIM,
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
              {t === "watched" ? `Watching (${wl.length})` : "Browse All"}
            </button>
          ))}
        </div>

        {/* Filters (browse only) */}
        {tab === "browse" && (
          <div style={{ padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", gap: 6, flexWrap: "wrap", background: "rgba(255,255,255,0.02)" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 140 }}>
              <Search style={{ position: "absolute", left: "0.7rem", top: "50%",
                transform: "translateY(-50%)", width: 12, height: 12, color: DIM, pointerEvents: "none" }} />
              <input autoFocus={tab === "browse"} value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search player or team…"
                style={{ width: "100%", boxSizing: "border-box",
                  padding: "0.45rem 0.7rem 0.45rem 2rem",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, color: "#fff", fontSize: "0.82rem", outline: "none" }} />
            </div>
            {["ALL", "BAT", "AR", "WK", "BWL"].map(r => (
              <button key={r} onClick={() => setRoleF(r)}
                style={{ padding: "0.3rem 0.55rem", borderRadius: 6, fontSize: "0.67rem",
                  fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${roleF === r ? "rgba(255,255,255,0.2)" : BDR}`,
                  background: roleF === r ? "rgba(255,255,255,0.1)" : CARD,
                  color: roleF === r ? "#fff" : DIM }}>
                {r}
              </button>
            ))}
          </div>
        )}

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {tab === "watched" && watchedPlayers.length === 0 && (
            <div style={{ padding: "3rem 2rem", textAlign: "center",
              color: "rgba(255,255,255,0.25)", fontSize: "0.85rem" }}>
              <Star size={32} style={{ marginBottom: "0.75rem", opacity: 0.2 }} />
              <div>No players starred yet.</div>
              <div style={{ marginTop: 4, fontSize: "0.75rem" }}>Switch to Browse to add targets.</div>
            </div>
          )}
          {(tab === "watched" ? watchedPlayers : browsed).map((p, i) => {
            const tc      = TEAM_COLOR[p.team] ?? "#aaa";
            const tier    = getPlayerTier(p.credits);
            const td      = TD[tier];
            const starred = wl.includes(p.name);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10,
                padding: "0.6rem 1.25rem", cursor: "pointer",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: starred ? `${tc}07` : "transparent",
                transition: "background 0.12s" }}
                onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = `${tc}0c`}
                onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = starred ? `${tc}07` : "transparent"}>
                <button onClick={() => toggle(p.name)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flexShrink: 0 }}>
                  <Star size={14} style={{ color: starred ? "#f59e0b" : "rgba(255,255,255,0.2)",
                    fill: starred ? "#f59e0b" : "none", transition: "all 0.15s" }} />
                </button>
                <span style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.04em",
                  color: ROLE_COLOR[p.role] ?? "#aaa", flexShrink: 0,
                  width: 24, textAlign: "center" }}>
                  {ROLE_ICON[p.role] ?? "BAT"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "#fff",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                    {!p.capped && <span style={{ fontSize: "0.58rem", color: DIM, marginLeft: 5 }}>UC</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: tc }}>{p.team}</span>
                    <TierBadge tier={tier} size="sm" />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: td.color, fontFamily: "monospace" }}>
                    {p.credits}cr
                  </div>
                  <div style={{ fontSize: "0.62rem", color: DIM }}>
                    Base {crFmt(getTierBasePrice(p.credits))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Prep Stage ───────────────────────────────────────────────────────
function PrepStage({ mode, onStart, onSkip, canStart, teamCount }: {
  mode: AuctionMode; onStart: () => void; onSkip: () => void; canStart: boolean; teamCount: number;
}) {
  const [showWL, setShowWL]     = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 min
  const [running, setRunning]   = useState(false);
  const wl = loadWL();

  useEffect(() => {
    if (!running || timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft(v => v - 1), 1000);
    return () => clearInterval(t);
  }, [running, timeLeft]);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const ss = String(timeLeft % 60).padStart(2, "0");

  const tierCounts = useMemo(() => {
    const counts: Record<PlayerTier, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };
    ALL_IPL_2026_PLAYERS.forEach(p => counts[getPlayerTier(p.credits)]++);
    return counts;
  }, []);

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: "1.5rem",
      padding: "2rem", textAlign: "center" }}>

      {/* Icon */}
      <div style={{ width: 72, height: 72, borderRadius: 20,
        background: "rgba(129,140,248,0.15)", border: "1px solid rgba(129,140,248,0.3)",
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem" }}>
        📋
      </div>

      <div>
        <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          Preparation Stage
        </h2>
        <p style={{ margin: "0.4rem 0 0", fontSize: "0.88rem", color: DIM, maxWidth: 380 }}>
          Review the player pool, star your targets, and plan your strategy before the auction begins.
        </p>
      </div>

      {/* Pool summary */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
        {TIER_ORDER.map(tier => {
          const td = TD[tier];
          const cfg = TIER_CONFIG[tier];
          return (
            <div key={tier} style={{ background: CARD, border: `1px solid ${td.color}30`,
              borderRadius: 12, padding: "0.6rem 0.85rem", minWidth: 80 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: td.color, marginBottom: 4 }} />
              <div style={{ fontSize: "0.68rem", fontWeight: 700, color: td.color }}>
                {td.label}
              </div>
              <div style={{ fontSize: "0.72rem", fontWeight: 800, color: "#fff", marginTop: 1 }}>
                {tierCounts[tier]}
              </div>
              <div style={{ fontSize: "0.6rem", color: DIM }}>
                Base {crFmt(cfg.basePrice)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Watchlist button */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <button onClick={() => setShowWL(true)}
          style={{ display: "flex", alignItems: "center", gap: 8,
            padding: "0.8rem 1.6rem", background: "rgba(245,158,11,0.15)",
            border: "1px solid rgba(245,158,11,0.35)", borderRadius: 12,
            color: "#f59e0b", fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
            transition: "all 0.15s" }}>
          <Star size={16} style={{ fill: "#f59e0b" }} />
          Open Watchlist
          {wl.length > 0 && (
            <span style={{ background: "#f59e0b", color: "#000", borderRadius: 20,
              fontSize: "0.65rem", fontWeight: 800, padding: "0 6px" }}>
              {wl.length}
            </span>
          )}
        </button>
        <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)" }}>
          Star players you want to target
        </span>
      </div>

      {/* Optional countdown */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
        {running ? (
          <div style={{ fontFamily: "monospace", fontSize: "2rem", fontWeight: 900,
            color: timeLeft < 60 ? "#f87171" : "#818cf8" }}>
            {mm}:{ss}
          </div>
        ) : (
          <button onClick={() => setRunning(true)}
            style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "0.45rem 0.9rem", background: "rgba(129,140,248,0.1)",
              border: "1px solid rgba(129,140,248,0.25)", borderRadius: 9,
              color: "#818cf8", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
            <Clock size={13} /> Start 5-min prep timer
          </button>
        )}
      </div>

      {/* Mode pill */}
      <div style={{ display: "flex", alignItems: "center", gap: 6,
        padding: "0.35rem 0.85rem", background: CARD, border: `1px solid ${BDR}`,
        borderRadius: 20, fontSize: "0.75rem", color: DIM }}>
        {mode === "tier" ? "Tier-based order · T1 → T2 → T3 → T4" : "Classic · random order"}
      </div>

      {/* CTA buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button onClick={canStart ? onStart : undefined} disabled={!canStart}
          title={canStart ? undefined : "At least 2 teams must join before starting"}
          style={{ display: "flex", alignItems: "center", gap: 8,
            padding: "0.9rem 2rem",
            background: canStart ? ACCENT : "rgba(192,25,44,0.18)",
            border: "none",
            borderRadius: 13,
            color: canStart ? "#fff" : "rgba(255,255,255,0.28)",
            fontWeight: 800, fontSize: "1rem",
            cursor: canStart ? "pointer" : "not-allowed",
            boxShadow: canStart ? `0 0 28px ${ACCENT}40` : "none",
            transition: "all 0.2s" }}>
          <Play size={18} />
          {canStart
            ? "Start Auction"
            : teamCount === 1
              ? "Need 1 more team…"
              : "Waiting for teams…"
          }
        </button>
        {canStart && (
          <button onClick={onSkip}
            style={{ display: "flex", alignItems: "center", gap: 6,
              padding: "0.9rem 1.4rem", background: CARD, border: `1px solid ${BDR}`,
              borderRadius: 13, color: DIM, fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
            <SkipForward size={15} /> Skip Prep
          </button>
        )}
      </div>

      <AnimatePresence>
        {showWL && <WatchlistPanel onClose={() => setShowWL(false)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Bid Input — clean text-based, no glitch ──────────────────────────
function BidInput({
  value, onChange, color, basePrice, increment
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  basePrice: number;
  increment: number;
}) {
  const [raw, setRaw]     = useState("");
  const [focused, setFoc] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  function commit(str: string) {
    const parsed = parseFloat(str.replace(/[^0-9.]/g, ""));
    if (!isNaN(parsed) && parsed >= basePrice) {
      onChange(parseFloat(parsed.toFixed(2)));
    }
    setFoc(false);
  }

  function handleFocus() {
    setRaw(value === 0 ? "" : String(value));
    setFoc(true);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow digits and a single decimal point only
    const v = e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");
    setRaw(v);
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); commit(raw); ref.current?.blur(); }
    if (e.key === "Escape") { setFoc(false); ref.current?.blur(); }
  }

  function step(delta: number) {
    const next = parseFloat(Math.max(basePrice, value + delta).toFixed(2));
    onChange(next);
    if (focused) { setRaw(String(next)); }
  }

  const displayVal = focused ? raw : (value === 0 ? "" : crFmt(value));
  const placeholder = crFmt(basePrice);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
      {/* − button */}
      <button
        onMouseDown={e => { e.preventDefault(); step(-increment); }}
        style={{ width: 32, height: 42, borderRadius: 8, flexShrink: 0,
          background: "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`,
          color: DIM, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Minus size={13} />
      </button>

      {/* Text input — never type=number, no spin buttons, no glitch */}
      <div style={{ flex: 1, position: "relative", minWidth: 90 }}>
        {!focused && value === 0 && (
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: "1.3rem", fontWeight: 900,
            color: "rgba(255,255,255,0.2)", pointerEvents: "none", fontFamily: "monospace" }}>
            {placeholder}
          </span>
        )}
        <input
          ref={ref}
          inputMode="decimal"
          value={displayVal}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={e => commit(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          style={{ width: "100%", boxSizing: "border-box",
            padding: "0.55rem 0.5rem",
            background: "rgba(255,255,255,0.08)",
            border: `2.5px solid ${focused ? color : `${color}50`}`,
            borderRadius: 10, color: color,
            fontSize: "1.6rem", fontWeight: 900, textAlign: "center",
            outline: "none", fontFamily: "monospace",
            transition: "border-color 0.15s" }}
        />
      </div>

      {/* + button */}
      <button
        onMouseDown={e => { e.preventDefault(); step(increment); }}
        style={{ width: 32, height: 42, borderRadius: 8, flexShrink: 0,
          background: "rgba(255,255,255,0.06)", border: `1px solid ${BDR}`,
          color: DIM, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Plus size={13} />
      </button>

      {/* Quick-jump buttons */}
      {[1, 2, 4, 8].map(mult => {
        const delta = parseFloat((increment * mult).toFixed(2));
        return (
          <button key={mult}
            onMouseDown={e => { e.preventDefault(); step(delta); }}
            style={{ padding: "0.32rem 0.55rem", borderRadius: 7,
              border: `1px solid ${BDR}`, background: CARD,
              color: DIM, fontSize: "0.65rem", fontWeight: 700, cursor: "pointer",
              flexShrink: 0 }}>
            +{crFmt(delta)}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────
export default function AuctionRoom() {
  const [, navigate]   = useLocation();

  // Load settings saved by CreateAuction (or JoinAuction)
  const config = useMemo(() => loadAuctionConfig(), []);
  const startBudget = config.budget;

  const savedMode = (typeof sessionStorage !== "undefined"
    ? sessionStorage.getItem("auction_mode") : null) as AuctionMode | null;
  const [mode] = useState<AuctionMode>(savedMode ?? config.format ?? "classic");

  // Room stage: prep or auction
  const [roomStage, setRoomStage] = useState<RoomStage>("prep");

  // Shuffled player queue — built once when auction starts
  const queueRef = useRef<Player[]>([]);
  const queueIdx = useRef(0);

  // Auction state — teams start empty, populated once API responds
  const [teams, setTeams]       = useState<AucTeam[]>(() => makeInitTeams(startBudget, []));
  const soldRef                  = useRef<Set<string>>(new Set());

  const [phase, setPhase]         = useState<AucPhase>("idle");
  const [nominated, setNominated] = useState<Player | null>(null);
  const [bidValue, setBidValue]   = useState(0);
  const [leadId, setLeadId]       = useState<string | null>(null);
  const [log, setLog]             = useState<LogEntry[]>([]);
  const [expandedTeam, setExpTeam] = useState<string | null>(null);
  const [mobileTab, setMobileTab]  = useState<MobileTab>("stage");
  const [showWL, setShowWL]        = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(!config.roomCode); // true immediately if no roomCode

  const leadTeam  = teams.find(t => t.id === leadId) ?? null;
  const remaining = queueRef.current.length - queueIdx.current;

  // ── Fetch registered teams from API ──────────────────────────────
  useEffect(() => {
    const roomCode = config.roomCode;
    if (!roomCode) return;
    apiFetch(`/auction/rooms/${roomCode}/teams`)
      .then(r => r.ok ? r.json() : null)
      .then((data: { teams: RegisteredTeam[] } | null) => {
        if (data) {
          setTeams(makeInitTeams(startBudget, data.teams));
        }
      })
      .catch(() => { /* keep empty */ })
      .finally(() => setTeamsLoaded(true));
  }, [config.roomCode, startBudget]);

  // ── Keyboard shortcuts ─────────────────────────────────────────────
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (phase !== "bidding" || !nominated) return;
    const inc = TIER_CONFIG[getPlayerTier(nominated.credits)].increment;
    if (e.code === "Space")  { e.preventDefault(); setBidValue(v => parseFloat((v + inc).toFixed(2))); }
    if (e.code === "Enter" && leadId) { e.preventDefault(); doSold(); }
  }, [phase, leadId, nominated]);

  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleKey]);

  // ── Start auction — build queue ────────────────────────────────────
  function startAuction() {
    queueRef.current = buildQueue(mode);
    queueIdx.current = 0;
    setRoomStage("auction");
    advanceToNext(queueRef.current, 0);
  }

  // ── Advance to next player in queue ───────────────────────────────
  function advanceToNext(queue: Player[], idx: number) {
    // Skip already-sold (possible after undo)
    let i = idx;
    while (i < queue.length && soldRef.current.has(queue[i].name)) i++;
    if (i >= queue.length) { setPhase("idle"); setNominated(null); return; }

    queueIdx.current = i + 1;
    const player = queue[i];
    setNominated(player);
    setBidValue(0);
    setLeadId(null);
    setPhase("revealing");

    setTimeout(() => {
      setBidValue(getTierBasePrice(player.credits));
      setPhase("bidding");
    }, REVEAL_MS);
  }

  function doNext() {
    setPhase("idle");
    setTimeout(() => advanceToNext(queueRef.current, queueIdx.current), 200);
  }

  function doSold() {
    if (!nominated || !leadTeam) return;
    soldRef.current.add(nominated.name);
    const tier = getPlayerTier(nominated.credits);
    const snap = teams.map(t => ({ ...t, squad: [...t.squad] }));
    setTeams(prev => prev.map(t =>
      t.id === leadId
        ? { ...t, budget: parseFloat((t.budget - bidValue).toFixed(2)), squad: [...t.squad, { ...nominated, price: bidValue, tier }] }
        : t
    ));
    setLog(prev => [{ player: nominated, status: "sold", winner: leadTeam.name, winnerColor: leadTeam.color, price: bidValue, tier, snapshot: snap }, ...prev]);
    setPhase("sold");
  }

  function doUnsold() {
    if (!nominated) return;
    const tier = getPlayerTier(nominated.credits);
    const snap = teams.map(t => ({ ...t, squad: [...t.squad] }));
    setLog(prev => [{ player: nominated, status: "unsold", tier, snapshot: snap }, ...prev]);
    setPhase("unsold");
  }

  function doUndo() {
    if (!log.length) return;
    const [last, ...rest] = log;
    if (last.status === "sold") soldRef.current.delete(last.player.name);
    setTeams(last.snapshot.map(t => ({ ...t, squad: [...t.squad] })));
    setLog(rest);
    // Step back queue
    queueIdx.current = Math.max(0, queueIdx.current - 1);
    setPhase("idle");
    setNominated(null);
    setLeadId(null);
  }

  // ── Centre stage ──────────────────────────────────────────────────
  function CentreStage() {

    if (roomStage === "prep") {
      return (
        <PrepStage mode={mode} onStart={startAuction} onSkip={startAuction} canStart={teams.length >= 2} teamCount={teams.length} />
      );
    }

    if (phase === "idle") {
      const done = queueIdx.current >= queueRef.current.length;
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1rem",
          textAlign: "center", padding: "2rem" }}>
          <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>
            {done ? "Auction Complete!" : "Loading next player…"}
          </h2>
          {done && (
            <p style={{ margin: 0, fontSize: "0.88rem", color: DIM }}>
              {log.filter(e => e.status === "sold").length} players sold ·{" "}
              {log.filter(e => e.status === "unsold").length} unsold
            </p>
          )}
        </div>
      );
    }

    if (phase === "revealing" && nominated) {
      const tc   = TEAM_COLOR[nominated.team] ?? "#aaa";
      const tier = getPlayerTier(nominated.credits);
      const td   = TD[tier];
      const wl   = loadWL();
      const isTarget = wl.includes(nominated.name);
      const progress = queueRef.current.length > 0
        ? Math.round((queueIdx.current / queueRef.current.length) * 100) : 0;

      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1rem",
          background: td.glow, position: "relative" }}>

          {/* Progress bar */}
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
            background: "rgba(255,255,255,0.08)" }}>
            <div style={{ height: "100%", width: `${progress}%`,
              background: td.color, transition: "width 0.4s" }} />
          </div>

          <motion.div initial={{ scale: 0.7, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            style={{ textAlign: "center" }}>

            <div style={{ marginBottom: "0.4rem" }}>
              <TierBadge tier={tier} size="lg" />
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: tc,
              letterSpacing: "0.1em", marginBottom: "0.4rem" }}>
              {nominated.team} · {TEAM_FULL_NAME[nominated.team]}
            </div>
            <div style={{ fontSize: "0.72rem", fontWeight: 800, letterSpacing: "0.12em",
              color: ROLE_COLOR[nominated.role] ?? "#aaa",
              background: `${ROLE_COLOR[nominated.role] ?? "#aaa"}18`,
              border: `1px solid ${ROLE_COLOR[nominated.role] ?? "#aaa"}40`,
              borderRadius: 6, padding: "3px 10px", display: "inline-block", marginBottom: "0.6rem" }}>
              {ROLE_LABEL[nominated.role] ?? nominated.role}
            </div>
            <h1 style={{ margin: 0, fontSize: "2.4rem", fontWeight: 900, color: "#fff",
              letterSpacing: "-0.04em", lineHeight: 1 }}>
              {nominated.name}
            </h1>
            {isTarget && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5,
                marginTop: "0.5rem", padding: "3px 10px",
                background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.35)",
                borderRadius: 20, fontSize: "0.72rem", color: "#f59e0b", fontWeight: 700 }}>
                <Star size={11} style={{ fill: "#f59e0b" }} /> Your watchlist target
              </div>
            )}
            <p style={{ margin: "0.4rem 0 0", fontSize: "0.85rem", color: DIM }}>
              {ROLE_LABEL[nominated.role]} · {nominated.credits}cr
              {!nominated.capped && " · Uncapped"}
            </p>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{ marginTop: "0.75rem", fontSize: "1.2rem", fontWeight: 900,
                color: td.color, fontFamily: "monospace" }}>
              Base Price: {crFmt(TIER_CONFIG[tier].basePrice)}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.55 }}
            transition={{ delay: 1.2 }}
            style={{ fontSize: "0.78rem", color: DIM }}>
            Bidding opens in a moment…
          </motion.div>

          <div style={{ position: "absolute", bottom: 12, right: 16,
            fontSize: "0.65rem", color: "rgba(255,255,255,0.2)" }}>
            {queueIdx.current}/{queueRef.current.length}
          </div>
        </div>
      );
    }

    if (phase === "bidding" && nominated) {
      const tc   = TEAM_COLOR[nominated.team] ?? "#aaa";
      const tier = getPlayerTier(nominated.credits);
      const td   = TD[tier];
      const cfg  = TIER_CONFIG[tier];
      const bidColor = leadTeam?.color ?? td.color;

      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          gap: "0.7rem", overflow: "hidden", padding: "0.75rem" }}>

          {/* Player card */}
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            style={{ background: leadTeam ? `${leadTeam.color}0c` : td.glow,
              border: `2px solid ${leadTeam ? `${leadTeam.color}50` : `${td.color}40`}`,
              borderRadius: 14, padding: "0.85rem 1rem",
              display: "flex", flexDirection: "column", alignItems: "center",
              position: "relative", overflow: "hidden", flexShrink: 0,
              transition: "border-color 0.25s, background 0.25s" }}>

            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3,
              background: td.color }} />
            <div style={{ position: "absolute", top: 9, left: 10 }}>
              <TierBadge tier={tier} size="sm" />
            </div>
            <div style={{ position: "absolute", top: 9, right: 10,
              fontSize: "0.6rem", fontWeight: 700, color: tc,
              background: `${tc}18`, padding: "2px 8px", borderRadius: 20 }}>
              {nominated.team}
            </div>

            <div style={{ width: 48, height: 48, borderRadius: "50%",
              background: `${tc}20`, border: `2px solid ${tc}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.04em",
              color: ROLE_COLOR[nominated.role] ?? "#aaa",
              marginBottom: "0.5rem", marginTop: "0.9rem" }}>
              {ROLE_ICON[nominated.role] ?? "BAT"}
            </div>
            <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#fff",
              textAlign: "center", lineHeight: 1.1 }}>{nominated.name}</p>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.7rem", color: DIM }}>
              {ROLE_LABEL[nominated.role]} · {nominated.credits}cr
              {!nominated.capped && " · UC"}
              {" "}· Base {crFmt(cfg.basePrice)} · +{crFmt(cfg.increment)} step
            </p>
          </motion.div>

          {/* ── Bid input — clean, no glitch ── */}
          <div style={{ background: CARD, border: `1px solid ${BDR}`,
            borderRadius: 12, padding: "0.85rem 0.9rem",
            display: "flex", flexDirection: "column", gap: "0.65rem", flexShrink: 0 }}>

            <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.12em",
              color: DIM, textTransform: "uppercase" }}>Current Bid</div>

            <BidInput
              value={bidValue}
              onChange={setBidValue}
              color={bidColor}
              basePrice={cfg.basePrice}
              increment={cfg.increment}
            />

            {/* Who bid */}
            <div>
              <div style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                color: DIM, textTransform: "uppercase", marginBottom: "0.32rem" }}>
                Who bid?
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.32rem" }}>
                {teams.map(team => {
                  const isLead = leadId === team.id;
                  const ok     = team.budget >= bidValue;
                  return (
                    <button key={team.id} onClick={() => ok && setLeadId(team.id)}
                      style={{ padding: "0.4rem 0.65rem", borderRadius: 9,
                        border: `1.5px solid ${isLead ? team.color : ok ? BDR : "rgba(255,255,255,0.03)"}`,
                        background: isLead ? `${team.color}20` : CARD,
                        color: isLead ? team.color : ok ? "#fff" : "rgba(255,255,255,0.18)",
                        fontWeight: isLead ? 800 : 500, fontSize: "0.75rem",
                        cursor: ok ? "pointer" : "not-allowed",
                        display: "flex", alignItems: "center", gap: "0.3rem",
                        transition: "all 0.15s" }}>
                      {isLead && <Crown size={9} style={{ flexShrink: 0 }} />}
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {team.name.split("'")[0]}
                      </span>
                      <span style={{ marginLeft: "auto", fontSize: "0.6rem",
                        opacity: 0.5, fontFamily: "monospace" }}>
                        {crFmt(team.budget)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: "0.45rem" }}>
              <button onClick={doSold} disabled={!leadTeam || bidValue <= 0}
                style={{ flex: 1, padding: "0.75rem", borderRadius: 11, border: "none",
                  background: (leadTeam && bidValue > 0) ? "#16a34a" : "rgba(22,163,74,0.12)",
                  color: (leadTeam && bidValue > 0) ? "#fff" : "rgba(255,255,255,0.2)",
                  fontWeight: 800, fontSize: "0.88rem",
                  cursor: (leadTeam && bidValue > 0) ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
                <CheckCircle size={15} />
                {leadTeam && bidValue > 0 ? `Sold — ${crFmt(bidValue)}` : "Sold"}
              </button>
              <button onClick={doUnsold}
                style={{ padding: "0.75rem 1rem", borderRadius: 11,
                  border: `1px solid ${BDR}`, background: CARD,
                  color: DIM, fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <XCircle size={12} /> Unsold
              </button>
            </div>

            <p style={{ margin: 0, fontSize: "0.6rem", color: "rgba(255,255,255,0.18)", textAlign: "center" }}>
              <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace" }}>Space</kbd> +{crFmt(cfg.increment)} ·{" "}
              <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "1px 4px", borderRadius: 3, fontFamily: "monospace" }}>Enter</kbd> confirm sold
            </p>
          </div>
        </div>
      );
    }

    if (phase === "sold" && nominated && leadTeam) {
      const tier = getPlayerTier(nominated.credits);
      const td   = TD[tier];
      return (
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.6rem" }}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            style={{ width: 64, height: 64, borderRadius: "50%",
              background: "rgba(34,197,94,0.12)", border: "2px solid rgba(34,197,94,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={30} style={{ color: "#22c55e" }} />
          </motion.div>
          <TierBadge tier={tier} size="lg" />
          <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#fff",
            textAlign: "center", lineHeight: 1.15 }}>
            {nominated.name}
          </p>
          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: leadTeam.color }}>
            → {leadTeam.name}
          </p>
          <p style={{ margin: 0, fontSize: "2.5rem", fontWeight: 900,
            color: "#22c55e", fontFamily: "monospace" }}>
            {crFmt(bidValue)}
          </p>
          {bidValue > TIER_CONFIG[tier].basePrice && (
            <p style={{ margin: 0, fontSize: "0.72rem", color: DIM }}>
              {crFmt(parseFloat((bidValue - TIER_CONFIG[tier].basePrice).toFixed(2)))} above base
            </p>
          )}
          <button onClick={doNext}
            style={{ marginTop: "0.5rem", padding: "0.8rem 2rem",
              background: ACCENT, border: "none", borderRadius: 12,
              color: "#fff", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.5rem" }}>
            Next Player <ChevronRight size={15} />
          </button>
        </motion.div>
      );
    }

    if (phase === "unsold" && nominated) {
      const tier = getPlayerTier(nominated.credits);
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.55rem" }}>
          <XCircle size={52} style={{ color: "#ef4444" }} />
          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "rgba(255,255,255,0.5)" }}>
            {nominated.name}
          </p>
          <TierBadge tier={tier} size="sm" />
          <p style={{ margin: "0.1rem 0 0", fontSize: "0.82rem", color: "rgba(255,255,255,0.3)" }}>
            Unsold — continues in pool
          </p>
          <button onClick={doNext}
            style={{ marginTop: "0.4rem", padding: "0.75rem 1.8rem",
              background: ACCENT, border: "none", borderRadius: 12,
              color: "#fff", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}>
            Next Player
          </button>
        </motion.div>
      );
    }

    return null;
  }

  // ── Log row ──────────────────────────────────────────────────────
  function LogRow({ entry }: { entry: LogEntry }) {
    const td = TD[entry.tier];
    return (
      <div style={{ background: CARD,
        border: `1px solid ${entry.status === "sold" ? `${entry.winnerColor}25` : BDR}`,
        borderRadius: 10, padding: "0.55rem 0.75rem", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#fff" }}>{entry.player.name}</span>
          {entry.status === "sold"
            ? <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#22c55e", fontFamily: "monospace" }}>{crFmt(entry.price!)}</span>
            : <span style={{ fontSize: "0.62rem", color: "#ef4444", fontWeight: 700 }}>UNSOLD</span>}
        </div>
        {entry.status === "sold" && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.28rem", marginTop: "0.1rem" }}>
            <Crown size={9} style={{ color: entry.winnerColor }} />
            <span style={{ fontSize: "0.65rem", color: entry.winnerColor, fontWeight: 600 }}>{entry.winner}</span>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.28rem", marginTop: "0.28rem", flexWrap: "wrap" }}>
          <span style={{ fontSize: "0.56rem", color: TEAM_COLOR[entry.player.team] ?? "#aaa",
            background: `${TEAM_COLOR[entry.player.team] ?? "#aaa"}18`,
            padding: "1px 4px", borderRadius: 3 }}>{entry.player.team}</span>
          <span style={{ fontSize: "0.56rem", color: ROLE_COLOR[entry.player.role] ?? "#aaa",
            background: `${ROLE_COLOR[entry.player.role] ?? "#aaa"}15`,
            padding: "1px 4px", borderRadius: 3 }}>{ROLE_LABEL[entry.player.role]}</span>
          <span style={{ fontSize: "0.56rem", color: td.color, background: `${td.color}15`,
            padding: "1px 4px", borderRadius: 3 }}>{td.label}</span>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────
  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem", height: "100%", minHeight: 0 }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
          flexShrink: 0, gap: "0.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", minWidth: 0 }}>
            <button onClick={() => navigate("/auction")}
              style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 9,
                padding: "0.38rem 0.65rem", color: DIM, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.3rem",
                fontSize: "0.78rem", fontWeight: 600, flexShrink: 0 }}>
              <ArrowLeft size={12} />
              <span className="hidden sm:inline">Back</span>
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.15em",
                  textTransform: "uppercase", color: ACCENT }}>Verbal Auction</span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700,
                  color: mode === "tier" ? "#e8a020" : DIM,
                  background: mode === "tier" ? "rgba(232,160,32,0.12)" : "rgba(255,255,255,0.06)",
                  border: `1px solid ${mode === "tier" ? "rgba(232,160,32,0.25)" : BDR}`,
                  padding: "1px 7px", borderRadius: 20 }}>
                  {mode === "tier" ? "Tier" : "Classic"}
                </span>
                <span style={{ fontSize: "0.62rem", fontWeight: 700,
                  color: "#34d399", background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.22)",
                  padding: "1px 7px", borderRadius: 20 }}>
                  ₹{startBudget}Cr each
                </span>
                {roomStage === "prep" && (
                  <span style={{ fontSize: "0.62rem", fontWeight: 700,
                    color: "#818cf8", background: "rgba(129,140,248,0.12)",
                    border: "1px solid rgba(129,140,248,0.25)",
                    padding: "1px 7px", borderRadius: 20 }}>
                    Prep
                  </span>
                )}
              </div>
              <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#fff",
                letterSpacing: "-0.03em", lineHeight: 1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {config.name || "Auction Room"}
              </h1>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
            {/* Watchlist button always available */}
            <button onClick={() => setShowWL(true)}
              style={{ display: "flex", alignItems: "center", gap: "0.28rem",
                padding: "0.38rem 0.65rem", background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)", borderRadius: 9,
                color: "#f59e0b", fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
              <Star size={11} style={{ fill: "#f59e0b" }} />
              <span className="hidden sm:inline">Watchlist</span>
            </button>

            {/* Undo */}
            {log.length > 0 && roomStage === "auction" && (
              <button onClick={doUndo}
                style={{ display: "flex", alignItems: "center", gap: "0.28rem",
                  padding: "0.38rem 0.65rem", background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${BDR}`, borderRadius: 9,
                  color: DIM, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                <RotateCcw size={10} />
                <span className="hidden sm:inline">Undo</span>
              </button>
            )}

            {/* Copy log */}
            {log.length > 0 && (
              <button onClick={() => navigator.clipboard?.writeText(
                log.map(e => e.status === "sold"
                  ? `[${TD[e.tier].label}] ${e.player.name} → ${e.winner} ${crFmt(e.price!)}`
                  : `[${TD[e.tier].label}] ${e.player.name} → UNSOLD`
                ).join("\n")
              )}
                style={{ display: "flex", alignItems: "center", gap: "0.28rem",
                  padding: "0.38rem 0.65rem", background: "rgba(255,255,255,0.05)",
                  border: `1px solid ${BDR}`, borderRadius: 9,
                  color: DIM, fontSize: "0.7rem", fontWeight: 600, cursor: "pointer" }}>
                <Copy size={10} />
                <span className="hidden sm:inline">Log</span>
              </button>
            )}

            {/* Live badge */}
            {roomStage === "auction" && (
              <div style={{ padding: "0.28rem 0.7rem", background: "rgba(34,197,94,0.1)",
                border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20,
                display: "flex", alignItems: "center", gap: "0.32rem" }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                  animation: "livePulse 1.4s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#22c55e" }}>
                  {remaining} left
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── DESKTOP 3-col ── */}
        <div className="hidden md:grid"
          style={{ gridTemplateColumns: "220px 1fr 250px", gap: "0.8rem",
            flex: 1, minHeight: 0, overflow: "hidden" }}>

          {/* Left: teams */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
            <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700,
              letterSpacing: "0.12em", color: DIM, textTransform: "uppercase" }}>Teams</p>
            {!teamsLoaded && (
              <div style={{ padding: "1rem 0", textAlign: "center", color: DIM, fontSize: "0.75rem" }}>
                Loading…
              </div>
            )}
            {teamsLoaded && teams.length === 0 && (
              <div style={{ background: CARD, border: `1px dashed ${BDR}`, borderRadius: 12,
                padding: "1.25rem 0.85rem", textAlign: "center" }}>
                <Users size={20} style={{ color: DIM, marginBottom: "0.5rem" }} />
                <p style={{ margin: 0, fontSize: "0.78rem", color: DIM }}>
                  Waiting for teams to join
                </p>
                <p style={{ margin: "0.3rem 0 0", fontSize: "0.68rem", color: "rgba(255,255,255,0.18)" }}>
                  Share the room code so others can join
                </p>
              </div>
            )}
            {teams.map(team => {
              const isLead = leadId === team.id;
              const ok     = phase === "bidding" && team.budget >= bidValue;
              return (
                <div key={team.id}
                  onClick={() => ok && setLeadId(team.id)}
                  style={{ background: isLead ? `${team.color}12` : CARD,
                    border: `1.5px solid ${isLead ? team.color : BDR}`,
                    borderRadius: 12, padding: "0.7rem 0.8rem",
                    cursor: ok ? "pointer" : "default",
                    opacity: phase === "bidding" && !ok ? 0.38 : 1,
                    transition: "all 0.18s" }}>
                  <BudgetBar team={team} startBudget={startBudget} />
                  {ok && (
                    <div style={{ display: "flex", gap: "0.28rem", marginTop: "0.45rem" }}>
                      {[1, 2, 4, 8].map(mult => {
                        const delta = parseFloat((TIER_CONFIG[getPlayerTier(nominated?.credits ?? 8)].increment * mult).toFixed(2));
                        const nxt   = parseFloat((bidValue + delta).toFixed(2));
                        const can   = team.budget >= nxt;
                        return (
                          <button key={mult}
                            onMouseDown={e => { e.stopPropagation(); if (can) { setLeadId(team.id); setBidValue(nxt); } }}
                            style={{ flex: 1, padding: "0.22rem 0", borderRadius: 5,
                              border: `1px solid ${can ? `${team.color}40` : BDR}`,
                              background: can ? `${team.color}14` : "transparent",
                              color: can ? team.color : "rgba(255,255,255,0.15)",
                              fontSize: "0.58rem", fontWeight: 700,
                              cursor: can ? "pointer" : "not-allowed" }}>
                            +{crFmt(delta)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {isLead && phase === "bidding" && (
                    <div style={{ marginTop: "0.32rem", fontSize: "0.63rem",
                      color: team.color, fontWeight: 700,
                      display: "flex", alignItems: "center", gap: "0.22rem" }}>
                      <Crown size={9} /> {crFmt(bidValue)}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Squads */}
            {roomStage === "auction" && (
              <>
                <p style={{ margin: "0.35rem 0 0", fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.12em", color: DIM, textTransform: "uppercase" }}>Squads</p>
                {teams.map(team => (
                  <div key={team.id} style={{ background: CARD, border: `1px solid ${BDR}`,
                    borderRadius: 10, overflow: "hidden", marginBottom: "0.35rem" }}>
                    <div onClick={() => setExpTeam(expandedTeam === team.id ? null : team.id)}
                      style={{ padding: "0.55rem 0.75rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        borderBottom: expandedTeam === team.id ? `1px solid ${BDR}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.38rem" }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: team.color }} />
                        <span style={{ fontSize: "0.73rem", fontWeight: 700, color: "#fff" }}>
                          {team.name.split("'")[0]}
                        </span>
                      </div>
                      <span style={{ fontSize: "0.6rem", color: DIM }}>
                        {team.squad.length}p · {crFmt(team.budget)}
                      </span>
                    </div>
                    <AnimatePresence>
                      {expandedTeam === team.id && (
                        <motion.div initial={{ height: 0 }} animate={{ height: "auto" }}
                          exit={{ height: 0 }} transition={{ duration: 0.18 }}
                          style={{ overflow: "hidden" }}>
                          <div style={{ padding: "0.38rem 0.55rem", maxHeight: 180, overflowY: "auto",
                            display: "flex", flexDirection: "column", gap: "0.22rem" }}>
                            {team.squad.length === 0
                              ? <span style={{ fontSize: "0.67rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>Empty</span>
                              : team.squad.map((p, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.38rem",
                                  padding: "0.22rem 0.38rem", borderRadius: 6, background: "rgba(255,255,255,0.03)" }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: TD[p.tier].color, display: "inline-block", flexShrink: 0 }} />
                                  <span style={{ fontSize: "0.68rem", color: "#fff", flex: 1,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {p.name}
                                  </span>
                                  <span style={{ fontSize: "0.6rem", color: DIM, fontFamily: "monospace" }}>
                                    {crFmt(p.price)}
                                  </span>
                                </div>
                              ))
                            }
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Centre */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden",
            background: "rgba(255,255,255,0.02)", border: `1px solid ${BDR}`, borderRadius: 16 }}>
            <CentreStage />
          </div>

          {/* Right: budgets + log */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", overflowY: "auto" }}>
            {teams.length > 0 && (
              <div style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 11,
                padding: "0.7rem 0.8rem", flexShrink: 0 }}>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.58rem", fontWeight: 700,
                  letterSpacing: "0.12em", color: DIM, textTransform: "uppercase" }}>Budgets</p>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                  {teams.map(t => <BudgetBar key={t.id} team={t} mini startBudget={startBudget} />)}
                </div>
              </div>
            )}
            <p style={{ margin: 0, fontSize: "0.58rem", fontWeight: 700,
              letterSpacing: "0.12em", color: DIM, textTransform: "uppercase", flexShrink: 0 }}>
              Log ({log.length})
            </p>
            {log.length === 0
              ? <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No sales yet</p>
              : log.map((e, i) => <LogRow key={i} entry={e} />)
            }
          </div>
        </div>

        {/* ── MOBILE ── */}
        <div className="md:hidden flex-1 flex flex-col min-h-0 overflow-hidden gap-3">
          <div style={{ display: "flex", gap: "0.38rem", flexShrink: 0 }}>
            {(([["stage", "Stage"], ["teams", "Teams"], ["log", `Log${log.length > 0 ? ` (${log.length})` : ""}`]]) as [MobileTab, string][])
              .map(([tab, lbl]) => (
                <button key={tab} onClick={() => setMobileTab(tab)}
                  style={{ flex: 1, padding: "0.42rem", borderRadius: 9,
                    border: `1px solid ${mobileTab === tab ? "rgba(255,255,255,0.2)" : BDR}`,
                    background: mobileTab === tab ? "rgba(255,255,255,0.1)" : CARD,
                    color: mobileTab === tab ? "#fff" : DIM,
                    fontSize: "0.78rem", fontWeight: 600, cursor: "pointer" }}>
                  {lbl}
                </button>
              ))}
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column",
            background: mobileTab === "stage" ? "rgba(255,255,255,0.02)" : "transparent",
            border: mobileTab === "stage" ? `1px solid ${BDR}` : "none",
            borderRadius: mobileTab === "stage" ? 14 : 0 }}>
            {mobileTab === "stage" && <CentreStage />}
            {mobileTab === "teams" && (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {teamsLoaded && teams.length === 0 && (
                  <div style={{ margin: "2rem auto", textAlign: "center" }}>
                    <Users size={22} style={{ color: DIM, marginBottom: "0.5rem" }} />
                    <p style={{ margin: 0, fontSize: "0.82rem", color: DIM }}>Waiting for teams to join</p>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.2)" }}>
                      Share the room code so others can join
                    </p>
                  </div>
                )}
                {teams.map(team => {
                  const isLead = leadId === team.id;
                  const ok     = phase === "bidding" && team.budget >= bidValue;
                  return (
                    <div key={team.id} onClick={() => ok && setLeadId(team.id)}
                      style={{ background: isLead ? `${team.color}12` : CARD,
                        border: `1.5px solid ${isLead ? team.color : BDR}`,
                        borderRadius: 12, padding: "0.85rem",
                        cursor: ok ? "pointer" : "default",
                        opacity: phase === "bidding" && !ok ? 0.38 : 1 }}>
                      <BudgetBar team={team} startBudget={startBudget} />
                      {isLead && phase === "bidding" && (
                        <div style={{ marginTop: "0.38rem", fontSize: "0.68rem",
                          color: team.color, fontWeight: 700,
                          display: "flex", alignItems: "center", gap: "0.28rem" }}>
                          <Crown size={10} /> Leading — {crFmt(bidValue)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {mobileTab === "log" && (
              <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {log.length === 0
                  ? <p style={{ textAlign: "center", padding: "2rem", fontSize: "0.82rem",
                      color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No sales yet</p>
                  : log.map((e, i) => <LogRow key={i} entry={e} />)
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Watchlist overlay */}
      <AnimatePresence>
        {showWL && <WatchlistPanel onClose={() => setShowWL(false)} />}
      </AnimatePresence>

      <style>{`
        @keyframes livePulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
      `}</style>
    </Layout>
  );
}
