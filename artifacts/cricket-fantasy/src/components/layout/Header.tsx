import { useLocation, Link } from "wouter";
import { Menu, Search, Bell, ChevronRight, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useApp } from "@/context/AppContext";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

const PAGE_LABELS: Record<string, string> = {
  "/": "Dashboard", "/matches": "Matches", "/players": "Players",
  "/my-teams": "My Teams", "/auction": "Auction", "/auction/create": "Create Auction",
  "/auction/join": "Join Auction", "/auction/room": "Auction Room",
  "/predictions": "Predictions", "/guide": "Guide", "/leaderboard": "Leaderboard",
  "/live": "Live Score", "/watchlist": "Watchlist", "/profile": "Profile",
};

const NOTIF_COLOR: Record<string, string> = {
  auction: "#e05572", score: "#6ee7b7", prediction: "#fbbf24", system: "rgba(255,255,255,0.5)",
};

function fmtTime(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

export function Header() {
  const [location] = useLocation();
  const { user } = useAuth();
  const { openMobile } = useSidebar();
  const { profile, notifications, markRead, markAllRead, unreadCount } = useApp();

  const [showNotifs, setShowNotifs]   = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const notifsRef  = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (notifsRef.current  && !notifsRef.current.contains(e.target as Node))  setShowNotifs(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const parts = location.split("/").filter(Boolean);
  const crumbs = [{ label: "Colosseum", href: "/" }];
  if (parts[0]) crumbs.push({ label: PAGE_LABELS[`/${parts[0]}`] ?? parts[0], href: `/${parts[0]}` });
  if (parts[1]) crumbs.push({ label: PAGE_LABELS[location] ?? parts[1], href: location });

  const dropStyle: React.CSSProperties = {
    position: "absolute", right: 0, top: "calc(100% + 10px)",
    background: "rgba(9,12,24,0.97)",
    backdropFilter: "blur(32px) saturate(200%)",
    WebkitBackdropFilter: "blur(32px) saturate(200%)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16,
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)", zIndex: 200,
  };

  return (
    <header style={{
      height: 72, display: "flex", alignItems: "center",
      justifyContent: "space-between",
      padding: "0 18px",
      background: "rgba(9,12,24,0.7)",
      backdropFilter: "blur(24px) saturate(180%)",
      WebkitBackdropFilter: "blur(24px) saturate(180%)",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0, position: "sticky", top: 0, zIndex: 40,
    }}>

      {/* Left */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
        <button className="lg:hidden press-sm" onClick={openMobile} style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <Menu size={16} style={{ color: "rgba(255,255,255,0.6)" }} />
        </button>

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
              {i > 0 && <ChevronRight size={12} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0 }} />}
              <span style={{
                fontSize: i === crumbs.length - 1 ? "0.9rem" : "0.82rem",
                fontWeight: i === crumbs.length - 1 ? 700 : 500,
                color: i === crumbs.length - 1 ? "#fff" : "rgba(255,255,255,0.35)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                display: i === 0 && crumbs.length > 1 ? "none" : "block",
              }}
                className={i === 0 && crumbs.length > 1 ? "hidden sm:block" : ""}>
                {c.label}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Search — desktop */}
        <div className="hidden lg:block" style={{ position: "relative" }}>
          <Search size={13} style={{
            position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)",
            color: "rgba(255,255,255,0.3)", pointerEvents: "none",
          }} />
          <input type="text" placeholder="Search…"
            style={{
              width: 200, height: 36, background: "rgba(255,255,255,0.05)",
              border: "1.5px solid rgba(255,255,255,0.08)", borderRadius: 9999,
              paddingLeft: "2.2rem", paddingRight: "0.9rem",
              color: "#fff", fontSize: "0.82rem", outline: "none",
              fontFamily: "inherit", transition: "border-color 0.2s",
            }}
            onFocus={e => (e.target as HTMLInputElement).style.borderColor = "rgba(192,25,44,0.5)"}
            onBlur={e => (e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)"}
          />
        </div>

        {/* Notifications */}
        <div ref={notifsRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowNotifs(v => !v); setShowProfile(false); }}
            className="press-sm"
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", position: "relative",
            }}>
            <Bell size={15} style={{ color: "rgba(255,255,255,0.5)" }} />
            {unreadCount > 0 && (
              <div style={{
                position: "absolute", top: 7, right: 7, width: 7, height: 7,
                borderRadius: "50%", background: "#c0192c",
                border: "1.5px solid rgba(9,12,24,1)",
              }} />
            )}
          </button>

          <AnimatePresence>
            {showNotifs && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{ ...dropStyle, width: 320 }}>
                <div style={{
                  padding: "0.85rem 1rem",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff" }}>
                    Notifications
                    {unreadCount > 0 && (
                      <span style={{
                        marginLeft: 8, background: "#c0192c", color: "#fff",
                        borderRadius: 9999, fontSize: "0.65rem", fontWeight: 700,
                        padding: "1px 7px",
                      }}>{unreadCount}</span>
                    )}
                  </span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} style={{
                      fontSize: "0.72rem", color: "rgba(192,25,44,0.8)",
                      background: "none", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 3, fontFamily: "inherit",
                    }}>
                      <Check size={11} /> All read
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: 340, overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{
                      padding: "2.5rem 1rem", textAlign: "center",
                      fontSize: "0.82rem", color: "rgba(255,255,255,0.25)",
                    }}>
                      No notifications yet
                    </div>
                  ) : notifications.map(n => (
                    <div key={n.id} onClick={() => { markRead(n.id); setShowNotifs(false); }}
                      style={{
                        padding: "0.75rem 1rem", cursor: "pointer",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                        background: n.read ? "transparent" : "rgba(192,25,44,0.04)",
                        borderLeft: n.read ? "3px solid transparent" : "3px solid #c0192c",
                        transition: "background 0.15s",
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)"}
                      onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : "rgba(192,25,44,0.04)"}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                        <div style={{
                          width: 8, height: 8, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                          background: NOTIF_COLOR[n.type] ?? "rgba(255,255,255,0.3)",
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#fff", marginBottom: 2 }}>
                            {n.title}
                          </div>
                          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.45)", lineHeight: 1.4 }}>
                            {n.body}
                          </div>
                        </div>
                        <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }}>
                          {fmtTime(n.time)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div ref={profileRef} style={{ position: "relative" }}>
          <button onClick={() => { setShowProfile(v => !v); setShowNotifs(false); }}
            className="press-sm"
            style={{
              width: 44, height: 44, borderRadius: "50%", cursor: "pointer",
              background: `linear-gradient(135deg, ${profile.avatarColor}50, ${profile.avatarColor}20)`,
              border: `2px solid ${profile.avatarColor}60`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "1rem", fontWeight: 800, color: "#fff",
              boxShadow: `0 0 16px ${profile.avatarColor}35`,
            }}>
            {profile.displayName.charAt(0).toUpperCase()}
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                style={{ ...dropStyle, width: 220 }}>
                <div style={{
                  padding: "1rem", borderBottom: "1px solid rgba(255,255,255,0.07)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${profile.avatarColor}50, ${profile.avatarColor}20)`,
                    border: `2px solid ${profile.avatarColor}60`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "1rem", fontWeight: 800, color: "#fff",
                  }}>
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "#fff",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {profile.displayName}
                    </div>
                    <div style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {user?.email}
                    </div>
                  </div>
                </div>
                {[
                  { label: "Profile & Settings", href: "/profile" },
                  { label: "My Teams",           href: "/my-teams" },
                  { label: "Watchlist",          href: "/watchlist" },
                  { label: "Leaderboard",        href: "/leaderboard" },
                ].map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setShowProfile(false)}>
                    <div style={{
                      padding: "0.65rem 1rem", cursor: "pointer",
                      fontSize: "0.83rem", color: "rgba(255,255,255,0.65)",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      transition: "background 0.12s, color 0.12s",
                    }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLDivElement).style.background = "rgba(192,25,44,0.08)";
                        (e.currentTarget as HTMLDivElement).style.color = "#fff";
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLDivElement).style.background = "transparent";
                        (e.currentTarget as HTMLDivElement).style.color = "rgba(255,255,255,0.65)";
                      }}>
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
