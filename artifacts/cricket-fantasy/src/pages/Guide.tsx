import { Layout } from "@/components/layout/Layout";
import { SCORING_RULES, TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO } from "../lib/ipl-constants";

const SECTION_COLOR: Record<string, string> = {
  "Base": "#00d4ff",
  "Batting": "#34d399",
  "SR Bonus (min 10 balls or 20 runs)": "#fbbf24",
  "SR Penalty": "#f87171",
  "Bowling": "#a78bfa",
  "Eco Bonus (min 2 overs)": "#fbbf24",
  "Eco Penalty": "#f87171",
  "Fielding": "#fb923c",
  "Multiplier": "#f472b6",
};

const grouped = SCORING_RULES.reduce<Record<string, typeof SCORING_RULES>>((acc, rule) => {
  if (!acc[rule.category]) acc[rule.category] = [];
  acc[rule.category].push(rule);
  return acc;
}, {});

export default function GuidePage() {
  return (
    <Layout>
    <div style={{ padding: "1.5rem", maxWidth: 860, margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>
          Fantasy Cricket Guide
        </h1>
        <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
          Everything you need to know about scoring, teams, and player roles
        </p>
      </div>

      <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
        Scoring System
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
        {Object.entries(grouped).map(([category, rules]) => {
          const color = SECTION_COLOR[category] ?? "#00d4ff";
          return (
            <div key={category} style={{
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${color}30`,
              borderRadius: 14,
              overflow: "hidden",
            }}>
              <div style={{
                padding: "0.75rem 1rem",
                background: `${color}15`,
                borderBottom: `1px solid ${color}30`,
              }}>
                <span style={{ color, fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {category}
                </span>
              </div>
              <div style={{ padding: "0.5rem 0" }}>
                {rules.map((rule, i) => (
                  <div key={i} style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.5rem 1rem",
                    borderBottom: i < rules.length - 1 ? "1px solid rgba(255,255,255,0.04)" : undefined,
                  }}>
                    <span style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.8rem" }}>{rule.event}</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: "0.875rem",
                      color: typeof rule.points === "number" && rule.points < 0 ? "#f87171"
                        : typeof rule.points === "string" ? "#f472b6"
                        : color,
                      minWidth: 36,
                      textAlign: "right",
                    }}>
                      {typeof rule.points === "number"
                        ? (rule.points > 0 ? `+${rule.points}` : rule.points)
                        : rule.points}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <h2 style={{ margin: "0 0 1rem", fontSize: "1.2rem", fontWeight: 700, color: "#fff" }}>
        IPL 2026 Teams
      </h2>
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
        gap: "0.75rem",
      }}>
        {Object.entries(TEAM_FULL_NAME).map(([code, name]) => (
          <div key={code} style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${TEAM_COLOR[code]}30`,
            borderRadius: 12,
            padding: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
          }}>
            <img src={TEAM_LOGO[code]} alt={code} style={{ width: 32, height: 32, objectFit: "contain" }}
              onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.9rem", color: TEAM_COLOR[code] }}>{code}</div>
              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.3 }}>{name}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
    </Layout>
  );
}

