import { Router, type IRouter } from "express";

const router: IRouter = Router();

const S3_BASE = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";
const COMP_ID = 284;

function stripJsonp(text: string): string {
  return text.replace(/^[A-Za-z_$][A-Za-z0-9_$]*\(/, "").replace(/\)\s*;?\s*$/, "");
}

async function fetchS3(path: string): Promise<any> {
  const url = `${S3_BASE}/${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`S3 fetch failed: ${res.status} ${url}`);
  const text = await res.text();
  return JSON.parse(stripJsonp(text));
}

interface PlayerStats {
  played: boolean;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  duck: boolean;
  wickets: number;
  dots: number;
  lbwBowled: number;
  maidens: number;
  ballsBowled: number;
  runsConceded: number;
  catches: number;
  runOuts: number;
  sharedRunOuts: number;
  stumpings: number;
}

function calcPoints(p: PlayerStats): number {
  if (!p.played) return 0;
  let pts = 4; // Playing XI

  const r = p.runs || 0;
  const balls = p.balls || 0;

  pts += r;
  pts += (p.fours || 0) * 4;
  pts += (p.sixes || 0) * 6;
  if (p.duck) pts -= 2;

  if (r >= 100) pts += 16;
  else if (r >= 75) pts += 12;
  else if (r >= 50) pts += 8;
  else if (r >= 25) pts += 4;

  if (balls >= 10 || r >= 20) {
    const sr = balls > 0 ? (r / balls) * 100 : 0;
    if (sr > 190) pts += 8;
    else if (sr > 170) pts += 6;
    else if (sr > 150) pts += 4;
    else if (sr >= 130) pts += 2;
    else if (sr >= 70 && sr <= 100) pts -= 2;
    else if (sr >= 60 && sr < 70) pts -= 4;
    else if (sr >= 50 && sr < 60) pts -= 6;
  }

  const w = p.wickets || 0;
  pts += (p.dots || 0) * 2;
  pts += w * 30;
  pts += (p.lbwBowled || 0) * 8;
  pts += (p.maidens || 0) * 12;

  if (w >= 5) pts += 16;
  else if (w >= 4) pts += 12;
  else if (w >= 3) pts += 8;

  const overs = (p.ballsBowled || 0) / 6;
  if (overs >= 2) {
    const eco = (p.runsConceded || 0) / overs;
    if (eco < 5) pts += 8;
    else if (eco < 6) pts += 6;
    else if (eco <= 7) pts += 4;
    else if (eco <= 8) pts += 2;
    else if (eco >= 10 && eco <= 11) pts -= 2;
    else if (eco > 11 && eco <= 12) pts -= 4;
    else if (eco > 12) pts -= 6;
  }

  const c = p.catches || 0;
  pts += c * 8;
  if (c >= 3) pts += 4;
  pts += (p.runOuts || 0) * 10;
  pts += (p.sharedRunOuts || 0) * 5;
  pts += (p.stumpings || 0) * 12;

  return pts;
}

router.get("/ipl/matches", async (_req, res): Promise<void> => {
  try {
    const data = await fetchS3(`${COMP_ID}-matchschedule.js`);
    const fixtures: any[] = data?.Matchsummary ?? data?.Fixtures ?? data?.fixtures ?? [];
    const matches = fixtures.map((m: any) => {
      const status = (m.MatchStatus ?? "").toLowerCase();
      const isLive = status === "live";
      const isCompleted = status === "post" || status === "result";
      const isUpcoming = status === "fixture" || status === "scheduled";
      // Match number: "Match 40" → 40
      const matchOrderRaw = String(m.MatchOrder ?? m.RowNo ?? "");
      const matchNum = parseInt(matchOrderRaw.replace(/[^0-9]/g, "")) || 0;
      return {
        iplId: String(m.MatchID ?? ""),
        matchNumber: matchNum,
        name: m.MatchName ?? m.MatchDesc ?? "",
        homeTeam: m.FirstBattingTeamCode ?? m.HomeTeamCode ?? "",
        awayTeam: m.SecondBattingTeamCode ?? m.AwayTeamCode ?? "",
        homeTeamFull: m.FirstBattingTeamName ?? m.HomeTeamName ?? "",
        awayTeamFull: m.SecondBattingTeamName ?? m.AwayTeamName ?? "",
        venue: m.GroundName ?? "",
        city: m.city ?? m.GroundCity ?? "",
        matchDate: m.MatchDate ?? "",
        matchTime: m.MatchTime ?? "",
        status: m.MatchStatus ?? "",
        firstInningsScore: m["1Summary"] ?? null,
        secondInningsScore: m["2Summary"] ?? null,
        mom: m.MOM ?? null,
        tossText: m.TossText ?? m.TossDetails ?? null,
        liveStrikerName: m.CurrentStrikerName ?? null,
        liveBowlerName: m.CurrentBowlerName ?? null,
        liveScore: isLive ? (m["1Summary"] ?? m["2Summary"] ?? null) : null,
        isLive,
        isCompleted,
        isUpcoming,
      };
    });
    res.json({ matches, source: "ipl-s3", count: matches.length });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch IPL schedule", detail: err?.message });
  }
});

router.get("/ipl/standings", async (_req, res): Promise<void> => {
  try {
    const data = await fetchS3(`${COMP_ID}-standings.js`);
    const table = data?.Table ?? data?.standings ?? [];
    const standings = table.map((row: any) => ({
      team: row.TeamCode ?? row.team ?? "",
      teamFull: row.TeamName ?? row.teamName ?? "",
      played: row.MatchesPlayed ?? row.played ?? 0,
      won: row.MatchesWon ?? row.won ?? 0,
      lost: row.MatchesLost ?? row.lost ?? 0,
      tied: row.MatchesTied ?? row.tied ?? 0,
      nrr: parseFloat(row.NetRunRate ?? row.nrr ?? "0"),
      points: row.Points ?? row.points ?? 0,
      position: row.Position ?? row.position ?? 0,
    }));
    res.json({ standings });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch IPL standings", detail: err?.message });
  }
});

router.get("/ipl/scorecard/:matchId", async (req, res): Promise<void> => {
  const { matchId } = req.params;
  try {
    const data = await fetchS3(`${COMP_ID}-${matchId}-matchscorecard.js`);
    res.json(data);
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch scorecard", detail: err?.message });
  }
});

router.get("/ipl/points/:matchId", async (req, res): Promise<void> => {
  const { matchId } = req.params;
  try {
    const data = await fetchS3(`${COMP_ID}-${matchId}-matchscorecard.js`);
    const innings: any[] = data?.Innings ?? data?.innings ?? [];
    const playerStats: Record<string, PlayerStats> = {};

    for (const inn of innings) {
      for (const batter of inn.Batsmen ?? []) {
        const name = batter.PlayerName ?? batter.name ?? "";
        if (!name) continue;
        if (!playerStats[name]) playerStats[name] = { played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false, wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, sharedRunOuts: 0, stumpings: 0 };
        const p = playerStats[name];
        p.played = true;
        p.runs += parseInt(batter.Runs ?? batter.runs ?? "0") || 0;
        p.balls += parseInt(batter.Balls ?? batter.balls ?? "0") || 0;
        p.fours += parseInt(batter.Fours ?? batter.fours ?? "0") || 0;
        p.sixes += parseInt(batter.Sixes ?? batter.sixes ?? "0") || 0;
        if (p.runs === 0 && !batter.NotOut && batter.Balls > 0) p.duck = true;
      }

      for (const bowler of inn.Bowlers ?? []) {
        const name = bowler.PlayerName ?? bowler.name ?? "";
        if (!name) continue;
        if (!playerStats[name]) playerStats[name] = { played: true, runs: 0, balls: 0, fours: 0, sixes: 0, duck: false, wickets: 0, dots: 0, lbwBowled: 0, maidens: 0, ballsBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, sharedRunOuts: 0, stumpings: 0 };
        const p = playerStats[name];
        p.played = true;
        p.wickets += parseInt(bowler.Wickets ?? bowler.wickets ?? "0") || 0;
        p.maidens += parseInt(bowler.Maidens ?? bowler.maidens ?? "0") || 0;
        p.runsConceded += parseInt(bowler.Runs ?? bowler.runs ?? "0") || 0;
        const oversStr = String(bowler.Overs ?? bowler.overs ?? "0");
        const parts = oversStr.split(".");
        p.ballsBowled += (parseInt(parts[0]) || 0) * 6 + (parseInt(parts[1]) || 0);
      }
    }

    const playerPoints: Record<string, number> = {};
    for (const [name, stats] of Object.entries(playerStats)) {
      playerPoints[name] = calcPoints(stats);
    }

    res.json({ matchId, playerPoints, playerStats });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to calculate points", detail: err?.message });
  }
});

export default router;
