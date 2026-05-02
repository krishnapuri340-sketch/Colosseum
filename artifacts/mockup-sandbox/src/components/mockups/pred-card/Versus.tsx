import { useState } from "react";
import { Users, MapPin, Zap } from "lucide-react";

const C1 = "#f9c84a";
const C2 = "#3b82f6";
const BG = "#060610";

const PLAYERS = [
  "MS Dhoni", "Ruturaj Gaikwad", "Devon Conway", "Shivam Dube",
  "Ravindra Jadeja", "Rohit Sharma", "Hardik Pandya", "Suryakumar Yadav",
  "Jasprit Bumrah", "Tilak Varma", "Deepak Chahar",
];

export function Versus() {
  const [winner, setWinner] = useState<string | null>(null);
  const [mom, setMom] = useState<string>("");
  const [open, setOpen] = useState(false);
  const t1pct = 63;

  return (
    <div style={{
      minHeight: "100vh", background: BG,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 390 }}>

        {/* Battle header — split background */}
        <div style={{
          borderRadius: "22px 22px 0 0", overflow: "hidden",
          position: "relative", height: 180,
        }}>
          {/* Left half */}
          <div style={{
            position: "absolute", inset: 0, left: 0, right: "50%",
            background: `linear-gradient(135deg, ${C1}30 0%, ${C1}08 100%)`,
          }} />
          {/* Right half */}
          <div style={{
            position: "absolute", inset: 0, left: "50%", right: 0,
            background: `linear-gradient(225deg, ${C2}35 0%, ${C2}08 100%)`,
          }} />
          {/* Center divider glow */}
          <div style={{
            position: "absolute", top: 0, bottom: 0, left: "50%",
            transform: "translateX(-50%)",
            width: 2, background: `linear-gradient(180deg, transparent, rgba(255,255,255,0.12), transparent)`,
          }} />

          {/* Teams side by side */}
          <div style={{
            position: "relative", height: "100%",
            display: "grid", gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center", padding: "0 20px", gap: 0,
          }}>
            {/* CSK side */}
            <button onClick={() => setWinner("CSK")} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              padding: 12, borderRadius: 16,
              outline: winner === "CSK" ? `2px solid ${C1}` : "none",
              outlineOffset: 2,
              transition: "all 0.2s",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: winner === "CSK" ? `${C1}25` : `${C1}12`,
                border: `2px solid ${winner === "CSK" ? C1 : `${C1}40`}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900, color: C1,
                boxShadow: winner === "CSK" ? `0 0 30px ${C1}40` : "none",
                transition: "all 0.2s",
              }}>CSK</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: winner === "CSK" ? C1 : "#fff" }}>Chennai</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Super Kings</div>
              </div>
              {winner === "CSK" && (
                <div style={{
                  position: "absolute", bottom: 10, left: "50%", transform: "translateX(-100%)",
                  padding: "3px 10px", borderRadius: 20,
                  background: `${C1}20`, border: `1px solid ${C1}60`,
                  fontSize: 10, fontWeight: 800, color: C1,
                }}>✓ Your pick</div>
              )}
            </button>

            {/* VS badge */}
            <div style={{
              width: 48, height: 48, borderRadius: "50%", zIndex: 2,
              background: "rgba(255,255,255,0.07)",
              border: "2px solid rgba(255,255,255,0.12)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.5)",
              letterSpacing: 1, flexShrink: 0,
              boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            }}>VS</div>

            {/* MI side */}
            <button onClick={() => setWinner("MI")} style={{
              background: "none", border: "none", cursor: "pointer",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              padding: 12, borderRadius: 16,
              outline: winner === "MI" ? `2px solid ${C2}` : "none",
              outlineOffset: 2,
              transition: "all 0.2s",
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 20,
                background: winner === "MI" ? `${C2}25` : `${C2}12`,
                border: `2px solid ${winner === "MI" ? C2 : `${C2}45`}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, fontWeight: 900, color: "#60a5fa",
                boxShadow: winner === "MI" ? `0 0 30px ${C2}45` : "none",
                transition: "all 0.2s",
              }}>MI</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: winner === "MI" ? "#60a5fa" : "#fff" }}>Mumbai</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Indians</div>
              </div>
              {winner === "MI" && (
                <div style={{
                  position: "absolute", bottom: 10, right: "50%", transform: "translateX(100%)",
                  padding: "3px 10px", borderRadius: 20,
                  background: `${C2}20`, border: `1px solid ${C2}60`,
                  fontSize: 10, fontWeight: 800, color: "#60a5fa",
                }}>✓ Your pick</div>
              )}
            </button>
          </div>
        </div>

        {/* Battle meter */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "none",
          padding: "10px 18px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6 }}>
            <Users size={10} style={{ color: "rgba(255,255,255,0.3)" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>
              ALL PREDICTORS · 284
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: C1, minWidth: 36 }}>{t1pct}%</span>
            <div style={{ flex: 1, height: 8, borderRadius: 4, overflow: "hidden",
              display: "flex", background: "rgba(255,255,255,0.05)" }}>
              <div style={{
                width: `${t1pct}%`,
                background: `linear-gradient(90deg, ${C1}cc, ${C1}88)`,
                borderRadius: "4px 0 0 4px",
                transition: "width 0.5s",
              }} />
              <div style={{
                flex: 1,
                background: `linear-gradient(90deg, ${C2}80, ${C2}cc)`,
                borderRadius: "0 4px 4px 0",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#60a5fa", minWidth: 36, textAlign: "right" }}>{100 - t1pct}%</span>
          </div>
        </div>

        {/* MOM + submit */}
        <div style={{
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "none",
          borderRadius: "0 0 22px 22px",
          padding: "16px 18px 20px",
          display: "flex", flexDirection: "column", gap: 12,
        }}>

          {/* MOM picker */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                Man of the Match
              </span>
              <div style={{
                display: "flex", alignItems: "center", gap: 4,
                padding: "2px 8px", borderRadius: 6,
                background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              }}>
                <Zap size={9} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b" }}>+50 pts</span>
              </div>
            </div>
            <div style={{ position: "relative" }}>
              <button onClick={() => setOpen(!open)} style={{
                width: "100%", padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                background: mom ? "rgba(192,25,44,0.06)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${mom ? "rgba(192,25,44,0.3)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                color: mom ? "#e05572" : "rgba(255,255,255,0.3)",
                fontSize: 13, fontWeight: mom ? 700 : 400, transition: "all 0.2s",
              }}>
                <span>{mom || "Select player…"}</span>
                <span style={{ fontSize: 10, opacity: 0.4, transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▼</span>
              </button>
              {open && (
                <div style={{
                  position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0,
                  background: "#0d0d18", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14, overflow: "hidden", zIndex: 10,
                  boxShadow: "0 20px 50px rgba(0,0,0,0.8)",
                }}>
                  {PLAYERS.map(p => (
                    <button key={p} onClick={() => { setMom(p); setOpen(false); }}
                      style={{
                        width: "100%", padding: "10px 14px", textAlign: "left",
                        cursor: "pointer", background: "transparent",
                        border: "none", borderBottom: "1px solid rgba(255,255,255,0.04)",
                        color: mom === p ? "#e05572" : "rgba(255,255,255,0.65)",
                        fontSize: 13, fontWeight: mom === p ? 700 : 400,
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4,
              fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              <MapPin size={10} />
              <span>MA Chidambaram Stadium</span>
            </div>
            <button
              disabled={!winner || !mom}
              style={{
                padding: "10px 24px", borderRadius: 12,
                background: winner && mom
                  ? "linear-gradient(135deg, #c0192c, #e05572)"
                  : "rgba(255,255,255,0.05)",
                border: "none",
                color: winner && mom ? "#fff" : "rgba(255,255,255,0.2)",
                fontWeight: 800, fontSize: 13, cursor: winner && mom ? "pointer" : "default",
                boxShadow: winner && mom ? "0 4px 20px rgba(192,25,44,0.4)" : "none",
                transition: "all 0.2s",
              }}>
              Lock Picks
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
