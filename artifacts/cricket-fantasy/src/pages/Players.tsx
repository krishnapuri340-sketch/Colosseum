import { Layout } from "@/components/layout/Layout";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp } from "lucide-react";
import { ALL_IPL_2026_PLAYERS, getPlayerTier, TIER_CONFIG, type PlayerTier } from "@/lib/ipl-players-2026";
import { TEAM_COLOR, TEAM_LOGO, ROLE_LABEL, ALL_TEAMS, TEAM_FULL_NAME } from "@/lib/ipl-constants";

// ── Design tokens ─────────────────────────────────────────────────────
const V       = "#7C6FF7";
const CARD    = "rgba(19,23,38,0.7)";
const BORDER  = "rgba(255,255,255,0.08)";
const DIM     = "rgba(255,255,255,0.38)";
const BORDER2 = "rgba(255,255,255,0.05)";

const TIER_COLORS: Record<PlayerTier, string> = {
  T1: "#e8a020", T2: "#a89ff9", T3: "#6ee7b7", T4: "#94a3b8",
};
const TIER_LABELS: Record<PlayerTier, string> = {
  T1: "Marquee", T2: "Premium", T3: "Mid-Level", T4: "Rookie",
};
const TIERS: PlayerTier[] = ["T1", "T2", "T3", "T4"];

type SortKey  = "credits" | "name";
type ViewMode = "teams" | "all";

// ── PlayerRow — used in both team cards and flat list ─────────────────
function PlayerRow({ player, showTeam = false }: {
  player: typeof ALL_IPL_2026_PLAYERS[0];
  showTeam?: boolean;
}) {
  const tc   = TEAM_COLOR[player.team] ?? "#aaa";
  const tier = getPlayerTier(player.credits);
  const tc2  = TIER_COLORS[tier];
  const base = TIER_CONFIG[tier].basePrice;
  const baseFmt = base < 1 ? `₹${base * 100}L` : `₹${base}Cr`;

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "0.6rem 1rem",
        borderBottom: `1px solid ${BORDER2}`,
        cursor: "default",
      }}
    >
      {/* Role tag */}
      <div style={{
        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
        background: `${tc}18`, border: `1px solid ${tc}30`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "0.58rem", fontWeight: 800, color: tc, letterSpacing: "0.02em",
      }}>
        {player.role}
      </div>

      {/* Name + meta */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#fff",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {player.name}
          </span>
          {!player.capped && (
            <span style={{
              fontSize: "0.58rem", fontWeight: 700, color: "rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.06)", padding: "0 4px", borderRadius: 3, flexShrink: 0,
            }}>UC</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          {showTeam && (
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: tc }}>{player.team}</span>
          )}
          <span style={{
            fontSize: "0.62rem", fontWeight: 700, color: tc2,
            background: `${tc2}14`, padding: "0px 6px", borderRadius: 4,
          }}>
            {TIER_LABELS[tier]}
          </span>
          <span style={{ fontSize: "0.62rem", color: DIM }}>{ROLE_LABEL[player.role]}</span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: tc2,
            fontFamily: "JetBrains Mono, monospace", lineHeight: 1 }}>
            {baseFmt}
          </div>
          <div style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.22)", marginTop: 1 }}>BASE</div>
        </div>
      </div>
    </div>
  );
}

// ── TeamCard ──────────────────────────────────────────────────────────
function TeamCard({ team, players, defaultOpen, search, roleFilter, tierFilter, capFilter }: {
  team: string; players: typeof ALL_IPL_2026_PLAYERS;
  defaultOpen?: boolean; search: string;
  roleFilter: string; tierFilter: PlayerTier | "ALL"; capFilter: "all" | "capped" | "uncapped";
}) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const tc   = TEAM_COLOR[team] ?? "#aaa";
  const logo = TEAM_LOGO[team];

  const hasFilter = !!(search || roleFilter !== "ALL" || tierFilter !== "ALL" || capFilter !== "all");

  const filtered = useMemo(() => players
    .filter(p => {
      if (roleFilter !== "ALL" && p.role !== roleFilter) return false;
      if (tierFilter !== "ALL" && getPlayerTier(p.credits) !== tierFilter) return false;
      if (capFilter === "capped"   && !p.capped) return false;
      if (capFilter === "uncapped" &&  p.capped) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => b.credits - a.credits),
    [players, roleFilter, tierFilter, capFilter, search]
  );

  if (hasFilter && filtered.length === 0) return null;
  const displayPlayers = hasFilter ? filtered : [...players].sort((a, b) => b.credits - a.credits);

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      style={{
        background: CARD, borderRadius: 18, overflow: "hidden",
        border: `1px solid ${open ? `${tc}30` : BORDER}`,
        borderTop: `2px solid ${tc}`,
        backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
        transition: "border-color 0.2s",
      }}>

      {/* Header */}
      <div onClick={() => setOpen(o => !o)} className="press-sm"
        style={{
          padding: "0.85rem 1rem", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 12,
          background: open ? `${tc}08` : "transparent",
          borderBottom: open ? `1px solid ${BORDER}` : "none",
          transition: "background 0.2s",
        }}>

        {/* Logo */}
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: `${tc}15`, border: `1px solid ${tc}30`,
          display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
        }}>
          {logo
            ? <img src={logo} alt={team} style={{ width: 28, height: 28, objectFit: "contain" }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            : <span style={{ fontWeight: 800, fontSize: "0.7rem", color: tc }}>{team}</span>
          }
        </div>

        {/* Name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fff",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {TEAM_FULL_NAME[team] ?? team}
          </div>
          <div style={{ fontSize: "0.68rem", color: DIM, marginTop: 1 }}>
            {displayPlayers.length} of {players.length} players
          </div>
        </div>

        {/* Chevron */}
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {open
            ? <ChevronUp  size={13} style={{ color: DIM }} />
            : <ChevronDown size={13} style={{ color: DIM }} />}
        </div>
      </div>

      {/* Player list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}>
            {/* Column headers */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              padding: "0.4rem 1rem",
              background: "rgba(255,255,255,0.02)",
              borderBottom: `1px solid ${BORDER2}`,
            }}>
              <div style={{ width: 30, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
                Player
              </span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>CR</span>
              <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}
                className="hidden sm:block">BASE</span>
            </div>
            {displayPlayers.map(p => <PlayerRow key={p.name} player={p} />)}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────
export default function Players() {
  const [search, setSearch]     = useState("");
  const [roleFilter, setRole]   = useState("ALL");
  const [tierFilter, setTier]   = useState<PlayerTier | "ALL">("ALL");
  const [sortBy, setSort]       = useState<SortKey>("credits");
  const [showFilters, setShowF] = useState(false);
  const [capFilter, setCap]     = useState<"all" | "capped" | "uncapped">("all");
  const [viewMode, setView]     = useState<ViewMode>("teams");

  const flatFiltered = useMemo(() =>
    ALL_IPL_2026_PLAYERS
      .filter(p => {
        if (roleFilter !== "ALL" && p.role !== roleFilter) return false;
        if (tierFilter !== "ALL" && getPlayerTier(p.credits) !== tierFilter) return false;
        if (capFilter === "capped"   && !p.capped) return false;
        if (capFilter === "uncapped" &&  p.capped) return false;
        if (search) {
          const q = search.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.team.toLowerCase().includes(q)) return false;
        }
        return true;
      })
      .sort((a, b) => sortBy === "name" ? a.name.localeCompare(b.name) : b.credits - a.credits),
    [search, roleFilter, tierFilter, sortBy, capFilter]
  );

  const teamGroups = useMemo(() =>
    ALL_TEAMS.map(team => ({ team, players: ALL_IPL_2026_PLAYERS.filter(p => p.team === team) })),
    []
  );

  const hasFilter = !!(search || roleFilter !== "ALL" || tierFilter !== "ALL" || capFilter !== "all");
  const activeCount = [roleFilter !== "ALL", tierFilter !== "ALL", capFilter !== "all", !!search].filter(Boolean).length;

  return (
    <Layout>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }} className="space-y-4">

        {/* ── Header ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "clamp(1.5rem,5vw,2rem)", fontWeight: 900, color: "#fff",
              letterSpacing: "-0.03em" }}>Players</h1>
            <p style={{ margin: "0.25rem 0 0", color: DIM, fontSize: "0.85rem" }}>
              {viewMode === "teams"
                ? `${ALL_TEAMS.length} teams · ${ALL_IPL_2026_PLAYERS.length} players`
                : `${flatFiltered.length} of ${ALL_IPL_2026_PLAYERS.length} players`}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* View toggle */}
            <div className="tab-bar" style={{ padding: 3 }}>
              {(["teams", "all"] as ViewMode[]).map(v => (
                <button key={v} className={`tab-item ${viewMode === v ? "active" : ""}`}
                  onClick={() => setView(v)}
                  style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}>
                  {v === "teams" ? "By Team" : "All Players"}
                </button>
              ))}
            </div>

            {/* Search */}
            <div style={{ position: "relative", minWidth: 160 }}>
              <Search style={{
                position: "absolute", left: "0.75rem", top: "50%", transform: "translateY(-50%)",
                width: 13, height: 13, color: DIM, pointerEvents: "none",
              }} />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search players…"
                style={{
                  paddingLeft: "2.1rem", paddingRight: "0.75rem", height: 36,
                  background: "rgba(255,255,255,0.05)",
                  border: `1.5px solid ${search ? `${V}50` : BORDER}`,
                  borderRadius: 9999, color: "#fff", fontSize: "0.82rem",
                  outline: "none", fontFamily: "inherit", transition: "border-color 0.2s",
                  boxShadow: search ? `0 0 0 3px ${V}12` : "none",
                }}
                onFocus={e => (e.target as HTMLInputElement).style.borderColor = `${V}60`}
                onBlur={e => (e.target as HTMLInputElement).style.borderColor = search ? `${V}50` : BORDER}
              />
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowF(v => !v)} className="press-sm"
              style={{
                height: 36, padding: "0 0.85rem", borderRadius: 9999,
                background: showFilters ? `${V}18` : "rgba(255,255,255,0.05)",
                border: `1.5px solid ${showFilters ? `${V}45` : BORDER}`,
                color: showFilters ? "#a89ff9" : DIM,
                display: "flex", alignItems: "center", gap: 5,
                fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
                fontFamily: "inherit",
              }}>
              <SlidersHorizontal size={13} />
              <span className="hidden sm:inline">Filters</span>
              {activeCount > 0 && (
                <span style={{
                  width: 16, height: 16, borderRadius: "50%", background: V,
                  color: "#fff", fontSize: "0.6rem", fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ── Filter panel ── */}
        <AnimatePresence>
          {showFilters && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }}
              style={{
                background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18,
                padding: "1.1rem 1.25rem",
                backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              }}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">

                {/* Role */}
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Role</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {["ALL", "BAT", "BWL", "AR", "WK"].map(r => (
                      <button key={r} onClick={() => setRole(r)} className="press-sm"
                        style={{
                          padding: "4px 10px", borderRadius: 9999, fontSize: "0.72rem",
                          fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                          background: roleFilter === r ? `${V}20` : "rgba(255,255,255,0.05)",
                          color: roleFilter === r ? "#a89ff9" : DIM,
                          border: `1px solid ${roleFilter === r ? `${V}45` : BORDER}`,
                          fontFamily: "inherit",
                        }}>
                        {r === "ALL" ? "All" : r}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tier */}
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Tier</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    <button onClick={() => setTier("ALL")} className="press-sm"
                      style={{
                        padding: "4px 10px", borderRadius: 9999, fontSize: "0.72rem",
                        fontWeight: 600, cursor: "pointer",
                        background: tierFilter === "ALL" ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                        color: tierFilter === "ALL" ? "#fff" : DIM,
                        border: `1px solid ${tierFilter === "ALL" ? "rgba(255,255,255,0.2)" : BORDER}`,
                        fontFamily: "inherit",
                      }}>All</button>
                    {TIERS.map(t => (
                      <button key={t} onClick={() => setTier(t)} className="press-sm"
                        style={{
                          padding: "4px 10px", borderRadius: 9999, fontSize: "0.72rem",
                          fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                          background: tierFilter === t ? `${TIER_COLORS[t]}18` : "rgba(255,255,255,0.05)",
                          color: tierFilter === t ? TIER_COLORS[t] : DIM,
                          border: `1px solid ${tierFilter === t ? `${TIER_COLORS[t]}40` : BORDER}`,
                          fontFamily: "inherit",
                        }}>
                        {TIER_LABELS[t]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Status</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["all", "capped", "uncapped"] as const).map(c => (
                      <button key={c} onClick={() => setCap(c)} className="press-sm"
                        style={{
                          padding: "4px 10px", borderRadius: 9999, fontSize: "0.72rem",
                          fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                          background: capFilter === c ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.05)",
                          color: capFilter === c ? "#fff" : DIM,
                          border: `1px solid ${capFilter === c ? "rgba(255,255,255,0.22)" : BORDER}`,
                          fontFamily: "inherit",
                        }}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <div className="section-label" style={{ marginBottom: 8 }}>Sort</div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["credits", "name"] as SortKey[]).map(s => (
                      <button key={s} onClick={() => setSort(s)} className="press-sm"
                        style={{
                          padding: "4px 10px", borderRadius: 9999, fontSize: "0.72rem",
                          fontWeight: 600, cursor: "pointer", textTransform: "capitalize",
                          background: sortBy === s ? `${V}20` : "rgba(255,255,255,0.05)",
                          color: sortBy === s ? "#a89ff9" : DIM,
                          border: `1px solid ${sortBy === s ? `${V}45` : BORDER}`,
                          fontFamily: "inherit",
                        }}>
                        {s === "credits" ? "Credits" : "Name"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Active chips + clear */}
              {activeCount > 0 && (
                <div style={{
                  marginTop: "0.85rem", paddingTop: "0.85rem",
                  borderTop: `1px solid ${BORDER}`,
                  display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                }}>
                  <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)" }}>Active:</span>
                  {roleFilter !== "ALL" && (
                    <span className="pill pill-violet">{roleFilter}</span>
                  )}
                  {tierFilter !== "ALL" && (
                    <span style={{
                      fontSize: "0.68rem", fontWeight: 700, padding: "2px 8px", borderRadius: 9999,
                      background: `${TIER_COLORS[tierFilter]}15`, color: TIER_COLORS[tierFilter],
                      border: `1px solid ${TIER_COLORS[tierFilter]}35`,
                    }}>{TIER_LABELS[tierFilter]}</span>
                  )}
                  {capFilter !== "all" && (
                    <span className="pill" style={{ background: "rgba(255,255,255,0.07)",
                      color: "rgba(255,255,255,0.6)", border: `1px solid ${BORDER}` }}>
                      {capFilter}
                    </span>
                  )}
                  <button onClick={() => { setRole("ALL"); setTier("ALL"); setCap("all"); setSearch(""); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 3,
                      fontSize: "0.7rem", color: DIM, cursor: "pointer",
                      background: "none", border: "none", fontFamily: "inherit", marginLeft: 2,
                    }}>
                    <X size={11} /> Clear all
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── By Team ── */}
        {viewMode === "teams" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {teamGroups.map(({ team, players }) => (
              <TeamCard key={team} team={team} players={players}
                defaultOpen={hasFilter} search={search}
                roleFilter={roleFilter} tierFilter={tierFilter} capFilter={capFilter} />
            ))}
          </div>
        )}

        {/* ── All Players flat ── */}
        {viewMode === "all" && (
          <>
            {/* Role pills */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {["ALL", "BAT", "BWL", "AR", "WK"].map(r => (
                <button key={r} onClick={() => setRole(r)} className="press-sm"
                  style={{
                    padding: "0.4rem 1rem", borderRadius: 9999, fontSize: "0.8rem",
                    fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                    background: roleFilter === r ? `${V}20` : "rgba(255,255,255,0.05)",
                    color: roleFilter === r ? "#a89ff9" : DIM,
                    border: `1px solid ${roleFilter === r ? `${V}40` : BORDER}`,
                    fontFamily: "inherit",
                  }}>
                  {r === "ALL"
                    ? `All (${ALL_IPL_2026_PLAYERS.length})`
                    : `${r} (${ALL_IPL_2026_PLAYERS.filter(p => p.role === r).length})`}
                </button>
              ))}
            </div>

            <div style={{
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, overflow: "hidden",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
            }}>
              {/* Column headers */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "0.5rem 1rem",
                background: "rgba(255,255,255,0.02)",
                borderBottom: `1px solid ${BORDER}`,
              }}>
                <div style={{ width: 30, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: "0.6rem", fontWeight: 700,
                  letterSpacing: "0.1em", color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>
                  Player
                </span>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em",
                  color: "rgba(255,255,255,0.22)", textTransform: "uppercase" }}>BASE</span>
              </div>

              {flatFiltered.map(p => <PlayerRow key={p.name} player={p} showTeam />)}

              {flatFiltered.length === 0 && (
                <div style={{ padding: "3rem", textAlign: "center",
                  color: "rgba(255,255,255,0.22)", fontSize: "0.88rem" }}>
                  No players match your filters
                </div>
              )}
            </div>
          </>
        )}
      </motion.div>
    </Layout>
  );
}
