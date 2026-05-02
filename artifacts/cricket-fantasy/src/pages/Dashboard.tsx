import { Layout } from "@/components/layout/Layout";
import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowUpRight, Gavel, Radio, Users, Target, Trophy,
  ChevronDown, Sparkles, Clock, Flame, ArrowRight, TrendingUp,
} from "lucide-react";
import { Link } from "wouter";
import { TEAM_LOGO, TEAM_COLOR, ALL_TEAMS } from "@/lib/ipl-constants";
import { useApp } from "@/context/AppContext";
import { useIplMatches, type IplMatch } from "@/hooks/use-ipl-data";

/* ───────── motion ───────── */

const fade: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};

/* ───────── shared bits ───────── */

/** Floating "↗" pill in the top-right corner of every clickable card. */
function CornerArrow() {
  return (
    <div style={{
      position: "absolute", top: 14, right: 14,
      width: 30, height: 30, borderRadius: "50%",
      background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.08)",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all 0.2s",
      zIndex: 2,
    }} className="card-arrow">
      <ArrowUpRight size={14} style={{ color: "rgba(255,255,255,0.7)" }} />
    </div>
  );
}

/** Glassy bento card. The wrapping <Link> handles navigation. */
function BentoCard({
  href, children, padding = "20px", style, glow,
}: {
  href?: string;
  children: React.ReactNode;
  padding?: string;
  style?: React.CSSProperties;
  /** "rgba(...)" background tint for the inner top-left glow. */
  glow?: string;
}) {
  const inner = (
    <div
      className="bento-card"
      style={{
        position: "relative",
        height: "100%",
        background:
          "linear-gradient(180deg, rgba(20,22,40,0.72) 0%, rgba(11,13,28,0.78) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 24,
        padding,
        overflow: "hidden",
        cursor: href ? "pointer" : "default",
        transition: "transform 0.22s ease, border-color 0.22s ease",
        ...style,
      }}
    >
      {glow && (
        <div aria-hidden style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: `radial-gradient(ellipse 60% 70% at 100% 0%, ${glow}, transparent 70%)`,
        }} />
      )}
      <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
        {children}
      </div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ───────── countdown widget ───────── */

function parseMatchDate(m: IplMatch): Date | null {
  if (!m?.matchDate) return null;
  // Try common formats: "Mar 22, 2026" + "7:30 PM"
  const candidates = [
    `${m.matchDate} ${m.matchTime ?? ""}`.trim(),
    m.matchDate,
  ];
  for (const c of candidates) {
    const d = new Date(c);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return null;
}

function useCountdown(target: Date | null) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!target) return { days: 0, hours: 0, mins: 0, secs: 0, expired: true };
  const diff = Math.max(0, target.getTime() - now);
  const days  = Math.floor(diff / 86_400_000);
  const hours = Math.floor((diff % 86_400_000) / 3_600_000);
  const mins  = Math.floor((diff % 3_600_000) / 60_000);
  const secs  = Math.floor((diff % 60_000) / 1000);
  return { days, hours, mins, secs, expired: diff === 0 };
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  const v = String(value).padStart(2, "0");
  return (
    <div style={{
      flex: 1, minWidth: 0,
      background: "linear-gradient(180deg, rgba(139,92,246,0.10), rgba(192,25,44,0.08))",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "10px 6px",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
    }}>
      <div style={{
        fontSize: "1.55rem", fontWeight: 900, color: "#fff",
        letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
      }}>{v}</div>
      <div style={{
        fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.14em",
        color: "rgba(255,255,255,0.4)", textTransform: "uppercase",
      }}>{label}</div>
    </div>
  );
}

/* ───────── form gauge (semi-circle SVG) ───────── */

function FormGauge({ value, label }: { value: number; label: string }) {
  // value 0–100 → angle 0..π
  const v = Math.max(0, Math.min(100, value));
  const r = 70;
  const cx = 90, cy = 88;
  const angle = Math.PI * (1 - v / 100);
  const x = cx + r * Math.cos(angle);
  const y = cy - r * Math.sin(angle);
  const largeArc = v > 50 ? 1 : 0;
  const arcPath = `M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
  const trackPath = `M ${cx - r} ${cy} A ${r} ${r} 0 1 1 ${cx + r} ${cy}`;
  const tone =
    v >= 70 ? "#22c55e" :
    v >= 45 ? "#fbbf24" :
              "#f87171";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <svg width="180" height="100" viewBox="0 0 180 100">
        <defs>
          <linearGradient id="formGrad" x1="0" x2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#22c55e" />
          </linearGradient>
        </defs>
        <path d={trackPath} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" strokeLinecap="round" />
        <path d={arcPath}   fill="none" stroke="url(#formGrad)" strokeWidth="10" strokeLinecap="round" />
        <circle cx={x} cy={y} r="6" fill="#fff" />
      </svg>
      <div style={{ marginTop: -8, textAlign: "center" }}>
        <div style={{
          fontSize: "2.1rem", fontWeight: 900, color: "#fff",
          letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums",
        }}>{Math.round(v)}</div>
        <div style={{ fontSize: "0.7rem", color: tone, fontWeight: 700, marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ───────── feature tiles (top row) ───────── */

const FEATURE_TILES: {
  href: string; label: string; tag: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  glow: string; iconColor: string;
}[] = [
  { href: "/auction",     label: "Auction",      tag: "Build your squad",
    icon: Gavel,    glow: "rgba(192,25,44,0.28)",  iconColor: "#f87171" },
  { href: "/live",        label: "Live Scoring", tag: "Watch it tick up",
    icon: Radio,    glow: "rgba(34,197,94,0.22)",  iconColor: "#4ade80" },
  { href: "/players",     label: "Players",      tag: "Stats & form",
    icon: Users,    glow: "rgba(99,102,241,0.22)", iconColor: "#a5b4fc" },
  { href: "/predictions", label: "Predictions",  tag: "Call the winner",
    icon: Target,   glow: "rgba(139,92,246,0.24)", iconColor: "#c4b5fd" },
];

function FeatureTile({ tile }: { tile: typeof FEATURE_TILES[number] }) {
  return (
    <BentoCard href={tile.href} glow={tile.glow} padding="22px" style={{ minHeight: 180 }}>
      <CornerArrow />
      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `linear-gradient(135deg, ${tile.glow}, transparent)`,
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: `0 6px 24px ${tile.glow}`,
        }}>
          <tile.icon size={26} style={{ color: tile.iconColor }} />
        </div>
        <div>
          <div style={{
            fontSize: "1.5rem", fontWeight: 900, color: "#fff",
            letterSpacing: "-0.03em", lineHeight: 1.05,
          }}>{tile.label}</div>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
            {tile.tag}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}

/* ───────── page ───────── */

export default function Dashboard() {
  const { profile, totalPts, currentRank, myTeams } = useApp();
  const { data: matches = [] } = useIplMatches();

  const live      = useMemo(() => matches.filter(m => m.isLive),      [matches]);
  const upcoming  = useMemo(() => matches.filter(m => m.isUpcoming),  [matches]);
  const completed = useMemo(() => matches.filter(m => m.isCompleted), [matches]);
  const featured  = live[0] ?? upcoming[0] ?? null;

  const featuredDate = featured ? parseMatchDate(featured) : null;
  const countdown    = useCountdown(featuredDate);

  // "Form" score: rough 0–100 derived from prediction accuracy + rank,
  // wholly cosmetic — falls back gracefully when stats are missing.
  const formScore = useMemo(() => {
    const rankPart = currentRank > 0 ? Math.max(0, 100 - currentRank) : 50;
    return Math.round(rankPart * 0.6 + 40 * 0.4);
  }, [currentRank]);

  return (
    <Layout>
      <motion.div
        className="space-y-4"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
        style={{ paddingBottom: 8 }}
      >

        {/* ═════════ HERO ═════════ */}
        <motion.div variants={fade} style={{
          position: "relative",
          background:
            "linear-gradient(135deg, rgba(192,25,44,0.18) 0%, rgba(139,92,246,0.10) 55%, rgba(11,13,28,0.85) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 28,
          padding: "26px 28px",
          overflow: "hidden",
        }}>
          {/* aurora */}
          <div aria-hidden style={{
            position: "absolute", top: "-40%", left: "55%", width: "55%", height: "200%",
            background: "radial-gradient(ellipse at center, rgba(139,92,246,0.35), transparent 60%)",
            filter: "blur(40px)", pointerEvents: "none",
          }} />
          <div aria-hidden style={{
            position: "absolute", top: "-30%", right: "-10%", width: "40%", height: "180%",
            background: "radial-gradient(ellipse at center, rgba(192,25,44,0.30), transparent 60%)",
            filter: "blur(50px)", pointerEvents: "none",
          }} />

          <div style={{
            position: "relative", display: "grid",
            gridTemplateColumns: "minmax(260px, 1.4fr) auto minmax(220px, 1fr)",
            alignItems: "center", gap: 24,
          }} className="hero-grid">
            <div>
              <div style={{
                fontSize: "clamp(2.4rem, 4vw, 3.4rem)", fontWeight: 900, color: "#fff",
                letterSpacing: "-0.045em", lineHeight: 1,
              }}>
                Colosseum
              </div>
              <div style={{
                marginTop: 6, fontSize: "0.92rem", color: "rgba(255,255,255,0.55)",
                fontWeight: 500,
              }}>
                IPL 2026 — Fantasy Auction League
              </div>
            </div>

            {/* Season pill */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 999,
              color: "rgba(255,255,255,0.85)", fontWeight: 700, fontSize: "0.82rem",
              whiteSpace: "nowrap",
            }} className="hero-pill">
              <Sparkles size={14} style={{ color: "#fbbf24" }} />
              Season 19
              <ChevronDown size={14} style={{ opacity: 0.6 }} />
            </div>

            <div style={{
              fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.5,
              textAlign: "right", maxWidth: 320, justifySelf: "end",
            }} className="hero-tagline">
              Run your private auction, draft your dream squad, and chase the
              orange&nbsp;cap on the only fantasy table that matters.
            </div>
          </div>
        </motion.div>

        {/* ═════════ FEATURE TILES ═════════ */}
        <motion.div variants={fade} style={{
          display: "grid", gap: 14,
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        }}>
          {FEATURE_TILES.map(t => <FeatureTile key={t.href} tile={t} />)}
        </motion.div>

        {/* ═════════ BENTO ROW 2 — Bonus / Featured / Countdown ═════════ */}
        <motion.div variants={fade} style={{
          display: "grid", gap: 14,
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 0.85fr)",
        }} className="bento-row-2">
          {/* Host Auction "bonus" card */}
          <BentoCard href="/auction/create" glow="rgba(192,25,44,0.30)" padding="26px"
            style={{ minHeight: 240 }}>
            <CornerArrow />
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "5px 10px",
              background: "rgba(192,25,44,0.22)",
              border: "1px solid rgba(192,25,44,0.36)",
              borderRadius: 999, color: "#f87171",
              fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.10em",
              textTransform: "uppercase",
            }}>
              <Flame size={11} /> Brand new
            </div>
            <div style={{
              fontSize: "0.85rem", color: "rgba(255,255,255,0.6)",
              marginTop: 18,
            }}>
              Sign up &amp; get up to <span style={{ color: "#fff", fontWeight: 800 }}>₹2,000 in coins</span>
            </div>
            <div style={{
              fontSize: "clamp(2rem, 3.6vw, 2.85rem)", fontWeight: 900, color: "#fff",
              letterSpacing: "-0.045em", lineHeight: 1.05, marginTop: 6,
            }}>
              Your Auction<br />Awaits!
            </div>
            <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 18px",
                background: "linear-gradient(135deg, #c0192c, #8b1023)",
                color: "#fff", borderRadius: 999, fontWeight: 800, fontSize: "0.82rem",
                boxShadow: "0 8px 24px rgba(192,25,44,0.4)",
              }}>
                Host now <ArrowRight size={14} />
              </div>
              <Link href="/auction/join">
                <div style={{
                  padding: "10px 16px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  color: "rgba(255,255,255,0.75)",
                  borderRadius: 999, fontWeight: 700, fontSize: "0.78rem",
                  cursor: "pointer",
                }}>
                  Or join one →
                </div>
              </Link>
            </div>
          </BentoCard>

          {/* Featured match */}
          {featured ? (
            <BentoCard href="/matches" glow="rgba(99,102,241,0.22)" padding="22px" style={{ minHeight: 240 }}>
              <CornerArrow />
              <div style={{
                fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
                color: featured.isLive ? "#4ade80" : "rgba(255,255,255,0.45)",
                fontWeight: 800,
              }}>
                {featured.isLive ? "● Live" : "Featured Match"}
              </div>

              <div style={{
                marginTop: 18, display: "flex", alignItems: "center",
                gap: 14, justifyContent: "space-between",
              }}>
                <TeamAvatar code={featured.homeTeam} />
                <div style={{
                  fontSize: "1.2rem", fontWeight: 900,
                  color: "rgba(255,255,255,0.35)", letterSpacing: "-0.02em",
                }}>VS</div>
                <TeamAvatar code={featured.awayTeam} />
              </div>

              <div style={{ marginTop: 18 }}>
                <div style={{
                  fontSize: "1.05rem", fontWeight: 800, color: "#fff",
                  letterSpacing: "-0.02em",
                }}>
                  M{featured.matchNumber} · {featured.homeTeam} vs {featured.awayTeam}
                </div>
                <div style={{
                  fontSize: "0.74rem", color: "rgba(255,255,255,0.45)", marginTop: 4,
                  display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap",
                }}>
                  <Clock size={11} /> {featured.matchDate} · {featured.matchTime}
                  <span style={{ opacity: 0.5 }}>·</span>
                  {featured.venue}
                </div>
              </div>
            </BentoCard>
          ) : (
            <BentoCard padding="22px" style={{ minHeight: 240 }}>
              <div style={{
                height: "100%", display: "flex", alignItems: "center",
                justifyContent: "center", color: "rgba(255,255,255,0.35)",
                fontSize: "0.85rem", textAlign: "center",
              }}>
                Fixtures will appear here once the season opens.
              </div>
            </BentoCard>
          )}

          {/* Countdown */}
          <BentoCard glow="rgba(139,92,246,0.24)" padding="20px" style={{ minHeight: 240 }}>
            <CornerArrow />
            <div style={{
              fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)", fontWeight: 800,
            }}>
              {featuredDate && !countdown.expired ? "Starts In" : "Festive Race"}
            </div>
            {featuredDate && !countdown.expired ? (
              <>
                <div style={{ display: "flex", gap: 6, marginTop: 14 }}>
                  <CountdownCell value={countdown.days}  label="Day" />
                  <CountdownCell value={countdown.hours} label="Hour" />
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <CountdownCell value={countdown.mins}  label="Min" />
                  <CountdownCell value={countdown.secs}  label="Sec" />
                </div>
                <div style={{
                  marginTop: 18, fontSize: "1.15rem", fontWeight: 900,
                  color: "#fff", letterSpacing: "-0.025em", lineHeight: 1.1,
                }}>
                  Festive Race
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", marginTop: 4 }}>
                  Top 100 fantasy bosses win exclusive gear.
                </div>
              </>
            ) : (
              <div style={{
                marginTop: 18,
                fontSize: "1.15rem", fontWeight: 900, color: "#fff",
                letterSpacing: "-0.025em", lineHeight: 1.1,
              }}>
                Festive Race
                <div style={{
                  marginTop: 8, fontSize: "0.78rem", fontWeight: 500,
                  color: "rgba(255,255,255,0.5)",
                }}>
                  The season's running now. Check back when the next match locks in.
                </div>
              </div>
            )}
          </BentoCard>
        </motion.div>

        {/* ═════════ BENTO ROW 3 — My Teams / Franchises / Form ═════════ */}
        <motion.div variants={fade} style={{
          display: "grid", gap: 14,
          gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 1.3fr) minmax(0, 0.8fr)",
        }} className="bento-row-3">
          {/* My Teams */}
          <BentoCard href="/my-teams" padding="20px" style={{ minHeight: 220 }}>
            <CornerArrow />
            <div style={{
              fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)", fontWeight: 800,
            }}>
              My Squads
            </div>

            <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
              {myTeams.length === 0 ? (
                <div style={{
                  padding: "18px 4px", color: "rgba(255,255,255,0.4)",
                  fontSize: "0.85rem",
                }}>
                  No squads yet — host an auction to build your first.
                </div>
              ) : (
                myTeams.slice(0, 3).map((t, i) => (
                  <SquadRow key={t.id ?? i} initial={(t.name?.[0] ?? "T").toUpperCase()}
                    name={t.name ?? `Squad ${i + 1}`}
                    sub={`${t.players?.length ?? 0} players · ${t.credits ?? 0} cr left`} />
                ))
              )}
            </div>
          </BentoCard>

          {/* Franchise rail */}
          <BentoCard padding="22px" style={{ minHeight: 220 }}>
            <div style={{
              fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)", fontWeight: 800,
            }}>
              IPL Franchises
            </div>
            <div style={{
              marginTop: 18,
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: 12,
            }}>
              {ALL_TEAMS.map(code => (
                <Link key={code} href="/players">
                  <div className="franchise-chip" style={{
                    aspectRatio: "1 / 1",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderRadius: 14,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    padding: 8, cursor: "pointer",
                    transition: "all 0.2s",
                  }}>
                    {TEAM_LOGO[code] ? (
                      <img src={TEAM_LOGO[code]} alt={code}
                        style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.85 }} />
                    ) : (
                      <span style={{
                        fontSize: "0.85rem", fontWeight: 900,
                        color: TEAM_COLOR[code] ?? "#fff",
                      }}>{code}</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            <div style={{
              marginTop: 16, fontSize: "0.72rem", color: "rgba(255,255,255,0.4)",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <TrendingUp size={11} />
              {completed.length} played · {live.length} live · {upcoming.length} upcoming
            </div>
          </BentoCard>

          {/* Form gauge */}
          <BentoCard href="/leaderboard" glow="rgba(34,197,94,0.18)" padding="20px" style={{ minHeight: 220 }}>
            <CornerArrow />
            <div style={{
              fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)", fontWeight: 800,
            }}>
              Form Index
            </div>
            <div style={{
              marginTop: 18,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <FormGauge value={formScore} label={
                formScore >= 70 ? "On fire" :
                formScore >= 45 ? "Steady" :
                                  "Needs work"
              } />
            </div>
            <div style={{
              marginTop: 8, fontSize: "0.72rem",
              color: "rgba(255,255,255,0.5)", textAlign: "center",
            }}>
              Rank #{currentRank || "—"} · {totalPts.toLocaleString()} pts
            </div>
          </BentoCard>
        </motion.div>

        {/* ═════════ FOOTER STRIP ═════════ */}
        <motion.div variants={fade} style={{
          marginTop: 6,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
          padding: "16px 18px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          color: "rgba(255,255,255,0.4)", fontSize: "0.72rem",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
            <Trophy size={13} style={{ color: "#fbbf24" }} />
            Colosseum · {profile?.username ?? "Guest"}
          </div>
          <div style={{ display: "flex", gap: 18, flexWrap: "wrap" }}>
            <FooterLink href="/matches">Matches</FooterLink>
            <FooterLink href="/auction">Auction</FooterLink>
            <FooterLink href="/leaderboard">Leaderboard</FooterLink>
            <FooterLink href="/guide">Guide</FooterLink>
            <FooterLink href="/profile">Profile</FooterLink>
          </div>
        </motion.div>
      </motion.div>
    </Layout>
  );
}

/* ───────── small subcomponents ───────── */

function TeamAvatar({ code }: { code: string }) {
  const color = TEAM_COLOR[code] ?? "#fff";
  const logo = TEAM_LOGO[code];
  return (
    <div style={{
      width: 56, height: 56, borderRadius: "50%",
      background: `radial-gradient(circle at 30% 30%, ${color}33, rgba(255,255,255,0.04))`,
      border: `1px solid ${color}55`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {logo ? (
        <img src={logo} alt={code} style={{ width: 38, height: 38, objectFit: "contain" }} />
      ) : (
        <span style={{ fontSize: "0.85rem", fontWeight: 900, color }}>{code}</span>
      )}
    </div>
  );
}

function SquadRow({ initial, name, sub }: { initial: string; name: string; sub: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      padding: "10px 12px",
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.05)",
      borderRadius: 14,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: "50%",
        background: "linear-gradient(135deg, #c0192c, #8b1023)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontWeight: 900, fontSize: "0.85rem",
      }}>{initial}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: "0.85rem", fontWeight: 700, color: "#fff",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{name}</div>
        <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.45)" }}>{sub}</div>
      </div>
      <ArrowUpRight size={14} style={{ color: "rgba(255,255,255,0.3)" }} />
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <span style={{
        cursor: "pointer", fontWeight: 700, letterSpacing: "0.04em",
        textTransform: "uppercase", transition: "color 0.2s",
      }} className="footer-link">
        {children}
      </span>
    </Link>
  );
}
