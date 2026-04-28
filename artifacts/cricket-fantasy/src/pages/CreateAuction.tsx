import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, ChevronRight } from "lucide-react";

const ACCENT = "#c0192c";
const CARD = "rgba(255,255,255,0.032)";
const BORDER = "rgba(255,255,255,0.08)";
const LABEL = "rgba(255,255,255,0.35)";
const focusBorder = "rgba(192,25,44,0.55)";

function WidgetLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontSize: "0.64rem", fontWeight: 700, letterSpacing: "0.12em",
      textTransform: "uppercase", color: LABEL, display: "block", marginBottom: "0.6rem",
    }}>
      {children}
    </span>
  );
}

function NumberStepper({
  value, onChange, min = 1, max = 99, suffix,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginTop: "0.25rem" }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
          color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, flexShrink: 0, transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
      >−</button>
      <div style={{ flex: 1, textAlign: "center" }}>
        <span style={{ fontSize: "2rem", fontWeight: 900, color: "#fff", lineHeight: 1 }}>
          {value}
        </span>
        {suffix && (
          <span style={{ fontSize: "0.75rem", color: LABEL, marginLeft: "0.3rem" }}>{suffix}</span>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: 36, height: 36, borderRadius: 10,
          background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
          color: "rgba(255,255,255,0.6)", fontSize: "1.1rem", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, flexShrink: 0, transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.12)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
      >+</button>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={onToggle}
      style={{
        width: 52, height: 28, borderRadius: 14, flexShrink: 0,
        background: on ? ACCENT : "rgba(255,255,255,0.1)",
        border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.12)"}`,
        cursor: "pointer", position: "relative", transition: "all 0.22s",
      }}
    >
      <div style={{
        position: "absolute", top: 3,
        left: on ? 26 : 3,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left 0.22s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }} />
    </div>
  );
}

export default function CreateAuction() {
  const [, navigate] = useLocation();

  const [name, setName] = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [format, setFormat] = useState<"classic" | "tier">("classic");
  const [maxPlayers, setMaxPlayers] = useState(11);
  const [budget, setBudget] = useState(100);
  const [countPlayers, setCountPlayers] = useState(11);
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
    <Layout>
      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1.5rem", maxWidth: 780 }}>

        {/* Page header */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`,
              borderRadius: 9, padding: "0.45rem 0.7rem",
              color: "rgba(255,255,255,0.45)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.3rem",
              fontSize: "0.78rem", fontWeight: 600, transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.45)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }}
          >
            <ArrowLeft style={{ width: 13, height: 13 }} /> Back
          </button>
          <div>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT }}>
              Auction
            </p>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.025em", lineHeight: 1 }}>
              Create New Auction
            </h1>
          </div>
        </div>

        {/* Bento grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gridTemplateRows: "auto auto auto",
          gap: "0.85rem",
        }}>

          {/* 1. Auction Name — wide, spans 2 cols */}
          <div style={{
            gridColumn: "1 / 3", gridRow: "1",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: "1.4rem 1.5rem",
          }}>
            <WidgetLabel>Auction Name</WidgetLabel>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              onFocus={() => setNameFocused(true)}
              onBlur={() => setNameFocused(false)}
              placeholder="e.g. Friday Night Draft"
              style={{
                width: "100%", boxSizing: "border-box",
                padding: "0.8rem 1rem",
                background: nameFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                border: `1.5px solid ${nameFocused ? focusBorder : "rgba(255,255,255,0.1)"}`,
                borderRadius: 10, color: "#fff", fontSize: "1rem",
                outline: "none", transition: "all 0.18s",
              }}
            />
          </div>

          {/* 2. Auction Format — tall, spans 2 rows */}
          <div style={{
            gridColumn: "3", gridRow: "1 / 3",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: "1.4rem 1.25rem",
            display: "flex", flexDirection: "column", gap: "0.75rem",
          }}>
            <WidgetLabel>Auction Format</WidgetLabel>
            {(["classic", "tier"] as const).map(f => (
              <div
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  flex: 1, borderRadius: 12, cursor: "pointer",
                  padding: "1rem",
                  background: format === f ? `${ACCENT}14` : "rgba(255,255,255,0.025)",
                  border: `1.5px solid ${format === f ? `${ACCENT}55` : "rgba(255,255,255,0.07)"}`,
                  transition: "all 0.18s",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "0.92rem", color: format === f ? "#fff" : "rgba(255,255,255,0.45)" }}>
                    {f === "classic" ? "Classic" : "Tier Based"}
                  </span>
                  <div style={{
                    width: 12, height: 12, borderRadius: "50%",
                    background: format === f ? ACCENT : "transparent",
                    border: `1.5px solid ${format === f ? ACCENT : "rgba(255,255,255,0.2)"}`,
                    flexShrink: 0,
                  }} />
                </div>
                <p style={{ margin: 0, fontSize: "0.7rem", color: "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>
                  {f === "classic"
                    ? "All players enter one open pool. Highest bid wins."
                    : "Players grouped by skill tier — Elite, Premium, Standard."}
                </p>
              </div>
            ))}
          </div>

          {/* 3. Max Players — small */}
          <div style={{
            gridColumn: "1", gridRow: "2",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: "1.2rem 1.25rem",
          }}>
            <WidgetLabel>Max Players / Team</WidgetLabel>
            <NumberStepper value={maxPlayers} onChange={setMaxPlayers} min={5} max={25} suffix="players" />
          </div>

          {/* 4. Budget — small */}
          <div style={{
            gridColumn: "2", gridRow: "2",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: "1.2rem 1.25rem",
          }}>
            <WidgetLabel>Budget / Team</WidgetLabel>
            <NumberStepper value={budget} onChange={setBudget} min={50} max={500} suffix="cr" />
          </div>

          {/* 5. Points count — medium */}
          <div style={{
            gridColumn: "1", gridRow: "3",
            background: CARD, border: `1px solid ${BORDER}`,
            borderRadius: 16, padding: "1.2rem 1.25rem",
          }}>
            <WidgetLabel>Players Whose Points Count</WidgetLabel>
            <NumberStepper value={countPlayers} onChange={setCountPlayers} min={1} max={maxPlayers} suffix="players" />
          </div>

          {/* 6. Captain / Vice-Captain — wide */}
          <div style={{
            gridColumn: "2 / 4", gridRow: "3",
            background: captainVC ? `${ACCENT}0a` : CARD,
            border: `1px solid ${captainVC ? `${ACCENT}30` : BORDER}`,
            borderRadius: 16, padding: "1.2rem 1.5rem",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: "1rem", transition: "all 0.22s",
          }}>
            <div>
              <WidgetLabel>Captain &amp; Vice-Captain</WidgetLabel>
              <p style={{ margin: 0, fontSize: "0.88rem", fontWeight: 700, color: captainVC ? "#fff" : "rgba(255,255,255,0.4)", transition: "color 0.2s" }}>
                Point Multipliers
              </p>
              <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: "rgba(255,255,255,0.28)" }}>
                Captain 2× &nbsp;·&nbsp; Vice-Captain 1.5×
              </p>
            </div>
            <Toggle on={captainVC} onToggle={() => setCaptainVC(v => !v)} />
          </div>

        </div>

        {/* Submit row */}
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            style={{
              padding: "0.8rem 1.4rem",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
              borderRadius: 11, color: "rgba(255,255,255,0.4)",
              fontWeight: 700, fontSize: "0.85rem", cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.09)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.4)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)";
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            style={{
              padding: "0.8rem 1.75rem",
              background: !name.trim() ? "rgba(192,25,44,0.15)" : ACCENT,
              border: `1.5px solid ${!name.trim() ? "rgba(192,25,44,0.2)" : ACCENT}`,
              borderRadius: 11,
              color: !name.trim() ? "rgba(255,255,255,0.22)" : "#fff",
              fontWeight: 800, fontSize: "0.88rem",
              cursor: name.trim() && !loading ? "pointer" : "default",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "0.4rem",
            }}
            onMouseEnter={e => { if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#a8172a"; }}
            onMouseLeave={e => { if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = ACCENT; }}
          >
            {loading ? "Creating…" : <><span>Create Auction</span><ChevronRight style={{ width: 15, height: 15 }} /></>}
          </button>
        </div>

      </form>
    </Layout>
  );
}
