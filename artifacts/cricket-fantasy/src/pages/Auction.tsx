import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Plus, ArrowRight, Hash, Play, Users, Calendar } from "lucide-react";

const ACCENT = "#c0192c";
const INDIGO  = "#818cf8";

const MY_AUCTIONS = [
  { id: "a1", name: "Friday Night Draft", participants: 4, playersLeft: 28, status: "live",     code: "FND2026" },
  { id: "a2", name: "Office League S2",   participants: 6, playersLeft: 0,  status: "complete", code: "OLS2026" },
];

function HostCard() {
  const [, navigate] = useLocation();
  return (
    <div
      style={{ flex: 1, minHeight: 380, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${ACCENT}50`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 60px ${ACCENT}14`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: `${ACCENT}08`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: ACCENT, background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`, padding: "4px 12px", borderRadius: 20 }}>Host</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>Host a new auction</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 360 }}>
          Create a private auction room, invite friends with a code, and bid live on IPL 2026 players.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.55rem", marginTop: "0.25rem" }}>
          {["Private room — invite by code", "Real-time competitive bidding", "Sim AI bids while friends join", "Full auction log & squad tracker"].map(text => (
            <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.55rem", color: "rgba(255,255,255,0.38)", fontSize: "0.85rem" }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: `${ACCENT}80`, flexShrink: 0 }} />
              {text}
            </div>
          ))}
        </div>
      </div>
      <button
        onClick={() => navigate("/auction/create")}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem", padding: "1rem 1.8rem", background: ACCENT, border: "none", borderRadius: 14, color: "#fff", fontWeight: 800, fontSize: "0.95rem", cursor: "pointer", transition: "background 0.2s" }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#a8172a"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ACCENT; }}
      >
        <Plus style={{ width: 17, height: 17 }} /> Create Auction Room
      </button>
    </div>
  );
}

function JoinCard() {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [joining, setJoining] = useState(false);
  const [, navigate] = useLocation();

  const handleJoin = () => {
    if (!code.trim()) return;
    setJoining(true);
    setTimeout(() => { setJoining(false); navigate("/auction/room"); }, 800);
  };

  return (
    <div
      style={{ flex: 1, minHeight: 380, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 24, padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.5rem", position: "relative", overflow: "hidden", transition: "border-color 0.2s, box-shadow 0.2s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = `${INDIGO}50`; (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 60px ${INDIGO}14`; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLDivElement).style.boxShadow = "none"; }}
    >
      <div style={{ position: "absolute", top: -60, right: -60, width: 260, height: 260, borderRadius: "50%", background: `${INDIGO}08`, pointerEvents: "none" }} />
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: INDIGO, background: `${INDIGO}18`, border: `1px solid ${INDIGO}35`, padding: "4px 12px", borderRadius: 20 }}>Join</span>
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.85rem" }}>
        <h2 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1.1 }}>Join with a code</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.95rem", lineHeight: 1.7, maxWidth: 360 }}>
          Have an invite code from a friend? Enter it below to jump into their auction room.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginTop: "0.5rem" }}>
          <label style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>Auction Code</label>
          <div style={{ position: "relative" }}>
            <Hash style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)", width: 17, height: 17, color: focused ? INDIGO : "rgba(255,255,255,0.22)", transition: "color 0.2s", pointerEvents: "none" }} />
            <input
              type="text" value={code}
              onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
              onKeyDown={e => e.key === "Enter" && handleJoin()}
              onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
              placeholder="e.g. FND2026" maxLength={8}
              style={{ width: "100%", padding: "1rem 1.2rem 1rem 2.8rem", background: "rgba(255,255,255,0.05)", border: `1.5px solid ${focused ? `${INDIGO}70` : "rgba(255,255,255,0.12)"}`, borderRadius: 14, color: "#fff", fontSize: "1.2rem", fontWeight: 800, letterSpacing: "0.2em", outline: "none", boxSizing: "border-box", fontFamily: "monospace", transition: "border-color 0.2s" }}
            />
          </div>
        </div>
      </div>
      <button
        onClick={handleJoin} disabled={!code.trim() || joining}
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.55rem", padding: "1rem 1.8rem", background: !code.trim() ? "rgba(129,140,248,0.15)" : INDIGO, border: `1.5px solid ${!code.trim() ? "rgba(129,140,248,0.2)" : INDIGO}`, borderRadius: 14, color: !code.trim() ? "rgba(129,140,248,0.4)" : "#fff", fontWeight: 800, fontSize: "0.95rem", cursor: code.trim() ? "pointer" : "default", transition: "all 0.2s" }}
      >
        {joining ? "Joining…" : <><span>Enter Auction</span><ArrowRight style={{ width: 17, height: 17 }} /></>}
      </button>
    </div>
  );
}

export default function Auction() {
  const [, navigate] = useLocation();
  return (
    <Layout>
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <p style={{ margin: "0 0 0.3rem", color: ACCENT, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>IPL 2026</p>
          <h1 style={{ margin: 0, fontSize: "2.1rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>Auction</h1>
          <p style={{ margin: "0.35rem 0 0", color: "rgba(255,255,255,0.38)", fontSize: "0.92rem" }}>Host a private draft or join a friend's room with an invite code.</p>
        </div>

        {/* Active rooms */}
        {MY_AUCTIONS.length > 0 && (
          <div>
            <p style={{ margin: "0 0 0.6rem", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>My Rooms</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {MY_AUCTIONS.map(room => (
                <div key={room.id}
                  onClick={() => room.status === "live" && navigate("/auction/room")}
                  style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.1rem", background: room.status === "live" ? "rgba(192,25,44,0.07)" : "rgba(255,255,255,0.03)", border: `1px solid ${room.status === "live" ? "rgba(192,25,44,0.25)" : "rgba(255,255,255,0.08)"}`, borderRadius: 12, cursor: room.status === "live" ? "pointer" : "default", transition: "all 0.15s" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: room.status === "live" ? "rgba(192,25,44,0.15)" : "rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {room.status === "live" ? <Play style={{ width: 15, height: 15, color: ACCENT }} /> : <Calendar style={{ width: 15, height: 15, color: "rgba(255,255,255,0.3)" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#fff" }}>{room.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.1rem", display: "flex", gap: "0.6rem" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}><Users style={{ width: 10, height: 10 }} /> {room.participants} teams</span>
                      <span>Code: <b style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)" }}>{room.code}</b></span>
                    </div>
                  </div>
                  {room.status === "live" && (
                    <span style={{ fontSize: "0.7rem", fontWeight: 700, color: ACCENT, background: "rgba(192,25,44,0.15)", padding: "3px 10px", borderRadius: 20, display: "flex", alignItems: "center", gap: "0.35rem" }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: ACCENT, animation: "pulse 1.4s ease-in-out infinite" }} /> LIVE
                    </span>
                  )}
                  {room.status === "complete" && <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>Ended</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: "1.5rem" }}>
          <HostCard />
          <JoinCard />
        </div>

        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
      </div>
    </Layout>
  );
}
