/**
 * JoinAuction.tsx — Complete join flow
 * 1. Enter code → 2. Preview room → 3. Set team name → 4. Waiting lobby → 5. Auction starts
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import {
  Hash, ArrowLeft, ArrowRight, Users, Trophy,
  CheckCircle, Clock, Wifi, Copy
} from "lucide-react";
import { TEAM_COLOR } from "@/lib/ipl-constants";

type JoinStep = "code" | "preview" | "lobby";

// Mock room data — wire to Supabase: fetch by code
const MOCK_ROOM = {
  code: "FND2026",
  name: "Friday Night Draft",
  host: "Rajveer",
  format: "Classic",
  squadSize: 11,
  budget: 100,
  captainVC: true,
  maxTeams: 6,
  teams: [
    { name:"Rajveer's Army", color:"#c0392b", ready:true,  isHost:true  },
    { name:"Karan's XI",     color:"#3b82f6", ready:true,  isHost:false },
    { name:"Arjun Plays",    color:"#a855f7", ready:false, isHost:false },
  ],
  playerPool: 252,
  status: "lobby" as "lobby"|"live",
};

const C = { card:"rgba(255,255,255,0.04)", border:"rgba(255,255,255,0.08)", dim:"rgba(255,255,255,0.35)" };
const ACCENT = "#c0192c";

export default function JoinAuction() {
  const [, navigate] = useLocation();
  const [step, setStep]         = useState<JoinStep>("code");
  const [code, setCode]         = useState("");
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading]   = useState(false);
  const [room, setRoom]         = useState<typeof MOCK_ROOM | null>(null);
  const [copied, setCopied]     = useState(false);

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length < 4) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 700));
    setLoading(false);
    // Simulate finding the room
    setRoom({ ...MOCK_ROOM, code: code.toUpperCase() });
    setStep("preview");
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!teamName.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setStep("lobby");
  }

  function copyCode() {
    navigator.clipboard?.writeText(room?.code ?? code);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  // ── STEP 1: Enter code ──────────────────────────────────────────
  if (step === "code") {
    return (
      <Layout>
        <div style={{ maxWidth:460, margin:"0 auto", paddingTop:"2rem" }}>
          <button onClick={() => navigate("/auction")}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem",
              background:C.card, border:`1px solid ${C.border}`, borderRadius:9,
              padding:"0.45rem 0.85rem", color:C.dim, cursor:"pointer",
              fontSize:"0.8rem", fontWeight:600, marginBottom:"1.5rem" }}>
            <ArrowLeft style={{ width:13, height:13 }} /> Back
          </button>

          <div style={{ marginBottom:"2rem" }}>
            <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.15em",
              color:ACCENT, textTransform:"uppercase", marginBottom:"0.4rem" }}>Auction</div>
            <h1 style={{ margin:0, fontSize:"2rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em" }}>Join with a Code</h1>
            <p style={{ margin:"0.4rem 0 0", color:C.dim, fontSize:"0.9rem" }}>
              Enter the invite code from your host to jump into their auction room.
            </p>
          </div>

          <form onSubmit={handleCodeSubmit}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20,
              padding:"2rem", display:"flex", flexDirection:"column", gap:"1.25rem" }}>
            <div>
              <label style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em",
                color:C.dim, textTransform:"uppercase", display:"block", marginBottom:"0.75rem" }}>
                Auction Code
              </label>
              <div style={{ position:"relative" }}>
                <Hash style={{ position:"absolute", left:"1rem", top:"50%",
                  transform:"translateY(-50%)", width:18, height:18,
                  color: code ? "#818cf8" : C.dim, pointerEvents:"none" }} />
                <input
                  type="text" value={code}
                  onChange={e => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,"").slice(0,8))}
                  placeholder="e.g. FND2026"
                  style={{ width:"100%", boxSizing:"border-box",
                    padding:"1.1rem 1.2rem 1.1rem 3rem",
                    background:"rgba(255,255,255,0.06)",
                    border:`2px solid ${code ? "rgba(129,140,248,0.5)" : C.border}`,
                    borderRadius:14, color:"#fff",
                    fontSize:"1.4rem", fontWeight:800, letterSpacing:"0.25em",
                    outline:"none", fontFamily:"monospace",
                    transition:"border-color 0.2s" }}
                />
              </div>
              {/* Example codes */}
              <div style={{ marginTop:"0.6rem", display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.25)" }}>Try: </span>
                {["FND2026","OLS2026"].map(c => (
                  <button key={c} type="button" onClick={() => setCode(c)}
                    style={{ fontSize:"0.7rem", color:"rgba(129,140,248,0.7)",
                      background:"rgba(129,140,248,0.1)", border:"1px solid rgba(129,140,248,0.2)",
                      borderRadius:6, padding:"2px 8px", cursor:"pointer",
                      fontFamily:"monospace", fontWeight:600 }}>
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <button type="submit" disabled={code.length < 4 || loading}
              style={{ padding:"1rem", borderRadius:12, border:"none",
                background:code.length >= 4 ? "#818cf8" : "rgba(129,140,248,0.15)",
                color:code.length >= 4 ? "#fff" : "rgba(255,255,255,0.25)",
                fontWeight:800, fontSize:"0.95rem",
                cursor:code.length >= 4 ? "pointer" : "default",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem",
                transition:"all 0.2s" }}>
              {loading ? "Finding room…" : <><span>Find Room</span><ArrowRight style={{ width:16, height:16 }} /></>}
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  // ── STEP 2: Preview room ────────────────────────────────────────
  if (step === "preview" && room) {
    return (
      <Layout>
        <div style={{ maxWidth:520, margin:"0 auto", paddingTop:"2rem" }}>
          <button onClick={() => setStep("code")}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem",
              background:C.card, border:`1px solid ${C.border}`, borderRadius:9,
              padding:"0.45rem 0.85rem", color:C.dim, cursor:"pointer",
              fontSize:"0.8rem", fontWeight:600, marginBottom:"1.5rem" }}>
            <ArrowLeft style={{ width:13, height:13 }} /> Back
          </button>

          {/* Room found banner */}
          <div style={{ background:"rgba(34,197,94,0.08)", border:"1px solid rgba(34,197,94,0.2)",
            borderRadius:12, padding:"0.85rem 1.1rem", marginBottom:"1.25rem",
            display:"flex", alignItems:"center", gap:"0.6rem" }}>
            <CheckCircle style={{ width:16, height:16, color:"#22c55e", flexShrink:0 }} />
            <span style={{ fontSize:"0.85rem", color:"#22c55e", fontWeight:600 }}>
              Room found! Hosted by <b>{room.host}</b>
            </span>
          </div>

          {/* Room details card */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20,
            padding:"1.5rem", marginBottom:"1rem" }}>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
              marginBottom:"1.25rem" }}>
              <div>
                <h2 style={{ margin:0, fontSize:"1.5rem", fontWeight:900, color:"#fff",
                  letterSpacing:"-0.03em" }}>{room.name}</h2>
                <div style={{ display:"flex", align:"center", gap:"0.5rem", marginTop:"0.3rem",
                  flexWrap:"wrap" }}>
                  <span style={{ fontSize:"0.68rem", color:"#22c55e", background:"rgba(34,197,94,0.1)",
                    border:"1px solid rgba(34,197,94,0.2)", padding:"2px 8px", borderRadius:20,
                    fontWeight:700, display:"flex", alignItems:"center", gap:"0.3rem" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%", background:"#22c55e" }} />
                    LOBBY OPEN
                  </span>
                  <span style={{ fontSize:"0.68rem", color:C.dim, fontFamily:"monospace" }}>
                    {room.teams.length}/{room.maxTeams} teams joined
                  </span>
                </div>
              </div>
              <div style={{ fontFamily:"monospace", fontWeight:900, fontSize:"1.1rem",
                color:"rgba(255,255,255,0.3)", letterSpacing:"0.15em" }}>
                {room.code}
              </div>
            </div>

            {/* Config chips */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"1.25rem" }}>
              {[
                [`${room.squadSize} players/team`, "👥"],
                [`₹${room.budget}Cr budget`, "💰"],
                [room.format, "🔀"],
                [room.captainVC ? "C/VC enabled" : "No C/VC", "🏆"],
                [`${room.playerPool} in pool`, "🏏"],
              ].map(([label, em]) => (
                <div key={label} style={{ padding:"0.3rem 0.75rem",
                  background:"rgba(255,255,255,0.05)", border:`1px solid ${C.border}`,
                  borderRadius:20, fontSize:"0.75rem", color:"rgba(255,255,255,0.6)",
                  display:"flex", alignItems:"center", gap:"0.35rem" }}>
                  <span>{em}</span> {label}
                </div>
              ))}
            </div>

            {/* Teams already joined */}
            <div>
              <p style={{ margin:"0 0 0.6rem", fontSize:"0.65rem", fontWeight:700,
                letterSpacing:"0.1em", color:C.dim, textTransform:"uppercase" }}>
                Teams in Lobby
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.4rem" }}>
                {room.teams.map((team, i) => (
                  <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.7rem",
                    padding:"0.55rem 0.75rem", background:"rgba(255,255,255,0.03)",
                    border:`1px solid rgba(255,255,255,0.06)`, borderRadius:9 }}>
                    <div style={{ width:8, height:8, borderRadius:"50%",
                      background:team.color, flexShrink:0 }} />
                    <span style={{ fontSize:"0.82rem", fontWeight:500, color:"#fff", flex:1 }}>
                      {team.name}
                    </span>
                    {team.isHost && (
                      <span style={{ fontSize:"0.62rem", color:"#e8a020", fontWeight:700,
                        background:"rgba(232,160,32,0.1)", padding:"1px 6px", borderRadius:4 }}>
                        HOST
                      </span>
                    )}
                    {team.ready
                      ? <CheckCircle style={{ width:13, height:13, color:"#22c55e" }} />
                      : <Clock style={{ width:13, height:13, color:C.dim }} />
                    }
                  </div>
                ))}
                {/* Empty slots */}
                {Array.from({ length: room.maxTeams - room.teams.length }).map((_, i) => (
                  <div key={i} style={{ padding:"0.55rem 0.75rem",
                    background:"rgba(255,255,255,0.015)",
                    border:`1px dashed rgba(255,255,255,0.06)`, borderRadius:9,
                    fontSize:"0.75rem", color:"rgba(255,255,255,0.2)", fontStyle:"italic" }}>
                    Waiting for player…
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Set team name & join */}
          <form onSubmit={handleJoin}
            style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:20,
              padding:"1.5rem", display:"flex", flexDirection:"column", gap:"1rem" }}>
            <div>
              <label style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em",
                color:C.dim, textTransform:"uppercase", display:"block", marginBottom:"0.65rem" }}>
                Your Team Name
              </label>
              <input type="text" value={teamName}
                onChange={e => setTeamName(e.target.value)} maxLength={30}
                placeholder="e.g. Sahil FC"
                style={{ width:"100%", boxSizing:"border-box",
                  padding:"0.9rem 1rem", background:"rgba(255,255,255,0.06)",
                  border:`1.5px solid ${teamName ? "rgba(129,140,248,0.5)" : C.border}`,
                  borderRadius:12, color:"#fff", fontSize:"1rem", outline:"none",
                  transition:"border-color 0.2s" }} />
            </div>
            <button type="submit" disabled={!teamName.trim() || loading}
              style={{ padding:"0.95rem", borderRadius:12, border:"none",
                background:teamName.trim() ? ACCENT : "rgba(192,25,44,0.15)",
                color:teamName.trim() ? "#fff" : "rgba(255,255,255,0.25)",
                fontWeight:800, fontSize:"0.95rem",
                cursor:teamName.trim() ? "pointer" : "default",
                display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
              {loading ? "Joining…" : <><Users style={{ width:16, height:16 }} /><span>Join Auction Room</span></>}
            </button>
          </form>
        </div>
      </Layout>
    );
  }

  // ── STEP 3: Lobby / waiting room ───────────────────────────────
  if (step === "lobby" && room) {
    const allTeams = [...room.teams, { name: teamName, color:"#22c55e", ready:false, isHost:false }];
    return (
      <Layout>
        <div style={{ maxWidth:560, margin:"0 auto", paddingTop:"2rem",
          display:"flex", flexDirection:"column", gap:"1.25rem" }}>

          {/* Header */}
          <div>
            <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.15em",
              color:"#22c55e", textTransform:"uppercase", marginBottom:"0.3rem" }}>
              You've joined!
            </div>
            <h1 style={{ margin:0, fontSize:"1.75rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em" }}>{room.name}</h1>
            <p style={{ margin:"0.3rem 0 0", color:C.dim, fontSize:"0.85rem" }}>
              Waiting for the host to start the auction…
            </p>
          </div>

          {/* Invite code share */}
          <div style={{ background:"rgba(232,160,32,0.06)", border:"1px solid rgba(232,160,32,0.2)",
            borderRadius:14, padding:"1rem 1.25rem",
            display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div>
              <div style={{ fontSize:"0.65rem", fontWeight:700, letterSpacing:"0.1em",
                color:"rgba(232,160,32,0.7)", textTransform:"uppercase", marginBottom:"0.2rem" }}>
                Share code with friends
              </div>
              <div style={{ fontFamily:"monospace", fontSize:"1.6rem", fontWeight:900,
                color:"#e8a020", letterSpacing:"0.2em" }}>{room.code}</div>
            </div>
            <button onClick={copyCode}
              style={{ display:"flex", alignItems:"center", gap:"0.4rem",
                padding:"0.55rem 1rem", background:"rgba(232,160,32,0.12)",
                border:"1px solid rgba(232,160,32,0.25)", borderRadius:9,
                color:"#e8a020", fontSize:"0.8rem", fontWeight:600, cursor:"pointer" }}>
              <Copy style={{ width:13, height:13 }} />
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          {/* Pulse — waiting animation */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`,
            borderRadius:20, padding:"1.5rem", textAlign:"center" }}>
            <div style={{ width:56, height:56, borderRadius:"50%",
              background:"rgba(34,197,94,0.1)", border:"2px solid rgba(34,197,94,0.3)",
              display:"flex", alignItems:"center", justifyContent:"center",
              margin:"0 auto 1rem", animation:"roomPulse 2s ease-in-out infinite" }}>
              <Wifi style={{ width:24, height:24, color:"#22c55e" }} />
            </div>
            <p style={{ margin:0, fontSize:"1rem", fontWeight:700, color:"rgba(255,255,255,0.7)" }}>
              Waiting for host to start
            </p>
            <p style={{ margin:"0.3rem 0 0", fontSize:"0.8rem", color:C.dim }}>
              Auction will begin once all teams are ready
            </p>
          </div>

          {/* All teams */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:16, overflow:"hidden" }}>
            <div style={{ padding:"0.85rem 1.1rem", borderBottom:`1px solid ${C.border}`,
              display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.1em",
                color:C.dim, textTransform:"uppercase" }}>
                Teams ({allTeams.length}/{room.maxTeams})
              </span>
              <span style={{ fontSize:"0.7rem", fontFamily:"monospace",
                color:C.dim }}>₹{room.budget}Cr each</span>
            </div>
            {allTeams.map((team, i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:"0.75rem",
                padding:"0.8rem 1.1rem", borderBottom:i < allTeams.length-1 ? `1px solid rgba(255,255,255,0.04)` : "none",
                background:team.name === teamName ? "rgba(34,197,94,0.04)" : "transparent" }}>
                <div style={{ width:9, height:9, borderRadius:"50%",
                  background:team.color, flexShrink:0 }} />
                <span style={{ fontSize:"0.88rem", fontWeight:600,
                  color: team.name === teamName ? "#22c55e" : "#fff", flex:1 }}>
                  {team.name}
                  {team.name === teamName && (
                    <span style={{ fontSize:"0.65rem", color:"#22c55e",
                      marginLeft:"0.5rem", fontWeight:500 }}>(You)</span>
                  )}
                </span>
                {team.isHost && (
                  <span style={{ fontSize:"0.62rem", color:"#e8a020", fontWeight:700,
                    background:"rgba(232,160,32,0.1)", padding:"1px 7px", borderRadius:4 }}>
                    HOST
                  </span>
                )}
                <CheckCircle style={{ width:14, height:14,
                  color: team.ready || team.name === teamName ? "#22c55e" : C.dim,
                  opacity: team.ready || team.name === teamName ? 1 : 0.3 }} />
              </div>
            ))}
          </div>

          {/* Auction config recap */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.65rem" }}>
            {[
              { label:"Format",  value:room.format,            icon:"🔀" },
              { label:"Squad",   value:`${room.squadSize} players`, icon:"👥" },
              { label:"Budget",  value:`₹${room.budget}Cr`,   icon:"💰" },
              { label:"Pool",    value:`${room.playerPool} players`, icon:"🏏" },
            ].map(s => (
              <div key={s.label} style={{ background:C.card, border:`1px solid ${C.border}`,
                borderRadius:12, padding:"0.85rem 1rem",
                display:"flex", alignItems:"center", gap:"0.65rem" }}>
                <span style={{ fontSize:"1.1rem" }}>{s.icon}</span>
                <div>
                  <div style={{ fontSize:"0.62rem", color:C.dim,
                    textTransform:"uppercase", letterSpacing:"0.08em", fontWeight:700 }}>
                    {s.label}
                  </div>
                  <div style={{ fontSize:"0.9rem", fontWeight:700, color:"#fff", marginTop:1 }}>
                    {s.value}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Go to room button (simulate start) */}
          <button onClick={() => navigate("/auction/room")}
            style={{ padding:"1rem", background:ACCENT, border:"none", borderRadius:12,
              color:"#fff", fontWeight:800, fontSize:"0.95rem", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem" }}>
            <Trophy style={{ width:16, height:16 }} />
            Enter Auction Room
          </button>
        </div>

        <style>{`@keyframes roomPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,0.3)}50%{box-shadow:0 0 0 12px rgba(34,197,94,0)}}`}</style>
      </Layout>
    );
  }

  return null;
}
