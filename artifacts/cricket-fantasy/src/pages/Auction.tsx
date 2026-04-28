import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Plus, ArrowRight, Hash } from "lucide-react";

const ACCENT = "#c0192c";
const INDIGO = "#818cf8";

function HostCard() {
  const [, navigate] = useLocation();

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${ACCENT}50`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${ACCENT}14`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* glow blob */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 160, height: 160,
        borderRadius: "50%", background: `${ACCENT}0d`, pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: ACCENT, background: `${ACCENT}18`, border: `1px solid ${ACCENT}35`,
          padding: "3px 10px", borderRadius: 20,
        }}>
          Host
        </span>
      </div>

      <div>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.35rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          Host a new auction
        </h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          Create a private auction room, invite friends with a code, and bid live on IPL 2026 players.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {[
          "Private room with invite code",
          "Real-time bidding",
        ].map(text => (
          <div key={text} style={{ display: "flex", alignItems: "center", gap: "0.6rem", color: "rgba(255,255,255,0.38)", fontSize: "0.78rem" }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: `${ACCENT}80`, flexShrink: 0 }} />
            {text}
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/auction/create")}
        style={{
          marginTop: "auto",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          padding: "0.85rem 1.5rem",
          background: ACCENT,
          border: "none", borderRadius: 12,
          color: "#fff", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer",
          transition: "background 0.2s, transform 0.1s",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#a8172a"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = ACCENT; }}
        onMouseDown={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
        onMouseUp={e => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        <Plus style={{ width: 16, height: 16 }} />
        Create Auction Room
      </button>
    </div>
  );
}

function JoinCard() {
  const [code, setCode] = useState("");
  const [focused, setFocused] = useState(false);
  const [joining, setJoining] = useState(false);

  const handleJoin = () => {
    if (!code.trim()) return;
    setJoining(true);
    setTimeout(() => setJoining(false), 1500);
  };

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: "rgba(255,255,255,0.035)",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: 20,
        padding: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${INDIGO}50`;
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 40px ${INDIGO}14`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.1)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* glow blob */}
      <div style={{
        position: "absolute", top: -40, right: -40, width: 160, height: 160,
        borderRadius: "50%", background: `${INDIGO}0d`, pointerEvents: "none",
      }} />

      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "flex-end" }}>
        <span style={{
          fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
          color: INDIGO, background: `${INDIGO}18`, border: `1px solid ${INDIGO}35`,
          padding: "3px 10px", borderRadius: 20,
        }}>
          Join
        </span>
      </div>

      <div>
        <h2 style={{ margin: "0 0 0.4rem", fontSize: "1.35rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
          Join with a code
        </h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.4)", fontSize: "0.875rem", lineHeight: 1.6 }}>
          Have an invite code? Enter it below to jump straight into a live or upcoming auction.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <label style={{
          fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "rgba(255,255,255,0.35)",
        }}>
          Auction Code
        </label>
        <div style={{ position: "relative" }}>
          <Hash style={{
            position: "absolute", left: "0.9rem", top: "50%", transform: "translateY(-50%)",
            width: 15, height: 15, color: focused ? INDIGO : "rgba(255,255,255,0.25)",
            transition: "color 0.2s", pointerEvents: "none",
          }} />
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))}
            onKeyDown={e => e.key === "Enter" && handleJoin()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="e.g. IPL2026A"
            maxLength={8}
            style={{
              width: "100%",
              padding: "0.9rem 1rem 0.9rem 2.5rem",
              background: "rgba(255,255,255,0.05)",
              border: `1.5px solid ${focused ? `${INDIGO}70` : "rgba(255,255,255,0.12)"}`,
              borderRadius: 12,
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              outline: "none",
              boxSizing: "border-box",
              fontFamily: "monospace",
              transition: "border-color 0.2s",
            }}
          />
        </div>
      </div>

      <button
        onClick={handleJoin}
        disabled={!code.trim() || joining}
        style={{
          marginTop: "auto",
          display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
          padding: "0.85rem 1.5rem",
          background: !code.trim() ? "rgba(129,140,248,0.15)" : INDIGO,
          border: `1.5px solid ${!code.trim() ? "rgba(129,140,248,0.2)" : INDIGO}`,
          borderRadius: 12,
          color: !code.trim() ? "rgba(129,140,248,0.45)" : "#fff",
          fontWeight: 800, fontSize: "0.9rem",
          cursor: code.trim() ? "pointer" : "default",
          transition: "all 0.2s",
          letterSpacing: "0.02em",
        }}
        onMouseEnter={e => {
          if (code.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#6366f1";
        }}
        onMouseLeave={e => {
          if (code.trim()) (e.currentTarget as HTMLButtonElement).style.background = INDIGO;
        }}
      >
        {joining ? (
          <span style={{ opacity: 0.7 }}>Joining…</span>
        ) : (
          <>
            Enter Auction <ArrowRight style={{ width: 16, height: 16 }} />
          </>
        )}
      </button>
    </div>
  );
}

export default function Auction() {
  return (
    <Layout>
      <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", gap: "2rem" }}>
        <div>
          <p style={{ margin: "0 0 0.3rem", color: ACCENT, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase" }}>
            IPL 2026
          </p>
          <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>
            Auction
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.38)", fontSize: "0.875rem" }}>
            Host a private draft or join a friend's auction room with an invite code.
          </p>
        </div>

        <div style={{
          display: "flex",
          gap: "1.25rem",
          flexWrap: "wrap",
        }}>
          <HostCard />
          <JoinCard />
        </div>
      </div>
    </Layout>
  );
}
