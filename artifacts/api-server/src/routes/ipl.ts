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
      const rawStatus = String(m.MatchStatus ?? "");
      const isLive = rawStatus.toLowerCase() === "live";
      const isCompleted = rawStatus.toLowerCase() === "post" || rawStatus.toLowerCase() === "result";
      const isUpcoming = !isLive && !isCompleted;
      const matchOrderRaw = String(m.MatchOrder ?? m.RowNo ?? "");
      const matchNum = parseInt(matchOrderRaw.replace(/[^0-9]/g, "")) || 0;

      const firstTeamId = String(m.FirstBattingTeamID ?? "");
      const winningId = String(m.WinningTeamID ?? "");
      let winningTeamCode: string | null = null;
      if (isCompleted && winningId) {
        winningTeamCode = winningId === firstTeamId
          ? (m.FirstBattingTeamCode ?? null)
          : (m.SecondBattingTeamCode ?? null);
      }

      // Derive actual home/away codes from HomeTeamID vs batting order
      const homeId  = String(m.HomeTeamID ?? "");
      const firstId2 = String(m.FirstBattingTeamID ?? "");
      const homeBatsFirst = homeId !== "" && homeId === firstId2;
      const homeTeamCode = homeBatsFirst
        ? (m.FirstBattingTeamCode  ?? m.HomeTeamCode ?? "")
        : (m.SecondBattingTeamCode ?? m.HomeTeamCode ?? m.FirstBattingTeamCode ?? "");
      const awayTeamCode = homeBatsFirst
        ? (m.SecondBattingTeamCode ?? m.AwayTeamCode ?? "")
        : (m.FirstBattingTeamCode  ?? m.AwayTeamCode ?? m.SecondBattingTeamCode ?? "");
      const homeScore = homeBatsFirst ? (m["1Summary"] ?? null) : (m["2Summary"] ?? null);
      const awayScore = homeBatsFirst ? (m["2Summary"] ?? null) : (m["1Summary"] ?? null);

      return {
        iplId: String(m.MatchID ?? ""),
        matchNumber: matchNum,
        name: m.MatchName ?? m.MatchDesc ?? "",
        homeTeam: homeTeamCode,
        awayTeam: awayTeamCode,
        homeTeamFull: String(m.HomeTeamName ?? m.FirstBattingTeamName ?? ""),
        awayTeamFull: String(m.AwayTeamName ?? m.SecondBattingTeamName ?? ""),
        venue: m.GroundName ?? "",
        city: m.city ?? m.GroundCity ?? "",
        matchDate: m.MatchDate ?? "",
        matchTime: m.MatchTime ?? "",
        status: rawStatus,
        firstInningsScore: homeScore,
        secondInningsScore: awayScore,
        result: m.Commentss ? String(m.Commentss).trim() : null,
        winningTeamCode,
        mom: m.MOM ?? null,
        tossText: m.TossDetails ?? m.TossText ?? null,
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
    const data = await fetchS3(`${COMP_ID}-matchschedule.js`);
    const fixtures: any[] = data?.Matchsummary ?? [];

    // Build team-code map from all matches
    const teamMap: Record<string, { code: string; full: string }> = {};
    for (const m of fixtures) {
      const id1 = String(m.FirstBattingTeamID ?? "");
      const id2 = String(m.SecondBattingTeamID ?? "");
      if (id1 && m.FirstBattingTeamCode) teamMap[id1] = { code: m.FirstBattingTeamCode, full: m.FirstBattingTeamName ?? m.FirstBattingTeamCode };
      if (id2 && m.SecondBattingTeamCode) teamMap[id2] = { code: m.SecondBattingTeamCode, full: m.SecondBattingTeamName ?? m.SecondBattingTeamCode };
    }

    interface TeamRow {
      code: string; full: string;
      played: number; won: number; lost: number; noResult: number;
      points: number;
      runsFor: number; ballsFor: number;
      runsAgainst: number; ballsAgainst: number;
    }
    const table: Record<string, TeamRow> = {};
    for (const { code, full } of Object.values(teamMap)) {
      table[code] = { code, full, played: 0, won: 0, lost: 0, noResult: 0, points: 0, runsFor: 0, ballsFor: 0, runsAgainst: 0, ballsAgainst: 0 };
    }

    function parseScore(summary: string | null): { runs: number; balls: number } {
      if (!summary) return { runs: 0, balls: 0 };
      const m = summary.match(/(\d+)\/\d+\s*\((\d+)\.(\d+)\s*Ov/i) ?? summary.match(/(\d+)\/\d+\s*\((\d+)\)/i);
      if (!m) return { runs: 0, balls: 0 };
      const runs = parseInt(m[1]) || 0;
      const overs = parseInt(m[2]) || 0;
      const balls = m[3] ? (overs * 6) + (parseInt(m[3]) || 0) : overs * 6;
      return { runs, balls: balls || 120 };
    }

    for (const m of fixtures) {
      const rawStatus = String(m.MatchStatus ?? "");
      const isCompleted = rawStatus.toLowerCase() === "post" || rawStatus.toLowerCase() === "result";
      if (!isCompleted) continue;

      const code1 = m.FirstBattingTeamCode as string;
      const code2 = m.SecondBattingTeamCode as string;
      const winId = String(m.WinningTeamID ?? "");
      const firstId = String(m.FirstBattingTeamID ?? "");
      const winCode = winId === firstId ? code1 : code2;
      const loseCode = winCode === code1 ? code2 : code1;

      const s1 = parseScore(m["1Summary"]);
      const s2 = parseScore(m["2Summary"]);

      if (table[code1]) {
        table[code1].played++;
        table[code1].runsFor += s1.runs; table[code1].ballsFor += s1.balls;
        table[code1].runsAgainst += s2.runs; table[code1].ballsAgainst += s2.balls;
      }
      if (table[code2]) {
        table[code2].played++;
        table[code2].runsFor += s2.runs; table[code2].ballsFor += s2.balls;
        table[code2].runsAgainst += s1.runs; table[code2].ballsAgainst += s1.balls;
      }

      // Determine result type from comment text
      const commentss = String(m.Commentss ?? "").toLowerCase();
      const isNoResult = commentss.includes("no result") || commentss.includes("abandon");
      const hasSuperOver = commentss.includes("super over");

      if (isNoResult) {
        // Both teams get 1 point, no win/loss recorded
        if (table[code1]) { table[code1].noResult++; table[code1].points += 1; }
        if (table[code2]) { table[code2].noResult++; table[code2].points += 1; }
      } else if (winId && (table[winCode] || hasSuperOver)) {
        // Normal win (including super-over): winner gets 2 pts, loser 0
        if (table[winCode]) { table[winCode].won++; table[winCode].points += 2; }
        if (table[loseCode]) { table[loseCode].lost++; }
      }
    }

    const standings = Object.values(table)
      .map(t => {
        const nrr = t.ballsFor > 0 && t.ballsAgainst > 0
          ? (t.runsFor / t.ballsFor) * 6 - (t.runsAgainst / t.ballsAgainst) * 6
          : 0;
        return { team: t.code, teamFull: t.full, played: t.played, won: t.won, lost: t.lost, noResult: t.noResult, points: t.points, nrr: Math.round(nrr * 1000) / 1000 };
      })
      .sort((a, b) => b.points - a.points || b.nrr - a.nrr)
      .map((t, i) => ({ ...t, position: i + 1 }));

    res.json({ standings });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to compute standings", detail: err?.message });
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
