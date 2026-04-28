import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MapPin, Swords, Radio, Calendar } from "lucide-react";
import { TEAM_LOGO, TEAM_COLOR } from "@/lib/ipl-constants";
import { apiFetch } from "@/lib/api";

interface IplMatch {
  iplId: string;
  matchNumber: number;
  name: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamFull: string;
  awayTeamFull: string;
  venue: string;
  city: string;
  matchDate: string;
  matchTime: string;
  status: string;
  firstInningsScore: string | null;
  secondInningsScore: string | null;
  mom: string | null;
  tossText: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

function TeamLogo({ code }: { code: string }) {
  const logo = TEAM_LOGO[code];
  const color = TEAM_COLOR[code] ?? "#00d4ff";
  if (logo) {
    return (
      <img
        src={logo}
        alt={code}
        style={{ width: 52, height: 52, objectFit: "contain" }}
        onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
      />
    );
  }
  return (
    <div style={{
      width: 52, height: 52, borderRadius: "50%",
      background: `${color}22`, border: `1.5px solid ${color}50`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 800, fontSize: "0.85rem", color,
    }}>
      {code}
    </div>
  );
}

function MatchCard({ match }: { match: IplMatch }) {
  const homeColor = TEAM_COLOR[match.homeTeam] ?? "#00d4ff";
  const awayColor = TEAM_COLOR[match.awayTeam] ?? "#00d4ff";

  return (
    <motion.div
      variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}
      className="glass-card rounded-2xl overflow-hidden hover:border-primary/40 cursor-pointer"
    >
      <div className="p-4 border-b border-white/5 flex justify-between items-center bg-white/5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-white">
            M{match.matchNumber}
          </span>
          {match.isLive && (
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-1 rounded bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse">
              <Radio className="w-3 h-3" /> LIVE
            </span>
          )}
          {match.isCompleted && (
            <span className="text-xs font-bold px-2 py-1 rounded bg-white/10 text-muted-foreground">
              COMPLETED
            </span>
          )}
          {match.isUpcoming && (
            <span className="text-xs font-bold px-2 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
              UPCOMING
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3 h-3" />
          {match.matchDate} • {match.matchTime}
        </div>
      </div>

      <div className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 flex-1">
            <TeamLogo code={match.homeTeam} />
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: homeColor }}>{match.homeTeam}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[130px]">{match.homeTeamFull}</div>
              {match.firstInningsScore && (
                <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: homeColor, marginTop: 2 }}>
                  {match.firstInningsScore}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center gap-1 px-4">
            <div className="text-muted-foreground/30">
              <Swords className="w-8 h-8" />
            </div>
            <span className="text-xs text-muted-foreground font-mono font-bold">VS</span>
          </div>

          <div className="flex items-center gap-4 flex-1 justify-end text-right">
            <div>
              <div style={{ fontWeight: 800, fontSize: "1.1rem", color: awayColor }}>{match.awayTeam}</div>
              <div className="text-xs text-muted-foreground truncate max-w-[130px]">{match.awayTeamFull}</div>
              {match.secondInningsScore && (
                <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: 700, color: awayColor, marginTop: 2 }}>
                  {match.secondInningsScore}
                </div>
              )}
            </div>
            <TeamLogo code={match.awayTeam} />
          </div>
        </div>

        {match.tossText && (
          <p className="text-xs text-muted-foreground mt-4 text-center italic">{match.tossText}</p>
        )}
        {match.mom && (
          <div className="mt-2 text-center text-xs">
            <span className="text-yellow-400">⭐ MOM:</span>{" "}
            <span className="text-white font-semibold">{match.mom}</span>
          </div>
        )}
      </div>

      <div className="px-6 py-3 border-t border-white/5 bg-background/30 flex items-center gap-2 text-sm text-muted-foreground">
        <MapPin className="w-4 h-4" />
        {match.venue}{match.city ? `, ${match.city}` : ""}
      </div>
    </motion.div>
  );
}

export default function Matches() {
  const [matches, setMatches] = useState<IplMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch("/ipl/matches")
      .then(async r => {
        if (!r.ok) {
          const text = await r.text();
          throw new Error(`HTTP ${r.status}: ${text.slice(0, 200)}`);
        }
        return r.json();
      })
      .then(d => {
        if (Array.isArray(d.matches)) {
          setMatches(d.matches);
        } else {
          setError(`Unexpected response format (count=${d.count ?? "?"})`);
        }
      })
      .catch(e => setError(`Failed to load matches: ${e.message}`))
      .finally(() => setLoading(false));
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };

  const filterMatches = (tab: string) => {
    if (tab === "live") return matches.filter(m => m.isLive);
    if (tab === "upcoming") return matches.filter(m => m.isUpcoming);
    if (tab === "completed") return matches.filter(m => m.isCompleted);
    return matches;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Match Centre</h1>
          <p className="text-muted-foreground">
            Live scores, results and upcoming fixtures — IPL 2026 ({matches.length} matches)
          </p>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-white/5 border border-white/10 p-1 mb-6">
            {["all", "live", "upcoming", "completed"].map(t => (
              <TabsTrigger
                key={t}
                value={t}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground capitalize"
              >
                {t === "live" ? (
                  <span className="flex items-center gap-1.5"><Radio className="w-3 h-3" /> Live ({matches.filter(m => m.isLive).length})</span>
                ) : t === "all" ? `All (${matches.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${filterMatches(t).length})`}
              </TabsTrigger>
            ))}
          </TabsList>

          {["all", "live", "upcoming", "completed"].map(tab => (
            <TabsContent key={tab} value={tab} className="mt-0 outline-none">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl bg-white/5" />)}
                </div>
              ) : (
                <motion.div
                  className="space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {filterMatches(tab).map(match => (
                    <MatchCard key={match.iplId} match={match} />
                  ))}
                  {filterMatches(tab).length === 0 && (
                    <div className="text-center py-20 glass-card rounded-2xl">
                      <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-xl font-bold mb-2">No Matches</h3>
                      <p className="text-muted-foreground">No {tab !== "all" ? tab : ""} matches found.</p>
                    </div>
                  )}
                </motion.div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </Layout>
  );
}
