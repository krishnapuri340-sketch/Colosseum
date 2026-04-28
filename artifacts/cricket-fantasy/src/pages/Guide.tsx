import { Layout } from "@/components/layout/Layout";
import { SCORING_RULES } from "../lib/ipl-constants";

const COLORS = {
  base:    "#00d4ff",
  batting: "#34d399",
  bowling: "#a78bfa",
  fielding: "#fb923c",
  bonus:   "#fbbf24",
  penalty: "#f87171",
  multi:   "#f472b6",
};

const grouped = SCORING_RULES.reduce<Record<string, typeof SCORING_RULES>>((acc, rule) => {
  if (!acc[rule.category]) acc[rule.category] = [];
  acc[rule.category].push(rule);
  return acc;
}, {});

type RuleGroup = { label?: string; color?: string; rules: typeof SCORING_RULES };

function ScoringCard({
  title, color, groups, style,
}: {
  title: string; color: string; groups: RuleGroup[]; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: `1px solid ${color}30`,
      borderRadius: 16,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}>
      <div style={{
        padding: "0.5rem 0.85rem",
        background: `${color}14`,
        borderBottom: `1px solid ${color}28`,
      }}>
        <span style={{ color, fontWeight: 800, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.09em" }}>
          {title}
        </span>
      </div>
      <div style={{ flex: 1 }}>
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div style={{
                padding: "0.3rem 0.85rem",
                background: `${group.color ?? color}0a`,
                borderTop: gi > 0 ? `1px solid rgba(255,255,255,0.05)` : undefined,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: group.color ?? color, opacity: 0.7 }}>
                  {group.label}
                </span>
              </div>
            )}
            {group.rules.map((rule, i) => (
              <div key={i} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.32rem 0.85rem",
                borderBottom: (i < group.rules.length - 1 || gi < groups.length - 1)
                  ? "1px solid rgba(255,255,255,0.04)" : undefined,
              }}>
                <span style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.72rem" }}>{rule.event}</span>
                <span style={{
                  fontWeight: 700, fontSize: "0.75rem",
                  color: typeof rule.points === "number" && rule.points < 0 ? COLORS.penalty
                    : typeof rule.points === "string" ? COLORS.multi
                    : (group.color ?? color),
                  minWidth: 28, textAlign: "right",
                }}>
                  {typeof rule.points === "number"
                    ? (rule.points > 0 ? `+${rule.points}` : rule.points)
                    : rule.points}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GuidePage() {
  return (
    <Layout>
      <div style={{ padding: "1.5rem", maxWidth: 960, margin: "0 auto" }}>
        <div style={{ marginBottom: "2rem" }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: "#fff" }}>
            Fantasy Cricket Guide
          </h1>
          <p style={{ margin: "0.4rem 0 0", color: "rgba(255,255,255,0.5)", fontSize: "0.9rem" }}>
            Everything you need to know about scoring, teams, and player roles
          </p>
        </div>

        <h2 style={{ margin: "0 0 1rem", fontSize: "1.1rem", fontWeight: 700, color: "#fff" }}>
          Scoring System
        </h2>

        {/* Bento scoring grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gridTemplateAreas: '"base batting" "bowling batting" "fielding fielding"',
          gap: "0.75rem",
          marginBottom: "2rem",
        }}>
          <ScoringCard
            title="Base"
            color={COLORS.base}
            style={{ gridArea: "base" }}
            groups={[
              { rules: grouped["Base"] ?? [] },
            ]}
          />

          <ScoringCard
            title="Batting"
            color={COLORS.batting}
            style={{ gridArea: "batting" }}
            groups={[
              { rules: grouped["Batting"] ?? [] },
              { label: "Strike Rate Bonus", color: COLORS.bonus, rules: grouped["SR Bonus (min 10 balls or 20 runs)"] ?? [] },
              { label: "Strike Rate Penalty", color: COLORS.penalty, rules: grouped["SR Penalty"] ?? [] },
            ]}
          />

          <ScoringCard
            title="Bowling"
            color={COLORS.bowling}
            style={{ gridArea: "bowling" }}
            groups={[
              { rules: grouped["Bowling"] ?? [] },
              { label: "Economy Bonus", color: COLORS.bonus, rules: grouped["Eco Bonus (min 2 overs)"] ?? [] },
              { label: "Economy Penalty", color: COLORS.penalty, rules: grouped["Eco Penalty"] ?? [] },
            ]}
          />

          <ScoringCard
            title="Fielding"
            color={COLORS.fielding}
            style={{ gridArea: "fielding" }}
            groups={[
              { rules: grouped["Fielding"] ?? [] },
              { label: "Multipliers", color: COLORS.multi, rules: grouped["Multiplier"] ?? [] },
            ]}
          />
        </div>

      </div>
    </Layout>
  );
}
