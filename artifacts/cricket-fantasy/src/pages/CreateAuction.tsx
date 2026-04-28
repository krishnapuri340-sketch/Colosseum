/**
 * CreateAuction.tsx — Refined v2
 * Changes: navigates to /auction/room on submit (not back to /auction)
 * Shows a generated invite code before entering the room.
 */
import { useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { ArrowLeft, ChevronRight, Copy, Users } from "lucide-react";

const ACCENT     = "#c0192c";
const CARD       = "rgba(255,255,255,0.032)";
const BORDER     = "rgba(255,255,255,0.08)";
const LABEL      = "rgba(255,255,255,0.35)";
const FOCUS_BDR  = "rgba(192,25,44,0.55)";

function WidgetLabel({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.13em",
      textTransform:"uppercase", color:LABEL, display:"block", marginBottom:"0.85rem" }}>
      {children}
    </span>
  );
}

function NumberStepper({ value, onChange, min=1, max=99, suffix, compact=false }:
  { value:number; onChange:(v:number)=>void; min?:number; max?:number; suffix?:string; compact?:boolean }) {
  const bs = compact ? 38 : 50, br = compact ? 10 : 14, bf = compact ? "1.1rem" : "1.4rem", nf = compact ? "2rem" : "3.2rem";
  return (
    <div style={{ display:"flex", alignItems:"center", gap: compact ? "0.55rem" : "0.9rem", flex:1 }}>
      <button type="button" onClick={() => onChange(Math.max(min, value-1))}
        style={{ width:bs, height:bs, borderRadius:br, background:"rgba(255,255,255,0.07)",
          border:`1px solid ${BORDER}`, color:"rgba(255,255,255,0.65)", fontSize:bf,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:700, flexShrink:0, transition:"background 0.15s" }}
        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.13)")}
        onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.07)")}>−</button>
      <div style={{ flex:1, textAlign:"center" }}>
        <div style={{ fontSize:nf, fontWeight:900, color:"#fff", lineHeight:1 }}>{value}</div>
        {suffix && <div style={{ fontSize:"0.72rem", color:LABEL, marginTop:"0.2rem" }}>{suffix}</div>}
      </div>
      <button type="button" onClick={() => onChange(Math.min(max, value+1))}
        style={{ width:bs, height:bs, borderRadius:br, background:"rgba(255,255,255,0.07)",
          border:`1px solid ${BORDER}`, color:"rgba(255,255,255,0.65)", fontSize:bf,
          cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center",
          fontWeight:700, flexShrink:0, transition:"background 0.15s" }}
        onMouseEnter={e=>(e.currentTarget.style.background="rgba(255,255,255,0.13)")}
        onMouseLeave={e=>(e.currentTarget.style.background="rgba(255,255,255,0.07)")}>+</button>
    </div>
  );
}

function Toggle({ on, onToggle }: { on:boolean; onToggle:()=>void }) {
  return (
    <div onClick={onToggle}
      style={{ width:60, height:32, borderRadius:16, flexShrink:0,
        background: on ? ACCENT : "rgba(255,255,255,0.1)",
        border:`1.5px solid ${on ? ACCENT : "rgba(255,255,255,0.12)"}`,
        cursor:"pointer", position:"relative", transition:"all 0.22s" }}>
      <div style={{ position:"absolute", top:4, left: on ? 30 : 4,
        width:20, height:20, borderRadius:"50%", background:"#fff",
        transition:"left 0.22s", boxShadow:"0 1px 4px rgba(0,0,0,0.4)" }} />
    </div>
  );
}

function genCode(name: string) {
  const prefix = name.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,3) || "IPL";
  const suffix = Math.random().toString(36).toUpperCase().slice(2,5);
  return `${prefix}${suffix}`;
}

export default function CreateAuction() {
  const [, navigate] = useLocation();

  const [name, setName]               = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [format, setFormat]           = useState<"classic"|"tier">("classic");
  const [maxPlayers, setMaxPlayers]   = useState(11);
  const [budget, setBudget]           = useState(100);
  const [topScoring, setTopScoring]   = useState(false);
  const [topCount, setTopCount]       = useState(11);
  const [foreignLimit, setForeignLimit] = useState(false);
  const [foreignMax, setForeignMax]   = useState(4);
  const [captainVC, setCaptainVC]     = useState(true);
  const [loading, setLoading]         = useState(false);
  const [code, setCode]               = useState("");
  const [copied, setCopied]           = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    setCode(genCode(name));
  };

  function copyCode() {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const card = (extra?: React.CSSProperties): React.CSSProperties => ({
    background:CARD, border:`1px solid ${BORDER}`, borderRadius:18,
    padding:"1.85rem 2rem", display:"flex", flexDirection:"column", ...extra,
  });

  // Invite code screen
  if (code) {
    return (
      <Layout>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center",
          justifyContent:"center", height:"100%", gap:"1.5rem", textAlign:"center" }}>
          <div style={{ fontSize:"0.7rem", fontWeight:700, letterSpacing:"0.15em",
            color:ACCENT, textTransform:"uppercase" }}>Auction Created</div>
          <h1 style={{ margin:0, fontSize:"2rem", fontWeight:900, color:"#fff",
            letterSpacing:"-0.03em" }}>{name}</h1>

          <div style={{ background:CARD, border:`1px solid ${BORDER}`, borderRadius:20,
            padding:"2rem 2.5rem", display:"flex", flexDirection:"column",
            alignItems:"center", gap:"1rem", minWidth:320 }}>
            <p style={{ margin:0, fontSize:"0.72rem", fontWeight:700,
              letterSpacing:"0.12em", color:LABEL, textTransform:"uppercase" }}>
              Share this code to invite teams
            </p>
            <div style={{ fontSize:"3rem", fontWeight:900, color:"#fff",
              fontFamily:"monospace", letterSpacing:"0.3em" }}>{code}</div>
            <button onClick={copyCode}
              style={{ display:"flex", alignItems:"center", gap:"0.5rem",
                padding:"0.65rem 1.4rem", background:"rgba(255,255,255,0.07)",
                border:`1px solid ${BORDER}`, borderRadius:10,
                color:"#fff", fontSize:"0.82rem", fontWeight:600, cursor:"pointer" }}>
              <Copy style={{ width:14, height:14 }} />
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <div style={{ fontSize:"0.78rem", color:LABEL }}>
              {maxPlayers} players/team · ₹{budget}Cr budget · {format === "classic" ? "Classic" : "Tier-Based"}
            </div>
          </div>

          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button onClick={() => navigate("/auction/room")}
              style={{ padding:"0.9rem 2rem", background:ACCENT, border:"none",
                borderRadius:12, color:"#fff", fontWeight:800, fontSize:"0.95rem",
                cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem" }}>
              <Users style={{ width:16, height:16 }} />
              Enter Auction Room
            </button>
            <button onClick={() => navigate("/auction")}
              style={{ padding:"0.9rem 1.5rem", background:"rgba(255,255,255,0.06)",
                border:`1px solid ${BORDER}`, borderRadius:12,
                color:LABEL, fontWeight:600, fontSize:"0.88rem", cursor:"pointer" }}>
              Back
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <form onSubmit={handleCreate}
        style={{ display:"flex", flexDirection:"column", gap:"1.1rem", height:"100%" }}>

        {/* Header */}
        <div style={{ display:"flex", alignItems:"center", gap:"1rem" }}>
          <button type="button" onClick={() => navigate("/auction")}
            style={{ background:"rgba(255,255,255,0.06)", border:`1px solid ${BORDER}`,
              borderRadius:10, padding:"0.45rem 0.8rem", color:LABEL, cursor:"pointer",
              display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.8rem", fontWeight:600 }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.color="#fff"; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.1)"; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.color=LABEL; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.06)"; }}>
            <ArrowLeft style={{ width:14, height:14 }} /> Back
          </button>
          <div>
            <p style={{ margin:0, fontSize:"0.65rem", fontWeight:700,
              letterSpacing:"0.16em", textTransform:"uppercase", color:ACCENT }}>Auction</p>
            <h1 style={{ margin:0, fontSize:"1.75rem", fontWeight:900, color:"#fff",
              letterSpacing:"-0.03em", lineHeight:1 }}>Create New Auction</h1>
          </div>
        </div>

        {/* Bento grid */}
        <div style={{ flex:1, display:"grid",
          gridTemplateColumns:"1.6fr 1fr 1fr",
          gridTemplateRows:"1fr 1fr",
          gap:"0.9rem", minHeight:0 }}>

          {/* Name */}
          <div style={{ ...card(), gridColumn:"1", gridRow:"1", justifyContent:"space-between" }}>
            <WidgetLabel>Auction Name</WidgetLabel>
            <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center" }}>
              <input type="text" value={name} onChange={e=>setName(e.target.value)}
                onFocus={()=>setNameFocused(true)} onBlur={()=>setNameFocused(false)}
                placeholder="e.g. Friday Night Draft"
                style={{ width:"100%", boxSizing:"border-box", padding:"0.95rem 1.1rem",
                  background: nameFocused ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)",
                  border:`1.5px solid ${nameFocused ? FOCUS_BDR : "rgba(255,255,255,0.1)"}`,
                  borderRadius:12, color:"#fff", fontSize:"1.1rem",
                  outline:"none", transition:"all 0.18s" }} />
              {name && (
                <p style={{ margin:"0.65rem 0 0", fontSize:"0.78rem",
                  color:"rgba(255,255,255,0.3)", fontStyle:"italic" }}>"{name}"</p>
              )}
            </div>
          </div>

          {/* Format — spans 2 rows on right */}
          <div style={{ ...card({ flexDirection:"column" }),
            gridColumn:"2 / 4", gridRow:"1 / 3", gap:"1.1rem" }}>
            <WidgetLabel>Auction Format</WidgetLabel>
            {(["classic","tier"] as const).map(f => (
              <div key={f} onClick={() => setFormat(f)}
                style={{ flex:1, borderRadius:13, cursor:"pointer", padding:"1.35rem 1.5rem",
                  background: format===f ? `${ACCENT}14` : "rgba(255,255,255,0.025)",
                  border:`1.5px solid ${format===f ? `${ACCENT}55` : "rgba(255,255,255,0.07)"}`,
                  transition:"all 0.18s", display:"flex", flexDirection:"column", justifyContent:"space-between" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:"0.65rem" }}>
                  <span style={{ fontWeight:900, fontSize:"1.1rem",
                    color: format===f ? "#fff" : "rgba(255,255,255,0.4)", letterSpacing:"-0.01em" }}>
                    {f === "classic" ? "Classic" : "Tier Based"}
                  </span>
                  <div style={{ width:17, height:17, borderRadius:"50%",
                    background: format===f ? ACCENT : "transparent",
                    border:`2px solid ${format===f ? ACCENT : "rgba(255,255,255,0.2)"}`,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {format===f && <div style={{ width:5, height:5, borderRadius:"50%", background:"#fff" }} />}
                  </div>
                </div>
                <p style={{ margin:0, fontSize:"0.82rem", color:"rgba(255,255,255,0.32)", lineHeight:1.6 }}>
                  {f === "classic"
                    ? "All players enter one open pool. Highest verbal bid wins."
                    : "Players grouped into Elite, Premium, and Standard tiers for structured bidding."}
                </p>
              </div>
            ))}
          </div>

          {/* Max Players */}
          <div style={{ ...card({ justifyContent:"space-between" }), gridColumn:"1", gridRow:"2" }}>
            <WidgetLabel>Max Players / Team</WidgetLabel>
            <div style={{ flex:1, display:"flex", alignItems:"center" }}>
              <NumberStepper value={maxPlayers} onChange={setMaxPlayers} min={5} max={25} suffix="players" />
            </div>
          </div>
        </div>

        {/* Second row */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1.5fr", gap:"0.9rem" }}>
          {/* Budget */}
          <div style={card({ justifyContent:"space-between", padding:"1.3rem 1.5rem" })}>
            <WidgetLabel>Budget / Team</WidgetLabel>
            <div style={{ display:"flex", alignItems:"center", flex:1 }}>
              <NumberStepper value={budget} onChange={setBudget} min={50} max={500} suffix="crores" compact />
            </div>
          </div>

          {/* Top Scoring */}
          <div style={card({ justifyContent:"space-between", gap:"0.65rem", padding:"1.3rem 1.5rem" })}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.13em",
                textTransform:"uppercase", color:LABEL }}>Top Scoring Count</span>
              <Toggle on={topScoring} onToggle={() => { setTopScoring(v=>!v); if(topScoring) setForeignLimit(false); }} />
            </div>
            <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center" }}>
              {topScoring
                ? <NumberStepper value={Math.min(topCount, maxPlayers)} onChange={v=>{ const c=Math.min(v,maxPlayers); setTopCount(c); if(foreignMax>c) setForeignMax(c); }} min={1} max={maxPlayers} suffix="players" compact />
                : <div style={{ textAlign:"center" }}>
                    <div style={{ fontSize:"1rem", fontWeight:700, color:"rgba(255,255,255,0.2)", lineHeight:1.4 }}>All players</div>
                    <div style={{ fontSize:"0.72rem", color:"rgba(255,255,255,0.15)", marginTop:"0.2rem" }}>points count</div>
                  </div>
              }
            </div>
            {topScoring && (
              <div style={{ borderTop:"1px solid rgba(255,255,255,0.07)", paddingTop:"0.75rem",
                display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
                  <span style={{ fontSize:"0.62rem", fontWeight:700, letterSpacing:"0.1em",
                    textTransform:"uppercase", color:"rgba(255,255,255,0.25)" }}>Foreign Limit</span>
                  <Toggle on={foreignLimit} onToggle={()=>setForeignLimit(v=>!v)} />
                </div>
                {foreignLimit && (
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <button type="button" onClick={()=>setForeignMax(f=>Math.max(1,f-1))}
                      style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                        background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                        color:"rgba(255,255,255,0.6)", fontSize:"1rem", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>−</button>
                    <div style={{ flex:1, textAlign:"center" }}>
                      <span style={{ fontSize:"1.5rem", fontWeight:900, color:"#fff" }}>{Math.min(foreignMax,topCount)}</span>
                      <span style={{ fontSize:"0.68rem", color:"rgba(255,255,255,0.3)", marginLeft:"0.3rem" }}>overseas</span>
                    </div>
                    <button type="button" onClick={()=>setForeignMax(f=>Math.min(topCount,f+1))}
                      style={{ width:34, height:34, borderRadius:9, flexShrink:0,
                        background:"rgba(255,255,255,0.06)", border:"1px solid rgba(255,255,255,0.1)",
                        color:"rgba(255,255,255,0.6)", fontSize:"1rem", cursor:"pointer",
                        display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700 }}>+</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Captain & VC */}
          <div style={{ ...card({
            background: captainVC ? `${ACCENT}0d` : CARD,
            border:`1px solid ${captainVC ? `${ACCENT}35` : BORDER}`,
            flexDirection:"row", alignItems:"center",
            justifyContent:"space-between", gap:"1.25rem", padding:"1.3rem 1.5rem",
          }), transition:"all 0.22s" }}>
            <div style={{ flex:1 }}>
              <WidgetLabel>Captain &amp; Vice-Captain</WidgetLabel>
              <p style={{ margin:0, fontSize:"1.1rem", fontWeight:900,
                color: captainVC ? "#fff" : "rgba(255,255,255,0.3)",
                letterSpacing:"-0.02em", lineHeight:1, transition:"color 0.2s" }}>
                Point Multipliers
              </p>
              <p style={{ margin:"0.35rem 0 0", fontSize:"0.76rem", color:"rgba(255,255,255,0.3)", lineHeight:1.5 }}>
                Captain <span style={{ color: captainVC ? "#fff" : "inherit", fontWeight:700 }}>2×</span>
                {" · "}Vice-Captain <span style={{ color: captainVC ? "#fff" : "inherit", fontWeight:700 }}>1.5×</span>
              </p>
            </div>
            <Toggle on={captainVC} onToggle={()=>setCaptainVC(v=>!v)} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display:"flex", justifyContent:"flex-end", gap:"0.65rem", paddingBottom:"0.25rem" }}>
          <button type="button" onClick={() => navigate("/auction")}
            style={{ padding:"0.8rem 1.4rem", background:"rgba(255,255,255,0.05)",
              border:`1px solid ${BORDER}`, borderRadius:11, color:LABEL,
              fontWeight:700, fontSize:"0.86rem", cursor:"pointer", transition:"all 0.15s" }}
            onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.color="#fff"; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.09)"; }}
            onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.color=LABEL; (e.currentTarget as HTMLButtonElement).style.background="rgba(255,255,255,0.05)"; }}>
            Cancel
          </button>
          <button type="submit" disabled={!name.trim() || loading}
            style={{ padding:"0.8rem 1.9rem",
              background: !name.trim() ? "rgba(192,25,44,0.15)" : ACCENT,
              border:`1.5px solid ${!name.trim() ? "rgba(192,25,44,0.2)" : ACCENT}`,
              borderRadius:11, color: !name.trim() ? "rgba(255,255,255,0.22)" : "#fff",
              fontWeight:800, fontSize:"0.88rem",
              cursor: name.trim() && !loading ? "pointer" : "default",
              transition:"all 0.15s",
              display:"flex", alignItems:"center", gap:"0.4rem" }}
            onMouseEnter={e=>{ if(name.trim()) (e.currentTarget as HTMLButtonElement).style.background="#a8172a"; }}
            onMouseLeave={e=>{ if(name.trim()) (e.currentTarget as HTMLButtonElement).style.background=ACCENT; }}>
            {loading ? "Creating…" : <><span>Create Auction</span><ChevronRight style={{ width:15, height:15 }} /></>}
          </button>
        </div>
      </form>
    </Layout>
  );
}
