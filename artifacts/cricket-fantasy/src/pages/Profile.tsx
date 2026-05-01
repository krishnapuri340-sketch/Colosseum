import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useApp } from "@/context/AppContext";
import { Camera, Save, LogOut, Bell, Shield, Palette, Trophy, ChevronRight, Check } from "lucide-react";
import { ALL_TEAMS, TEAM_COLOR, TEAM_FULL_NAME, TEAM_LOGO } from "@/lib/ipl-constants";

const ACCENT = "#c0192c";
const CARD   = "rgba(255,255,255,0.04)";
const BORDER = "rgba(255,255,255,0.08)";
const DIM    = "rgba(255,255,255,0.4)";

const COLOR_OPTIONS  = ["#c0192c","#3b82f6","#a855f7","#f59e0b","#34d399","#818cf8","#f472b6","#fb923c","#22c55e","#60a5fa"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16,
      overflow:"hidden" }}>
      <div style={{ padding:"0.9rem 1.25rem", borderBottom:`1px solid ${BORDER}`,
        fontSize:"0.72rem", fontWeight:700, letterSpacing:"0.1em",
        color:DIM, textTransform:"uppercase" }}>
        {title}
      </div>
      <div style={{ padding:"1.25rem" }}>
        {children}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type="text", placeholder, maxLength, textarea }:
  { label:string; value:string; onChange:(v:string)=>void; type?:string;
    placeholder?:string; maxLength?:number; textarea?:boolean }) {
  return (
    <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
      <label style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.08em",
        color:DIM, textTransform:"uppercase" }}>{label}</label>
      {textarea ? (
        <textarea value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength} rows={3}
          style={{ padding:"0.75rem 0.85rem", background:"rgba(255,255,255,0.05)",
            border:`1px solid ${BORDER}`, borderRadius:10, color:"#fff",
            fontSize:"0.88rem", outline:"none", resize:"vertical",
            fontFamily:"inherit" }} />
      ) : (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)}
          placeholder={placeholder} maxLength={maxLength}
          style={{ padding:"0.75rem 0.85rem", background:"rgba(255,255,255,0.05)",
            border:`1px solid ${BORDER}`, borderRadius:10, color:"#fff",
            fontSize:"0.88rem", outline:"none" }} />
      )}
    </div>
  );
}

export default function Profile() {
  const { user, logout } = useAuth();
  const { profile, updateProfile, myTeams, myAuctions, totalPts, currentRank, predAccuracy } = useApp();
  const [, navigate] = useLocation();

  const [displayName, setDisplayName] = useState(profile.displayName);
  const [username, setUsername]       = useState(profile.username);
  const [bio, setBio]                 = useState(profile.bio);
  const [avatar, setAvatar]           = useState(profile.avatar);
  const [avatarColor, setColor]       = useState(profile.avatarColor);
  const [favTeam, setFavTeam]         = useState(profile.favoriteTeam);
  const [saved, setSaved]             = useState(false);
  const [activeTab, setActiveTab]     = useState<"profile"|"notifications"|"privacy">("profile");

  const [notifSettings, setNotifSettings] = useState({
    auctionStart:   true,
    auctionBid:     true,
    scoreUpdates:   true,
    predDeadline:   true,
    tradeRequests:  true,
    weeklyDigest:   false,
  });

  function handleSave() {
    updateProfile({ displayName, username, bio, avatar, avatarColor, favoriteTeam: favTeam });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleLogout() {
    logout().then(() => navigate("/login"));
  }

  const teamColor = TEAM_COLOR[favTeam] ?? "#aaa";

  return (
    <Layout>
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.3 }} className="space-y-6 max-w-3xl">

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12 }}>
          <div>
            <h1 className="text-2xl font-black text-white">Profile & Settings</h1>
            <p className="text-sm text-white/40 mt-0.5">{user?.email}</p>
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <button onClick={handleLogout}
              style={{ display:"flex", alignItems:"center", gap:6, padding:"0.5rem 1rem",
                background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.25)",
                borderRadius:10, color:"#f87171", fontSize:"0.8rem", fontWeight:600,
                cursor:"pointer" }}>
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label:"Total Points",  value:totalPts.toLocaleString(), color:"#818cf8" },
            { label:"Current Rank",  value:`#${currentRank}`,          color:"#f59e0b" },
            { label:"Teams Built",   value:myTeams.length,             color:"#34d399" },
            { label:"Pred. Accuracy",value:`${predAccuracy}%`,         color:"#f87171" },
          ].map(s=>(
            <div key={s.label} style={{ background:CARD, border:`1px solid ${BORDER}`,
              borderRadius:13, padding:"0.85rem 1rem" }}>
              <div style={{ fontSize:"1.35rem", fontWeight:900, color:s.color,
                fontFamily:"monospace", lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:"0.62rem", color:DIM, marginTop:3,
                fontWeight:600, letterSpacing:"0.05em" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tab switcher */}
        <div style={{ display:"flex", gap:4, background:"rgba(255,255,255,0.04)",
          border:`1px solid ${BORDER}`, borderRadius:12, padding:4 }}>
          {([["profile","Profile",Palette],["notifications","Notifications",Bell],["privacy","Privacy",Shield]] as const)
            .map(([t,label,Icon])=>(
              <button key={t} onClick={()=>setActiveTab(t)}
                style={{ flex:1, padding:"0.5rem", borderRadius:9, border:"none",
                  background:activeTab===t?"rgba(255,255,255,0.1)":"transparent",
                  color:activeTab===t?"#fff":DIM,
                  fontWeight:600, fontSize:"0.82rem", cursor:"pointer",
                  display:"flex", alignItems:"center", justifyContent:"center", gap:5 }}>
                <Icon size={14} />{label}
              </button>
            ))}
        </div>

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <div className="space-y-4">

            {/* Avatar + name preview */}
            <div style={{ background:`linear-gradient(135deg, ${avatarColor}18, rgba(255,255,255,0.02))`,
              border:`1px solid ${avatarColor}30`, borderRadius:16,
              padding:"1.5rem", display:"flex", alignItems:"center", gap:"1.25rem" }}>
              <div style={{ width:72, height:72, borderRadius:"50%", flexShrink:0,
                background:`${avatarColor}25`, border:`3px solid ${avatarColor}60`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:"1.6rem", fontWeight:900, color:"#fff", letterSpacing:"-0.02em" }}>
                {(displayName || "S").charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize:"1.25rem", fontWeight:900, color:"#fff" }}>
                  {displayName || "Your Name"}
                </div>
                <div style={{ fontSize:"0.78rem", color:DIM, marginTop:3 }}>
                  @{username || "username"} · joined {profile.joinedAt}
                </div>
                <div style={{ fontSize:"0.75rem", color:DIM, marginTop:2, maxWidth:300 }}>
                  {bio || "Your bio"}
                </div>
              </div>
            </div>

            <Section title="Avatar Colour">
              <p style={{ fontSize:"0.75rem", color:DIM, marginBottom:"0.85rem" }}>
                Your avatar displays your name initial — pick a colour to personalise it.
              </p>
              <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                {COLOR_OPTIONS.map(c=>(
                  <button key={c} onClick={()=>setColor(c)}
                    style={{ width:32, height:32, borderRadius:8, background:c,
                      border:`2px solid ${avatarColor===c?"#fff":BORDER}`,
                      cursor:"pointer", transition:"all 0.15s" }} />
                ))}
              </div>
            </Section>

            <Section title="Personal Info">
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem" }}>
                <Field label="Display Name" value={displayName} onChange={setDisplayName}
                  placeholder="How others see you" maxLength={30} />
                <Field label="Username" value={username} onChange={setUsername}
                  placeholder="lowercase_no_spaces" maxLength={20} />
              </div>
              <div style={{ marginTop:"1rem" }}>
                <Field label="Bio" value={bio} onChange={setBio}
                  placeholder="Tell your league what you're about…" maxLength={120} textarea />
              </div>
            </Section>

            <Section title="Favourite IPL Team">
              <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:6 }}>
                {ALL_TEAMS.map(t=>{
                  const tc   = TEAM_COLOR[t]??"#aaa";
                  const logo = TEAM_LOGO[t];
                  const sel  = favTeam===t;
                  return (
                    <button key={t} onClick={()=>setFavTeam(t)}
                      style={{ padding:"0.65rem 0.4rem", borderRadius:10, cursor:"pointer",
                        background:sel?`${tc}22`:"rgba(255,255,255,0.04)",
                        border:`2px solid ${sel?tc:BORDER}`,
                        display:"flex", flexDirection:"column", alignItems:"center",
                        gap:4, transition:"all 0.15s" }}>
                      {logo
                        ? <img src={logo} alt={t} style={{ width:28, height:28, objectFit:"contain" }} />
                        : <div style={{ width:28, height:28, borderRadius:"50%",
                            background:`${tc}22`, border:`1.5px solid ${tc}50`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontWeight:800, fontSize:"0.6rem", color:tc }}>{t}</div>
                      }
                      <span style={{ fontSize:"0.6rem", fontWeight:700,
                        color:sel?tc:"rgba(255,255,255,0.4)" }}>{t}</span>
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section title="My Auctions">
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {myAuctions.length === 0 && (
                  <p style={{ margin:0, fontSize:"0.82rem", color:DIM, fontStyle:"italic" }}>
                    No auctions yet — create or join one from the Auction page.
                  </p>
                )}
                {myAuctions.map(a=>(
                  <div key={a.id} style={{ display:"flex", alignItems:"center", gap:10,
                    padding:"0.7rem 0.9rem", background:"rgba(255,255,255,0.03)",
                    border:`1px solid ${BORDER}`, borderRadius:10 }}>
                    <div>
                      <div style={{ fontWeight:600, fontSize:"0.85rem", color:"#fff" }}>{a.name}</div>
                      <div style={{ fontSize:"0.68rem", color:DIM, marginTop:1 }}>
                        {a.format==="tier"?"Tier":"Classic"} · ₹{a.budget}Cr · {a.participants} teams · {a.role}
                      </div>
                    </div>
                    <span style={{ marginLeft:"auto", fontSize:"0.65rem", fontWeight:700,
                      color: a.status==="live"?"#22c55e":a.status==="lobby"?"#f59e0b":"rgba(255,255,255,0.3)",
                      background: a.status==="live"?"rgba(34,197,94,0.1)":a.status==="lobby"?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.06)",
                      padding:"2px 8px", borderRadius:20 }}>
                      {a.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </Section>

            {/* Save button */}
            <button onClick={handleSave}
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:7,
                padding:"0.9rem", background:saved?"#16a34a":ACCENT, border:"none",
                borderRadius:12, color:"#fff", fontWeight:800, fontSize:"0.9rem",
                cursor:"pointer", width:"100%", transition:"background 0.25s",
                boxShadow:`0 0 24px ${saved?"rgba(22,163,74,0.3)":"rgba(192,25,44,0.3)"}` }}>
              {saved ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Profile</>}
            </button>
          </div>
        )}

        {/* ── NOTIFICATIONS TAB ── */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            <Section title="Notification Preferences">
              <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>
                {Object.entries({
                  auctionStart:   "Auction starting soon (30 min warning)",
                  auctionBid:     "You've been outbid in an auction",
                  scoreUpdates:   "Live score updates for your squad players",
                  predDeadline:   "Prediction deadline reminders",
                  tradeRequests:  "Trade window requests",
                  weeklyDigest:   "Weekly fantasy digest email",
                }).map(([key, label])=>(
                  <div key={key} style={{ display:"flex", alignItems:"center",
                    justifyContent:"space-between", gap:"1rem" }}>
                    <span style={{ fontSize:"0.88rem", color:"rgba(255,255,255,0.8)" }}>{label}</span>
                    <div onClick={()=>setNotifSettings(p=>({...p,[key]:!p[key as keyof typeof p]}))}
                      style={{ width:48, height:26, borderRadius:13, flexShrink:0,
                        background:notifSettings[key as keyof typeof notifSettings]?ACCENT:"rgba(255,255,255,0.1)",
                        border:`1.5px solid ${notifSettings[key as keyof typeof notifSettings]?ACCENT:"rgba(255,255,255,0.12)"}`,
                        cursor:"pointer", position:"relative", transition:"all 0.22s" }}>
                      <div style={{ position:"absolute", top:3,
                        left:notifSettings[key as keyof typeof notifSettings]?24:3,
                        width:16, height:16, borderRadius:"50%", background:"#fff",
                        transition:"left 0.22s" }} />
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </div>
        )}

        {/* ── PRIVACY TAB ── */}
        {activeTab === "privacy" && (
          <div className="space-y-4">
            <Section title="Account">
              <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                {[
                  { label:"Change Password", href:"#" },
                  { label:"Export My Data",  href:"#" },
                  { label:"Delete Account",  href:"#", danger:true },
                ].map(item=>(
                  <div key={item.label}
                    style={{ display:"flex", alignItems:"center", justifyContent:"space-between",
                      padding:"0.75rem 0.9rem", background:"rgba(255,255,255,0.03)",
                      border:`1px solid ${(item as any).danger?"rgba(239,68,68,0.2)":BORDER}`,
                      borderRadius:10, cursor:"pointer" }}>
                    <span style={{ fontSize:"0.88rem",
                      color:(item as any).danger?"#f87171":"rgba(255,255,255,0.8)" }}>
                      {item.label}
                    </span>
                    <ChevronRight size={14} style={{ color:DIM }} />
                  </div>
                ))}
              </div>
            </Section>
            <Section title="Visibility">
              <p style={{ fontSize:"0.85rem", color:DIM, lineHeight:1.6 }}>
                Your profile, watchlist, and prediction picks are visible to members of
                leagues you're in. Your squad details are visible to league members only
                after the relevant match locks.
              </p>
            </Section>
          </div>
        )}
      </motion.div>
    </Layout>
  );
}
