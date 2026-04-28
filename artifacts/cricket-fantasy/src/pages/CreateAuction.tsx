import { useState } from "react";
import { useLocation } from "wouter";
import { X, ChevronRight } from "lucide-react";

const ACCENT = "#c0192c";
const CARD_BG = "rgba(12,14,28,0.97)";
const BORDER = "rgba(255,255,255,0.09)";
const LABEL_COLOR = "rgba(255,255,255,0.38)";
const focusBorder = "rgba(192,25,44,0.55)";
const blurBorder = "rgba(255,255,255,0.1)";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: "0.67rem", fontWeight: 700, letterSpacing: "0.1em",
      textTransform: "uppercase", color: LABEL_COLOR,
    }}>
      {children}
    </span>
  );
}

function StyledInput({
  value, onChange, placeholder, type = "text",
}: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: "100%", boxSizing: "border-box",
        padding: "0.75rem 1rem",
        background: focused ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.04)",
        border: `1.5px solid ${focused ? focusBorder : blurBorder}`,
        borderRadius: 10, color: "#fff", fontSize: "0.9rem",
        outline: "none", transition: "all 0.18s",
      }}
    />
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, flexShrink: 0,
        background: on ? ACCENT : "rgba(255,255,255,0.12)",
        border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.15)"}`,
        cursor: "pointer", position: "relative",
        transition: "background 0.2s, border-color 0.2s",
      }}
    >
      <div style={{
        position: "absolute", top: 2,
        left: on ? 22 : 2,
        width: 16, height: 16, borderRadius: "50%",
        background: "#fff",
        transition: "left 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}

function FormatCard({
  label, desc, active, onSelect,
}: {
  label: string; desc: string; active: boolean; onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1, padding: "0.85rem 1rem", borderRadius: 10, cursor: "pointer",
        background: active ? `${ACCENT}18` : "rgba(255,255,255,0.03)",
        border: `1.5px solid ${active ? `${ACCENT}60` : blurBorder}`,
        transition: "all 0.18s",
        display: "flex", flexDirection: "column", gap: "0.2rem",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontWeight: 700, fontSize: "0.88rem", color: active ? "#fff" : "rgba(255,255,255,0.55)" }}>
          {label}
        </span>
        <div style={{
          width: 14, height: 14, borderRadius: "50%",
          border: `1.5px solid ${active ? ACCENT : "rgba(255,255,255,0.2)"}`,
          background: active ? ACCENT : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          {active && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff" }} />}
        </div>
      </div>
      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{desc}</span>
    </div>
  );
}

export default function CreateAuction() {
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [format, setFormat] = useState<"classic" | "tier">("classic");
  const [maxPlayers, setMaxPlayers] = useState("11");
  const [budget, setBudget] = useState("100");
  const [countPlayers, setCountPlayers] = useState("11");
  const [captainVC, setCaptainVC] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    navigate("/auction");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 50,
      background: "rgba(0,0,0,0.72)",
      backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "1rem",
    }}>
      <form
        onSubmit={handleCreate}
        style={{
          width: "100%", maxWidth: 480,
          background: CARD_BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 20,
          boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem",
          borderBottom: `1px solid ${BORDER}`,
        }}>
          <div>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: ACCENT }}>
              IPL 2026
            </p>
            <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em" }}>
              Create New Auction
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            style={{
              background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
              borderRadius: 8, width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(255,255,255,0.45)", cursor: "pointer", flexShrink: 0,
              transition: "background 0.15s, color 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.12)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
            }}
          >
            <X style={{ width: 15, height: 15 }} />
          </button>
        </div>

        {/* Fields */}
        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* 1. Auction Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <SectionLabel>Auction Name</SectionLabel>
            <StyledInput
              value={name}
              onChange={setName}
              placeholder="e.g. Friday Night Draft"
            />
          </div>

          {/* 2. Auction Format */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <SectionLabel>Auction Format</SectionLabel>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <FormatCard
                label="Classic"
                desc="All players in one open pool"
                active={format === "classic"}
                onSelect={() => setFormat("classic")}
              />
              <FormatCard
                label="Tier Based"
                desc="Players grouped by skill tiers"
                active={format === "tier"}
                onSelect={() => setFormat("tier")}
              />
            </div>
          </div>

          {/* 3 & 4. Max Players + Budget */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <SectionLabel>Max Players / Team</SectionLabel>
              <StyledInput
                value={maxPlayers}
                onChange={setMaxPlayers}
                type="number"
                placeholder="11"
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
              <SectionLabel>Budget / Team (cr)</SectionLabel>
              <StyledInput
                value={budget}
                onChange={setBudget}
                type="number"
                placeholder="100"
              />
            </div>
          </div>

          {/* 5. Players whose points count */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
            <SectionLabel>Players Whose Points Count</SectionLabel>
            <StyledInput
              value={countPlayers}
              onChange={setCountPlayers}
              type="number"
              placeholder="11"
            />
          </div>

          {/* 6. Captain / Vice-Captain toggle */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "0.85rem 1rem",
            background: captainVC ? `${ACCENT}0d` : "rgba(255,255,255,0.025)",
            border: `1.5px solid ${captainVC ? `${ACCENT}35` : blurBorder}`,
            borderRadius: 10,
            transition: "all 0.2s",
          }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.88rem", color: captainVC ? "#fff" : "rgba(255,255,255,0.55)" }}>
                Captain &amp; Vice-Captain
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                2× and 1.5× point multipliers
              </div>
            </div>
            <Toggle on={captainVC} onToggle={() => setCaptainVC(v => !v)} />
          </div>

        </div>

        {/* Footer */}
        <div style={{
          padding: "1rem 1.5rem 1.5rem",
          borderTop: `1px solid ${BORDER}`,
          display: "flex", gap: "0.75rem",
        }}>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            style={{
              flex: "0 0 auto",
              padding: "0.8rem 1.25rem",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${BORDER}`,
              borderRadius: 10, color: "rgba(255,255,255,0.45)",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            style={{
              flex: 1,
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              padding: "0.8rem 1.25rem",
              background: !name.trim() ? "rgba(192,25,44,0.18)" : ACCENT,
              border: `1.5px solid ${!name.trim() ? "rgba(192,25,44,0.22)" : ACCENT}`,
              borderRadius: 10,
              color: !name.trim() ? "rgba(255,255,255,0.25)" : "#fff",
              fontWeight: 800, fontSize: "0.88rem",
              cursor: name.trim() && !loading ? "pointer" : "default",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#a8172a";
            }}
            onMouseLeave={e => {
              if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = ACCENT;
            }}
          >
            {loading ? "Creating…" : (
              <>Create Auction <ChevronRight style={{ width: 15, height: 15 }} /></>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
