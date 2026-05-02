import { useState } from "react";
import { CheckCircle, Lock, Users, MapPin, Clock } from "lucide-react";

const C1 = "#f9c84a";
const C2 = "#004c97";
const BG = "#07070e";
const SURFACE = "rgba(255,255,255,0.04)";

const PLAYERS = [
  "MS Dhoni", "Ruturaj Gaikwad", "Devon Conway", "Shivam Dube",
  "Ravindra Jadeja", "Deepak Chahar", "Rohit Sharma", "Hardik Pandya",
  "Suryakumar Yadav", "Jasprit Bumrah", "Tilak Varma",
];

export function Glassmorphism() {
  const [winner, setWinner] = useState<string | null>(null);
  const [mom, setMom] = useState<string>("");
  const [open, setOpen] = useState(false);

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 390 }}>

        {/* Card shell */}
        <div style={{
          borderRadius: 24, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
          position: "relative",
        }}>

          {/* Team color orbs */}
          <div style={{
            position: "absolute", top: -60, left: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, ${C1}30 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, ${C2}30 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Header strip */}
          <div style={{
            padding: "14px 18px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                padding: "3px 10px", borderRadius: 20,
                background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)",
                fontSize: 10, fontWeight: 800, color: "#ef4444",
                letterSpacing: "0.12em", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%",
                  background: "#ef4444", display: "inline-block",
                  animation: "pulse 1.5s ease-in-out infinite",
                }} />
                LIVE
              </div>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 500 }}>Match 42</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
              <Clock size={11} />
              <span>19:30 IST</span>
            </div>
          </div>

          {/* Team vs Team hero */}
          <div style={{ padding: "22px 18px 16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>

              {/* Team 1 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: `${C1}15`, border: `2px solid ${C1}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900, color: C1,
                  boxShadow: `0 0 24px ${C1}25`,
                }}>CSK</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Chennai</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Super Kings</div>
                </div>
              </div>

              {/* VS badge */}
              <div style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.4)",
                letterSpacing: 1,
              }}>VS</div>

              {/* Team 2 */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: 18,
                  background: `${C2}20`, border: `2px solid ${C2}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 900, color: "#5b9de8",
                  boxShadow: `0 0 24px ${C2}30`,
                }}>MI</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>Mumbai</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Indians</div>
                </div>
              </div>
            </div>

            {/* Community vote bar */}
            <div style={{ marginTop: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C1 }}>CSK 58%</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 4 }}>
                  <Users size={10} /> 284 predictors
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#5b9de8" }}>42% MI</span>
              </div>
              <div style={{ height: 5, borderRadius: 3, overflow: "hidden", display: "flex",
                background: "rgba(255,255,255,0.06)" }}>
                <div style={{ width: "58%", background: `linear-gradient(90deg, ${C1}, ${C1}aa)`, borderRadius: 3 }} />
                <div style={{ flex: 1, background: `linear-gradient(90deg, ${C2}88, ${C2})`, borderRadius: 3 }} />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 18px" }} />

          {/* Prediction section */}
          <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Match Winner */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Match Winner
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b",
                  background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.2)" }}>
                  +30 pts
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { code: "CSK", label: "Chennai Super Kings", color: C1 },
                  { code: "MI",  label: "Mumbai Indians",      color: C2, textColor: "#5b9de8" },
                ].map(t => {
                  const sel = winner === t.code;
                  return (
                    <button key={t.code}
                      onClick={() => setWinner(t.code)}
                      style={{
                        padding: "10px 12px", borderRadius: 14, cursor: "pointer",
                        background: sel ? `${t.color}18` : SURFACE,
                        border: `1.5px solid ${sel ? t.color : "rgba(255,255,255,0.08)"}`,
                        display: "flex", alignItems: "center", gap: 8,
                        transition: "all 0.2s",
                        boxShadow: sel ? `0 0 18px ${t.color}25` : "none",
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `${t.color}15`, border: `1px solid ${t.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 11, fontWeight: 900, color: t.textColor ?? t.color,
                      }}>{t.code}</div>
                      <div style={{ textAlign: "left", minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sel ? (t.textColor ?? t.color) : "#fff" }}>{t.code}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                      </div>
                      {sel && <CheckCircle size={13} style={{ color: t.textColor ?? t.color, marginLeft: "auto", flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MOM */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>
                  Man of the Match
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b",
                  background: "rgba(245,158,11,0.1)", padding: "2px 8px", borderRadius: 6, border: "1px solid rgba(245,158,11,0.2)" }}>
                  +50 pts
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setOpen(!open)} style={{
                  width: "100%", padding: "11px 14px", borderRadius: 14, cursor: "pointer",
                  background: mom ? "rgba(192,25,44,0.08)" : SURFACE,
                  border: `1.5px solid ${mom ? "rgba(192,25,44,0.35)" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  color: mom ? "#e05572" : "rgba(255,255,255,0.3)",
                  fontSize: 13, fontWeight: mom ? 700 : 400,
                  transition: "all 0.2s",
                }}>
                  <span>{mom || "Pick Man of the Match…"}</span>
                  <span style={{ fontSize: 10, opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {open && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#111118", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 14, overflow: "hidden", zIndex: 10,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                  }}>
                    {PLAYERS.map(p => (
                      <button key={p} onClick={() => { setMom(p); setOpen(false); }}
                        style={{
                          width: "100%", padding: "10px 14px", textAlign: "left", cursor: "pointer",
                          background: mom === p ? "rgba(192,25,44,0.1)" : "transparent",
                          border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                          color: mom === p ? "#e05572" : "rgba(255,255,255,0.7)",
                          fontSize: 13, fontWeight: mom === p ? 700 : 400,
                          transition: "background 0.15s",
                        }}>
                        {p}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{
            padding: "14px 18px 18px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
              <MapPin size={11} />
              <span>MA Chidambaram Stadium</span>
            </div>
            <button
              disabled={!winner || !mom}
              style={{
                padding: "10px 22px", borderRadius: 12, cursor: winner && mom ? "pointer" : "default",
                background: winner && mom
                  ? "linear-gradient(135deg, #c0192c, #e05572)"
                  : "rgba(192,25,44,0.12)",
                border: "none",
                color: winner && mom ? "#fff" : "rgba(255,255,255,0.2)",
                fontWeight: 800, fontSize: 13,
                boxShadow: winner && mom ? "0 4px 20px rgba(192,25,44,0.4)" : "none",
                transition: "all 0.2s",
              }}>
              Lock Picks
            </button>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.4; }
          }
        `}</style>
      </div>
    </div>
  );
}
