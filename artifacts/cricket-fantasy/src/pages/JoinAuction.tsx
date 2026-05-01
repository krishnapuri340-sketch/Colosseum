/**
 * JoinAuction.tsx
 * 1. Enter code  →  2. Preview room  →  3. Enter team name  →  4. Auction Room
 *
 * On "Join": saves the fetched room config to localStorage so AuctionRoom picks it up.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  Hash, ArrowLeft, ArrowRight, Users, CheckCircle,
  Copy, AlertCircle, ChevronRight,
} from "lucide-react";
import { apiFetch } from "@/lib/api";

type Step = "code" | "preview";

interface RoomData {
  code:            string;
  name:            string;
  budget:          number;
  maxPlayers:      number;
  format:          string;
  topScoring:      boolean;
  topScoringCount: number;
  captainVC:       boolean;
}

const C = {
  card:   "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  dim:    "rgba(255,255,255,0.35)",
};
const ACCENT = "#c0192c";

export default function JoinAuction() {
  const [, navigate] = useLocation();

  const [step, setStep]         = useState<Step>("code");
  const [code, setCode]         = useState("");
  const [teamName, setTeamName] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [room, setRoom]         = useState<RoomData | null>(null);
  const [error, setError]       = useState("");
  const [copied, setCopied]     = useState(false);

  // ── Step 1: look up room by code ─────────────────────────────────
  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 4) return;
    setLoading(true);
    setError("");
    try {
      const res = await apiFetch(`/auction/rooms/${trimmed}`);
      if (!res.ok) {
        setError(res.status === 404
          ? "No room found for that code. Double-check with your host."
          : "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      const data = await res.json() as { room: RoomData };
      setRoom(data.room);
      setStep("preview");
    } catch {
      setError("Could not reach the server. Check your connection.");
    }
    setLoading(false);
  }

  // ── Step 2: join with a team name → save config → navigate ───────
  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim() || !room) return;
    // Save room config for AuctionRoom to read
    try {
      localStorage.setItem("colosseum_auction_config", JSON.stringify({
        name:            room.name,
        budget:          room.budget,
        maxPlayers:      room.maxPlayers,
        format:          room.format,
        topScoring:      room.topScoring,
        topScoringCount: room.topScoringCount,
        captainVC:       room.captainVC,
        teamName:        teamName.trim(),
      }));
    } catch { /* ignore storage errors */ }
    navigate("/auction/room");
  }

  function copyCode() {
    navigator.clipboard?.writeText(room?.code ?? code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // ── STEP 1: Enter code ───────────────────────────────────────────
  if (step === "code") {
    return (
      <Layout>
        <div style={{ maxWidth: 460, margin: "0 auto", paddingTop: "2rem" }}>
          <button onClick={() => navigate("/auction")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem",
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 9,
              padding: "0.45rem 0.85rem", color: C.dim, cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, marginBottom: "1.5rem" }}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> Back
          </button>

          <div style={{ marginBottom: "2rem" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.15em",
              color: ACCENT, textTransform: "uppercase", marginBottom: "0.4rem" }}>Auction</div>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#fff",
              letterSpacing: "-0.03em" }}>Join with a Code</h1>
            <p style={{ margin: "0.4rem 0 0", color: C.dim, fontSize: "0.9rem" }}>
              Enter the invite code your host shared to jump into their auction room.
            </p>
          </div>

          <form onSubmit={handleCodeSubmit}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
              padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
                color: C.dim, textTransform: "uppercase", display: "block", marginBottom: "0.75rem" }}>
                Auction Code
              </label>
              <div style={{ position: "relative" }}>
                <Hash style={{ position: "absolute", left: "1rem", top: "50%",
                  transform: "translateY(-50%)", width: 18, height: 18,
                  color: code ? "#818cf8" : C.dim, pointerEvents: "none" }} />
                <input
                  type="text"
                  value={code}
                  onChange={e => {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
                    setError("");
                  }}
                  placeholder="e.g. FND2026"
                  autoFocus
                  style={{ width: "100%", boxSizing: "border-box",
                    padding: "1.1rem 1.2rem 1.1rem 3rem",
                    background: "rgba(255,255,255,0.06)",
                    border: `2px solid ${error ? "rgba(192,25,44,0.55)" : code ? "rgba(129,140,248,0.5)" : C.border}`,
                    borderRadius: 14, color: "#fff",
                    fontSize: "1.4rem", fontWeight: 800, letterSpacing: "0.25em",
                    outline: "none", fontFamily: "monospace",
                    transition: "border-color 0.2s" }}
                />
              </div>
              {error && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem",
                  marginTop: "0.65rem", color: "#f87171", fontSize: "0.82rem" }}>
                  <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
                  {error}
                </div>
              )}
            </div>

            <button type="submit" disabled={code.length < 4 || loading}
              style={{ padding: "1rem", borderRadius: 12, border: "none",
                background: code.length >= 4 ? "#818cf8" : "rgba(129,140,248,0.15)",
                color: code.length >= 4 ? "#fff" : "rgba(255,255,255,0.25)",
                fontWeight: 800, fontSize: "0.95rem",
                cursor: code.length >= 4 ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
                transition: "all 0.2s" }}>
              {loading
                ? "Looking up room…"
                : <><span>Find Room</span><ArrowRight style={{ width: 16, height: 16 }} /></>}
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  // ── STEP 2: Preview + join ───────────────────────────────────────
  if (step === "preview" && room) {
    const formatLabel = room.format === "tier" ? "Tier-Based" : "Classic";
    return (
      <Layout>
        <div style={{ maxWidth: 520, margin: "0 auto", paddingTop: "2rem",
          display: "flex", flexDirection: "column", gap: "1rem" }}>
          <button onClick={() => setStep("code")}
            style={{ display: "flex", alignItems: "center", gap: "0.4rem",
              background: C.card, border: `1px solid ${C.border}`, borderRadius: 9,
              padding: "0.45rem 0.85rem", color: C.dim, cursor: "pointer",
              fontSize: "0.8rem", fontWeight: 600, alignSelf: "flex-start" }}>
            <ArrowLeft style={{ width: 13, height: 13 }} /> Back
          </button>

          {/* Room found banner */}
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)",
            borderRadius: 12, padding: "0.85rem 1.1rem",
            display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <CheckCircle style={{ width: 16, height: 16, color: "#22c55e", flexShrink: 0 }} />
            <span style={{ fontSize: "0.85rem", color: "#22c55e", fontWeight: 600 }}>
              Room found!
            </span>
          </div>

          {/* Room card */}
          <div style={{ background: C.card, border: `1px solid ${C.border}`,
            borderRadius: 20, padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "flex-start",
              justifyContent: "space-between", marginBottom: "1.25rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "#fff",
                  letterSpacing: "-0.03em" }}>{room.name}</h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem",
                  marginTop: "0.3rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.68rem", color: "#22c55e",
                    background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)",
                    padding: "2px 8px", borderRadius: 20, fontWeight: 700,
                    display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e" }} />
                    LOBBY OPEN
                  </span>
                </div>
              </div>
              <button onClick={copyCode}
                style={{ display: "flex", alignItems: "center", gap: "0.35rem",
                  padding: "0.4rem 0.85rem", background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${C.border}`, borderRadius: 9, color: C.dim,
                  fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
                <Copy style={{ width: 12, height: 12 }} />
                {copied ? "Copied!" : room.code}
              </button>
            </div>

            {/* Config chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.45rem" }}>
              {[
                `${room.maxPlayers} players / team`,
                `₹${room.budget}Cr budget`,
                formatLabel,
                room.captainVC ? "C/VC on" : "No C/VC",
                ...(room.topScoring ? [`Top ${room.topScoringCount} count`] : []),
              ].map(label => (
                <div key={label} style={{ padding: "0.3rem 0.75rem",
                  background: "rgba(255,255,255,0.05)", border: `1px solid ${C.border}`,
                  borderRadius: 20, fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Team name + join */}
          <form onSubmit={handleJoin}
            style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20,
              padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em",
                color: C.dim, textTransform: "uppercase", display: "block", marginBottom: "0.65rem" }}>
                Your Team Name
              </label>
              <input
                type="text"
                value={teamName}
                onChange={e => setTeamName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                maxLength={30}
                placeholder="e.g. Sahil FC"
                autoFocus
                style={{ width: "100%", boxSizing: "border-box",
                  padding: "0.9rem 1rem",
                  background: nameFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${nameFocused ? "rgba(129,140,248,0.5)" : C.border}`,
                  borderRadius: 12, color: "#fff", fontSize: "1rem", outline: "none",
                  transition: "border-color 0.2s" }} />
            </div>
            <button type="submit" disabled={!teamName.trim()}
              style={{ padding: "0.95rem", borderRadius: 12, border: "none",
                background: teamName.trim() ? ACCENT : "rgba(192,25,44,0.15)",
                color: teamName.trim() ? "#fff" : "rgba(255,255,255,0.25)",
                fontWeight: 800, fontSize: "0.95rem",
                cursor: teamName.trim() ? "pointer" : "default",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}>
              <Users style={{ width: 16, height: 16 }} />
              <span>Enter Auction Room</span>
              <ChevronRight style={{ width: 15, height: 15 }} />
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  return null;
}
