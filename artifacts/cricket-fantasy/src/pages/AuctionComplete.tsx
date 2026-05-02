import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Trophy, Crown, ArrowLeft, Users, Gavel } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { TEAM_COLOR, ROLE_LABEL, ROLE_COLOR } from "@/lib/ipl-constants";
import { getPlayerTier, TIER_CONFIG } from "@/lib/ipl-players-2026";

const ACCENT = "#c0192c";
const BDR    = "rgba(255,255,255,0.08)";
const CARD   = "rgba(255,255,255,0.04)";
const DIM    = "rgba(255,255,255,0.35)";

const AUCTION_CONFIG_KEY = "colosseum_auction_config";

interface AucTeam {
  id: string; name: string; color: string; budget: number;
  squad: { name: string; team: string; role: string; credits: number; price: number; tier: string }[];
}
interface AuctionSnapshot {
  teams: AucTeam[];
  log: unknown[];
  excludedPlayers: string[];
  roomStage: string;
}

function crFmt(n: number) {
  if (n === 0) return "₹0";
  if (n < 1)   return `₹${Math.round(n * 100)}L`;
  return n % 1 === 0 ? `₹${n}Cr` : `₹${n.toFixed(2).replace(/\.?0+$/, "")}Cr`;
}

const TD: Record<string, { label: string; color: string }> = {
  T1: { label: "Marquee",   color: "#e8a020" },
  T2: { label: "Premium",   color: "#818cf8" },
  T3: { label: "Mid-Level", color: "#34d399" },
  T4: { label: "Rookie",    color: "#94a3b8" },
};

export default function AuctionComplete() {
  const [, navigate] = useLocation();
  const [snap, setSnap] = useState<AuctionSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const config = useMemo(() => {
    try {
      const raw = localStorage.getItem(AUCTION_CONFIG_KEY);
      if (raw) return JSON.parse(raw) as { name: string; budget: number; roomCode?: string };
    } catch {}
    return { name: "Auction", budget: 100 };
  }, []);

  useEffect(() => {
    const roomCode = config.roomCode;
    if (!roomCode) {
      setError("No room code found.");
      setLoading(false);
      return;
    }
    apiFetch(`/auction/rooms/${roomCode}/state`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.stateJson) {
          setSnap(JSON.parse(data.stateJson) as AuctionSnapshot);
        } else {
          setError("No auction data found.");
        }
      })
      .catch(() => setError("Failed to load auction results."))
      .finally(() => setLoading(false));
  }, [config.roomCode]);

  const teams = snap?.teams ?? [];
  const totalSold = teams.reduce((s, t) => s + t.squad.length, 0);
  const totalSpent = teams.reduce((s, t) => s + (config.budget - t.budget), 0);

  // Sort teams by squad size desc, then budget spent desc
  const sorted = [...teams].sort((a, b) =>
    b.squad.length !== a.squad.length
      ? b.squad.length - a.squad.length
      : (config.budget - b.budget) - (config.budget - a.budget)
  );

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", height: "100%", minHeight: 0 }}>

        {/* Topbar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.7rem" }}>
            <button onClick={() => navigate("/auction")}
              style={{ background: CARD, border: `1px solid ${BDR}`, borderRadius: 9,
                padding: "0.38rem 0.65rem", color: DIM, cursor: "pointer",
                display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.78rem", fontWeight: 600 }}>
              <ArrowLeft size={12} /> Back
            </button>
            <div>
              <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.15em",
                textTransform: "uppercase", color: ACCENT }}>Auction Complete</div>
              <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
                {config.name || "Auction Results"}
              </h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.28rem 0.8rem",
            background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)", borderRadius: 20 }}>
            <Trophy size={11} style={{ color: "#22c55e" }} />
            <span style={{ fontSize: "0.65rem", fontWeight: 700, color: "#22c55e" }}>Final Results</span>
          </div>
        </div>

        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
            color: DIM, fontSize: "0.88rem" }}>
            Loading results…
          </div>
        )}

        {!loading && error && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: "0.75rem" }}>
            <Gavel size={36} style={{ color: DIM }} />
            <p style={{ margin: 0, color: DIM, fontSize: "0.9rem" }}>{error}</p>
            <button onClick={() => navigate("/auction")}
              style={{ padding: "0.65rem 1.5rem", background: ACCENT, border: "none",
                borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer" }}>
              Go to Auction
            </button>
          </div>
        )}

        {!loading && !error && snap && (
          <>
            {/* Summary strip */}
            <div style={{ display: "flex", gap: "0.6rem", flexShrink: 0, flexWrap: "wrap" }}>
              {[
                { label: "Teams",         value: String(teams.length) },
                { label: "Players Sold",  value: String(totalSold) },
                { label: "Total Spent",   value: crFmt(parseFloat(totalSpent.toFixed(2))) },
                { label: "Budget Each",   value: crFmt(config.budget) },
              ].map(s => (
                <div key={s.label} style={{ background: CARD, border: `1px solid ${BDR}`,
                  borderRadius: 10, padding: "0.6rem 0.9rem", flex: 1, minWidth: 90, textAlign: "center" }}>
                  <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.12em",
                    color: DIM, textTransform: "uppercase", marginBottom: 2 }}>{s.label}</div>
                  <div style={{ fontSize: "1rem", fontWeight: 900, color: "#fff", fontFamily: "monospace" }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Team cards */}
            <div style={{ flex: 1, overflowY: "auto", display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "0.8rem", alignContent: "start" }}>
              {sorted.map((team, rank) => {
                const spent = parseFloat((config.budget - team.budget).toFixed(2));
                const byTier = ["T1","T2","T3","T4"].map(t => ({
                  tier: t,
                  players: team.squad.filter(p => p.tier === t),
                })).filter(g => g.players.length > 0);

                return (
                  <div key={team.id} style={{ background: CARD,
                    border: `1.5px solid ${rank === 0 ? `${team.color}60` : BDR}`,
                    borderRadius: 16, overflow: "hidden" }}>

                    {/* Team header */}
                    <div style={{ padding: "0.85rem 1rem",
                      background: rank === 0 ? `${team.color}12` : "transparent",
                      borderBottom: `1px solid ${BDR}`,
                      display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {rank === 0 && <Crown size={14} style={{ color: team.color, flexShrink: 0 }} />}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.9rem", color: team.color,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {team.name}
                        </div>
                        <div style={{ display: "flex", gap: "0.5rem", marginTop: 2 }}>
                          <span style={{ fontSize: "0.65rem", color: DIM }}>
                            <Users size={9} style={{ display: "inline", marginRight: 3 }} />
                            {team.squad.length} players
                          </span>
                          <span style={{ fontSize: "0.65rem", color: "#22c55e", fontFamily: "monospace" }}>
                            {crFmt(spent)} spent
                          </span>
                          <span style={{ fontSize: "0.65rem", color: DIM, fontFamily: "monospace" }}>
                            {crFmt(team.budget)} left
                          </span>
                        </div>
                      </div>
                      {rank === 0 && (
                        <span style={{ fontSize: "0.62rem", fontWeight: 700, color: team.color,
                          background: `${team.color}18`, border: `1px solid ${team.color}35`,
                          padding: "2px 8px", borderRadius: 20, flexShrink: 0 }}>
                          Most Players
                        </span>
                      )}
                    </div>

                    {/* Players grouped by tier */}
                    <div style={{ padding: "0.6rem 0.75rem", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {team.squad.length === 0 && (
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.2)",
                          fontStyle: "italic", textAlign: "center", padding: "0.5rem 0" }}>
                          No players
                        </p>
                      )}
                      {byTier.map(({ tier, players }) => (
                        <div key={tier}>
                          <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.1em",
                            color: TD[tier]?.color ?? "#aaa", textTransform: "uppercase", marginBottom: "0.3rem" }}>
                            {TD[tier]?.label ?? tier} ({players.length})
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                            {players.map((p, i) => {
                              const tc = TEAM_COLOR[p.team] ?? "#aaa";
                              const rc = ROLE_COLOR[p.role] ?? "#aaa";
                              return (
                                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.4rem",
                                  padding: "0.28rem 0.45rem", borderRadius: 7,
                                  background: "rgba(255,255,255,0.03)" }}>
                                  <span style={{ width: 5, height: 5, borderRadius: "50%",
                                    background: TD[tier]?.color ?? "#aaa", flexShrink: 0, display: "inline-block" }} />
                                  <span style={{ fontSize: "0.72rem", color: "#fff", flex: 1,
                                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {p.name}
                                  </span>
                                  <span style={{ fontSize: "0.58rem", color: tc, flexShrink: 0 }}>{p.team}</span>
                                  <span style={{ fontSize: "0.58rem", color: rc, flexShrink: 0 }}>
                                    {ROLE_LABEL[p.role] ?? p.role}
                                  </span>
                                  <span style={{ fontSize: "0.62rem", color: "#22c55e",
                                    fontFamily: "monospace", flexShrink: 0 }}>
                                    {crFmt(p.price)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
