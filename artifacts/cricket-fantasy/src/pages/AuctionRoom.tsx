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
  ArrowLeft, Gavel, XCircle, Crown, Search,
  ChevronDown, ChevronUp, RotateCcw, Plus, Minus,
  Copy, TriangleAlert, Star, Users, Play,
  SkipForward, BookOpen, ChevronRight, Trophy, Ban,
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
import { useApp } from "@/context/AppContext";

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

function buildQueue(mode: AuctionMode, excl: string[] = []): Player[] {
  const pool = excl.length
    ? ALL_IPL_2026_PLAYERS.filter(p => !excl.includes(p.name))
    : [...ALL_IPL_2026_PLAYERS];
  if (mode === "classic") return shuffle([...pool]);
  return TIER_ORDER.flatMap(tier =>
    shuffle(pool.filter(p => getPlayerTier(p.credits) === tier))
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

// ── Player Pool Panel (host-only exclusion manager) ───────────────────
function PlayerPoolPanel({ excluded, onToggle, onClose }: {
  excluded: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState("");
  const [roleF, setRoleF]   = useState("ALL");
  const [tierF, setTierF]   = useState("ALL");

  const filtered = useMemo(() =>
    ALL_IPL_2026_PLAYERS
      .filter(p =>
        (roleF === "ALL" || p.role === roleF) &&
        (tierF === "ALL" || getPlayerTier(p.credits) === tierF) &&
        (!search || p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.team.toLowerCase().includes(search.toLowerCase()))
      )
      .sort((a, b) => b.credits - a.credits),
    [search, roleF, tierF]
  );

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
        style={{ width: "100%", maxWidth: 600, maxHeight: "90vh",
          background: "rgba(8,9,18,0.99)", border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column",
          boxShadow: "0 30px 80px rgba(0,0,0,0.7)" }}>

        {/* Header */}
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff",
              display: "flex", alignItems: "center", gap: 7 }}>
              <Ban size={15} style={{ color: "#ef4444" }} />
              Manage Player Pool
            </span>
            <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: DIM }}>
              {ALL_IPL_2026_PLAYERS.length - excluded.length} of {ALL_IPL_2026_PLAYERS.length} players in auction
              {excluded.length > 0 && <span style={{ color: "#ef4444", marginLeft: 8 }}>· {excluded.length} excluded</span>}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer",
              color: DIM, fontSize: "1.1rem" }}>✕</button>
        </div>

        {/* Filters */}
        <div style={{ padding: "0.6rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: 6, flexWrap: "wrap", background: "rgba(255,255,255,0.02)" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 140 }}>
            <Search style={{ position: "absolute", left: "0.7rem", top: "50%",
              transform: "translateY(-50%)", width: 12, height: 12, color: DIM, pointerEvents: "none" }} />
            <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
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
          {["ALL", "T1", "T2", "T3", "T4"].map(t => {
            const tdObj = t === "ALL" ? null : TD[t as PlayerTier];
            return (
              <button key={t} onClick={() => setTierF(t)}
                style={{ padding: "0.3rem 0.55rem", borderRadius: 6, fontSize: "0.67rem",
                  fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${tierF === t ? (tdObj?.color ?? "rgba(255,255,255,0.2)") : BDR}`,
                  background: tierF === t ? (tdObj ? `${tdObj.color}18` : "rgba(255,255,255,0.1)") : CARD,
                  color: tierF === t ? (tdObj?.color ?? "#fff") : DIM }}>
                {t === "ALL" ? "All Tiers" : tdObj?.label ?? t}
              </button>
            );
          })}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {filtered.map((p, i) => {
            const tc  = TEAM_COLOR[p.team] ?? "#aaa";
            const tier = getPlayerTier(p.credits);
            const td  = TD[tier];
            const isExcluded = excluded.includes(p.name);
            return (
              <div key={i} onClick={() => onToggle(p.name)}
                style={{ display: "flex", alignItems: "center", gap: 10,
                  padding: "0.58rem 1.25rem", cursor: "pointer",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: isExcluded ? "rgba(239,68,68,0.06)" : "transparent",
                  opacity: isExcluded ? 0.55 : 1,
                  transition: "all 0.12s" }}>
                <div style={{ width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                  border: `1.5px solid ${isExcluded ? "#ef4444" : "rgba(255,255,255,0.2)"}`,
                  background: isExcluded ? "rgba(239,68,68,0.2)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {isExcluded && <span style={{ fontSize: "0.6rem", color: "#ef4444" }}>✕</span>}
                </div>
                <span style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.04em",
                  color: ROLE_COLOR[p.role] ?? "#aaa", flexShrink: 0,
                  width: 26, textAlign: "center" }}>
                  {ROLE_ICON[p.role] ?? "BAT"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem",
                    color: isExcluded ? "rgba(255,255,255,0.35)" : "#fff",
                    textDecoration: isExcluded ? "line-through" : "none",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 1 }}>
                    <span style={{ fontSize: "0.65rem", fontWeight: 700, color: tc }}>{p.team}</span>
                    <span style={{ fontSize: "0.6rem", color: td.color,
                      background: `${td.color}15`, padding: "1px 5px", borderRadius: 3 }}>
                      {td.label}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: isExcluded ? DIM : td.color,
                    fontFamily: "monospace" }}>
                    {p.credits}cr
                  </div>
                  <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.2)" }}>
                    Base {crFmt(getTierBasePrice(p.credits))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        {excluded.length > 0 && (
          <div style={{ padding: "0.75rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            background: "rgba(239,68,68,0.05)" }}>
            <span style={{ fontSize: "0.75rem", color: "#ef4444", fontWeight: 600 }}>
              {excluded.length} players excluded from auction pool
            </span>
            <button onClick={() => excluded.forEach(n => onToggle(n))}
              style={{ padding: "0.35rem 0.85rem", borderRadius: 8, fontSize: "0.72rem",
                fontWeight: 600, cursor: "pointer", background: "transparent",
                border: "1px solid rgba(239,68,68,0.4)", color: "#ef4444" }}>
              Clear all
            </button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Prep Stage ───────────────────────────────────────────────────────
function PrepStage({ mode, onStart, onSkip, canStart, teamCount, excluded, onToggleExclude }: {
  mode: AuctionMode; onStart: () => void; onSkip: () => void; canStart: boolean; teamCount: number;
  excluded: string[]; onToggleExclude: (name: string) => void;
}) {
  const [showWL, setShowWL] = useState(false);
  const [showPool, setShowPool] = useState(false);
  const wl = loadWL();

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

      {/* Watchlist + Pool buttons */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button onClick={() => setShowWL(true)}
            style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "0.75rem 1.4rem", background: "rgba(245,158,11,0.15)",
              border: "1px solid rgba(245,158,11,0.35)", borderRadius: 12,
              color: "#f59e0b", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
              transition: "all 0.15s" }}>
            <Star size={15} style={{ fill: "#f59e0b" }} />
            Watchlist
            {wl.length > 0 && (
              <span style={{ background: "#f59e0b", color: "#000", borderRadius: 20,
                fontSize: "0.63rem", fontWeight: 800, padding: "0 6px" }}>
                {wl.length}
              </span>
            )}
          </button>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.22)" }}>Star your targets</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
          <button onClick={() => setShowPool(true)}
            style={{ display: "flex", alignItems: "center", gap: 8,
              padding: "0.75rem 1.4rem",
              background: excluded.length > 0 ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
              border: `1px solid ${excluded.length > 0 ? "rgba(239,68,68,0.4)" : BDR}`,
              borderRadius: 12,
              color: excluded.length > 0 ? "#ef4444" : DIM,
              fontWeight: 700, fontSize: "0.88rem", cursor: "pointer",
              transition: "all 0.15s" }}>
            <Ban size={15} />
            Manage Pool
            {excluded.length > 0 && (
              <span style={{ background: "#ef4444", color: "#fff", borderRadius: 20,
                fontSize: "0.63rem", fontWeight: 800, padding: "0 6px" }}>
                {excluded.length} out
              </span>
            )}
          </button>
          <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.22)" }}>Exclude players</span>
        </div>
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
        {showPool && (
          <PlayerPoolPanel
            excluded={excluded}
            onToggle={onToggleExclude}
            onClose={() => setShowPool(false)}
          />
        )}
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
  const { myAuctions, addAuction } = useApp();

  // Load settings saved by CreateAuction (or JoinAuction)
  const config = useMemo(() => loadAuctionConfig(), []);
  const startBudget = config.budget;

  // Host vs member determination
  const isHost = config.roomCode
    ? !!localStorage.getItem("colosseum_is_host_" + config.roomCode)
    : true; // No room code = solo session, acts as host

  const savedMode = (typeof sessionStorage !== "undefined"
    ? sessionStorage.getItem("auction_mode") : null) as AuctionMode | null;
  const [mode] = useState<AuctionMode>(savedMode ?? config.format ?? "classic");

  // Excluded players (host-managed before auction starts)
  const [excluded, setExcluded] = useState<string[]>([]);
  function toggleExclude(name: string) {
    setExcluded(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

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
  const [mobileTab, setMobileTab]  = useState<MobileTab>("stage");
  const [showWL, setShowWL]        = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(!config.roomCode); // true immediately if no roomCode

  // Real-time: WebSocket for live sync
  const wsRef           = useRef<WebSocket | null>(null);
  const reconnectRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wsConnected, setWsConnected]     = useState(false);
  const [memberCount,  setMemberCount]    = useState(0);
  const [memberRemaining, setMemberRemaining] = useState(0);

  const leadTeam  = teams.find(t => t.id === leadId) ?? null;
  const remaining = isHost
    ? queueRef.current.length - queueIdx.current
    : memberRemaining;

  // ── Register this league in Profile on first mount ───────────────
  useEffect(() => {
    if (!config.roomCode) return;
    const alreadyAdded = myAuctions.some(a => a.code === config.roomCode);
    if (alreadyAdded) return;
    const isHost = !!localStorage.getItem("colosseum_is_host_" + config.roomCode);
    addAuction({
      id:             config.roomCode,
      name:           config.name || "Auction Room",
      code:           config.roomCode,
      format:         config.format ?? "classic",
      budget:         config.budget,
      squadSize:      config.maxPlayers,
      captainVC:      config.captainVC,
      tradeWindow:    false,
      captainChanges: false,
      status:         "lobby",
      role:           isHost ? "host" : "member",
      participants:   0,
      playersLeft:    ALL_IPL_2026_PLAYERS.length,
      createdAt:      new Date().toISOString(),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Init: load saved state (rejoin) or fallback to API teams ────────
  useEffect(() => {
    const roomCode = config.roomCode;
    if (!roomCode) { setTeamsLoaded(true); return; }

    (async () => {
      // Try saved state first — restores full auction snapshot on rejoin
      try {
        const stateRes = await apiFetch(`/auction/rooms/${roomCode}/state`);
        if (stateRes.ok) {
          const { stateJson } = await stateRes.json() as { stateJson: string };
          if (stateJson) {
            const snap = JSON.parse(stateJson) as {
              queue?: Player[]; queueIdx?: number; soldPlayers?: string[];
              teams?: AucTeam[]; log?: LogEntry[]; phase?: AucPhase;
              nominated?: Player | null; bidValue?: number; leadId?: string | null;
              roomStage?: string; excludedPlayers?: string[];
            };
            if (snap.queue?.length) queueRef.current = snap.queue;
            if (typeof snap.queueIdx === "number") queueIdx.current = snap.queueIdx;
            if (snap.soldPlayers) soldRef.current = new Set(snap.soldPlayers);
            if (snap.teams?.length) setTeams(snap.teams);
            if (snap.log) setLog(snap.log.map(e => ({ ...e, snapshot: [] as AucTeam[] })));
            if (snap.phase) setPhase(snap.phase);
            if (snap.nominated !== undefined) setNominated(snap.nominated);
            if (typeof snap.bidValue === "number") setBidValue(snap.bidValue);
            if (snap.leadId !== undefined) setLeadId(snap.leadId);
            if (snap.roomStage === "auction") setRoomStage("auction");
            if (snap.excludedPlayers) setExcluded(snap.excludedPlayers);
            setTeamsLoaded(true);
            return; // State restored — skip API teams fetch
          }
        }
      } catch { /* no saved state yet */ }

      // No saved state — load teams from API
      try {
        const r = await apiFetch(`/auction/rooms/${roomCode}/teams`);
        if (r.ok) {
          const data = await r.json() as { teams: RegisteredTeam[] };
          if (data?.teams) setTeams(makeInitTeams(startBudget, data.teams));
        }
      } catch { /* keep empty */ }
      setTeamsLoaded(true);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.roomCode, startBudget]);

  // ── WebSocket: connect and maintain live sync ─────────────────────
  useEffect(() => {
    const roomCode = config.roomCode;
    if (!roomCode) return;

    function connect() {
      const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
      const url   = `${proto}//${window.location.host}/api/ws/auction?room=${roomCode}${isHost ? "&host=1" : ""}`;
      const ws    = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen  = () => setWsConnected(true);
      ws.onclose = () => {
        setWsConnected(false);
        reconnectRef.current = setTimeout(connect, 3000);
      };
      ws.onerror = () => {};

      ws.onmessage = (evt) => {
        try {
          const msg = JSON.parse(evt.data as string) as { type: string; payload?: any; members?: number };
          if (msg.type === "presence" && msg.members !== undefined) {
            setMemberCount(msg.members);
          }
          if (!isHost && msg.type === "state" && msg.payload) {
            const s = msg.payload;
            if (s.roomStage !== undefined) setRoomStage(s.roomStage);
            if (s.phase     !== undefined) setPhase(s.phase);
            if (s.nominated !== undefined) setNominated(s.nominated);
            if (s.bidValue  !== undefined) setBidValue(s.bidValue);
            if (s.leadId    !== undefined) setLeadId(s.leadId);
            if (s.teams     !== undefined) { setTeams(s.teams); setTeamsLoaded(true); }
            if (s.log       !== undefined) setLog(s.log);
            if (s.remaining !== undefined) setMemberRemaining(s.remaining);
            if (s.queueIdx  !== undefined) { queueIdx.current = s.queueIdx; }
            if (s.excluded  !== undefined) setExcluded(s.excluded);
          }
        } catch { /* ignore */ }
      };
    }

    connect();
    return () => {
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.roomCode]);

  // ── WebSocket: host broadcasts state on every relevant change ─────
  useEffect(() => {
    if (!isHost || !config.roomCode) return;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const snap = {
      roomStage,
      phase,
      nominated,
      bidValue,
      leadId,
      teams,
      log: log.map(({ snapshot: _s, ...rest }) => rest),
      queueIdx:  queueIdx.current,
      remaining: queueRef.current.length - queueIdx.current,
      excluded,
      maxPlayers: config.maxPlayers,
    };
    ws.send(JSON.stringify({ type: "state", payload: snap }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomStage, phase, nominated, bidValue, leadId, teams, log]);

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

  // ── Persist state to DB ───────────────────────────────────────────
  async function saveSnap(overrides: {
    teams?: AucTeam[]; log?: LogEntry[]; phase?: AucPhase;
    nominated?: Player | null; bidValue?: number; leadId?: string | null;
    roomStage?: RoomStage; excl?: string[];
  } = {}) {
    const roomCode = config.roomCode;
    if (!roomCode) return;
    const snap = {
      queue:          queueRef.current,
      queueIdx:       queueIdx.current,
      soldPlayers:    Array.from(soldRef.current),
      teams:          overrides.teams          ?? teams,
      log:            (overrides.log           ?? log).map(({ snapshot: _s, ...rest }) => ({ ...rest, snapshot: [] })),
      phase:          overrides.phase          ?? phase,
      nominated:      overrides.nominated      !== undefined ? overrides.nominated : nominated,
      bidValue:       overrides.bidValue       ?? bidValue,
      leadId:         overrides.leadId         !== undefined ? overrides.leadId : leadId,
      roomStage:      overrides.roomStage      ?? roomStage,
      excludedPlayers: overrides.excl          ?? excluded,
    };
    try {
      await apiFetch(`/auction/rooms/${roomCode}/state`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stateJson: JSON.stringify(snap) }),
      });
    } catch { /* non-fatal */ }
  }

  // ── Complete auction (host-only) ──────────────────────────────────
  async function doComplete() {
    const roomCode = config.roomCode;
    const finalSnap = {
      queue:           queueRef.current,
      queueIdx:        queueIdx.current,
      soldPlayers:     Array.from(soldRef.current),
      teams,
      log:             log.map(({ snapshot: _s, ...rest }) => ({ ...rest, snapshot: [] })),
      phase,
      nominated,
      bidValue,
      leadId,
      roomStage:       "auction",
      excludedPlayers: excluded,
      completedAt:     Date.now(),
    };
    try {
      if (roomCode) {
        await apiFetch(`/auction/rooms/${roomCode}/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stateJson: JSON.stringify(finalSnap) }),
        });
      }
    } catch { /* navigate anyway */ }
    navigate("/auction/complete");
  }

  // ── Start auction — build queue ────────────────────────────────────
  function startAuction() {
    queueRef.current = buildQueue(mode, excluded);
    queueIdx.current = 0;
    setRoomStage("auction");
    saveSnap({ roomStage: "auction", excl: excluded });
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
    const snapTeams = teams.map(t => ({ ...t, squad: [...t.squad] }));
    const newTeams = teams.map(t =>
      t.id === leadId
        ? { ...t, budget: parseFloat((t.budget - bidValue).toFixed(2)), squad: [...t.squad, { ...nominated, price: bidValue, tier }] }
        : t
    );
    const newEntry: LogEntry = { player: nominated, status: "sold", winner: leadTeam.name, winnerColor: leadTeam.color, price: bidValue, tier, snapshot: snapTeams };
    const newLog = [newEntry, ...log];
    setTeams(newTeams);
    setLog(newLog);
    setPhase("sold");
    saveSnap({ teams: newTeams, log: newLog, phase: "sold" });
  }

  function doUnsold() {
    if (!nominated) return;
    const tier = getPlayerTier(nominated.credits);
    const snapTeams = teams.map(t => ({ ...t, squad: [...t.squad] }));
    const newEntry: LogEntry = { player: nominated, status: "unsold", tier, snapshot: snapTeams };
    const newLog = [newEntry, ...log];
    setLog(newLog);
    setPhase("unsold");
    saveSnap({ log: newLog, phase: "unsold" });
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
      if (!isHost) {
        return (
          <div style={{ flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "1rem",
            textAlign: "center", padding: "2rem" }}>
            <div style={{ width: 56, height: 56, borderRadius: "50%",
              background: "rgba(129,140,248,0.12)", border: "1px solid rgba(129,140,248,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={24} style={{ color: "#818cf8" }} />
            </div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: "#fff" }}>
              Waiting for host to start
            </h2>
            <p style={{ margin: 0, fontSize: "0.85rem", color: DIM, maxWidth: 300 }}>
              You have joined the room. The auction will begin shortly when the host starts it.
            </p>
            {teams.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginTop: "0.5rem" }}>
                {teams.map(t => (
                  <span key={t.id} style={{ padding: "3px 12px", borderRadius: 20,
                    background: `${t.color}18`, border: `1px solid ${t.color}40`,
                    fontSize: "0.75rem", fontWeight: 700, color: t.color }}>
                    {t.name}
                  </span>
                ))}
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "0.5rem",
              padding: "0.5rem 1.2rem", borderRadius: 20,
              background: wsConnected ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.05)",
              border: `1px solid ${wsConnected ? "rgba(34,197,94,0.25)" : "rgba(255,255,255,0.1)"}` }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%",
                background: wsConnected ? "#22c55e" : "#f59e0b",
                animation: "livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700,
                color: wsConnected ? "#22c55e" : "#f59e0b" }}>
                {wsConnected ? "Connected — watching live" : "Connecting…"}
              </span>
            </div>
          </div>
        );
      }
      return (
        <PrepStage
          mode={mode}
          onStart={startAuction}
          onSkip={startAuction}
          canStart={teams.length >= 2}
          teamCount={teams.length}
          excluded={excluded}
          onToggleExclude={toggleExclude}
        />
      );
    }

    if (phase === "idle") {
      const done = queueIdx.current >= queueRef.current.length;
      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center", gap: "1rem",
          textAlign: "center", padding: "2rem" }}>
          {done ? (
            <>
              <div style={{ width: 68, height: 68, borderRadius: "50%",
                background: "rgba(192,25,44,0.12)", border: "2px solid rgba(192,25,44,0.35)",
                display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Trophy size={30} style={{ color: ACCENT }} />
              </div>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
                Auction Complete
              </h2>
              <p style={{ margin: 0, fontSize: "0.88rem", color: DIM }}>
                {log.filter(e => e.status === "sold").length} players sold ·{" "}
                {log.filter(e => e.status === "unsold").length} unsold
              </p>
              {isHost && (
                <button onClick={doComplete}
                  style={{ marginTop: "0.5rem", padding: "0.9rem 2.2rem",
                    background: ACCENT, border: "none", borderRadius: 14,
                    color: "#fff", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.5rem",
                    boxShadow: `0 0 32px ${ACCENT}50` }}>
                  <Trophy size={16} /> View Final Results
                </button>
              )}
              {!isHost && (
                <p style={{ margin: 0, fontSize: "0.8rem", color: DIM }}>
                  Waiting for host to finalise…
                </p>
              )}
            </>
          ) : (
            <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fff" }}>
              Loading next player…
            </h2>
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
      const tc        = TEAM_COLOR[nominated.team] ?? "#aaa";
      const tier      = getPlayerTier(nominated.credits);
      const td        = TD[tier];
      const cfg       = TIER_CONFIG[tier];
      const bidColor  = leadTeam?.color ?? td.color;
      const aboveBase = parseFloat((bidValue - cfg.basePrice).toFixed(2));

      return (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
          gap: "0.85rem", overflowY: "auto", overflowX: "hidden",
          padding: "0.95rem", position: "relative" }}>

          {/* Ambient stage glow — picks up tier color */}
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none",
            background: `radial-gradient(ellipse 90% 55% at 50% 0%, ${td.glow} 0%, transparent 65%)` }} />

          {/* ── HERO PLAYER CARD ── */}
          <motion.div
            key={nominated.name}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 220, damping: 22 }}
            style={{
              position: "relative", zIndex: 1, flexShrink: 0,
              background: `linear-gradient(180deg, ${td.glow} 0%, transparent 100%), ${CARD}`,
              border: `2px solid ${bidColor}55`,
              borderRadius: 18, padding: "1rem 1.1rem",
              boxShadow: `0 0 0 1px ${td.color}22 inset, 0 22px 50px -22px ${bidColor}55`,
              display: "flex", alignItems: "center", gap: "0.95rem",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}>

            {/* Role medallion */}
            <div style={{
              width: 68, height: 68, borderRadius: "50%",
              background: `radial-gradient(circle at 30% 30%, ${tc}55, ${tc}15 70%)`,
              border: `2px solid ${tc}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.74rem", fontWeight: 900, letterSpacing: "0.06em",
              color: ROLE_COLOR[nominated.role] ?? "#aaa",
              flexShrink: 0,
              boxShadow: `0 0 22px ${tc}40 inset, 0 6px 18px -6px ${tc}60`,
            }}>
              {ROLE_ICON[nominated.role] ?? "BAT"}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                <TierBadge tier={tier} size="sm" />
                <span style={{ fontSize: "0.62rem", fontWeight: 700, color: tc,
                  background: `${tc}18`, border: `1px solid ${tc}40`,
                  padding: "1px 8px", borderRadius: 20 }}>
                  {nominated.team}
                </span>
                {!nominated.capped && (
                  <span style={{ fontSize: "0.56rem", fontWeight: 800, color: DIM,
                    background: "rgba(255,255,255,0.04)", border: `1px solid ${BDR}`,
                    padding: "1px 7px", borderRadius: 4, letterSpacing: "0.08em" }}>
                    UNCAPPED
                  </span>
                )}
              </div>
              <h2 style={{ margin: 0, fontSize: "1.55rem", fontWeight: 900, color: "#fff",
                letterSpacing: "-0.03em", lineHeight: 1.05,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {nominated.name}
              </h2>
              <p style={{ margin: "0.28rem 0 0", fontSize: "0.7rem", color: DIM }}>
                {ROLE_LABEL[nominated.role]} · Base {crFmt(cfg.basePrice)} · +{crFmt(cfg.increment)} step
              </p>
            </div>
          </motion.div>

          {/* ── Bid podium / member view ── */}
          {!isHost ? (
            /* Member: large bid display only — interaction handled by host */
            <div style={{ flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: "0.7rem",
              background: CARD, border: `1px solid ${BDR}`, borderRadius: 16,
              padding: "1.5rem 1rem", position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.18em",
                color: DIM, textTransform: "uppercase" }}>Current Bid</div>
              <div style={{ fontSize: "3.4rem", fontWeight: 900, fontFamily: "monospace",
                color: bidColor, letterSpacing: "-0.04em", lineHeight: 1,
                textShadow: `0 0 38px ${bidColor}55` }}>
                {crFmt(bidValue > 0 ? bidValue : cfg.basePrice)}
              </div>
              {leadTeam ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6,
                  padding: "0.35rem 0.95rem", borderRadius: 20,
                  background: `${leadTeam.color}20`, border: `1px solid ${leadTeam.color}45` }}>
                  <Crown size={11} style={{ color: leadTeam.color }} />
                  <span style={{ fontSize: "0.72rem", fontWeight: 800, color: leadTeam.color }}>
                    {leadTeam.name} leading
                  </span>
                </div>
              ) : (
                <span style={{ fontSize: "0.72rem", color: DIM }}>Awaiting first bid…</span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "0.4rem",
                fontSize: "0.65rem", color: DIM }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                  animation: "livePulse 1.4s ease-in-out infinite" }} />
                Watching live
              </div>
            </div>
          ) : (
            /* Host bid podium */
            <>
              {/* Big bid display with –/+ steppers */}
              <div style={{ position: "relative", zIndex: 1, flexShrink: 0,
                background: `linear-gradient(180deg, ${bidColor}0a, transparent), ${CARD}`,
                border: `1.5px solid ${bidColor}40`, borderRadius: 16,
                padding: "0.85rem 0.95rem",
                display: "flex", alignItems: "center", gap: "0.7rem",
                boxShadow: leadTeam ? `0 10px 28px -14px ${bidColor}70` : "none",
                transition: "border-color 0.25s, box-shadow 0.25s" }}>

                <button
                  onMouseDown={() => setBidValue(v => parseFloat(Math.max(0, v - cfg.increment).toFixed(2)))}
                  disabled={bidValue <= 0}
                  aria-label={`Decrease bid by ${crFmt(cfg.increment)}`}
                  style={{ width: 46, height: 46, borderRadius: 12,
                    background: "rgba(255,255,255,0.05)", border: `1px solid ${BDR}`,
                    color: bidValue > 0 ? "#fff" : "rgba(255,255,255,0.18)",
                    cursor: bidValue > 0 ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0 }}>
                  <Minus size={17} />
                </button>

                <div style={{ flex: 1, textAlign: "center", padding: "0 0.4rem", minWidth: 0 }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 800, letterSpacing: "0.16em",
                    color: leadTeam ? leadTeam.color : DIM, textTransform: "uppercase",
                    marginBottom: 2,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {leadTeam ? `${leadTeam.name.split("'")[0]} leads` : "Pick a team to bid"}
                  </div>
                  <div style={{ fontSize: "2.6rem", fontWeight: 900, fontFamily: "monospace",
                    color: bidColor, letterSpacing: "-0.04em", lineHeight: 1,
                    textShadow: `0 0 28px ${bidColor}45` }}>
                    {crFmt(bidValue > 0 ? bidValue : cfg.basePrice)}
                  </div>
                  {aboveBase > 0 && (
                    <div style={{ fontSize: "0.62rem", color: "#34d399", fontWeight: 700,
                      marginTop: 3 }}>
                      +{crFmt(aboveBase)} above base
                    </div>
                  )}
                </div>

                <button
                  onMouseDown={() => setBidValue(v => parseFloat((v + cfg.increment).toFixed(2)))}
                  aria-label={`Increase bid by ${crFmt(cfg.increment)}`}
                  style={{ width: 46, height: 46, borderRadius: 12,
                    background: `${bidColor}25`, border: `1px solid ${bidColor}55`,
                    color: bidColor, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: `0 0 18px -4px ${bidColor}70` }}>
                  <Plus size={17} />
                </button>
              </div>

              {/* Manual entry — fine-grained typing fallback */}
              <div style={{ position: "relative", zIndex: 1, flexShrink: 0 }}>
                <BidInput
                  value={bidValue}
                  onChange={setBidValue}
                  color={bidColor}
                  basePrice={cfg.basePrice}
                  increment={cfg.increment}
                />
              </div>

              {/* Hint — pick team via left panel */}
              {!leadTeam && (
                <div style={{ position: "relative", zIndex: 1, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  padding: "0.45rem 0.85rem", borderRadius: 10,
                  background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.22)",
                  fontSize: "0.7rem", color: "#a5b4fc", fontWeight: 600 }}>
                  <ChevronRight size={11} />
                  Tap a team in the left panel to set the leading bidder
                </div>
              )}

              {/* Action row */}
              <div style={{ display: "flex", gap: "0.55rem", position: "relative", zIndex: 1, flexShrink: 0 }}>
                <button onClick={doSold} disabled={!leadTeam || bidValue <= 0}
                  style={{ flex: 1, padding: "0.95rem", borderRadius: 14, border: "none",
                    background: (leadTeam && bidValue > 0)
                      ? "linear-gradient(135deg, #22c55e 0%, #15803d 100%)"
                      : "rgba(34,197,94,0.10)",
                    color: (leadTeam && bidValue > 0) ? "#fff" : "rgba(255,255,255,0.2)",
                    fontWeight: 900, fontSize: "0.95rem", letterSpacing: "0.02em",
                    cursor: (leadTeam && bidValue > 0) ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                    boxShadow: (leadTeam && bidValue > 0)
                      ? "0 14px 30px -10px rgba(34,197,94,0.55), 0 1px 0 rgba(255,255,255,0.22) inset"
                      : "none",
                    transition: "transform 0.08s ease",
                    fontFamily: "inherit" }}
                  onMouseDown={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"}
                  onMouseUp={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}
                  onMouseLeave={e => (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"}>
                  <Gavel size={16} />
                  {leadTeam && bidValue > 0 ? `SOLD — ${crFmt(bidValue)}` : "SOLD"}
                </button>
                <button onClick={doUnsold}
                  style={{ padding: "0.95rem 1.25rem", borderRadius: 14,
                    border: `1px solid ${BDR}`, background: CARD,
                    color: DIM, fontWeight: 800, fontSize: "0.85rem", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "0.4rem",
                    fontFamily: "inherit" }}>
                  <Ban size={13} /> Unsold
                </button>
              </div>

              <p style={{ margin: 0, fontSize: "0.6rem", color: "rgba(255,255,255,0.22)",
                textAlign: "center", flexShrink: 0, position: "relative", zIndex: 1 }}>
                <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px",
                  borderRadius: 3, fontFamily: "monospace" }}>Space</kbd> +{crFmt(cfg.increment)}
                {" · "}
                <kbd style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px",
                  borderRadius: 3, fontFamily: "monospace" }}>Enter</kbd> confirm sold
              </p>
            </>
          )}
        </div>
      );
    }

    if (phase === "sold" && nominated && leadTeam) {
      const tier  = getPlayerTier(nominated.credits);
      const above = parseFloat((bidValue - TIER_CONFIG[tier].basePrice).toFixed(2));
      return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: "0.85rem",
            position: "relative", overflow: "hidden",
            background: `radial-gradient(ellipse 65% 55% at 50% 50%, ${leadTeam.color}28, transparent 70%)` }}>

          {/* Conic ray glow */}
          <motion.div aria-hidden="true"
            initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 0.55, rotate: 0 }}
            transition={{ delay: 0.05, duration: 0.6 }}
            style={{ position: "absolute", inset: "-20%", pointerEvents: "none",
              background: `conic-gradient(from 0deg at 50% 50%, ${leadTeam.color}10, transparent 22%, ${leadTeam.color}1c, transparent 48%, ${leadTeam.color}10, transparent 74%, ${leadTeam.color}1c, transparent)` }} />

          <motion.div
            initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 180, delay: 0.08 }}
            style={{ width: 80, height: 80, borderRadius: "50%",
              background: "linear-gradient(135deg, #22c55e 0%, #15803d 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 56px rgba(34,197,94,0.65), 0 1px 0 rgba(255,255,255,0.22) inset",
              zIndex: 1 }}>
            <Gavel size={36} style={{ color: "#fff" }} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            style={{ display: "flex", flexDirection: "column", alignItems: "center",
              gap: "0.4rem", zIndex: 1 }}>
            <span style={{ fontSize: "0.66rem", fontWeight: 800, letterSpacing: "0.22em",
              textTransform: "uppercase", color: "#22c55e" }}>SOLD</span>
            <h2 style={{ margin: 0, fontSize: "1.95rem", fontWeight: 900, color: "#fff",
              textAlign: "center", letterSpacing: "-0.03em", lineHeight: 1 }}>
              {nominated.name}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 7,
              padding: "0.4rem 1rem", borderRadius: 20,
              background: `${leadTeam.color}25`, border: `1px solid ${leadTeam.color}55` }}>
              <Crown size={13} style={{ color: leadTeam.color }} />
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: leadTeam.color }}>
                {leadTeam.name}
              </span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.32, type: "spring", stiffness: 220 }}
            style={{ zIndex: 1, textAlign: "center" }}>
            <div style={{ fontSize: "3.4rem", fontWeight: 900, fontFamily: "monospace",
              color: "#22c55e", letterSpacing: "-0.04em", lineHeight: 1,
              textShadow: "0 0 40px rgba(34,197,94,0.55)" }}>
              {crFmt(bidValue)}
            </div>
            {above > 0 && (
              <div style={{ fontSize: "0.72rem", color: DIM, marginTop: 5, fontWeight: 600 }}>
                +{crFmt(above)} above base
              </div>
            )}
          </motion.div>

          {isHost && (
            <motion.button
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 }}
              onClick={doNext}
              style={{ marginTop: "0.4rem", padding: "0.85rem 2rem",
                background: `linear-gradient(135deg, ${ACCENT}, #8b1020)`,
                border: "none", borderRadius: 14,
                color: "#fff", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.5rem", zIndex: 1,
                fontFamily: "inherit",
                boxShadow: `0 14px 32px -10px ${ACCENT}, 0 1px 0 rgba(255,255,255,0.18) inset` }}>
              Next Player <ChevronRight size={15} />
            </motion.button>
          )}
          {!isHost && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: "0.3rem",
              padding: "0.45rem 1.2rem", borderRadius: 20,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                animation: "livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e" }}>Watching live</span>
            </div>
          )}
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
          {isHost && (
            <button onClick={doNext}
              style={{ marginTop: "0.4rem", padding: "0.75rem 1.8rem",
                background: ACCENT, border: "none", borderRadius: 12,
                color: "#fff", fontWeight: 800, fontSize: "0.88rem", cursor: "pointer" }}>
              Next Player
            </button>
          )}
          {!isHost && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginTop: "0.3rem",
              padding: "0.45rem 1.2rem", borderRadius: 20,
              background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e",
                animation: "livePulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e" }}>Watching live</span>
            </div>
          )}
        </motion.div>
      );
    }

    return null;
  }

  // ── Squad card (always-visible roster) ──────────────────────────
  function SquadCard({ team }: { team: AucTeam }) {
    const filled = team.squad.length;
    const target = config.maxPlayers;
    const fillPct = Math.min(100, (filled / target) * 100);
    const isLastWinner = log[0]?.status === "sold" && log[0].winner === team.name;
    return (
      <motion.div
        animate={isLastWinner
          ? { boxShadow: [`0 0 0 0 ${team.color}55`, `0 0 0 6px ${team.color}00`] }
          : {}}
        transition={{ duration: 1.2 }}
        style={{ background: CARD,
          border: `1px solid ${isLastWinner ? `${team.color}55` : BDR}`,
          borderRadius: 11, overflow: "hidden", marginBottom: "0.4rem",
          transition: "border-color 0.3s" }}>
        {/* Header */}
        <div style={{ padding: "0.5rem 0.7rem 0.4rem",
          borderBottom: `1px solid ${BDR}` }}>
          <div style={{ display: "flex", alignItems: "center",
            justifyContent: "space-between", gap: "0.4rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", minWidth: 0 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%",
                background: team.color, flexShrink: 0,
                boxShadow: `0 0 8px ${team.color}` }} />
              <span style={{ fontSize: "0.74rem", fontWeight: 800, color: "#fff",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {team.name.split("'")[0]}
              </span>
            </div>
            <span style={{ fontSize: "0.6rem", fontWeight: 700,
              color: filled >= target ? "#22c55e" : DIM,
              fontFamily: "monospace", flexShrink: 0 }}>
              {filled}/{target}
            </span>
          </div>
          {/* Slot fill bar */}
          <div style={{ marginTop: 5, height: 3, background: "rgba(255,255,255,0.05)",
            borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${fillPct}%`,
              background: filled >= target ? "#22c55e" : team.color,
              transition: "width 0.4s" }} />
          </div>
        </div>
        {/* Roster */}
        <div style={{ padding: "0.35rem 0.45rem", maxHeight: 200, overflowY: "auto",
          display: "flex", flexDirection: "column", gap: "0.2rem" }}>
          {team.squad.length === 0 ? (
            <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.22)",
              fontStyle: "italic", padding: "0.25rem 0.3rem" }}>
              No players yet
            </span>
          ) : (
            team.squad.map((p, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.32rem",
                padding: "0.22rem 0.35rem", borderRadius: 5,
                background: "rgba(255,255,255,0.025)" }}>
                <span style={{ width: 4, height: 4, borderRadius: "50%",
                  background: TD[p.tier].color, flexShrink: 0 }} />
                <span style={{ fontSize: "0.66rem", fontWeight: 600, color: "#fff",
                  flex: 1, overflow: "hidden", textOverflow: "ellipsis",
                  whiteSpace: "nowrap" }}>
                  {p.name}
                </span>
                <span style={{ fontSize: "0.52rem", fontWeight: 800,
                  color: ROLE_COLOR[p.role] ?? "#aaa", letterSpacing: "0.04em" }}>
                  {ROLE_ICON[p.role] ?? "BAT"}
                </span>
                <span style={{ fontSize: "0.6rem", color: "#22c55e",
                  fontFamily: "monospace", fontWeight: 700, flexShrink: 0 }}>
                  {crFmt(p.price)}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    );
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
          flexShrink: 0, gap: "0.75rem", padding: "0.55rem 0.85rem",
          background: "rgba(255,255,255,0.025)", border: `1px solid ${BDR}`, borderRadius: 14 }}>

          {/* Left: back + title */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem", minWidth: 0 }}>
            <button onClick={() => navigate("/auction")}
              aria-label="Back to auction lobby"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BDR}`,
                borderRadius: 10, width: 32, height: 32, color: DIM, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                fontFamily: "inherit" }}>
              <ArrowLeft size={14} />
            </button>
            <div style={{ minWidth: 0 }}>
              <h1 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 900, color: "#fff",
                letterSpacing: "-0.025em", lineHeight: 1.1,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {config.name || "Auction Room"}
              </h1>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem",
                marginTop: 3, fontSize: "0.66rem", color: DIM, fontWeight: 600 }}>
                <span style={{ color: mode === "tier" ? "#e8a020" : DIM, fontWeight: 700 }}>
                  {mode === "tier" ? "Tier mode" : "Classic mode"}
                </span>
                <span style={{ opacity: 0.4 }}>·</span>
                <span>₹{startBudget}Cr each</span>
                {roomStage === "prep" && (
                  <>
                    <span style={{ opacity: 0.4 }}>·</span>
                    <span style={{ color: "#818cf8", fontWeight: 700 }}>Prep stage</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: status + icon toolbar + live counter */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>

            {/* Connection / member count */}
            {config.roomCode && isHost && memberCount > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 5,
                padding: "0.32rem 0.65rem",
                background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.2)",
                borderRadius: 20 }}>
                <Users size={10} style={{ color: "#818cf8" }} />
                <span style={{ fontSize: "0.63rem", fontWeight: 700, color: "#818cf8" }}>
                  {memberCount}
                </span>
              </div>
            )}
            {config.roomCode && !isHost && (
              <div style={{ display: "flex", alignItems: "center", gap: 5,
                padding: "0.32rem 0.65rem",
                background: wsConnected ? "rgba(34,197,94,0.1)" : "rgba(245,158,11,0.1)",
                border: `1px solid ${wsConnected ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)"}`,
                borderRadius: 20 }}>
                <div style={{ width: 5, height: 5, borderRadius: "50%",
                  background: wsConnected ? "#22c55e" : "#f59e0b",
                  animation: "livePulse 1.4s ease-in-out infinite" }} />
                <span style={{ fontSize: "0.63rem", fontWeight: 700,
                  color: wsConnected ? "#22c55e" : "#f59e0b" }}>
                  {wsConnected ? "Live" : "Reconnecting"}
                </span>
              </div>
            )}

            {/* Watchlist (icon) */}
            <button onClick={() => setShowWL(true)} title="Watchlist · Prep targets"
              aria-label="Open watchlist"
              style={{ width: 32, height: 32, borderRadius: 9,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)",
                color: "#f59e0b", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: "inherit" }}>
              <Star size={13} style={{ fill: "#f59e0b" }} />
            </button>

            {/* Undo (host) */}
            {isHost && log.length > 0 && roomStage === "auction" && (
              <button onClick={doUndo} title="Undo last sale" aria-label="Undo last sale"
                style={{ width: 32, height: 32, borderRadius: 9,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${BDR}`,
                  color: DIM, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit" }}>
                <RotateCcw size={13} />
              </button>
            )}

            {/* Finish auction (host) — bypass the queue at any time */}
            {isHost && roomStage === "auction" && (
              <button
                onClick={() => {
                  const sold   = log.filter(e => e.status === "sold").length;
                  const unsold = log.filter(e => e.status === "unsold").length;
                  const left   = Math.max(0, queueRef.current.length - queueIdx.current);
                  const msg = `Finish the auction now?\n\n${sold} sold · ${unsold} unsold · ${left} player${left === 1 ? "" : "s"} remaining.\n\nThis will end the auction for everyone and show the final results.`;
                  if (window.confirm(msg)) doComplete();
                }}
                title="Finish auction & view results"
                aria-label="Finish auction now"
                style={{ width: 32, height: 32, borderRadius: 9,
                  background: `linear-gradient(135deg, ${ACCENT}30, ${ACCENT}15)`,
                  border: `1px solid ${ACCENT}55`,
                  color: ACCENT, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit" }}>
                <Trophy size={13} />
              </button>
            )}

            {/* Copy log */}
            {log.length > 0 && (
              <button title="Copy auction log to clipboard" aria-label="Copy auction log"
                onClick={() => navigator.clipboard?.writeText(
                  log.map(e => e.status === "sold"
                    ? `[${TD[e.tier].label}] ${e.player.name} → ${e.winner} ${crFmt(e.price!)}`
                    : `[${TD[e.tier].label}] ${e.player.name} → UNSOLD`
                  ).join("\n")
                )}
                style={{ width: 32, height: 32, borderRadius: 9,
                  background: "rgba(255,255,255,0.04)", border: `1px solid ${BDR}`,
                  color: DIM, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "inherit" }}>
                <Copy size={13} />
              </button>
            )}

            {/* Live counter — hero pill */}
            {roomStage === "auction" && (
              <div style={{ padding: "0.36rem 0.85rem",
                background: "linear-gradient(135deg, rgba(34,197,94,0.20), rgba(34,197,94,0.06))",
                border: "1px solid rgba(34,197,94,0.32)", borderRadius: 20,
                display: "flex", alignItems: "center", gap: "0.4rem",
                marginLeft: "0.2rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
                  animation: "livePulse 1.4s ease-in-out infinite",
                  boxShadow: "0 0 10px #22c55e" }} />
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#22c55e",
                  letterSpacing: "0.02em" }}>
                  {remaining} <span style={{ opacity: 0.7, fontWeight: 600 }}>left</span>
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
              const isLead   = leadId === team.id;
              const teamFull = team.squad.length >= config.maxPlayers;
              const ok       = isHost && phase === "bidding" && team.budget >= bidValue && !teamFull;
              return (
                <div key={team.id}
                  onClick={() => ok && setLeadId(team.id)}
                  style={{ background: isLead ? `${team.color}12` : CARD,
                    border: `1.5px solid ${isLead ? team.color : BDR}`,
                    borderRadius: 12, padding: "0.7rem 0.8rem",
                    cursor: ok ? "pointer" : "default",
                    opacity: isHost && phase === "bidding" && !ok ? 0.38 : 1,
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

            {/* Squads — always-visible roster per team */}
            {roomStage === "auction" && (
              <>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
                  margin: "0.45rem 0 0" }}>
                  <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.12em", color: DIM, textTransform: "uppercase" }}>Squads</p>
                  <span style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.3)" }}>
                    of {config.maxPlayers}
                  </span>
                </div>
                {teams.map(team => <SquadCard key={team.id} team={team} />)}
              </>
            )}
          </div>

          {/* Centre */}
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden",
            background: "rgba(255,255,255,0.02)", border: `1px solid ${BDR}`, borderRadius: 16 }}>
            <CentreStage />
          </div>

          {/* Right: sales log */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", overflowY: "auto" }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between",
              flexShrink: 0 }}>
              <p style={{ margin: 0, fontSize: "0.58rem", fontWeight: 700,
                letterSpacing: "0.12em", color: DIM, textTransform: "uppercase" }}>
                Sales Log
              </p>
              {log.length > 0 && (
                <span style={{ fontSize: "0.6rem", fontWeight: 800, color: "#22c55e",
                  background: "rgba(34,197,94,0.10)", border: "1px solid rgba(34,197,94,0.22)",
                  padding: "1px 7px", borderRadius: 20 }}>
                  {log.filter(e => e.status === "sold").length} sold
                </span>
              )}
            </div>
            {log.length === 0
              ? (
                <div style={{ background: CARD, border: `1px dashed ${BDR}`, borderRadius: 12,
                  padding: "1.5rem 0.85rem", textAlign: "center" }}>
                  <Gavel size={18} style={{ color: DIM, marginBottom: "0.5rem" }} />
                  <p style={{ margin: 0, fontSize: "0.74rem", color: DIM, fontWeight: 600 }}>
                    No sales yet
                  </p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.65rem",
                    color: "rgba(255,255,255,0.2)" }}>
                    Sold &amp; unsold lots will appear here
                  </p>
                </div>
              )
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
                  const isLead   = leadId === team.id;
                  const teamFull = team.squad.length >= config.maxPlayers;
                  const ok       = isHost && phase === "bidding" && team.budget >= bidValue && !teamFull;
                  return (
                    <div key={team.id} onClick={() => ok && setLeadId(team.id)}
                      style={{ background: isLead ? `${team.color}12` : CARD,
                        border: `1.5px solid ${isLead ? team.color : BDR}`,
                        borderRadius: 12, padding: "0.85rem",
                        cursor: ok ? "pointer" : "default",
                        opacity: isHost && phase === "bidding" && !ok ? 0.38 : 1 }}>
                      <BudgetBar team={team} startBudget={startBudget} />
                      {isLead && phase === "bidding" && (
                        <div style={{ marginTop: "0.38rem", fontSize: "0.68rem",
                          color: team.color, fontWeight: 700,
                          display: "flex", alignItems: "center", gap: "0.28rem" }}>
                          <Crown size={10} /> Leading — {crFmt(bidValue)}
                        </div>
                      )}
                      {/* Mobile squad roster */}
                      {roomStage === "auction" && (
                        <div style={{ marginTop: "0.55rem", paddingTop: "0.55rem",
                          borderTop: `1px dashed ${BDR}` }}>
                          {team.squad.length === 0 ? (
                            <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)",
                              fontStyle: "italic" }}>
                              No players yet
                            </span>
                          ) : (
                            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                              {team.squad.map((p, i) => (
                                <div key={i} style={{ display: "flex", alignItems: "center",
                                  gap: "0.4rem", padding: "0.25rem 0.4rem", borderRadius: 6,
                                  background: "rgba(255,255,255,0.03)" }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%",
                                    background: TD[p.tier].color, flexShrink: 0 }} />
                                  <span style={{ fontSize: "0.74rem", color: "#fff", flex: 1,
                                    overflow: "hidden", textOverflow: "ellipsis",
                                    whiteSpace: "nowrap" }}>
                                    {p.name}
                                  </span>
                                  <span style={{ fontSize: "0.6rem",
                                    color: ROLE_COLOR[p.role] ?? "#aaa",
                                    fontWeight: 700, letterSpacing: "0.03em" }}>
                                    {ROLE_ICON[p.role] ?? "BAT"}
                                  </span>
                                  <span style={{ fontSize: "0.66rem", color: "#22c55e",
                                    fontFamily: "monospace", fontWeight: 700 }}>
                                    {crFmt(p.price)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
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
