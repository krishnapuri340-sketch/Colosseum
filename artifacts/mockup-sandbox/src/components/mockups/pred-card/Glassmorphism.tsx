import { useState } from "react";
import { CheckCircle, Users, MapPin, Clock } from "lucide-react";

const C1 = "#f9c84a";
const C2 = "#004c97";
const C2_TEXT = "#5b9de8";
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

  const canSubmit = !!winner && !!mom;

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 390 }}>

        {/* Card shell */}
        <div style={{
          borderRadius: 22, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "rgba(8,8,18,0.82)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px ${C1}08`,
          position: "relative",
        }}>

          {/* Team colour orbs */}
          <div style={{
            position: "absolute", top: -60, left: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, ${C1}28 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", top: -60, right: -60,
            width: 220, height: 220, borderRadius: "50%",
            background: `radial-gradient(circle, ${C2}28 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Header */}
          <div style={{
            padding: "13px 18px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{
                padding: "2px 9px", borderRadius: 20,
                background: "rgba(239,68,68,0.14)", border: "1px solid rgba(239,68,68,0.3)",
                fontSize: 10, fontWeight: 800, color: "#ef4444",
                letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: 5,
              }}>
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: "#ef4444", display: "inline-block",
                  animation: "ping 1.2s ease-in-out infinite",
                }} />
                LIVE
              </div>
              <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.25)",
                background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: 6,
                letterSpacing: "0.06em" }}>M42</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4,
              fontSize: 11, color: "rgba(255,255,255,0.28)" }}>
              <Clock size={11} />
              <span>19:30 IST</span>
            </div>
          </div>

          {/* Expanded body */}
          <div style={{ padding: "1.1rem 1.1rem", display: "flex", flexDirection: "column", gap: "1rem" }}>

            {/* Team vs Team hero */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr", alignItems: "center", gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 58, height: 58, borderRadius: 18,
                  background: `${C1}14`, border: `1.5px solid ${C1}45`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 900, color: C1,
                  boxShadow: `0 0 22px ${C1}22`,
                }}>CSK</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>Chennai</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Super Kings</div>
                </div>
              </div>

              <div style={{
                width: 38, height: 38, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.35)", letterSpacing: 1,
              }}>VS</div>

              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 7 }}>
                <div style={{
                  width: 58, height: 58, borderRadius: 18,
                  background: `${C2}18`, border: `1.5px solid ${C2}50`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 900, color: C2_TEXT,
                  boxShadow: `0 0 22px ${C2}28`,
                }}>MI</div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#fff" }}>Mumbai</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Indians</div>
                </div>
              </div>
            </div>

            {/* Community vote bar — glass pill */}
            <div style={{
              padding: "0.7rem 0.85rem", borderRadius: 12,
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 7 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: C1 }}>58% CSK</span>
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)", display: "flex", alignItems: "center", gap: 3 }}>
                  <Users size={9} /> 284 predictors
                </span>
                <span style={{ fontSize: 11, fontWeight: 700, color: C2_TEXT }}>MI 42%</span>
              </div>
              <div style={{ height: 7, borderRadius: 4, overflow: "hidden", display: "flex",
                background: "rgba(255,255,255,0.05)", boxShadow: "inset 0 1px 3px rgba(0,0,0,0.3)" }}>
                <div style={{ width: "58%", background: `linear-gradient(90deg,${C1},${C1}90)`,
                  borderRadius: "4px 0 0 4px", boxShadow: `0 0 8px ${C1}50` }} />
                <div style={{ flex: 1, background: `linear-gradient(90deg,${C2}90,${C2_TEXT})`,
                  borderRadius: "0 4px 4px 0", boxShadow: `0 0 8px ${C2_TEXT}50` }} />
              </div>
            </div>

            {/* Match Winner */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  Match Winner
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b",
                  background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                  padding: "2px 9px", borderRadius: 20, letterSpacing: "0.04em" }}>
                  +30 pts
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { code: "CSK", label: "Chennai Super Kings", color: C1,      textColor: C1 },
                  { code: "MI",  label: "Mumbai Indians",      color: C2,      textColor: C2_TEXT },
                ].map(t => {
                  const sel = winner === t.code;
                  return (
                    <button key={t.code}
                      onClick={() => setWinner(t.code)}
                      style={{
                        padding: "10px 12px", borderRadius: 13, cursor: "pointer",
                        background: sel ? `${t.color}18` : SURFACE,
                        border: `1.5px solid ${sel ? t.color : "rgba(255,255,255,0.09)"}`,
                        display: "flex", alignItems: "center", gap: 8,
                        transition: "all 0.2s",
                        boxShadow: sel ? `0 0 22px ${t.color}30, inset 0 1px 0 ${t.color}20` : "none",
                      }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
                        background: `${t.color}14`, border: `1px solid ${t.color}35`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 900, color: t.textColor,
                      }}>{t.code}</div>
                      <div style={{ textAlign: "left", minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: sel ? t.textColor : "#fff" }}>{t.code}</div>
                        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", overflow: "hidden",
                          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.label}</div>
                      </div>
                      {sel && <CheckCircle size={13} style={{ color: t.textColor, flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MOM */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                  Man of the Match
                </span>
                <span style={{ fontSize: 10, fontWeight: 800, color: "#f59e0b",
                  background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)",
                  padding: "2px 9px", borderRadius: 20, letterSpacing: "0.04em" }}>
                  +50 pts
                </span>
              </div>
              <div style={{ position: "relative" }}>
                <button onClick={() => setOpen(!open)} style={{
                  width: "100%", padding: "11px 14px", borderRadius: 13, cursor: "pointer",
                  background: mom ? "rgba(192,25,44,0.1)" : SURFACE,
                  border: `1.5px solid ${mom ? "rgba(192,25,44,0.35)" : "rgba(255,255,255,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  color: mom ? "#e05572" : "rgba(255,255,255,0.3)",
                  fontSize: 13, fontWeight: mom ? 700 : 400,
                  transition: "all 0.2s",
                  boxShadow: mom ? "0 0 18px rgba(192,25,44,0.2)" : "none",
                }}>
                  <span>{mom || "Pick Man of the Match…"}</span>
                  <span style={{ fontSize: 10, opacity: 0.4,
                    transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
                </button>
                {open && (
                  <div style={{
                    position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                    background: "#111118", border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 13, overflow: "hidden", zIndex: 10,
                    boxShadow: "0 20px 50px rgba(0,0,0,0.7)",
                    maxHeight: 220, overflowY: "auto",
                  }}>
                    {PLAYERS.map(p => (
                      <button key={p} onClick={() => { setMom(p); setOpen(false); }}
                        style={{
                          width: "100%", padding: "10px 14px", textAlign: "left", cursor: "pointer",
                          background: mom === p ? "rgba(192,25,44,0.1)" : "transparent",
                          border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                          color: mom === p ? "#e05572" : "rgba(255,255,255,0.65)",
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

            {/* Footer */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 10, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.8rem",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "rgba(255,255,255,0.22)" }}>
                <MapPin size={11} style={{ color: "rgba(255,255,255,0.3)" }} />
                <span>MA Chidambaram Stadium</span>
              </div>
              <button
                disabled={!canSubmit}
                style={{
                  padding: "10px 22px", borderRadius: 12, cursor: canSubmit ? "pointer" : "default",
                  background: canSubmit
                    ? "linear-gradient(135deg, #c0192c 0%, #e05572 100%)"
                    : "rgba(192,25,44,0.12)",
                  border: "none",
                  color: canSubmit ? "#fff" : "rgba(255,255,255,0.2)",
                  fontWeight: 800, fontSize: 13,
                  boxShadow: canSubmit ? "0 4px 20px rgba(192,25,44,0.45), inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
                  transition: "all 0.2s",
                }}>
                Lock Picks
              </button>
            </div>

          </div>
        </div>

        <style>{`
          @keyframes ping {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.3; }
          }
        `}</style>
      </div>
    </div>
  );
}
