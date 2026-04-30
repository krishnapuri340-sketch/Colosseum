/**
 * AppContext — single source of truth for user-specific state
 * Connects: profile, watchlist, my teams, auction settings, notifications
 * All pages read from here instead of local mock data
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext";

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
  avatar:      "⚡",
  avatarColor: "#c0192c",
  favoriteTeam: "MI",
  bio:         "IPL fantasy enthusiast",
  joinedAt:    "April 2026",
};

const DEFAULT_NOTIFICATIONS: Notification[] = [
  { id:"n1", type:"auction",    title:"Friday Night Draft",   body:"Auction starts in 30 minutes. All 4 teams ready.",          time:Date.now()-120000,  read:false, href:"/auction/room" },
  { id:"n2", type:"score",      title:"Jasprit Bumrah",       body:"Just took a wicket vs DC — +30 pts added to your squad.",   time:Date.now()-3600000, read:false, href:"/live" },
  { id:"n3", type:"prediction", title:"MI vs RCB prediction", body:"Match starts in 47 minutes. Lock your picks now.",          time:Date.now()-7200000, read:true,  href:"/predictions" },
  { id:"n4", type:"system",     title:"Trade Window open",    body:"Office League S2 trade window is now open.",                time:Date.now()-86400000,read:true,  href:"/leaderboard" },
];

const DEFAULT_TEAMS: MyTeam[] = [
  { id:"t1", name:"Bumrah Leads",  captain:"Jasprit Bumrah", vc:"Rohit Sharma",   players:["Jasprit Bumrah","Rohit Sharma","Virat Kohli","Rashid Khan","Travis Head","Rishabh Pant","Tilak Varma","Arshdeep Singh","Varun Chakravarthy","Yashasvi Jaiswal","KL Rahul"], matchId:"m1", points:487,  status:"live",      teams:["MI","RCB"], credits:99.0 },
  { id:"t2", name:"Gill Power",    captain:"Shubman Gill",   vc:"Rashid Khan",    players:["Shubman Gill","Rashid Khan","Sai Sudharsan","Jos Buttler","Kagiso Rabada","Ruturaj Gaikwad","MS Dhoni","Hardik Pandya","Ishan Kishan","Avesh Khan","Mayank Yadav"],              matchId:"m2", points:null, status:"upcoming",  teams:["GT","CSK"], credits:98.5 },
  { id:"t3", name:"Pant Effect",   captain:"Rishabh Pant",   vc:"Andre Russell",  players:["Rishabh Pant","Andre Russell","Mohammed Shami","Sunil Narine","Varun Chakravarthy","Nicholas Pooran","Mitchell Marsh","Rinku Singh","Arshdeep Singh","Harshal Patel","Kamindu Mendis"], matchId:"m3", points:412,  status:"completed", teams:["LSG","KKR"], credits:97.5 },
];

const DEFAULT_AUCTIONS: AuctionRoom[] = [
  { id:"a1", name:"Friday Night Draft", code:"FND2026", format:"classic", budget:100, squadSize:11, captainVC:true, tradeWindow:false, captainChanges:true, status:"live",     role:"host",   participants:4, playersLeft:28, createdAt:"2026-04-18" },
  { id:"a2", name:"Office League S2",   code:"OLS2026", format:"tier",    budget:100, squadSize:11, captainVC:true, tradeWindow:true,  captainChanges:true, status:"complete", role:"member", participants:6, playersLeft:0,  createdAt:"2026-04-20" },
];

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

  // Sync email from auth
  useEffect(() => {
    if (user) {
      setProfileState(p => ({ ...p,
        email:       p.email || user.email,
        displayName: p.displayName === "Strategist" ? user.name : p.displayName,
      }));
    }
  }, [user]);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfileState(p => { const next = { ...p, ...patch }; lsSet("colosseum_profile", next); return next; });
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
  const totalPts    = 2529;    // → wire to API /fantasy/stats
  const currentRank = 7;
  const predAccuracy = 68;

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
