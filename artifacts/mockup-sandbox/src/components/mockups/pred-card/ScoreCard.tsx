import { useState } from "react";
import { Users, ChevronDown, Award } from "lucide-react";

const C1 = "#f9c84a";
const C2 = "#3b82f6";

const PLAYERS = [
  "MS Dhoni", "Ruturaj Gaikwad", "Devon Conway", "Shivam Dube",
  "Ravindra Jadeja", "Rohit Sharma", "Hardik Pandya", "Suryakumar Yadav",
  "Jasprit Bumrah", "Tilak Varma", "Deepak Chahar",
];

type Row = { code: string; full: string; color: string; textColor: string; pct: number };

function TeamRow({ row, selected, onClick }: { row: Row; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: "100%", background: "none", border: "none", cursor: "pointer",
      padding: "14px 18px",
      display: "grid",
      gridTemplateColumns: "42px 1fr 54px 48px",
      alignItems: "center", gap: 10,
      background: selected ? `${row.color}10` : "transparent",
      borderLeft: `3px solid ${selected ? row.color : "transparent"}`,
      transition: "all 0.15s",
    }}>
      {/* Logo box */}
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: `${row.color}15`,
        border: `1.5px solid ${selected ? row.color : `${row.color}35`}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 12, fontWeight: 900, color: row.textColor,
        boxShadow: selected ? `0 0 14px ${row.color}30` : "none",
        transition: "all 0.15s",
      }}>{row.code}</div>

      {/* Team name */}
      <div style={{ textAlign: "left" }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: selected ? row.textColor : "#fff" }}>{row.code}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{row.full}</div>
      </div>

      {/* Community bar */}
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: row.textColor, textAlign: "right" }}>
          {row.pct}%
        </div>
        <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <div style={{ width: `${row.pct}%`, height: "100%",
            background: row.color, borderRadius: 2, transition: "width 0.4s" }} />
        </div>
      </div>

      {/* Pick indicator */}
      <div style={{
        width: 38, height: 22, borderRadius: 6,
        background: selected ? `${row.color}20` : "rgba(255,255,255,0.04)",
        border: `1px solid ${selected ? row.color : "rgba(255,255,255,0.08)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, fontWeight: 800,
        color: selected ? row.textColor : "rgba(255,255,255,0.2)",
        letterSpacing: "0.06em",
        transition: "all 0.15s",
      }}>{selected ? "✓ PICK" : "PICK"}</div>
    </button>
  );
}

export function ScoreCard() {
  const [winner, setWinner] = useState<string | null>(null);
  const [mom, setMom] = useState<string>("");
  const [open, setOpen] = useState(false);

  const teams: Row[] = [
    { code: "CSK", full: "Chennai Super Kings", color: C1, textColor: C1, pct: 63 },
    { code: "MI",  full: "Mumbai Indians",      color: C2, textColor: "#60a5fa", pct: 37 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "#06060f",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "24px 16px", fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ width: "100%", maxWidth: 390 }}>

        {/* Scorecard shell */}
        <div style={{
          borderRadius: 20, overflow: "hidden",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
        }}>

          {/* Header bar — like a scorecard title row */}
          <div style={{
            background: "rgba(255,255,255,0.045)",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            padding: "12px 18px",
            display: "grid", gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "rgba(255,255,255,0.5)",
                letterSpacing: "0.12em", textTransform: "uppercase" }}>Match 42</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                IPL 2026 · League Stage
              </div>
            </div>
            <div style={{
              padding: "4px 12px", borderRadius: 20,
              background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
              fontSize: 10, fontWeight: 800, color: "#ef4444",
              letterSpacing: "0.1em",
              display: "flex", alignItems: "center", gap: 5,
            }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", background: "#ef4444",
                display: "inline-block", animation: "blink 1.4s step-end infinite",
              }} />
              LIVE
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>19:30 IST</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>
                MA Chidambaram
              </div>
            </div>
          </div>

          {/* Column headers — scorecard style */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "42px 1fr 54px 48px",
            gap: 10, padding: "8px 18px",
            background: "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.05)",
          }}>
            <div />
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.12em", textTransform: "uppercase" }}>Team</div>
            <div style={{ display: "flex", alignItems: "center", gap: 3,
              fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.12em", textTransform: "uppercase", justifyContent: "flex-end" }}>
              <Users size={8} /> Vote %
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.25)",
              letterSpacing: "0.1em", textTransform: "uppercase", textAlign: "center" }}>
              +30 pts
            </div>
          </div>

          {/* Team rows */}
          {teams.map(row => (
            <div key={row.code}>
              <TeamRow row={row} selected={winner === row.code} onClick={() => setWinner(row.code)} />
              {row.code === "CSK" && (
                <div style={{ height: 1, background: "rgba(255,255,255,0.05)", margin: "0 18px" }} />
              )}
            </div>
          ))}

          {/* MOM section */}
          <div style={{
            borderTop: "1px solid rgba(255,255,255,0.07)",
            background: "rgba(255,255,255,0.02)",
          }}>
            {/* Section header */}
            <div style={{
              padding: "10px 18px 8px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={12} style={{ color: "#f59e0b" }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.4)",
                  textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Man of the Match
                </span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#f59e0b",
                background: "rgba(245,158,11,0.1)", padding: "2px 8px",
                borderRadius: 6, border: "1px solid rgba(245,158,11,0.2)" }}>
                +50 pts
              </span>
            </div>

            <div style={{ padding: "0 18px 16px", position: "relative" }}>
              <button onClick={() => setOpen(!open)} style={{
                width: "100%", padding: "11px 14px", borderRadius: 12, cursor: "pointer",
                background: mom ? "rgba(192,25,44,0.08)" : "rgba(255,255,255,0.03)",
                border: `1px solid ${mom ? "rgba(192,25,44,0.3)" : "rgba(255,255,255,0.08)"}`,
                display: "flex", alignItems: "center", justifyContent: "space-between",
                color: mom ? "#e05572" : "rgba(255,255,255,0.3)",
                fontSize: 13, fontWeight: mom ? 700 : 400, transition: "all 0.2s",
              }}>
                <span>{mom || "Select player…"}</span>
                <ChevronDown size={13}
                  style={{ opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }} />
              </button>
              {open && (
                <div style={{
                  position: "absolute", top: "calc(100% - 10px)", left: 18, right: 18,
                  background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.1)",
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

          {/* Lock button — full-width footer */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <button
              disabled={!winner || !mom}
              style={{
                width: "100%", padding: "15px 18px",
                background: winner && mom
                  ? "linear-gradient(135deg, #c0192c 0%, #e05572 100%)"
                  : "rgba(255,255,255,0.03)",
                border: "none", cursor: winner && mom ? "pointer" : "default",
                color: winner && mom ? "#fff" : "rgba(255,255,255,0.18)",
                fontWeight: 800, fontSize: 14, letterSpacing: "0.04em",
                transition: "all 0.2s",
                boxShadow: winner && mom ? "inset 0 1px 0 rgba(255,255,255,0.15)" : "none",
              }}>
              {winner && mom ? "🔒 Lock My Picks" : "Select winner + MOM to continue"}
            </button>
          </div>
        </div>

        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}
