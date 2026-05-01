/**
 * AppContext — single source of truth for user-specific state
 * Connects: profile, watchlist, my teams, auction settings, notifications
 * All pages read from here instead of local mock data
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { apiJson } from "../lib/api";

// ── Types ──────────────────────────────────────────────────────────────
export interface UserProfile {
  displayName: string;
  username:    string;
  email:       string;
  avatar:      string;       // initials or emoji
  avatarColor: string;       // hex
  favoriteTeam: string;
  bio:         string;
  joinedAt:    string;
}

export interface MyTeam {
  id:       string;
  name:     string;
  captain:  string;
  vc:       string;
  players:  string[];       // player names
  matchId:  string;
  points:   number | null;
  status:   "upcoming" | "live" | "completed";
  teams:    [string, string];  // [homeTeam, awayTeam]
  credits:  number;
}

export interface AuctionRoom {
  id:       string;
  name:     string;
  code:     string;
  format:   "classic" | "tier";
  budget:   number;
  squadSize: number;
  captainVC: boolean;
  tradeWindow: boolean;
  captainChanges: boolean;
  status:   "lobby" | "live" | "complete";
  role:     "host" | "member";
  participants: number;
  playersLeft:  number;
  createdAt:    string;
}

export interface Notification {
  id:      string;
  type:    "auction" | "score" | "prediction" | "system";
  title:   string;
  body:    string;
  time:    number;
  read:    boolean;
  href?:   string;
}

interface AppContextValue {
  // Profile
  profile:         UserProfile;
  updateProfile:   (p: Partial<UserProfile>) => void;

  // Watchlist
  watchlist:       string[];
  toggleWatch:     (name: string) => void;
  isWatched:       (name: string) => boolean;

  // My Teams
  myTeams:         MyTeam[];
  addTeam:         (t: MyTeam) => void;
  removeTeam:      (id: string) => void;
  updateTeamCVC:   (id: string, captain: string, vc: string) => void;

  // Auctions
  myAuctions:      AuctionRoom[];
  addAuction:      (a: AuctionRoom) => void;

  // Notifications
  notifications:   Notification[];
  markRead:        (id: string) => void;
  markAllRead:     () => void;
  unreadCount:     number;

  // Fantasy stats (derived)
  totalPts:        number;
  currentRank:     number;
  predAccuracy:    number;
}

// ── Default profile ────────────────────────────────────────────────────
const DEFAULT_PROFILE: UserProfile = {
  displayName: "Strategist",
  username:    "strategist",
  email:       "",
  avatar:      "S",
  avatarColor: "#c0192c",
  favoriteTeam: "MI",
  bio:         "IPL fantasy enthusiast",
  joinedAt:    "April 2026",
};

const DEFAULT_NOTIFICATIONS: Notification[] = [];

const DEFAULT_TEAMS: MyTeam[] = [];

const DEFAULT_AUCTIONS: AuctionRoom[] = [];

// ── localStorage helpers ───────────────────────────────────────────────
function ls<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ── Context ────────────────────────────────────────────────────────────
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [profile, setProfileState]     = useState<UserProfile>(() =>
    ls("colosseum_profile", { ...DEFAULT_PROFILE, email: "" })
  );
  const [watchlist, setWatchlist]       = useState<string[]>(() => ls("colosseum_watchlist", []));
  const [myTeams, setMyTeams]           = useState<MyTeam[]>(() => ls("colosseum_teams", DEFAULT_TEAMS));
  const [myAuctions, setMyAuctions]     = useState<AuctionRoom[]>(() => ls("colosseum_auctions", DEFAULT_AUCTIONS));
  const [notifications, setNotifs]      = useState<Notification[]>(() => ls("colosseum_notifs", DEFAULT_NOTIFICATIONS));

  // When user logs in, fetch their saved profile from the server
  useEffect(() => {
    if (!user) return;
    apiJson<Partial<UserProfile>>("/profile")
      .then(serverProfile => {
        setProfileState(p => {
          const next = {
            ...p,
            displayName: p.displayName === "Strategist" ? (serverProfile.displayName ?? user.name) : (serverProfile.displayName ?? p.displayName),
            ...serverProfile,
            // email always comes from auth, never from stored profile
            email: user.email,
          };
          lsSet("colosseum_profile", next);
          return next;
        });
      })
      .catch(() => {
        // If fetch fails, at least sync email/name from auth
        setProfileState(p => ({ ...p,
          email:       user.email,
          displayName: p.displayName === "Strategist" ? user.name : p.displayName,
        }));
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState(p => {
      const next = { ...p, ...patch };
      lsSet("colosseum_profile", next);
      return next;
    });
    // Persist to server (best-effort — don't block UI)
    apiJson("/profile", {
      method: "PATCH",
      body: JSON.stringify(patch),
    }).catch(() => {});
  }, []);

  const toggleWatch = useCallback((name: string) => {
    setWatchlist(prev => {
      const next = prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name];
      lsSet("colosseum_watchlist", next);
      return next;
    });
  }, []);

  const isWatched = useCallback((name: string) => watchlist.includes(name), [watchlist]);

  const addTeam = useCallback((t: MyTeam) => {
    setMyTeams(prev => { const next = [...prev, t]; lsSet("colosseum_teams", next); return next; });
  }, []);

  const removeTeam = useCallback((id: string) => {
    setMyTeams(prev => { const next = prev.filter(t => t.id !== id); lsSet("colosseum_teams", next); return next; });
  }, []);

  const updateTeamCVC = useCallback((id: string, captain: string, vc: string) => {
    setMyTeams(prev => {
      const next = prev.map(t => t.id === id ? { ...t, captain, vc } : t);
      lsSet("colosseum_teams", next);
      return next;
    });
  }, []);

  const addAuction = useCallback((a: AuctionRoom) => {
    setMyAuctions(prev => { const next = [a, ...prev]; lsSet("colosseum_auctions", next); return next; });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifs(prev => { const next = prev.map(n => n.id===id?{...n,read:true}:n); lsSet("colosseum_notifs",next); return next; });
  }, []);

  const markAllRead = useCallback(() => {
    setNotifs(prev => { const next = prev.map(n=>({...n,read:true})); lsSet("colosseum_notifs",next); return next; });
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalPts    = 0;
  const currentRank = 0;
  const predAccuracy = 0;

  return (
    <AppContext.Provider value={{
      profile, updateProfile,
      watchlist, toggleWatch, isWatched,
      myTeams, addTeam, removeTeam, updateTeamCVC,
      myAuctions, addAuction,
      notifications, markRead, markAllRead, unreadCount,
      totalPts, currentRank, predAccuracy,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
