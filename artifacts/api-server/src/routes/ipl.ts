import { Router, type IRouter } from "express";

const router: IRouter = Router();

const S3_BASE  = "https://ipl-stats-sports-mechanic.s3.ap-south-1.amazonaws.com/ipl/feeds";
const IPL_FEED = "https://scores.iplt20.com/ipl/feeds";
const COMP_ID  = 284;

function stripJsonp(text: string): string {
  return text.replace(/^[A-Za-z_$][A-Za-z0-9_$]*\(/, "").replace(/\)\s*;?\s*$/, "");
}

const MATCH_ID_RE = /^\d+$/;

interface CacheEntry { data: any; expiresAt: number; }
const cache = new Map<string, CacheEntry>();

async function fetchUrl(url: string, key: string, ttlMs: number): Promise<any> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expiresAt > now) return hit.data;
  const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${url}`);
  const text = await res.text();
  const data = JSON.parse(stripJsonp(text));
  cache.set(key, { data, expiresAt: now + ttlMs });
  return data;
}

function fetchS3(path: string, ttlMs = 60_000): Promise<any> {
  return fetchUrl(`${S3_BASE}/${path}`, `s3:${path}`, ttlMs);
}

function fetchInnings(matchId: string, inn: number, ttlMs: number): Promise<any> {
  const path = `${matchId}-Innings${inn}.js`;
  return fetchUrl(`${IPL_FEED}/${path}`, `inn:${path}`, ttlMs);
}

function cleanName(raw: string): string {
  return String(raw ?? "").replace(/\s*\([^)]*\)\s*$/, "").trim();
}

interface PlayerStats {
  played: boolean;
  runs: number; balls: number; fours: number; sixes: number;
  duck: boolean; fifty: boolean; century: boolean;
  wickets: number; dots: number; lbwBowled: number;
  maidens: number; ballsBowled: number; runsConceded: number;
  catches: number; runOuts: number; sharedRunOuts: number; stumpings: number;
}

function emptyStats(): PlayerStats {
  return {
    played: false, runs: 0, balls: 0, fours: 0, sixes: 0,
    duck: false, fifty: false, century: false,
    wickets: 0, dots: 0, lbwBowled: 0, maidens: 0,
    ballsBowled: 0, runsConceded: 0, catches: 0, runOuts: 0, sharedRunOuts: 0, stumpings: 0,
  };
}

function calcPoints(p: PlayerStats): number {
  if (!p.played) return 0;
  let pts = 4;

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
      const m = summary.match(/(\d+)\/(\d+)\s*\((\d+)\.(\d+)\s*Ov/i) ?? summary.match(/(\d+)\/(\d+)\s*\((\d+)\)/i);
      if (!m) return { runs: 0, balls: 0 };
      const runs = parseInt(m[1]) || 0;
      const wickets = parseInt(m[2]) || 0;
      const overs = parseInt(m[3]) || 0;
      const actualBalls = m[4] ? (overs * 6) + (parseInt(m[4]) || 0) : (overs * 6) || 120;
      const balls = wickets >= 10 ? 120 : actualBalls;
      return { runs, balls };
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

      const commentss = String(m.Commentss ?? "").toLowerCase();
      const isNoResult = commentss.includes("no result") || commentss.includes("abandon");
      const hasSuperOver = commentss.includes("super over");

      if (isNoResult) {
        if (table[code1]) { table[code1].played++; table[code1].noResult++; table[code1].points += 1; }
        if (table[code2]) { table[code2].played++; table[code2].noResult++; table[code2].points += 1; }
      } else {
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
        if (winId && (table[winCode] || hasSuperOver)) {
          if (table[winCode]) { table[winCode].won++; table[winCode].points += 2; }
          if (table[loseCode]) { table[loseCode].lost++; }
        }
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

router.get("/ipl/scorecard/:matchId", async (req, res): Promise<void> => {
  const { matchId } = req.params;
  if (!MATCH_ID_RE.test(matchId)) { res.status(400).json({ error: "Invalid match ID" }); return; }
  try {
    const schedule = await fetchS3(`${COMP_ID}-matchschedule.js`);
    const fixtures: any[] = schedule?.Matchsummary ?? [];
    const info = fixtures.find((m: any) => String(m.MatchID) === matchId);
    const isLive = info?.MatchStatus?.toLowerCase() === "live";
    const ttl = isLive ? 30_000 : 600_000;

    const teamCodes = [info?.FirstBattingTeamCode ?? "", info?.SecondBattingTeamCode ?? ""];
    const teamNames = [
      String(info?.FirstBattingTeamName ?? ""),
      String(info?.SecondBattingTeamName ?? ""),
    ];
    const summaries = [info?.["1Summary"] ?? "", info?.["2Summary"] ?? ""];

    const [r1, r2] = await Promise.allSettled([
      fetchInnings(matchId, 1, ttl),
      fetchInnings(matchId, 2, ttl),
    ]);

    const innings: any[] = [];
    for (let i = 0; i < 2; i++) {
      const result = i === 0 ? r1 : r2;
      if (result.status !== "fulfilled") continue;
      const raw = result.value?.[`Innings${i + 1}`];
      if (!raw) continue;

      const batters = ((raw.BattingCard ?? []) as any[])
        .map((b: any) => ({
          PlayerName: cleanName(b.PlayerName),
          Runs: b.Runs ?? 0, Balls: b.Balls ?? 0,
          Fours: b.Fours ?? 0, Sixes: b.Sixes ?? 0,
          DotBalls: b.DotBalls ?? 0,
          StrikeRate: b.StrikeRate ?? "0.00",
          Dismissal: b.OutDesc ?? "",
          NotOut: !b.OutDesc || b.OutDesc.trim() === "" || /not out/i.test(b.OutDesc),
          PlayingOrder: b.PlayingOrder ?? 0,
        }))
        .sort((a: any, b: any) => a.PlayingOrder - b.PlayingOrder);

      const bowlers = ((raw.BowlingCard ?? []) as any[])
        .map((b: any) => ({
          PlayerName: cleanName(b.PlayerName),
          Overs: String(b.Overs ?? 0),
          Balls: b.TotalLegalBallsBowled ?? 0,
          Runs: b.Runs ?? 0, Wickets: b.Wickets ?? 0,
          Economy: b.Economy ?? 0,
          Dots: b.DotBalls ?? 0, Maidens: b.Maidens ?? 0,
          BowlingOrder: b.BowlingOrder ?? 0,
        }))
        .sort((a: any, b: any) => a.BowlingOrder - b.BowlingOrder);

      innings.push({
        InningsNo: i + 1,
        InningsName: teamNames[i] ? `${teamNames[i]} Innings` : `Innings ${i + 1}`,
        TeamCode: teamCodes[i],
        TotalScore: summaries[i],
        Batsmen: batters,
        Bowlers: bowlers,
      });
    }

    if (innings.length === 0) {
      res.status(404).json({ error: "Scorecard not yet available" });
      return;
    }
    res.json({ innings, isLive });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch scorecard", detail: err?.message });
  }
});

router.get("/ipl/points/:matchId", async (req, res): Promise<void> => {
  const { matchId } = req.params;
  if (!MATCH_ID_RE.test(matchId)) { res.status(400).json({ error: "Invalid match ID" }); return; }
  try {
    const schedule = await fetchS3(`${COMP_ID}-matchschedule.js`);
    const fixtures: any[] = schedule?.Matchsummary ?? [];
    const info = fixtures.find((m: any) => String(m.MatchID) === matchId);
    const isLive = info?.MatchStatus?.toLowerCase() === "live";
    const ttl = isLive ? 30_000 : 600_000;

    const [r1, r2] = await Promise.allSettled([
      fetchInnings(matchId, 1, ttl),
      fetchInnings(matchId, 2, ttl),
    ]);

    const playerStats: Record<string, PlayerStats> = {};

    for (let i = 0; i < 2; i++) {
      const result = i === 0 ? r1 : r2;
      if (result.status !== "fulfilled") continue;
      const raw = result.value?.[`Innings${i + 1}`];
      if (!raw) continue;

      for (const b of raw.BattingCard ?? []) {
        const name = cleanName(b.PlayerName ?? "");
        if (!name) continue;
        if (!playerStats[name]) playerStats[name] = emptyStats();
        const p = playerStats[name];
        p.played = true;
        p.runs += b.Runs ?? 0;
        p.balls += b.Balls ?? 0;
        p.fours += b.Fours ?? 0;
        p.sixes += b.Sixes ?? 0;
        const notOut = !b.OutDesc || b.OutDesc.trim() === "" || /not out/i.test(b.OutDesc);
        if ((b.Runs ?? 0) === 0 && !notOut && (b.Balls ?? 0) > 0) p.duck = true;
        if (p.runs >= 100) p.century = true;
        else if (p.runs >= 50) p.fifty = true;
      }

      for (const b of raw.BowlingCard ?? []) {
        const name = cleanName(b.PlayerName ?? "");
        if (!name) continue;
        if (!playerStats[name]) playerStats[name] = emptyStats();
        const p = playerStats[name];
        p.played = true;
        p.wickets += b.Wickets ?? 0;
        p.maidens += b.Maidens ?? 0;
        p.dots += b.DotBalls ?? 0;
        p.ballsBowled += b.TotalLegalBallsBowled ?? 0;
        p.runsConceded += b.Runs ?? 0;
      }

      for (const b of raw.BattingCard ?? []) {
        const outDesc = String(b.OutDesc ?? "").trim();
        if (!outDesc || /not out/i.test(outDesc)) continue;
        const lower = outDesc.toLowerCase();

        let bowlerName: string | null = null;
        if (/^b /.test(lower)) bowlerName = cleanName(outDesc.slice(2));
        else if (/^lbw b /.test(lower)) bowlerName = cleanName(outDesc.slice(6));
        if (bowlerName) {
          if (!playerStats[bowlerName]) playerStats[bowlerName] = emptyStats();
          playerStats[bowlerName].lbwBowled++;
        }

        if (/^c .+ b /.test(lower)) {
          const bIdx = lower.indexOf(" b ");
          const catcherName = cleanName(outDesc.slice(2, bIdx).trim());
          if (catcherName && !/^sub/i.test(catcherName)) {
            if (!playerStats[catcherName]) playerStats[catcherName] = emptyStats();
            playerStats[catcherName].catches++;
          }
        }

        if (/^st .+ b /.test(lower)) {
          const bIdx = lower.indexOf(" b ");
          const keeperName = cleanName(outDesc.slice(3, bIdx).trim());
          if (keeperName) {
            if (!playerStats[keeperName]) playerStats[keeperName] = emptyStats();
            playerStats[keeperName].stumpings++;
          }
        }
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
