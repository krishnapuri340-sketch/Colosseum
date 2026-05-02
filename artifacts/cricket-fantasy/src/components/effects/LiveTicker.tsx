import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { TEAM_COLOR } from "@/lib/ipl-constants";

interface IplMatch {
  iplId: string;
  matchNumber: number;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchDate: string;
  matchTime: string;
  firstInningsScore: string | null;
  secondInningsScore: string | null;
  result: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

type TickerItem = {
  key: string;
  kind: "live" | "upcoming" | "result";
  homeTeam: string;
  awayTeam: string;
  text: string;
};

function buildItems(matches: IplMatch[]): TickerItem[] {
  const live = matches.filter((m) => m.isLive);
  const upcoming = matches.filter((m) => m.isUpcoming).slice(0, 5);
  const recent = matches
    .filter((m) => m.isCompleted && m.result)
    .slice(-3)
    .reverse();

  const items: TickerItem[] = [];

  for (const m of live) {
    const score = [m.firstInningsScore, m.secondInningsScore]
      .filter(Boolean)
      .join(" • ");
    items.push({
      key: `live-${m.iplId}`,
      kind: "live",
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      text: `M${m.matchNumber} ${m.homeTeam} vs ${m.awayTeam}${score ? ` — ${score}` : ""}`,
    });
  }
  for (const m of upcoming) {
    items.push({
      key: `up-${m.iplId}`,
      kind: "upcoming",
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      text: `M${m.matchNumber} ${m.homeTeam} vs ${m.awayTeam} • ${m.matchDate} ${m.matchTime} • ${m.venue}`,
    });
  }
  for (const m of recent) {
    items.push({
      key: `done-${m.iplId}`,
      kind: "result",
      homeTeam: m.homeTeam,
      awayTeam: m.awayTeam,
      text: `M${m.matchNumber} ${m.result}`,
    });
  }
  return items;
}

export function LiveTicker() {
  const [items, setItems] = useState<TickerItem[]>([]);

  useEffect(() => {
    let cancelled = false;
    let inflight: AbortController | null = null;

    async function load() {
      // Skip if a previous fetch is still in flight — prevents pile-ups
      // on slow networks where the request exceeds the polling interval.
      if (inflight) return;
      const ctrl = new AbortController();
      inflight = ctrl;
      try {
        const r = await apiFetch("/ipl/matches", { signal: ctrl.signal });
        const d = await r.json();
        if (!cancelled && Array.isArray(d.matches)) {
          setItems(buildItems(d.matches as IplMatch[]));
        }
      } catch {
        /* silent — ticker is purely cosmetic */
      } finally {
        if (inflight === ctrl) inflight = null;
      }
    }

    load();
    const t = setInterval(load, 60_000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(t);
      inflight?.abort();
    };
  }, []);

  if (items.length === 0) return null;

  // Duplicate items for seamless marquee loop
  const looped = [...items, ...items];
  const hasLive = items.some((i) => i.kind === "live");

  return (
    <div
      style={{
        position: "relative",
        height: 30,
        overflow: "hidden",
        background:
          "linear-gradient(90deg, rgba(7,9,26,0.95) 0%, rgba(14,17,34,0.92) 50%, rgba(7,9,26,0.95) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "0 1px 0 rgba(255,255,255,0.03) inset, 0 4px 16px rgba(0,0,0,0.2)",
        zIndex: 30,
        flexShrink: 0,
      }}
    >
      {/* Left "LIVE" / "FIXTURES" badge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "0 14px",
          background: hasLive
            ? "linear-gradient(90deg, rgba(34,197,94,0.22) 0%, rgba(34,197,94,0.08) 100%)"
            : "linear-gradient(90deg, rgba(192,25,44,0.22) 0%, rgba(192,25,44,0.08) 100%)",
          borderRight: hasLive
            ? "1px solid rgba(34,197,94,0.3)"
            : "1px solid rgba(192,25,44,0.3)",
          zIndex: 2,
          fontSize: "0.62rem",
          fontWeight: 900,
          letterSpacing: "0.16em",
          color: hasLive ? "#4ade80" : "#e05572",
          textTransform: "uppercase",
        }}
      >
        {hasLive && (
          <span
            className="live-pulse"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px rgba(34,197,94,0.6)",
            }}
          />
        )}
        {hasLive ? "Live" : "Fixtures"}
      </div>

      {/* Right fade so text doesn't bleed into the edge */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 0,
          bottom: 0,
          width: 60,
          background:
            "linear-gradient(90deg, transparent 0%, rgba(7,9,26,0.95) 100%)",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Marquee track */}
      <div
        className="ticker-track"
        style={{
          position: "absolute",
          left: 84,
          top: 0,
          bottom: 0,
          display: "flex",
          alignItems: "center",
          gap: 0,
          whiteSpace: "nowrap",
          willChange: "transform",
        }}
      >
        {looped.map((item, idx) => {
          const c1 = TEAM_COLOR[item.homeTeam] ?? "rgba(255,255,255,0.55)";
          const c2 = TEAM_COLOR[item.awayTeam] ?? "rgba(255,255,255,0.55)";
          const dotColor =
            item.kind === "live"
              ? "#4ade80"
              : item.kind === "upcoming"
                ? "#fbbf24"
                : "rgba(255,255,255,0.35)";
          return (
            <span
              key={`${item.key}-${idx}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "0 22px",
                fontSize: "0.74rem",
                fontWeight: 600,
                color: "rgba(255,255,255,0.7)",
                borderRight: "1px solid rgba(255,255,255,0.06)",
                height: "100%",
              }}
            >
              <span
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: dotColor,
                  boxShadow:
                    item.kind === "live"
                      ? "0 0 6px rgba(34,197,94,0.7)"
                      : "none",
                  flexShrink: 0,
                }}
              />
              <span style={{ color: c1, fontWeight: 800 }}>
                {item.homeTeam}
              </span>
              <span style={{ opacity: 0.4 }}>vs</span>
              <span style={{ color: c2, fontWeight: 800 }}>
                {item.awayTeam}
              </span>
              <span style={{ opacity: 0.45, fontWeight: 500 }}>
                {item.text.replace(
                  `${item.homeTeam} vs ${item.awayTeam}`,
                  "",
                )}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}
