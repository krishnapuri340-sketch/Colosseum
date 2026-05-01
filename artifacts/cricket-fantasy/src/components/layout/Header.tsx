import { useLocation, Link } from "wouter";
import { Menu, Search, Bell, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useApp } from "@/context/AppContext";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PAGE_LABELS: Record<string, string> = {
  "/":               "Dashboard",
  "/matches":        "Matches",
  "/players":        "Players",
  "/auction":        "Auction",
  "/auction/create": "Create Auction",
  "/auction/join":   "Join Auction",
  "/auction/room":   "Auction Room",
  "/predictions":    "Predictions",
  "/guide":          "Guide",
  "/leaderboard":    "Leaderboard",
  "/live":           "Live Score",
  "/watchlist":      "Watchlist",
  "/profile":        "Profile",
};

const NOTIF_TYPE_LABEL: Record<string, string> = {
  auction:    "Auction",
  score:      "Score",
  prediction: "Prediction",
  system:     "System",
};

export function Header() {
  const [location] = useLocation();
  const { user }   = useAuth();
  const { openMobile } = useSidebar();
  const { profile, notifications, markRead, markAllRead, unreadCount } = useApp();

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const parts  = location.split("/").filter(Boolean);
  const crumbs: { label:string; href:string }[] = [{ label:"Colosseum", href:"/" }];
  if (parts[0]) crumbs.push({ label:PAGE_LABELS[`/${parts[0]}`]??parts[0], href:`/${parts[0]}` });
  if (parts[1]) crumbs.push({ label:PAGE_LABELS[location]??parts[1], href:location });

  function fmtTime(ts: number) {
    const s = Math.floor((Date.now()-ts)/1000);
    if (s<60) return `${s}s`;
    if (s<3600) return `${Math.floor(s/60)}m`;
    if (s<86400) return `${Math.floor(s/3600)}h`;
    return `${Math.floor(s/86400)}d`;
  }

  return (
    <header className="flex items-center justify-between border-b border-white/5 bg-background/80 backdrop-blur-sm sticky top-0 z-40"
      style={{ height:60, padding:"0 16px" }}>

      {/* Left: hamburger + breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button className="lg:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl"
          style={{ background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)" }}
          onClick={openMobile}>
          <Menu className="w-4 h-4 text-white/70" />
        </button>
        <div className="flex items-center gap-1.5 text-sm min-w-0">
          {crumbs.map((c,i) => (
            <span key={i} className="flex items-center gap-1.5 min-w-0">
              {i > 0 && <ChevronRight className="w-3 h-3 text-white/30 flex-shrink-0" />}
              <span className={`truncate ${i===crumbs.length-1 ? "font-semibold text-white" : "text-white/40 hidden sm:block"}`}>
                {c.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search — desktop only */}
        <div className="relative hidden lg:block">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input type="text" placeholder="Search players, matches…"
            className="w-52 h-9 bg-white/5 border border-white/10 rounded-full pl-9 pr-4 text-sm
              focus:outline-none focus:border-primary/50 text-white placeholder:text-white/30 transition-all" />
        </div>

        {/* Notifications */}
        <div ref={notifsRef} style={{ position:"relative" }}>
          <button onClick={()=>{ setShowNotifs(v=>!v); setShowProfile(false); }}
            style={{ width:36, height:36, borderRadius:10, display:"flex",
              alignItems:"center", justifyContent:"center", position:"relative",
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.09)",
              cursor:"pointer" }}>
            <Bell className="w-4 h-4 text-white/50" />
            {unreadCount > 0 && (
              <div style={{ position:"absolute", top:6, right:6, width:8, height:8,
                borderRadius:"50%", background:"#c0192c",
                border:"2px solid rgba(7,8,15,1)" }} />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity:0, y:-6, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-6, scale:0.97 }}
                transition={{ duration:0.15 }}
                style={{ position:"absolute", right:0, top:"calc(100% + 8px)",
                  width:320, background:"rgba(10,11,22,0.98)",
                  border:"1px solid rgba(255,255,255,0.12)", borderRadius:16,
                  overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.6)",
                  zIndex:200 }}>
                <div style={{ padding:"0.75rem 1rem", borderBottom:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontWeight:700, fontSize:"0.85rem", color:"#fff" }}>
                    Notifications {unreadCount>0&&<span style={{ fontSize:"0.68rem",
                      background:"#c0192c", color:"#fff", borderRadius:20,
                      padding:"0 6px", marginLeft:4 }}>{unreadCount}</span>}
                  </span>
                  {unreadCount>0&&(
                    <button onClick={markAllRead}
                      style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.4)",
                        background:"none", border:"none", cursor:"pointer",
                        display:"flex", alignItems:"center", gap:3 }}>
                      <Check size={11} /> Mark all read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight:340, overflowY:"auto" }}>
                  {notifications.length===0
                    ? <div style={{ padding:"2rem", textAlign:"center",
                        fontSize:"0.82rem", color:"rgba(255,255,255,0.25)" }}>
                        No notifications
                      </div>
                    : notifications.map(n=>(
                      <div key={n.id}
                        onClick={()=>{ markRead(n.id); setShowNotifs(false); }}
                        style={{ padding:"0.75rem 1rem", cursor:"pointer",
                          borderBottom:"1px solid rgba(255,255,255,0.05)",
                          background:n.read?"transparent":"rgba(192,25,44,0.04)",
                          borderLeft:n.read?"3px solid transparent":"3px solid #c0192c",
                          transition:"background 0.15s" }}
                        onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.04)"}
                        onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background=n.read?"transparent":"rgba(192,25,44,0.04)"}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:8 }}>
                          <div style={{ width:28, height:28, borderRadius:8, flexShrink:0, marginTop:1,
                            background:"rgba(192,25,44,0.12)", border:"1px solid rgba(192,25,44,0.2)",
                            display:"flex", alignItems:"center", justifyContent:"center" }}>
                            <span style={{ fontSize:"0.55rem", fontWeight:800, letterSpacing:"0.04em",
                              color:"#f87171", textTransform:"uppercase" }}>
                              {(NOTIF_TYPE_LABEL[n.type] ?? "info").slice(0,3)}
                            </span>
                          </div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontSize:"0.78rem", fontWeight:600,
                              color:"#fff", marginBottom:1 }}>{n.title}</div>
                            <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.5)",
                              lineHeight:1.4 }}>{n.body}</div>
                          </div>
                          <span style={{ fontSize:"0.62rem", color:"rgba(255,255,255,0.25)",
                            flexShrink:0, marginTop:1 }}>
                            {fmtTime(n.time)}
                          </span>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Profile avatar */}
        <div ref={profileRef} style={{ position:"relative" }}>
          <button onClick={()=>{ setShowProfile(v=>!v); setShowNotifs(false); }}
            style={{ width:36, height:36, borderRadius:"50%", cursor:"pointer",
              background:`${profile.avatarColor}30`,
              border:`2px solid ${profile.avatarColor}70`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"0.95rem", fontWeight:900, color:"#fff" }}>
            {(profile.displayName || "U").charAt(0).toUpperCase()}
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div initial={{ opacity:0, y:-6, scale:0.97 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:-6, scale:0.97 }}
                transition={{ duration:0.15 }}
                style={{ position:"absolute", right:0, top:"calc(100% + 8px)",
                  width:220, background:"rgba(10,11,22,0.98)",
                  border:"1px solid rgba(255,255,255,0.12)", borderRadius:14,
                  overflow:"hidden", boxShadow:"0 20px 60px rgba(0,0,0,0.6)",
                  zIndex:200 }}>
                <div style={{ padding:"1rem", borderBottom:"1px solid rgba(255,255,255,0.08)",
                  display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:38, height:38, borderRadius:"50%",
                    background:`${profile.avatarColor}30`,
                    border:`2px solid ${profile.avatarColor}70`,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontSize:"1rem", fontWeight:900, color:"#fff", flexShrink:0 }}>
                    {(profile.displayName || "U").charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:"0.85rem", color:"#fff",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {profile.displayName}
                    </div>
                    <div style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.4)",
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                {[
                  { label:"Profile & Settings", href:"/profile" },
                  { label:"Watchlist",           href:"/watchlist" },
                  { label:"Leaderboard",         href:"/leaderboard" },
                ].map(item=>(
                  <Link key={item.href} href={item.href} onClick={()=>setShowProfile(false)}>
                    <div style={{ padding:"0.65rem 1rem", cursor:"pointer",
                      fontSize:"0.82rem", color:"rgba(255,255,255,0.7)",
                      borderBottom:"1px solid rgba(255,255,255,0.05)",
                      transition:"background 0.12s" }}
                      onMouseEnter={e=>(e.currentTarget as HTMLDivElement).style.background="rgba(255,255,255,0.06)"}
                      onMouseLeave={e=>(e.currentTarget as HTMLDivElement).style.background="transparent"}>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
