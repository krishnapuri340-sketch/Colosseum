import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiJson } from "@/lib/api";
import { useCallback } from "react";

/* ───────── Canonical IPL types (shared across all consumers) ───────── */

/**
 * Canonical shape of a row from GET /api/ipl/matches.
 * Fields below are always populated by the server (nullable where the
 * upstream feed legitimately omits them). Keep this in sync with the
 * route handler so consumers can rely on a single typed contract.
 */
export interface IplMatch {
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
  result: string | null;
  winningTeamCode: string | null;
  mom: string | null;
  tossText: string | null;
  liveStrikerName: string | null;
  liveBowlerName: string | null;
  liveScore: string | null;
  isLive: boolean;
  isCompleted: boolean;
  isUpcoming: boolean;
}

/** Canonical shape of a row from GET /api/ipl/standings. */
export interface IplStanding {
  team: string;
  teamFull: string;
  played: number;
  won: number;
  lost: number;
  noResult: number;
  tied: number;
  nrr: number;
  points: number;
  position: number;
}

/* ───────── Query keys ───────── */

export const IPL_MATCHES_KEY = ["ipl", "matches"] as const;
export const IPL_STANDINGS_KEY = ["ipl", "standings"] as const;

/* ───────── Hooks ─────────
 * Single source of truth for IPL data across the app.
 * Multiple components calling these hooks share one in-flight request and
 * one cached response, replacing the previous fan-out of separate fetches
 * that hammered the upstream S3 feed.
 */

interface UseMatchesOptions {
  /** Pass to enable polling (e.g. 30_000 for live scoring). */
  refetchInterval?: number;
}

export function useIplMatches(opts: UseMatchesOptions = {}) {
  return useQuery({
    queryKey: IPL_MATCHES_KEY,
    queryFn: () => apiJson<{ matches: IplMatch[] }>("/ipl/matches"),
    select: (d) => d.matches,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchInterval: opts.refetchInterval,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useIplStandings() {
  return useQuery({
    queryKey: IPL_STANDINGS_KEY,
    queryFn: () => apiJson<{ standings: IplStanding[] }>("/ipl/standings"),
    select: (d) => d.standings,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

/** Force-refresh both IPL caches; useful for a "reload" button. */
export function useRefreshIpl() {
  const qc = useQueryClient();
  return useCallback(() => {
    void qc.invalidateQueries({ queryKey: IPL_MATCHES_KEY });
    void qc.invalidateQueries({ queryKey: IPL_STANDINGS_KEY });
  }, [qc]);
}
