import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, ChevronRight, Copy, Users } from "lucide-react";
import { apiFetch } from "@/lib/api";

const ACCENT    = "#c0192c";
const CARD      = "rgba(255,255,255,0.032)";
const BORDER    = "rgba(255,255,255,0.08)";
const LABEL_CLR = "rgba(255,255,255,0.35)";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.13em",
      textTransform:"uppercase", color:LABEL_CLR, display:"block", marginBottom:"0.75rem" }}>
      {children}
    </span>
  );
}

function Stepper({ value, onChange, min=1, max=99, suffix }:
  { value:number; onChange:(v:number)=>void; min?:number; max?:number; suffix?:string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
      <button type="button" onClick={()=>onChange(Math.max(min,value-1))}
        style={{ width:44, height:44, borderRadius:12, flexShrink:0,
          background:"rgba(255,255,255,0.07)", border:`1px solid ${BORDER}`,
          color:"rgba(255,255,255,0.65)", fontSize:"1.4rem",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
      <div style={{ flex:1, textAlign:"center" }}>
        <div style={{ fontSize:"2.2rem", fontWeight:900, color:"#fff", lineHeight:1 }}>{value}</div>
        {suffix&&<div style={{ fontSize:"0.7rem", color:LABEL_CLR, marginTop:"0.15rem" }}>{suffix}</div>}
      </div>
      <button type="button" onClick={()=>onChange(Math.min(max,value+1))}
        style={{ width:44, height:44, borderRadius:12, flexShrink:0,
          background:"rgba(255,255,255,0.07)", border:`1px solid ${BORDER}`,
          color:"rgba(255,255,255,0.65)", fontSize:"1.4rem",
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
    </div>
  );
}

function Toggle({ on, onToggle }: { on:boolean; onToggle:()=>void }) {
  return (
    <div onClick={onToggle}
      style={{ width:52, height:28, borderRadius:14, flexShrink:0,
        background:on?ACCENT:"rgba(255,255,255,0.1)",
        border:`1.5px solid ${on?ACCENT:"rgba(255,255,255,0.12)"}`,
        cursor:"pointer", position:"relative", transition:"all 0.22s" }}>
      <div style={{ position:"absolute", top:3, left:on?26:3,
        width:18, height:18, borderRadius:"50%", background:"#fff",
        transition:"left 0.22s", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }} />
    </div>
  );
}

function genCode(name: string) {
  const prefix = name.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,3)||"IPL";
  return `${prefix}${Math.random().toString(36).toUpperCase().slice(2,5)}`;
}

function Card({ children, style }: { children:React.ReactNode; style?:React.CSSProperties }) {
  return (
    <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:16,
      padding:"1.25rem 1.35rem", ...style }}>
      {children}
    </div>
  );
}

export default function CreateAuction() {
  const [, navigate] = useLocation();
  const [name, setName]             = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [format, setFormat]         = useState<"classic"|"tier">("classic");
  const [maxPlayers, setMaxPlayers] = useState(11);
  const [budget, setBudget]         = useState(100);
  const [topScoring, setTopScoring]     = useState(false);
  const [topScoringCount, setTopScoringCount] = useState(11);
  const [captainVC, setCaptainVC]   = useState(true);
  const [tradeWindow, setTrade]      = useState(false);
  const [captainChanges, setCapChg]  = useState(true);
  const [loading, setLoading]         = useState(false);
  const [enterLoading, setEnterLoading] = useState(false);
  const [code, setCode]               = useState("");
  const [copied, setCopied]           = useState(false);
  const [hostTeam, setHostTeam]       = useState("");
  const [hostTeamFocused, setHostTeamFocused] = useState(false);

  // Keep topScoringCount within bounds when maxPlayers changes
  useEffect(() => {
    if (topScoringCount >= maxPlayers) setTopScoringCount(Math.max(1, maxPlayers - 1));
  }, [maxPlayers]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    const generatedCode = genCode(name);
    try {
      await apiFetch("/auction/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: generatedCode,
          name: name.trim(),
          budget, maxPlayers, format,
          topScoring, topScoringCount, captainVC,
        }),
      });
    } catch {
      // Non-fatal — room still usable locally
    }
    setLoading(false);
    setCode(generatedCode);
  }

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true); setTimeout(()=>setCopied(false),1500);
  }

  // ── Invite code screen ──
  async function handleEnterRoom() {
    if (!hostTeam.trim() || enterLoading) return;
    setEnterLoading(true);
    try {
      // Register host's team in DB
      await apiFetch(`/auction/rooms/${code}/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamName: hostTeam.trim(), isHost: true }),
      });
    } catch { /* non-fatal */ }
    try {
      localStorage.setItem("colosseum_auction_config", JSON.stringify({
        name, budget, maxPlayers, format,
        topScoring, topScoringCount, captainVC,
        roomCode: code,
      }));
    } catch {}
    setEnterLoading(false);
    navigate("/auction/room");
  }

  if (code) {
    return (
      <Layout>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", minHeight:"60vh", gap:"1.25rem", textAlign:"center",
          padding:"1rem" }}>
          <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.15em",
            color:ACCENT, textTransform:"uppercase" }}>Auction Created</div>
          <h1 style={{ margin:0, fontSize:"1.75rem", fontWeight:900, color:"#fff",
            letterSpacing:"-0.03em" }}>{name}</h1>

          {/* Invite code card */}
          <Card style={{ width:"100%", maxWidth:380, display:"flex", flexDirection:"column",
            alignItems:"center", gap:"0.85rem" }}>
            <p style={{ margin:0, fontSize:"0.68rem", fontWeight:700,
              letterSpacing:"0.12em", color:LABEL_CLR, textTransform:"uppercase" }}>
              Share to invite teams
            </p>
            <div style={{ fontSize:"2.8rem", fontWeight:900, color:"#fff",
              fontFamily:"monospace", letterSpacing:"0.3em" }}>{code}</div>
            <button onClick={copyCode}
              style={{ display:"flex", alignItems:"center", gap:"0.5rem",
                padding:"0.6rem 1.2rem", background:"rgba(255,255,255,0.07)",
                border:`1px solid ${BORDER}`, borderRadius:10,
                color:"#fff", fontSize:"0.82rem", fontWeight:600, cursor:"pointer" }}>
              <Copy style={{ width:13, height:13 }} />
              {copied?"Copied!":"Copy Code"}
            </button>
            <div style={{ fontSize:"0.75rem", color:LABEL_CLR }}>
              {maxPlayers} players · ₹{budget}Cr · {format==="classic"?"Classic":"Tier-Based"}
              {topScoring && ` · Top ${topScoringCount} count`}
            </div>
          </Card>

          {/* Host team name */}
          <Card style={{ width:"100%", maxWidth:380, textAlign:"left" }}>
            <Label>Your Team Name</Label>
            <input
              type="text"
              value={hostTeam}
              onChange={e => setHostTeam(e.target.value)}
              onFocus={() => setHostTeamFocused(true)}
              onBlur={() => setHostTeamFocused(false)}
              maxLength={30}
              placeholder="e.g. Rajveer's Army"
              autoFocus
              style={{ width:"100%", boxSizing:"border-box",
                padding:"0.85rem 1rem",
                background: hostTeamFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                border:`1.5px solid ${hostTeamFocused ? "rgba(192,25,44,0.55)" : BORDER}`,
                borderRadius:12, color:"#fff", fontSize:"1rem",
                outline:"none", transition:"all 0.18s" }} />
            <p style={{ margin:"0.55rem 0 0", fontSize:"0.72rem", color:LABEL_CLR }}>
              This name will appear in the auction room for all participants.
            </p>
          </Card>

          <div style={{ display:"flex", gap:"0.65rem", flexWrap:"wrap", justifyContent:"center" }}>
            <button onClick={handleEnterRoom}
              disabled={!hostTeam.trim() || enterLoading}
              style={{ padding:"0.85rem 1.75rem",
                background: hostTeam.trim() ? ACCENT : "rgba(192,25,44,0.18)",
                border:"none",
                borderRadius:12,
                color: hostTeam.trim() ? "#fff" : "rgba(255,255,255,0.3)",
                fontWeight:800, fontSize:"0.9rem",
                cursor: hostTeam.trim() ? "pointer" : "default",
                display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <Users style={{ width:15, height:15 }} />
              Enter Auction Room
            </button>
            <button onClick={()=>navigate("/auction")}
              style={{ padding:"0.85rem 1.25rem", background:"rgba(255,255,255,0.06)",
                border:`1px solid ${BORDER}`, borderRadius:12,
                color:LABEL_CLR, fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
              Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={handleCreate} style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"0.85rem" }}>
          <button type="button" onClick={()=>navigate("/auction")}
            style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${BORDER}`,
              borderRadius:10, padding:"0.45rem 0.75rem", color:LABEL_CLR, cursor:"pointer",
              display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.8rem", fontWeight:600 }}>
            <ArrowLeft style={{ width:14, height:14 }} /> Back
          </button>
          <div>
            <p style={{ margin:0, fontSize:"0.62rem", fontWeight:700,
              letterSpacing:"0.16em", textTransform:"uppercase", color:ACCENT }}>Auction</p>
            <h1 style={{ margin:0, fontSize:"1.55rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", lineHeight:1 }}>Create New Auction</h1>
          </div>
        </div>

        {/* Form cards — single column on mobile, 2-col on md+ */}
        <div style={{ display:"grid",
          gridTemplateColumns:"1fr",
          gap:"0.85rem" }}
          className="md:grid-cols-2">

          {/* Name */}
          <Card>
            <Label>Auction Name</Label>
            <input type="text" value={name} onChange={e=>setName(e.target.value)}
              onFocus={()=>setNameFocused(true)} onBlur={()=>setNameFocused(false)}
              placeholder="e.g. Friday Night Draft"
              style={{ width:"100%", boxSizing:"border-box", padding:"0.85rem 1rem",
                background:nameFocused?"rgba(255,255,255,0.07)":"rgba(255,255,255,0.04)",
                border:`1.5px solid ${nameFocused?"rgba(192,25,44,0.55)":"rgba(255,255,255,0.1)"}`,
                borderRadius:12, color:"#fff", fontSize:"1rem",
                outline:"none", transition:"all 0.18s" }} />
          </Card>

          {/* Format */}
          <Card style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
            <Label>Auction Format</Label>
            {(["classic","tier"] as const).map(f=>(
              <div key={f} onClick={()=>setFormat(f)}
                style={{ borderRadius:12, cursor:"pointer", padding:"0.9rem 1rem",
                  background:format===f?`${ACCENT}14`:"rgba(255,255,255,0.025)",
                  border:`1.5px solid ${format===f?`${ACCENT}55`:"rgba(255,255,255,0.07)"}`,
                  transition:"all 0.18s", display:"flex", alignItems:"center",
                  justifyContent:"space-between" }}>
                <div>
                  <div style={{ fontWeight:700, fontSize:"0.95rem",
                    color:format===f?"#fff":"rgba(255,255,255,0.4)" }}>
                    {f==="classic"?"Classic":"Tier Based"}
                  </div>
                  <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.3)", marginTop:"0.2rem" }}>
                    {f==="classic"?"Open pool, highest bid wins":"Marquee → Core → Squad tiers"}
                  </div>
                </div>
                <div style={{ width:16, height:16, borderRadius:"50%", flexShrink:0,
                  background:format===f?ACCENT:"transparent",
                  border:`2px solid ${format===f?ACCENT:"rgba(255,255,255,0.2)"}`,
                  display:"flex", alignItems:"center", justifyContent:"center" }}>
                  {format===f&&<div style={{ width:5, height:5, borderRadius:"50%", background:"#fff" }} />}
                </div>
              </div>
            ))}
          </Card>

          {/* Squad size */}
          <Card>
            <Label>Max Players / Team</Label>
            <Stepper value={maxPlayers} onChange={setMaxPlayers} min={5} max={25} suffix="players per team" />
          </Card>

          {/* Budget */}
          <Card>
            <Label>Starting Budget</Label>
            <Stepper value={budget} onChange={setBudget} min={50} max={500} suffix="crores per team" />
          </Card>

          {/* Toggles */}
          <Card style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
            <Label>Options</Label>

            {/* Captain & Vice-Captain */}
            <div style={{ display:"flex", alignItems:"center",
              justifyContent:"space-between", gap:"1rem" }}>
              <div>
                <div style={{ fontSize:"0.88rem", fontWeight:600, color:"#fff" }}>Captain &amp; Vice-Captain</div>
                <div style={{ fontSize:"0.72rem", color:LABEL_CLR, marginTop:"0.1rem" }}>2× and 1.5× multipliers</div>
              </div>
              <Toggle on={captainVC} onToggle={()=>setCaptainVC(v=>!v)} />
            </div>

            {/* Top Scoring Only */}
            <div style={{ display:"flex", flexDirection:"column", gap:"0.75rem" }}>
              <div style={{ display:"flex", alignItems:"center",
                justifyContent:"space-between", gap:"1rem" }}>
                <div>
                  <div style={{ fontSize:"0.88rem", fontWeight:600, color:"#fff" }}>Top Scoring Only</div>
                  <div style={{ fontSize:"0.72rem", color:LABEL_CLR, marginTop:"0.1rem" }}>
                    Only top-ranked players count; the rest sit on the bench live
                  </div>
                </div>
                <Toggle on={topScoring} onToggle={()=>setTopScoring(v=>!v)} />
              </div>

              {topScoring && (
                <div style={{ background:"rgba(192,25,44,0.06)",
                  border:"1px solid rgba(192,25,44,0.18)", borderRadius:12,
                  padding:"1rem 1rem 0.85rem" }}>
                  <div style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em",
                    textTransform:"uppercase", color:"rgba(192,25,44,0.7)", marginBottom:"0.75rem" }}>
                    Players that count toward score
                  </div>
                  <Stepper
                    value={topScoringCount}
                    onChange={v => setTopScoringCount(Math.min(v, maxPlayers - 1))}
                    min={1}
                    max={maxPlayers - 1}
                    suffix={`of ${maxPlayers} · bottom ${maxPlayers - topScoringCount} benched`}
                  />
                  <p style={{ margin:"0.65rem 0 0", fontSize:"0.7rem",
                    color:"rgba(255,255,255,0.28)", lineHeight:1.5 }}>
                    Rankings refresh live as match points update — the {topScoringCount} highest-scoring players
                    automatically play, and anyone below that threshold moves to the bench.
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* Season Rules */}
          <Card style={{ display:"flex", flexDirection:"column", gap:"0.85rem" }}>
            <Label>Season Rules</Label>
            {([
              ["tradeWindow",    tradeWindow,    ()=>setTrade((v:boolean)=>!v),   "Mid-Season Trade Window",  "Opens after every team completes 7 matches. Teams can propose optional player swaps."],
              ["captainChanges", captainChanges, ()=>setCapChg((v:boolean)=>!v),  "Captain & VC Changes",     "Allow managers to update their Captain and Vice-Captain before each match deadline."],
            ] as [string,boolean,()=>void,string,string][]).map(([_k, val, fn, title, sub])=>(
              <div key={title} style={{ display:"flex", alignItems:"flex-start",
                justifyContent:"space-between", gap:"1rem" }}>
                <div>
                  <div style={{ fontSize:"0.88rem", fontWeight:600, color:"#fff" }}>{title}</div>
                  <div style={{ fontSize:"0.72rem", color:LABEL_CLR, marginTop:"0.15rem", maxWidth:280, lineHeight:1.5 }}>{sub}</div>
                </div>
                <Toggle on={val} onToggle={fn} />
              </div>
            ))}
          </Card>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.6rem", paddingTop:"0.25rem" }}>
          <button type="button" onClick={()=>navigate("/auction")}
            style={{ padding:"0.75rem 1.25rem", background:"rgba(255,255,255,0.05)",
              border:`1px solid ${BORDER}`, borderRadius:11, color:LABEL_CLR,
              fontWeight:600, fontSize:"0.85rem", cursor:"pointer" }}>
            Cancel
          </button>
          <button type="submit" disabled={!name.trim()||loading}
            style={{ padding:"0.75rem 1.75rem",
              background:!name.trim()?"rgba(192,25,44,0.15)":ACCENT,
              border:"none", borderRadius:11,
              color:!name.trim()?"rgba(255,255,255,0.22)":"#fff",
              fontWeight:800, fontSize:"0.88rem",
              cursor:name.trim()&&!loading?"pointer":"default",
              display:"flex", alignItems:"center", gap:"0.4rem" }}>
            {loading?"Creating…":<><span>Create Auction</span><ChevronRight style={{ width:14, height:14 }} /></>}
          </button>
        </div>
      </form>
    </Layout>
  );
}
