/**
 * Guide.tsx — Refined v2
 * Added: How to Play section, Quick Start steps, FAQ cards, cleaner header
 */
import { Layout } from "@/components/layout/Layout";
import { SCORING_RULES } from "../lib/ipl-constants";
import { Gavel, Users, Trophy, Zap, HelpCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const COLORS = {
  base:    "#00d4ff",
  batting: "#34d399",
  bowling: "#a78bfa",
  fielding:"#fb923c",
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

function ScoringCard({ title, color, groups, style }:
  { title:string; color:string; groups:RuleGroup[]; style?: React.CSSProperties }) {
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:`1px solid ${color}30`,
      borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column", ...style }}>
      <div style={{ padding:"0.45rem 0.85rem", background:`${color}14`,
        borderBottom:`1px solid ${color}28` }}>
        <span style={{ color, fontWeight:800, fontSize:"0.7rem",
          textTransform:"uppercase", letterSpacing:"0.09em" }}>{title}</span>
      </div>
      <div style={{ flex:1 }}>
        {groups.map((group, gi) => (
          <div key={gi}>
            {group.label && (
              <div style={{ padding:"0.28rem 0.85rem",
                background:`${group.color ?? color}0a`,
                borderTop: gi > 0 ? "1px solid rgba(255,255,255,0.05)" : undefined,
                borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ fontSize:"0.58rem", fontWeight:700, letterSpacing:"0.1em",
                  textTransform:"uppercase", color:group.color ?? color, opacity:0.7 }}>
                  {group.label}
                </span>
              </div>
            )}
            {group.rules.map((rule, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                padding:"0.3rem 0.85rem",
                borderBottom:(i < group.rules.length-1 || gi < groups.length-1)
                  ? "1px solid rgba(255,255,255,0.04)" : undefined }}>
                <span style={{ color:"rgba(255,255,255,0.62)", fontSize:"0.7rem" }}>{rule.event}</span>
                <span style={{ fontWeight:700, fontSize:"0.73rem",
                  color: typeof rule.points==="number" && rule.points<0 ? COLORS.penalty
                    : typeof rule.points==="string" ? COLORS.multi
                    : (group.color ?? color),
                  minWidth:28, textAlign:"right" }}>
                  {typeof rule.points==="number"
                    ? (rule.points>0 ? `+${rule.points}` : rule.points)
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

const STEPS = [
  { icon:<Gavel style={{ width:20, height:20 }}/>, color:"#c0392b", title:"1. Create an Auction",
    desc:"One person hosts. They create a room, set the budget and squad size, and share the invite code with friends." },
  { icon:<Users style={{ width:20, height:20 }}/>, color:"#3b82f6", title:"2. Everyone Joins",
    desc:"Friends enter the code to join the room. The host waits until all teams are ready before starting." },
  { icon:<Trophy style={{ width:20, height:20 }}/>, color:"#f59e0b", title:"3. Auction Players",
    desc:"Host nominates players one by one. Everyone calls verbal bids. Highest bidder wins. Host records the sale." },
  { icon:<Zap style={{ width:20, height:20 }}/>, color:"#22c55e", title:"4. Score Points",
    desc:"Once the IPL season starts, your squad earns fantasy points based on real match performances. Best total wins." },
];

const FAQS = [
  { q:"How many players per team?", a:"The host sets this when creating the auction — typically 11. You need at least 1 WK, 3 BAT, 3 BWL, and 1 AR." },
  { q:"What happens if nobody bids?", a:"The host marks the player as Unsold. They return to the pool and can be nominated again later." },
  { q:"Can I change my Captain mid-season?", a:"Yes — you can update your Captain and Vice-Captain before each match deadline in the My Teams section." },
  { q:"What's the base price?", a:"Base price is typically set at 80% of the player's credit value. The host can adjust this when nominating." },
  { q:"Does the budget reset?", a:"No. Whatever you spend in the auction is gone. Manage your budget carefully — you'll need enough for later rounds." },
  { q:"What if I run out of budget?", a:"You can't bid on more players. This is why pacing matters — leave enough for the roles you still need." },
];

function FAQItem({ q, a }: { q:string; a:string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.08)",
      borderRadius:12, overflow:"hidden" }}>
      <div onClick={() => setOpen(o=>!o)}
        style={{ padding:"0.85rem 1rem", cursor:"pointer",
          display:"flex", alignItems:"center", justifyContent:"space-between",
          borderBottom: open ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
        <span style={{ fontSize:"0.88rem", fontWeight:600, color:"rgba(255,255,255,0.85)" }}>{q}</span>
        {open
          ? <ChevronUp style={{ width:14, height:14, color:"rgba(255,255,255,0.35)", flexShrink:0 }} />
          : <ChevronDown style={{ width:14, height:14, color:"rgba(255,255,255,0.35)", flexShrink:0 }} />}
      </div>
      {open && (
        <div style={{ padding:"0.75rem 1rem" }}>
          <p style={{ margin:0, fontSize:"0.82rem", color:"rgba(255,255,255,0.5)", lineHeight:1.7 }}>{a}</p>
        </div>
      )}
    </div>
  );
}

export default function GuidePage() {
  return (
    <Layout>
      <div style={{ maxWidth:920, margin:"0 auto", display:"flex", flexDirection:"column", gap:"2.5rem", paddingBottom:"2rem" }}>

        {/* Header */}
        <div>
          <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.15em",
            color:"#c0392b", textTransform:"uppercase", marginBottom:"0.4rem" }}>Guide</div>
          <h1 style={{ margin:0, fontSize:"1.75rem", fontWeight:800, color:"#fff" }}>
            How to Play Colosseum
          </h1>
          <p style={{ margin:"0.4rem 0 0", color:"rgba(255,255,255,0.45)", fontSize:"0.9rem" }}>
            Everything you need to run a great IPL fantasy auction with friends.
          </p>
        </div>

        {/* Quick Start */}
        <div>
          <h2 style={{ margin:"0 0 1rem", fontSize:"1.05rem", fontWeight:700, color:"#fff" }}>Quick Start</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:"0.8rem" }}>
            {STEPS.map((step, i) => (
              <div key={i} style={{ background:"rgba(255,255,255,0.03)",
                border:`1px solid ${step.color}28`, borderRadius:14,
                padding:"1.1rem 1.2rem", display:"flex", gap:"0.85rem" }}>
                <div style={{ width:38, height:38, borderRadius:10, flexShrink:0,
                  background:`${step.color}18`, border:`1px solid ${step.color}30`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color:step.color }}>
                  {step.icon}
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.88rem", color:"#fff", marginBottom:"0.3rem" }}>
                    {step.title}
                  </div>
                  <p style={{ margin:0, fontSize:"0.78rem", color:"rgba(255,255,255,0.45)", lineHeight:1.6 }}>
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scoring System */}
        <div>
          <h2 style={{ margin:"0 0 1rem", fontSize:"1.05rem", fontWeight:700, color:"#fff" }}>
            Scoring System
          </h2>
          <div style={{ display:"grid",
            gridTemplateColumns:"1fr 1.5fr",
            gridTemplateAreas:'"base batting" "bowling batting" "fielding fielding"',
            gap:"0.7rem" }}>
            <ScoringCard title="Base"    color={COLORS.base}    style={{ gridArea:"base" }}
              groups={[{ rules: grouped["Base"] ?? [] }]} />
            <ScoringCard title="Batting" color={COLORS.batting} style={{ gridArea:"batting" }}
              groups={[
                { rules: grouped["Batting"] ?? [] },
                { label:"Strike Rate Bonus",   color:COLORS.bonus,   rules: grouped["SR Bonus (min 10 balls or 20 runs)"] ?? [] },
                { label:"Strike Rate Penalty", color:COLORS.penalty, rules: grouped["SR Penalty"] ?? [] },
              ]} />
            <ScoringCard title="Bowling" color={COLORS.bowling} style={{ gridArea:"bowling" }}
              groups={[
                { rules: grouped["Bowling"] ?? [] },
                { label:"Economy Bonus",   color:COLORS.bonus,   rules: grouped["Eco Bonus (min 2 overs)"] ?? [] },
                { label:"Economy Penalty", color:COLORS.penalty, rules: grouped["Eco Penalty"] ?? [] },
              ]} />
            <ScoringCard title="Fielding" color={COLORS.fielding} style={{ gridArea:"fielding" }}
              groups={[
                { rules: grouped["Fielding"] ?? [] },
                { label:"Multipliers", color:COLORS.multi, rules: grouped["Multiplier"] ?? [] },
              ]} />
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 style={{ margin:"0 0 1rem", fontSize:"1.05rem", fontWeight:700, color:"#fff",
            display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <HelpCircle style={{ width:18, height:18, color:"rgba(255,255,255,0.4)" }} />
            FAQs
          </h2>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.55rem" }}>
            {FAQS.map((faq, i) => <FAQItem key={i} {...faq} />)}
          </div>
        </div>
      </div>
    </Layout>
  );
}
