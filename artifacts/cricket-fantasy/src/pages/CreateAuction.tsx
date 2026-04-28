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
      fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.13em",
      textTransform: "uppercase", color: LABEL, display: "block", marginBottom: "1rem",
    }}>
      {children}
    </span>
  );
}

function NumberStepper({
  value, onChange, min = 1, max = 99, suffix, compact = false,
}: {
  value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string; compact?: boolean;
}) {
  const btnSize = compact ? 38 : 52;
  const btnRadius = compact ? 10 : 14;
  const btnFontSize = compact ? "1.1rem" : "1.4rem";
  const numFontSize = compact ? "2.2rem" : "3.5rem";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? "0.6rem" : "1rem", flex: 1 }}>
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        style={{
          width: btnSize, height: btnSize, borderRadius: btnRadius,
          background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
          color: "rgba(255,255,255,0.65)", fontSize: btnFontSize, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, flexShrink: 0, transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
        onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
      >−</button>
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: numFontSize, fontWeight: 900, color: "#fff", lineHeight: 1 }}>
          {value}
        </div>
        {suffix && (
          <div style={{ fontSize: "0.75rem", color: LABEL, marginTop: "0.2rem" }}>{suffix}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        style={{
          width: btnSize, height: btnSize, borderRadius: btnRadius,
          background: "rgba(255,255,255,0.07)", border: `1px solid ${BORDER}`,
          color: "rgba(255,255,255,0.65)", fontSize: btnFontSize, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, flexShrink: 0, transition: "background 0.15s",
        }}
        onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.13)")}
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
        width: 64, height: 34, borderRadius: 17, flexShrink: 0,
        background: on ? ACCENT : "rgba(255,255,255,0.1)",
        border: `1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.12)"}`,
        cursor: "pointer", position: "relative", transition: "all 0.22s",
      }}
    >
      <div style={{
        position: "absolute", top: 4,
        left: on ? 32 : 4,
        width: 22, height: 22, borderRadius: "50%",
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
  const [topScoringEnabled, setTopScoringEnabled] = useState(false);
  const [topScoringCount, setTopScoringCount] = useState(11);
  const [foreignLimitEnabled, setForeignLimitEnabled] = useState(false);
  const [foreignLimit, setForeignLimit] = useState(4);
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

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 20,
    padding: "2rem 2.25rem",
    display: "flex",
    flexDirection: "column",
    ...extra,
  });

  return (
    <Layout>
      <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", height: "100%" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            style={{
              background: "rgba(255,255,255,0.06)", border: `1px solid ${BORDER}`,
              borderRadius: 10, padding: "0.5rem 0.8rem",
              color: "rgba(255,255,255,0.45)", cursor: "pointer",
              display: "flex", alignItems: "center", gap: "0.35rem",
              fontSize: "0.8rem", fontWeight: 600, transition: "all 0.15s",
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
            <ArrowLeft style={{ width: 14, height: 14 }} /> Back
          </button>
          <div>
            <p style={{ margin: 0, fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.16em", textTransform: "uppercase", color: ACCENT }}>
              Auction
            </p>
            <h1 style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}>
              Create New Auction
            </h1>
          </div>
        </div>

        {/* Bento grid — fills remaining vertical space */}
        <div style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1.6fr 1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: "1rem",
          minHeight: 0,
        }}>

          {/* 1. Auction Name — large top-left */}
          <div style={{
            ...card(),
            gridColumn: "1", gridRow: "1",
            justifyContent: "space-between",
          }}>
            <WidgetLabel>Auction Name</WidgetLabel>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
                placeholder="e.g. Friday Night Draft"
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "1rem 1.25rem",
                  background: nameFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  border: `1.5px solid ${nameFocused ? focusBorder : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 12, color: "#fff", fontSize: "1.15rem",
                  outline: "none", transition: "all 0.18s",
                }}
              />
              {name && (
                <p style={{ margin: "0.75rem 0 0", fontSize: "0.8rem", color: "rgba(255,255,255,0.3)", fontStyle: "italic" }}>
                  "{name}"
                </p>
              )}
            </div>
          </div>

          {/* 2. Auction Format — tall, spans 2 rows right side */}
          <div style={{
            ...card({ flexDirection: "column" }),
            gridColumn: "2 / 4", gridRow: "1 / 3",
            gap: "1.25rem",
          }}>
            <WidgetLabel>Auction Format</WidgetLabel>
            {(["classic", "tier"] as const).map(f => (
              <div
                key={f}
                onClick={() => setFormat(f)}
                style={{
                  flex: 1, borderRadius: 14, cursor: "pointer",
                  padding: "1.5rem 1.6rem",
                  background: format === f ? `${ACCENT}14` : "rgba(255,255,255,0.025)",
                  border: `1.5px solid ${format === f ? `${ACCENT}55` : "rgba(255,255,255,0.07)"}`,
                  transition: "all 0.18s",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                  <span style={{ fontWeight: 900, fontSize: "1.15rem", color: format === f ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing: "-0.01em" }}>
                    {f === "classic" ? "Classic" : "Tier Based"}
                  </span>
                  <div style={{
                    width: 18, height: 18, borderRadius: "50%",
                    background: format === f ? ACCENT : "transparent",
                    border: `2px solid ${format === f ? ACCENT : "rgba(255,255,255,0.2)"}`,
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {format === f && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />}
                  </div>
                </div>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "rgba(255,255,255,0.32)", lineHeight: 1.6 }}>
                  {f === "classic"
                    ? "All players enter one open pool. Highest bidder wins each player."
                    : "Players are grouped into Elite, Premium, and Standard tiers for structured bidding."}
                </p>
              </div>
            ))}
          </div>

          {/* 3. Max Players */}
          <div style={{
            ...card({ justifyContent: "space-between" }),
            gridColumn: "1", gridRow: "2",
          }}>
            <WidgetLabel>Max Players / Team</WidgetLabel>
            <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
              <NumberStepper value={maxPlayers} onChange={setMaxPlayers} min={5} max={25} suffix="players" />
            </div>
          </div>

        </div>

        {/* Second row of smaller widgets */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1.5fr",
          gap: "1rem",
        }}>

          {/* 4. Budget */}
          <div style={card({ justifyContent: "space-between", padding: "1.4rem 1.6rem" })}>
            <WidgetLabel>Budget / Team</WidgetLabel>
            <div style={{ display: "flex", alignItems: "center", flex: 1 }}>
              <NumberStepper value={budget} onChange={setBudget} min={50} max={500} suffix="crores" compact />
            </div>
          </div>

          {/* 5. Top Scoring Player Count + nested Foreign Players Limit */}
          <div style={card({ justifyContent: "space-between", gap: "0.75rem", padding: "1.4rem 1.6rem" })}>
            {/* Header toggle */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{
                fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.13em",
                textTransform: "uppercase", color: LABEL,
              }}>
                Top Scoring Player Count
              </span>
              <Toggle on={topScoringEnabled} onToggle={() => {
                setTopScoringEnabled(v => !v);
                if (topScoringEnabled) setForeignLimitEnabled(false);
              }} />
            </div>

            {/* Main stepper or placeholder */}
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
              {topScoringEnabled ? (
                <NumberStepper
                  value={Math.min(topScoringCount, maxPlayers)}
                  onChange={v => {
                    const clamped = Math.min(v, maxPlayers);
                    setTopScoringCount(clamped);
                    if (foreignLimit > clamped) setForeignLimit(clamped);
                  }}
                  min={1}
                  max={maxPlayers}
                  suffix="players"
                  compact
                />
              ) : (
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.05rem", fontWeight: 700, color: "rgba(255,255,255,0.2)", lineHeight: 1.4 }}>All players</div>
                  <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.15)", marginTop: "0.2rem" }}>points count</div>
                </div>
              )}
            </div>

            {/* Foreign Players Limit — nested sub-section, only shown when top scoring is on */}
            {topScoringEnabled && (
              <div style={{
                borderTop: "1px solid rgba(255,255,255,0.07)",
                paddingTop: "0.85rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
                    Foreign Players Limit
                  </span>
                  <Toggle on={foreignLimitEnabled} onToggle={() => setForeignLimitEnabled(v => !v)} />
                </div>
                {foreignLimitEnabled ? (
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <button type="button"
                      onClick={() => setForeignLimit(f => Math.max(1, f - 1))}
                      style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)", fontSize: "1rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                      }}>−</button>
                    <div style={{ flex: 1, textAlign: "center" }}>
                      <span style={{ fontSize: "1.6rem", fontWeight: 900, color: "#fff" }}>
                        {Math.min(foreignLimit, topScoringCount)}
                      </span>
                      <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", marginLeft: "0.35rem" }}>overseas</span>
                    </div>
                    <button type="button"
                      onClick={() => setForeignLimit(f => Math.min(topScoringCount, f + 1))}
                      style={{
                        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                        background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                        color: "rgba(255,255,255,0.6)", fontSize: "1rem", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700,
                      }}>+</button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>
                    No overseas player limit
                  </p>
                )}
              </div>
            )}
          </div>

          {/* 6. Captain / Vice-Captain */}
          <div style={{
            ...card({
              background: captainVC ? `${ACCENT}0d` : CARD,
              border: `1px solid ${captainVC ? `${ACCENT}35` : BORDER}`,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
              padding: "1.4rem 1.6rem",
            }),
            transition: "all 0.22s",
          }}>
            <div style={{ flex: 1 }}>
              <WidgetLabel>Captain &amp; Vice-Captain</WidgetLabel>
              <p style={{ margin: 0, fontSize: "1.15rem", fontWeight: 900, color: captainVC ? "#fff" : "rgba(255,255,255,0.3)", letterSpacing: "-0.02em", lineHeight: 1, transition: "color 0.2s" }}>
                Point Multipliers
              </p>
              <p style={{ margin: "0.4rem 0 0", fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                Captain scores <span style={{ color: captainVC ? "#fff" : "inherit", fontWeight: 700 }}>2×</span> &nbsp;·&nbsp; Vice-Captain scores <span style={{ color: captainVC ? "#fff" : "inherit", fontWeight: 700 }}>1.5×</span>
              </p>
            </div>
            <Toggle on={captainVC} onToggle={() => setCaptainVC(v => !v)} />
          </div>

        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", paddingBottom: "0.5rem" }}>
          <button
            type="button"
            onClick={() => navigate("/auction")}
            style={{
              padding: "0.85rem 1.5rem",
              background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`,
              borderRadius: 12, color: "rgba(255,255,255,0.4)",
              fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", transition: "all 0.15s",
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
              padding: "0.85rem 2rem",
              background: !name.trim() ? "rgba(192,25,44,0.15)" : ACCENT,
              border: `1.5px solid ${!name.trim() ? "rgba(192,25,44,0.2)" : ACCENT}`,
              borderRadius: 12,
              color: !name.trim() ? "rgba(255,255,255,0.22)" : "#fff",
              fontWeight: 800, fontSize: "0.9rem",
              cursor: name.trim() && !loading ? "pointer" : "default",
              transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: "0.45rem",
            }}
            onMouseEnter={e => { if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = "#a8172a"; }}
            onMouseLeave={e => { if (name.trim()) (e.currentTarget as HTMLButtonElement).style.background = ACCENT; }}
          >
            {loading ? "Creating…" : <><span>Create Auction</span><ChevronRight style={{ width: 16, height: 16 }} /></>}
          </button>
        </div>

      </form>
    </Layout>
  );
}
