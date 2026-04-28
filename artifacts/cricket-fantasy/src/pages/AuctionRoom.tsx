/**
 * AuctionRoom.tsx — Live auction experience
 * The centrepiece. Host nominates a player, everyone bids, highest wins.
 * Fully self-contained with simulated state — wire socket/Supabase realtime to replace timers.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { 
  Gavel, Timer, Trophy, Users, ArrowLeft, ChevronRight, 
  CheckCircle, XCircle, Zap, Crown, Wallet, Clock
} from "lucide-react";
import { IPL_2026_PLAYERS, TEAM_COLOR, TEAM_FULL_NAME, ROLE_LABEL, ROLE_COLOR, ROLE_ICON } from "@/lib/ipl-constants";

// ── Types ────────────────────────────────────────────────────────────
interface AuctionPlayer {
  name: string; team: string; role: string; credits: number;
}

interface Bid {
  bidder: string; color: string; amount: number; ts: number;
}

interface AuctionLogEntry {
  player: AuctionPlayer; winner: string; winnerColor: string; price: number; status: "sold" | "unsold";
}

interface SquadPlayer extends AuctionPlayer {
  purchasePrice: number; isCaptain: boolean; isVC: boolean;
}

interface TeamState {
  name: string; color: string; budget: number; squad: SquadPlayer[];
}

// ── Helpers ──────────────────────────────────────────────────────────
const ACCENT    = "#c0192c";
const C = { border: "rgba(255,255,255,0.08)", card: "rgba(255,255,255,0.04)", dim: "rgba(255,255,255,0.35)" };

const TEAMS: TeamState[] = [
  { name: "Rajveer's Army",   color: "#c0392b", budget: 100, squad: [] },
  { name: "Karan's XI",       color: "#3b82f6", budget: 100, squad: [] },
  { name: "Arjun Plays",      color: "#a855f7", budget: 100, squad: [] },
  { name: "Sahil FC",         color: "#f59e0b", budget: 100, squad: [] },
];

const MY_TEAM = TEAMS[0];
const BID_INCREMENT = 0.5; // crores

function fmt(n: number) { return n % 1 === 0 ? `₹${n}cr` : `₹${n.toFixed(1)}cr`; }

function TeamBudgetBar({ team }: { team: TeamState }) {
  const pct = Math.round((team.budget / 100) * 100);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: team.color }}>{team.name.split("'")[0]}</span>
        <span style={{ fontSize: "0.72rem", fontFamily: "monospace", color: C.dim }}>{fmt(team.budget)}</span>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
        <div style={{ height: "100%", borderRadius: 2, width: `${pct}%`, background: team.color, transition: "width 0.4s ease" }} />
      </div>
      <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.25)" }}>{team.squad.length} players</div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────
export default function AuctionRoom() {
  const [, navigate] = useLocation();

  // Pool — shuffle for randomness
  const poolRef = useRef<AuctionPlayer[]>([...IPL_2026_PLAYERS].sort(() => Math.random() - 0.5));
  const [poolIdx, setPoolIdx]       = useState(0);
  const [phase, setPhase]           = useState<"waiting" | "reveal" | "bidding" | "sold" | "unsold">("waiting");
  const [currentPlayer, setCurrentPlayer] = useState<AuctionPlayer | null>(null);
  const [bidHistory, setBidHistory] = useState<Bid[]>([]);
  const [currentBid, setCurrentBid] = useState(0);
  const [topBidder, setTopBidder]   = useState<{ name: string; color: string } | null>(null);
  const [timer, setTimer]           = useState(20);
  const [teams, setTeams]           = useState<TeamState[]>(TEAMS.map(t => ({ ...t, squad: [] })));
  const [log, setLog]               = useState<AuctionLogEntry[]>([]);
  const [myBid, setMyBid]           = useState<number | null>(null);
  const [isBidding, setIsBidding]   = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = () => { if (timerRef.current) clearInterval(timerRef.current); };

  // Simulate AI bids from other teams
  const scheduleAIBid = useCallback((afterMs: number, currentAmt: number) => {
    setTimeout(() => {
      setPhase(p => {
        if (p !== "bidding") return p;
        const aiTeams = teams.filter(t => t.name !== MY_TEAM.name && t.budget > currentAmt + BID_INCREMENT);
        if (aiTeams.length === 0 || Math.random() < 0.3) return p; // 30% chance AI doesn't bid
        const bidder = aiTeams[Math.floor(Math.random() * aiTeams.length)];
        const newAmt = parseFloat((currentAmt + BID_INCREMENT + Math.random() * BID_INCREMENT).toFixed(1));
        setBidHistory(h => [{ bidder: bidder.name, color: bidder.color, amount: newAmt, ts: Date.now() }, ...h.slice(0, 19)]);
        setCurrentBid(newAmt);
        setTopBidder({ name: bidder.name, color: bidder.color });
        setTimer(15);
        scheduleAIBid(3000 + Math.random() * 4000, newAmt);
        return p;
      });
    }, afterMs);
  }, [teams]);

  function nominateNext() {
    const pool = poolRef.current;
    if (poolIdx >= pool.length) return;
    const player = pool[poolIdx];
    setCurrentPlayer(player);
    setPhase("reveal");
    setBidHistory([]);
    setCurrentBid(player.credits * 0.8); // base price ~80% of credits
    setTopBidder(null);
    setMyBid(null);
    setTimer(20);

    setTimeout(() => {
      setPhase("bidding");
      setTimer(20);
      scheduleAIBid(3000 + Math.random() * 3000, player.credits * 0.8);
    }, 1800);
  }

  // Countdown during bidding
  useEffect(() => {
    if (phase !== "bidding") return;
    clearTimer();
    timerRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearTimer();
          // Resolve
          if (topBidder) {
            setPhase("sold");
            if (currentPlayer) {
              const winner = topBidder;
              setTeams(prev => prev.map(team =>
                team.name === winner.name
                  ? { ...team, budget: parseFloat((team.budget - currentBid).toFixed(1)), squad: [...team.squad, { ...currentPlayer, purchasePrice: currentBid, isCaptain: false, isVC: false }] }
                  : team
              ));
              setLog(prev => [{ player: currentPlayer, winner: winner.name, winnerColor: winner.color, price: currentBid, status: "sold" }, ...prev]);
            }
          } else {
            setPhase("unsold");
            if (currentPlayer) setLog(prev => [{ player: currentPlayer, winner: "", winnerColor: "", price: 0, status: "unsold" }, ...prev]);
          }
          setPoolIdx(i => i + 1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return clearTimer;
  }, [phase, topBidder, currentBid, currentPlayer]);

  function placeBid() {
    if (!currentPlayer || phase !== "bidding") return;
    const myTeam = teams.find(t => t.name === MY_TEAM.name)!;
    const newBid = parseFloat((currentBid + BID_INCREMENT).toFixed(1));
    if (myTeam.budget < newBid) return;
    setIsBidding(true);
    setTimeout(() => setIsBidding(false), 400);
    setMyBid(newBid);
    setBidHistory(h => [{ bidder: MY_TEAM.name, color: MY_TEAM.color, amount: newBid, ts: Date.now() }, ...h.slice(0, 19)]);
    setCurrentBid(newBid);
    setTopBidder({ name: MY_TEAM.name, color: MY_TEAM.color });
    setTimer(15);
    scheduleAIBid(3000 + Math.random() * 4000, newBid);
  }

  function markUnsold() {
    if (!currentPlayer) return;
    clearTimer();
    setPhase("unsold");
    setLog(prev => [{ player: currentPlayer, winner: "", winnerColor: "", price: 0, status: "unsold" }, ...prev]);
    setPoolIdx(i => i + 1);
  }

  const pool = poolRef.current;
  const myTeamState = teams.find(t => t.name === MY_TEAM.name)!;
  const remaining = pool.length - poolIdx;

  const timerPct = (timer / 20) * 100;
  const timerColor = timer > 10 ? "#22c55e" : timer > 5 ? "#f59e0b" : "#ef4444";

  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", height: "100%" }}>

        {/* ── Header ── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => navigate("/auction")}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: "0.45rem 0.8rem", color: C.dim, cursor: "pointer", display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", fontWeight: 600 }}
            >
              <ArrowLeft style={{ width: 13, height: 13 }} /> Back
            </button>
            <div>
              <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT }}>Live Auction</p>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>Friday Night Draft</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <div style={{ padding: "0.4rem 0.9rem", background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", borderRadius: 20, display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 6px #22c55e", animation: "pulse 1.4s ease-in-out infinite" }} />
              <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#22c55e", letterSpacing: "0.08em" }}>LIVE</span>
            </div>
            <span style={{ fontSize: "0.8rem", color: C.dim }}>{remaining} players left</span>
          </div>
        </div>

        {/* ── Main 3-col grid ── */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: "1rem", flex: 1, minHeight: 0 }}>

          {/* ── LEFT: Team budgets ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.dim, textTransform: "uppercase" }}>Team Budgets</p>
            {teams.map(team => (
              <div key={team.name} style={{ background: team.name === MY_TEAM.name ? `${team.color}0d` : C.card, border: `1px solid ${team.name === MY_TEAM.name ? `${team.color}30` : C.border}`, borderRadius: 12, padding: "0.85rem 1rem" }}>
                <TeamBudgetBar team={team} />
              </div>
            ))}

            {/* My squad mini */}
            <div style={{ marginTop: "0.5rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.dim, textTransform: "uppercase" }}>My Squad ({myTeamState.squad.length})</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxHeight: 280, overflowY: "auto" }}>
                {myTeamState.squad.length === 0
                  ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No players yet</p>
                  : myTeamState.squad.map((p, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.4rem 0.7rem", background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${C.border}` }}>
                      <span style={{ fontSize: "0.72rem", color: TEAM_COLOR[p.team] ?? "#aaa", fontWeight: 700, minWidth: 30 }}>{p.team}</span>
                      <span style={{ fontSize: "0.75rem", color: "#fff", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</span>
                      <span style={{ fontSize: "0.7rem", color: C.dim, fontFamily: "monospace" }}>{fmt(p.purchasePrice)}</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>

          {/* ── CENTRE: Player stage + bidding ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Player card */}
            <div style={{
              flex: 1, background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "2rem", position: "relative", overflow: "hidden", minHeight: 280,
              transition: "border-color 0.3s",
              ...(topBidder?.name === MY_TEAM.name ? { borderColor: `${MY_TEAM.color}50`, boxShadow: `0 0 40px ${MY_TEAM.color}14` } : {}),
            }}>

              {phase === "waiting" && (
                <div style={{ textAlign: "center" }}>
                  <Gavel style={{ width: 48, height: 48, color: "rgba(255,255,255,0.15)", marginBottom: "1rem" }} />
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Auction Not Started</p>
                  <p style={{ margin: "0.4rem 0 1.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.2)" }}>All teams ready — host to begin</p>
                  <button
                    onClick={nominateNext}
                    style={{ padding: "0.9rem 2rem", background: ACCENT, border: "none", borderRadius: 12, color: "#fff", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer" }}
                  >
                    Start Auction ⚔️
                  </button>
                </div>
              )}

              {(phase === "reveal" || phase === "bidding") && currentPlayer && (
                <>
                  {/* Team colour strip */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: TEAM_COLOR[currentPlayer.team] ?? "#aaa", opacity: 0.7 }} />

                  <div style={{ position: "absolute", top: 12, right: 16, fontSize: "0.68rem", fontWeight: 700, color: TEAM_COLOR[currentPlayer.team] ?? "#aaa", letterSpacing: "0.1em", background: `${TEAM_COLOR[currentPlayer.team] ?? "#aaa"}18`, padding: "3px 10px", borderRadius: 20 }}>
                    {currentPlayer.team} · {TEAM_FULL_NAME[currentPlayer.team]}
                  </div>

                  {/* Avatar */}
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${TEAM_COLOR[currentPlayer.team] ?? "#aaa"}22`, border: `2px solid ${TEAM_COLOR[currentPlayer.team] ?? "#aaa"}50`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", marginBottom: "1rem" }}>
                    {ROLE_ICON[currentPlayer.role] ?? "🏏"}
                  </div>

                  <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", textAlign: "center" }}>{currentPlayer.name}</p>
                  <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: C.dim }}>{ROLE_LABEL[currentPlayer.role] ?? currentPlayer.role} · {currentPlayer.credits} credits</p>

                  {phase === "bidding" && (
                    <>
                      {/* Timer ring */}
                      <div style={{ position: "absolute", bottom: 16, right: 16, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <Clock style={{ width: 13, height: 13, color: timerColor }} />
                        <span style={{ fontSize: "1rem", fontWeight: 900, color: timerColor, fontFamily: "monospace" }}>{timer}s</span>
                      </div>
                      {/* Timer bar */}
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.06)" }}>
                        <div style={{ height: "100%", background: timerColor, width: `${timerPct}%`, transition: "width 1s linear, background 0.5s" }} />
                      </div>
                    </>
                  )}
                </>
              )}

              {phase === "sold" && currentPlayer && (
                <div style={{ textAlign: "center" }}>
                  <CheckCircle style={{ width: 52, height: 52, color: "#22c55e", marginBottom: "0.75rem" }} />
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff" }}>{currentPlayer.name}</p>
                  <p style={{ margin: "0.3rem 0 0.1rem", fontSize: "1.1rem", fontWeight: 700, color: topBidder?.color ?? "#22c55e" }}>{topBidder?.name}</p>
                  <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#22c55e" }}>{fmt(currentBid)}</p>
                  <button onClick={nominateNext} style={{ marginTop: "1.2rem", padding: "0.75rem 1.8rem", background: ACCENT, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
                    Next Player <ChevronRight style={{ width: 14, height: 14, display: "inline" }} />
                  </button>
                </div>
              )}

              {phase === "unsold" && currentPlayer && (
                <div style={{ textAlign: "center" }}>
                  <XCircle style={{ width: 52, height: 52, color: "#ef4444", marginBottom: "0.75rem" }} />
                  <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "rgba(255,255,255,0.6)" }}>{currentPlayer.name}</p>
                  <p style={{ margin: "0.3rem 0 0", fontSize: "0.9rem", color: "rgba(255,255,255,0.3)" }}>Unsold — returns to pool</p>
                  <button onClick={nominateNext} style={{ marginTop: "1.2rem", padding: "0.75rem 1.8rem", background: "rgba(255,255,255,0.07)", border: `1px solid ${C.border}`, borderRadius: 10, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
                    Next Player
                  </button>
                </div>
              )}
            </div>

            {/* Bid controls */}
            {phase === "bidding" && (
              <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                {/* Current bid display */}
                <div style={{ flex: 1, background: topBidder?.name === MY_TEAM.name ? `${MY_TEAM.color}14` : C.card, border: `1px solid ${topBidder?.name === MY_TEAM.name ? `${MY_TEAM.color}40` : C.border}`, borderRadius: 14, padding: "0.85rem 1.2rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                  <span style={{ fontSize: "0.68rem", color: C.dim, letterSpacing: "0.1em", textTransform: "uppercase" }}>Current Bid</span>
                  <span style={{ fontSize: "1.8rem", fontWeight: 900, color: topBidder?.color ?? "#fff", fontFamily: "monospace" }}>{fmt(currentBid)}</span>
                  {topBidder && <span style={{ fontSize: "0.75rem", color: topBidder.color }}>{topBidder.name}</span>}
                </div>

                {/* My bid button */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <button
                    onClick={placeBid}
                    disabled={isBidding || myTeamState.budget < currentBid + BID_INCREMENT}
                    style={{
                      padding: "1rem 1.8rem", background: myTeamState.budget < currentBid + BID_INCREMENT ? "rgba(192,25,44,0.1)" : ACCENT,
                      border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: "1rem",
                      cursor: myTeamState.budget < currentBid + BID_INCREMENT ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", gap: "0.5rem", opacity: isBidding ? 0.7 : 1,
                      transition: "all 0.15s",
                    }}
                  >
                    <Gavel style={{ width: 18, height: 18 }} />
                    Bid {fmt(currentBid + BID_INCREMENT)}
                  </button>
                  <button
                    onClick={markUnsold}
                    style={{ padding: "0.5rem 1rem", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, color: C.dim, fontSize: "0.78rem", cursor: "pointer", fontWeight: 600 }}
                  >
                    Mark Unsold
                  </button>
                </div>
              </div>
            )}

            {/* Bid history */}
            {phase === "bidding" && bidHistory.length > 0 && (
              <div style={{ maxHeight: 120, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                {bidHistory.map((b, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.35rem 0.75rem", background: i === 0 ? `${b.color}14` : "transparent", borderRadius: 8, border: i === 0 ? `1px solid ${b.color}30` : "1px solid transparent", transition: "all 0.2s" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: 700, color: b.color }}>{b.bidder.split("'")[0]}</span>
                    <span style={{ fontSize: "0.72rem", color: C.dim, flex: 1 }}>placed a bid</span>
                    <span style={{ fontSize: "0.8rem", fontWeight: 800, color: b.color, fontFamily: "monospace" }}>{fmt(b.amount)}</span>
                    {i === 0 && <Zap style={{ width: 12, height: 12, color: b.color }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Auction log ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", overflowY: "auto" }}>
            <p style={{ margin: 0, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.12em", color: C.dim, textTransform: "uppercase" }}>Auction Log</p>
            {log.length === 0
              ? <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.2)", fontStyle: "italic" }}>No sales yet</p>
              : log.map((entry, i) => (
                <div key={i} style={{ background: C.card, border: `1px solid ${entry.status === "sold" ? `${entry.winnerColor}25` : C.border}`, borderRadius: 10, padding: "0.7rem 0.9rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.2rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{entry.player.name}</span>
                    {entry.status === "sold"
                      ? <span style={{ fontSize: "0.8rem", fontWeight: 800, color: "#22c55e", fontFamily: "monospace" }}>{fmt(entry.price)}</span>
                      : <span style={{ fontSize: "0.7rem", color: "#ef4444", fontWeight: 700 }}>UNSOLD</span>
                    }
                  </div>
                  {entry.status === "sold" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <Crown style={{ width: 10, height: 10, color: entry.winnerColor }} />
                      <span style={{ fontSize: "0.7rem", color: entry.winnerColor, fontWeight: 600 }}>{entry.winner}</span>
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.3rem" }}>
                    <span style={{ fontSize: "0.62rem", color: TEAM_COLOR[entry.player.team] ?? "#aaa", background: `${TEAM_COLOR[entry.player.team] ?? "#aaa"}18`, padding: "1px 6px", borderRadius: 4 }}>{entry.player.team}</span>
                    <span style={{ fontSize: "0.62rem", color: C.dim, background: "rgba(255,255,255,0.06)", padding: "1px 6px", borderRadius: 4 }}>{ROLE_LABEL[entry.player.role]}</span>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </Layout>
  );
}
