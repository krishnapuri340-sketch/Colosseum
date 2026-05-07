/**
 * Stats.tsx — IPL 2026 Overall Statistics
 *
 * Categories (all pull from /api/ipl/stats):
 *   Fantasy Pts · Runs (Orange Cap) · Wickets (Purple Cap)
 *   Sixes · Fours · Fifties · Centuries · Dot Balls · Maidens
 *
 * Fantasy points are calculated server-side using the exact scoring rules.
 * The "F" badge marks players in any active fantasy squad.
 * Top-3 rows get a gold/silver/bronze treatment.
 * Inspired by the reference Stats.tsx but fully in Colosseum's design system.
 */
import { useState, useEffect, useMemo } from "react";
import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { apiJson } from "@/lib/api";
import { TEAM_COLOR, TEAM_LOGO } from "@/lib/ipl-constants";
import { TrendingUp, ChevronDown, ChevronUp, RefreshCw, Award } from "lucide-react";

// ── Design tokens ────────────────────────────────────────────────────
const V      = "#7C6FF7";
const CARD   = "rgba(19,23,38,0.7)";
const BORDER = "rgba(255,255,255,0.08)";
const DIM    = "rgba(255,255,255,0.38)";
const BDR2   = "rgba(255,255,255,0.05)";

const GOLD   = "#e8a020";
const SILVER = "#9ca3af";
const BRONZE = "#d97706";

// ── Category config ──────────────────────────────────────────────────
const CATS = [
  { id: "fantasyPts",  label: "Fantasy",     sub: "Most Fantasy Points",   unit: "pts",    color: V,       icon: "⚡" },
  { id: "orangeCap",   label: "Orange Cap",  sub: "Most Runs",             unit: "runs",   color: "#fb923c", icon: "🏏" },
  { id: "purpleCap",   label: "Purple Cap",  sub: "Most Wickets",          unit: "wkts",   color: "#a89ff9", icon: "🎯" },
  { id: "sixes",       label: "Sixes",       sub: "Most Sixes",            unit: "6s",     color: "#818cf8", icon: "6️" },
  { id: "fours",       label: "Fours",       sub: "Most Fours",            unit: "4s",     color: "#60a5fa", icon: "4️" },
  { id: "fifties",     label: "Fifties",     sub: "Most Half-Centuries",   unit: "50s",    color: "#fbbf24", icon: "50" },
  { id: "centuries",   label: "Centuries",   sub: "Most Centuries",        unit: "100s",   color: GOLD,    icon: "💯" },
  { id: "dots",        label: "Dot Balls",   sub: "Most Dot Balls Bowled", unit: "dots",   color: "#6ee7b7", icon: "●" },
  { id: "maidens",     label: "Maidens",     sub: "Most Maiden Overs",     unit: "M",      color: "#34d399", icon: "M" },
] as const;

type CatId = typeof CATS[number]["id"];

// ── API response shapes ──────────────────────────────────────────────
interface StatEntry {
  name: string;
  team: string;
  isFantasy?: boolean;
  fantasyPts?: number;
  // batting
  runs?: number; balls?: number; innings?: number;
  hs?: number | string; sr?: number | string; fours?: number; sixes?: number;
  fifties?: number; centuries?: number;
  // bowling
  wickets?: number; overs?: string; eco?: number | string; best?: string;
  dots?: number; maidens?: number;
  // fielding
  catches?: number;
}

interface StatsResp {
  matchesProcessed: number;
  fantasyPts:  StatEntry[];
  orangeCap:   StatEntry[];
  purpleCap:   StatEntry[];
  sixes:       StatEntry[];
  fours:       StatEntry[];
  fifties:     StatEntry[];
  centuries:   StatEntry[];
  dots:        StatEntry[];
  maidens:     StatEntry[];
}

// ── Helpers ──────────────────────────────────────────────────────────
function medalColor(i: number) {
  if (i === 0) return GOLD;
  if (i === 1) return SILVER;
  if (i === 2) return BRONZE;
  return "rgba(255,255,255,0.28)";
}

function statValue(entry: StatEntry, cat: CatId): number | string {
  switch (cat) {
    case "fantasyPts": return entry.fantasyPts ?? 0;
    case "orangeCap":  return entry.runs ?? 0;
    case "purpleCap":  return entry.wickets ?? 0;
    case "sixes":      return entry.sixes ?? 0;
    case "fours":      return entry.fours ?? 0;
    case "fifties":    return entry.fifties ?? 0;
    case "centuries":  return entry.centuries ?? 0;
    case "dots":       return entry.dots ?? 0;
    case "maidens":    return entry.maidens ?? 0;
  }
}

function subLine(entry: StatEntry, cat: CatId): string {
  switch (cat) {
    case "fantasyPts":
      return [
        entry.runs    != null && `${entry.runs}r`,
        entry.wickets != null && `${entry.wickets}w`,
        entry.catches != null && `${entry.catches}ct`,
      ].filter(Boolean).join(" · ") || "";
    case "orangeCap":
      return [
        entry.hs    != null && `HS: ${entry.hs}`,
        entry.sr    != null && `SR: ${entry.sr}`,
        entry.innings != null && `${entry.innings} inn`,
      ].filter(Boolean).join(" · ");
    case "purpleCap":
      return [
        entry.best != null && `Best: ${entry.best}`,
        entry.eco  != null && `Eco: ${entry.eco}`,
        entry.innings != null && `${entry.innings} inn`,
      ].filter(Boolean).join(" · ");
    case "sixes":
    case "fours":
      return entry.runs != null ? `${entry.runs} runs · SR: ${entry.sr ?? "—"}` : "";
    case "fifties":
    case "centuries":
      return [
        entry.runs != null && `${entry.runs} runs`,
        entry.innings != null && `${entry.innings} inn`,
      ].filter(Boolean).join(" · ");
    case "dots":
    case "maidens":
      return [
        entry.wickets != null && `${entry.wickets}w`,
        entry.overs   != null && `${entry.overs} ov`,
      ].filter(Boolean).join(" · ");
  }
}

function TeamLogo({ code, size = 22 }: { code: string; size?: number }) {
  const logo  = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#aaa";
  if (logo) return (
    <img src={logo} alt={code}
      style={{ width: size, height: size, objectFit: "contain", flexShrink: 0 }}
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
  );
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: size * 0.3, color }}>
      {code}
    </div>
  );
}

// ── Top-3 podium cards ───────────────────────────────────────────────
function Podium({ entries, cat }: { entries: StatEntry[]; cat: CatId }) {
  const top = entries.slice(0, 3);
  if (top.length === 0) return null;
  // Reorder: 2nd | 1st | 3rd
  const order = top.length === 3 ? [top[1], top[0], top[2]] : top;
  const heights = ["h-28", "h-36", "h-28"];
  const podiumColors = [SILVER, GOLD, BRONZE];

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${order.length}, 1fr)`,
      gap: 8, alignItems: "flex-end", marginBottom: "1.25rem" }}>
      {order.map((entry, oi) => {
        const realRank  = top.indexOf(entry);
        const tc        = TEAM_COLOR[entry.team] ?? "#aaa";
        const podColor  = podiumColors[oi];
        const val       = statValue(entry, cat);
        const catConf   = CATS.find(c => c.id === cat)!;

        return (
          <motion.div key={entry.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: oi * 0.08, duration: 0.3, ease: [0.22,1,0.36,1] }}
            style={{
              borderRadius: 16, padding: "0.85rem 0.6rem",
              background: `${podColor}10`,
              border: `1.5px solid ${podColor}35`,
              display: "flex", flexDirection: "column",
              alignItems: "center", textAlign: "center",
              position: "relative", overflow: "hidden",
              minHeight: oi === 1 ? 200 : 170,
            }}>

            {/* Glow */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 16, pointerEvents: "none",
              background: `radial-gradient(ellipse 80% 60% at 50% 0%, ${podColor}18, transparent 70%)`,
            }} />

            {/* Rank medal */}
            <div style={{
              width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
              background: `${podColor}22`, border: `2px solid ${podColor}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: oi === 1 ? "1rem" : "0.9rem", marginBottom: "0.6rem",
              zIndex: 1,
            }}>
              {oi === 1 ? "1" : oi === 0 ? "2" : "3"}
            </div>

            {/* Team logo */}
            <TeamLogo code={entry.team} size={oi === 1 ? 32 : 26} />

            {/* Name */}
            <div style={{
              fontWeight: 800, fontSize: oi === 1 ? "0.82rem" : "0.72rem",
              color: "#fff", marginTop: "0.4rem", lineHeight: 1.2,
              overflow: "hidden", textOverflow: "ellipsis",
              display: "-webkit-box", WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as any,
              zIndex: 1,
            }}>
              {entry.name.split(" ").pop()}
            </div>
            <div style={{ fontSize: "0.62rem", color: tc, fontWeight: 700, marginTop: 2, zIndex: 1 }}>
              {entry.team}
            </div>

            {/* Value */}
            <div style={{
              marginTop: "0.5rem", fontSize: oi === 1 ? "1.8rem" : "1.4rem",
              fontWeight: 900, color: podColor,
              fontFamily: "JetBrains Mono, monospace", lineHeight: 1,
              zIndex: 1,
            }}>
              {val}
            </div>
            <div style={{ fontSize: "0.6rem", color: DIM, marginTop: 2, zIndex: 1 }}>
              {catConf.unit}
            </div>

            {/* Fantasy badge */}
            {entry.isFantasy && (
              <div style={{
                position: "absolute", top: 6, right: 6,
                width: 16, height: 16, borderRadius: "50%",
                background: `${V}30`, border: `1px solid ${V}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.5rem", fontWeight: 800, color: "#a89ff9",
              }}>F</div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

// ── Single stat row ──────────────────────────────────────────────────
function StatRow({ entry, rank, cat }: { entry: StatEntry; rank: number; cat: CatId }) {
  const tc       = TEAM_COLOR[entry.team] ?? "#aaa";
  const val      = statValue(entry, cat);
  const sub      = subLine(entry, cat);
  const mColor   = medalColor(rank);
  const catConf  = CATS.find(c => c.id === cat)!;
  const isTop3   = rank < 3;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "0.6rem 1rem",
      borderBottom: `1px solid ${BDR2}`,
      borderLeft: `3px solid ${isTop3 ? mColor : "rgba(255,255,255,0.06)"}`,
      background: isTop3 ? `${mColor}06` : "transparent",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)"}
      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = isTop3 ? `${mColor}06` : "transparent"}>

      {/* Rank */}
      <div style={{
        width: 24, textAlign: "center", flexShrink: 0,
        fontWeight: 800, fontSize: isTop3 ? "0.88rem" : "0.72rem",
        color: mColor, fontFamily: "JetBrains Mono, monospace",
      }}>
        {rank + 1}
      </div>

      {/* Logo */}
      <TeamLogo code={entry.team} size={24} />

      {/* Name + sub */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#fff",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {entry.name}
          </span>
          {entry.isFantasy && (
            <span style={{
              fontSize: "0.55rem", fontWeight: 800,
              background: `${V}22`, color: "#a89ff9",
              border: `1px solid ${V}40`,
              padding: "0 4px", borderRadius: 4, flexShrink: 0,
            }}>F</span>
          )}
        </div>
        {sub && (
          <div style={{ fontSize: "0.65rem", color: DIM, marginTop: 1, fontFamily: "JetBrains Mono, monospace" }}>
            {sub}
          </div>
        )}
      </div>

      {/* Value */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{
          fontSize: isTop3 ? "1.05rem" : "0.95rem",
          fontWeight: 900, fontFamily: "JetBrains Mono, monospace",
          color: isTop3 ? (rank === 0 ? GOLD : rank === 1 ? SILVER : BRONZE) : "rgba(255,255,255,0.75)",
        }}>
          {val}
        </div>
        <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", marginTop: 1 }}>
          {catConf.unit}
        </div>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────
export default function Stats() {
  const [activeCat, setCat]     = useState<CatId>("fantasyPts");
  const [stats, setStats]       = useState<StatsResp | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [expanded, setExpanded] = useState(false);

  async function fetchStats() {
    setLoading(true); setError("");
    try {
      const data = await apiJson<StatsResp>("/ipl/stats");
      setStats(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load stats");
    }
    setLoading(false);
  }

  useEffect(() => { fetchStats(); }, []);

  const catConf  = CATS.find(c => c.id === activeCat)!;
  const entries: StatEntry[] = stats ? (stats[activeCat as keyof StatsResp] as StatEntry[] ?? []) : [];
  const visible  = expanded ? entries : entries.slice(0, 10);

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div className="pill pill-violet"
              style={{ display: "inline-flex", marginBottom: "0.5rem" }}>
              IPL 2026
            </div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.75rem,5vw,2.2rem)",
              fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>
              Statistics
            </h1>
            <p style={{ margin: "0.3rem 0 0", color: DIM, fontSize: "0.9rem" }}>
              Season leaders · fantasy points calculated by our scoring rules
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {stats && (
              <span style={{ fontSize: "0.72rem", color: DIM }}>
                {stats.matchesProcessed} matches
              </span>
            )}
            <button onClick={fetchStats} className="btn-secondary press"
              style={{ height: 36, borderRadius: 10, padding: "0 0.85rem", fontSize: "0.8rem" }}>
              <RefreshCw size={12} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Category pills ── */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATS.map(cat => (
            <button key={cat.id} onClick={() => { setCat(cat.id); setExpanded(false); }}
              className="press-sm"
              style={{
                padding: "0.4rem 0.85rem", borderRadius: 9999,
                fontSize: "0.78rem", fontWeight: 600, cursor: "pointer",
                background: activeCat === cat.id ? `${cat.color}20` : "rgba(255,255,255,0.04)",
                color: activeCat === cat.id ? cat.color : DIM,
                border: `1px solid ${activeCat === cat.id ? `${cat.color}45` : BORDER}`,
                fontFamily: "inherit", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}>
              <span style={{ fontSize: "0.7rem" }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* ── Main card ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 20,
          overflow: "hidden", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>

          {/* Card header */}
          <div style={{
            padding: "0.9rem 1.1rem",
            background: `${catConf.color}0a`,
            borderBottom: `1px solid ${catConf.color}20`,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: `${catConf.color}18`, border: `1px solid ${catConf.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1rem",
              }}>
                {catConf.icon}
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff" }}>
                  {catConf.sub}
                </div>
                <div style={{ fontSize: "0.68rem", color: DIM, marginTop: 1 }}>
                  {entries.length} players ranked
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5,
              fontSize: "0.65rem", color: DIM }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: V, opacity: 0.7 }} />
              F = in a fantasy squad
            </div>
          </div>

          {/* Loading */}
          {loading && (
            <div style={{ padding: "1rem" }}>
              {[1,2,3,4,5].map(i => (
                <div key={i} className="shimmer"
                  style={{ height: 52, borderRadius: 10, marginBottom: 4 }} />
              ))}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{ padding: "2rem", textAlign: "center",
              color: "#f87171", fontSize: "0.88rem" }}>
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && entries.length === 0 && (
            <div style={{ padding: "3rem 2rem", textAlign: "center",
              color: DIM, fontSize: "0.88rem" }}>
              <TrendingUp size={28} style={{ margin: "0 auto 0.75rem", opacity: 0.2 }} />
              Stats will appear once match data is synced
            </div>
          )}

          {/* Podium */}
          {!loading && entries.length >= 3 && (
            <div style={{ padding: "1rem 1rem 0" }}>
              <Podium entries={entries} cat={activeCat} />
            </div>
          )}

          {/* Column headers */}
          {!loading && entries.length > 0 && (
            <div style={{
              display: "grid", gridTemplateColumns: "24px 26px 1fr auto",
              gap: 12, padding: "0.4rem 1rem",
              borderBottom: `1px solid ${BORDER}`,
              background: "rgba(255,255,255,0.02)",
            }}>
              {["#","","Player", catConf.unit.toUpperCase()].map((h, i) => (
                <div key={i} style={{
                  fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.22)",
                  textAlign: i === 3 ? "right" : "left",
                }}>{h}</div>
              ))}
            </div>
          )}

          {/* Rows */}
          <AnimatePresence initial={false}>
            {!loading && visible.map((entry, i) => (
              <motion.div key={entry.name + i}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}>
                <StatRow entry={entry} rank={i} cat={activeCat} />
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Show more / less */}
          {!loading && entries.length > 10 && (
            <button onClick={() => setExpanded(v => !v)} className="press"
              style={{
                width: "100%", padding: "0.75rem",
                background: "rgba(255,255,255,0.02)",
                border: "none", borderTop: `1px solid ${BORDER}`,
                color: DIM, fontSize: "0.8rem", fontWeight: 600,
                cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              }}>
              {expanded
                ? <><ChevronUp size={13} /> Show less</>
                : <><ChevronDown size={13} /> Show all {entries.length} players</>}
            </button>
          )}
        </div>

        {/* ── Scoring rules reference ── */}
        <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
          overflow: "hidden", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
          <button
            onClick={() => {
              const el = document.getElementById("scoring-rules");
              if (el) el.style.display = el.style.display === "none" ? "block" : "none";
            }}
            style={{
              width: "100%", padding: "0.85rem 1.1rem",
              background: "transparent", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
            }}>
            <Award size={14} style={{ color: GOLD }} />
            <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "rgba(255,255,255,0.7)" }}>
              Fantasy Scoring Rules
            </span>
            <ChevronDown size={13} style={{ color: DIM, marginLeft: "auto" }} />
          </button>
          <div id="scoring-rules" style={{ display: "none" }}>
            <div style={{ padding: "0 1.1rem 1.1rem",
              display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
              gap: "0.5rem" }}>
              {[
                { group: "Base",     rules: [["Playing XI", "+4"]] },
                { group: "Batting",  rules: [["Run scored","+1"],["Four hit","+4"],["Six hit","+6"],["Duck","-2"],["25+ runs","+4"],["50+ runs","+8"],["75+ runs","+12"],["100+ runs","+16"]] },
                { group: "SR Bonus", rules: [["SR > 190","+8"],["SR > 170","+6"],["SR > 150","+4"],["SR ≥ 130","+2"],["SR 70–100","-2"],["SR 60–69","-4"],["SR 50–59","-6"]] },
                { group: "Bowling",  rules: [["Wicket","+30"],["LBW/Bowled bonus","+8"],["Dot ball","+2"],["Maiden over","+12"],["3-wkt haul","+8"],["4-wkt haul","+12"],["5+ wkt haul","+16"]] },
                { group: "Eco Bonus",rules: [["Eco < 5","+8"],["Eco < 6","+6"],["Eco ≤ 7","+4"],["Eco ≤ 8","+2"],["Eco 10–11","-2"],["Eco 11–12","-4"],["Eco > 12","-6"]] },
                { group: "Fielding", rules: [["Catch","+8"],["3+ catches","+4"],["Stumping","+12"],["Direct run-out","+10"],["Indirect run-out","+5"]] },
                { group: "Multiplier", rules: [["Captain","2×"],["Vice-Captain","1.5×"]] },
              ].map(section => (
                <div key={section.group} style={{ background: "rgba(255,255,255,0.025)",
                  border: `1px solid ${BORDER}`, borderRadius: 12, padding: "0.7rem 0.85rem" }}>
                  <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.1em",
                    textTransform: "uppercase", color: V, marginBottom: "0.5rem" }}>
                    {section.group}
                  </div>
                  {section.rules.map(([ev, pts]) => (
                    <div key={ev} style={{ display: "flex", justifyContent: "space-between",
                      alignItems: "center", padding: "0.2rem 0",
                      borderBottom: `1px solid ${BDR2}` }}>
                      <span style={{ fontSize: "0.72rem", color: DIM }}>{ev}</span>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700,
                        fontFamily: "JetBrains Mono, monospace",
                        color: pts.startsWith("+") ? "#6ee7b7"
                          : pts.startsWith("-") ? "#f87171"
                          : "#fbbf24" }}>
                        {pts}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

      </motion.div>
    </Layout>
  );
}
