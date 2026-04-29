import { useLocation } from "wouter";
import { Layout } from "@/components/layout/Layout";
import { Plus, ArrowRight, Play, Users, Calendar, Hash, Trophy } from "lucide-react";

const ACCENT = "#c0192c";
const INDIGO  = "#818cf8";
const C = { card:"rgba(255,255,255,0.035)", border:"rgba(255,255,255,0.1)", dim:"rgba(255,255,255,0.4)" };

const MY_AUCTIONS = [
  { id:"a1", name:"Friday Night Draft", participants:4, playersLeft:28, status:"live",     code:"FND2026" },
  { id:"a2", name:"Office League S2",   participants:6, playersLeft:0,  status:"complete", code:"OLS2026" },
];

export default function Auction() {
  const [, navigate] = useLocation();

  return (
    <Layout>
      <div style={{ display:"flex", flexDirection:"column", gap:"2rem" }}>
        {/* Header */}
        <div>
          <p style={{ margin:"0 0 0.3rem", color:ACCENT, fontSize:"0.72rem",
            fontWeight:700, letterSpacing:"0.2em", textTransform:"uppercase" }}>IPL 2026</p>
          <h1 style={{ margin:0, fontSize:"2.1rem", fontWeight:900, color:"#fff",
            letterSpacing:"-0.03em" }}>Auction</h1>
          <p style={{ margin:"0.35rem 0 0", color:C.dim, fontSize:"0.92rem" }}>
            Host a private draft or join a friend's room with an invite code.
          </p>
        </div>

        {/* Active rooms */}
        {MY_AUCTIONS.length > 0 && (
          <div>
            <p style={{ margin:"0 0 0.6rem", fontSize:"0.72rem", fontWeight:700,
              letterSpacing:"0.12em", color:C.dim, textTransform:"uppercase" }}>My Rooms</p>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              {MY_AUCTIONS.map(room => (
                <div key={room.id}
                  onClick={() => room.status === "live" && navigate("/auction/room")}
                  style={{ display:"flex", alignItems:"center", gap:"1rem",
                    padding:"0.85rem 1.1rem",
                    background:room.status==="live" ? "rgba(192,25,44,0.07)" : "rgba(255,255,255,0.03)",
                    border:`1px solid ${room.status==="live" ? "rgba(192,25,44,0.25)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius:12,
                    cursor:room.status==="live" ? "pointer" : "default",
                    transition:"all 0.15s" }}>
                  <div style={{ width:36, height:36, borderRadius:10,
                    background:room.status==="live" ? "rgba(192,25,44,0.15)" : "rgba(255,255,255,0.06)",
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    {room.status==="live"
                      ? <Play style={{ width:15, height:15, color:ACCENT }} />
                      : <Calendar style={{ width:15, height:15, color:"rgba(255,255,255,0.3)" }} />}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontWeight:700, fontSize:"0.9rem", color:"#fff" }}>{room.name}</div>
                    <div style={{ fontSize:"0.75rem", color:"rgba(255,255,255,0.35)",
                      marginTop:"0.1rem", display:"flex", gap:"0.6rem" }}>
                      <span style={{ display:"flex", alignItems:"center", gap:"0.25rem" }}>
                        <Users style={{ width:10, height:10 }} /> {room.participants} teams
                      </span>
                      <span>Code: <b style={{ fontFamily:"monospace",
                        color:"rgba(255,255,255,0.6)" }}>{room.code}</b></span>
                      {room.status==="live" && (
                        <span style={{ color:"#22c55e", fontWeight:600 }}>
                          {room.playersLeft} players left
                        </span>
                      )}
                    </div>
                  </div>
                  {room.status==="live" && (
                    <span style={{ fontSize:"0.7rem", fontWeight:700, color:ACCENT,
                      background:"rgba(192,25,44,0.15)", padding:"3px 10px", borderRadius:20,
                      display:"flex", alignItems:"center", gap:"0.35rem" }}>
                      <div style={{ width:5, height:5, borderRadius:"50%", background:ACCENT,
                        animation:"pulse 1.4s ease-in-out infinite" }} />
                      LIVE
                    </span>
                  )}
                  {room.status==="complete" && (
                    <span style={{ fontSize:"0.7rem", color:"rgba(255,255,255,0.25)", fontWeight:600 }}>
                      Ended
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Host / Join cards */}
        <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>

          {/* HOST */}
          <div
            style={{ flex:1, minWidth:280, minHeight:360, background:C.card,
              border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"2.5rem",
              display:"flex", flexDirection:"column", gap:"1.5rem",
              position:"relative", overflow:"hidden", transition:"border-color 0.2s, box-shadow 0.2s",
              cursor:"pointer" }}
            onClick={() => navigate("/auction/create")}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor=`${ACCENT}50`; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 0 60px ${ACCENT}14`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,255,255,0.1)"; (e.currentTarget as HTMLDivElement).style.boxShadow="none"; }}>
            <div style={{ position:"absolute", top:-60, right:-60, width:260, height:260,
              borderRadius:"50%", background:`${ACCENT}08`, pointerEvents:"none" }} />
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em",
                textTransform:"uppercase", color:ACCENT, background:`${ACCENT}18`,
                border:`1px solid ${ACCENT}35`, padding:"4px 12px", borderRadius:20 }}>Host</span>
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.85rem" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${ACCENT}18`,
                border:`1px solid ${ACCENT}30`, display:"flex", alignItems:"center",
                justifyContent:"center" }}>
                <Trophy style={{ width:20, height:20, color:ACCENT }} />
              </div>
              <h2 style={{ margin:0, fontSize:"1.8rem", fontWeight:900, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1.1 }}>Host a new auction</h2>
              <p style={{ margin:0, color:"rgba(255,255,255,0.4)", fontSize:"0.9rem", lineHeight:1.7 }}>
                Create a private room, set the budget and squad size, share the code, and run the auction live with friends.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {["Choose format: Classic or Tier-Based",
                  "Set budget, squad size, C/VC rules",
                  "252 IPL 2026 players in pool",
                  "Real-time verbal auction host controls"].map(t => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:"0.5rem",
                    color:"rgba(255,255,255,0.38)", fontSize:"0.83rem" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%",
                      background:`${ACCENT}80`, flexShrink:0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <button
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.55rem",
                padding:"1rem 1.8rem", background:ACCENT, border:"none", borderRadius:14,
                color:"#fff", fontWeight:800, fontSize:"0.95rem", cursor:"pointer" }}>
              <Plus style={{ width:17, height:17 }} /> Create Auction Room
            </button>
          </div>

          {/* JOIN */}
          <div
            style={{ flex:1, minWidth:280, minHeight:360, background:C.card,
              border:"1px solid rgba(255,255,255,0.1)", borderRadius:24, padding:"2.5rem",
              display:"flex", flexDirection:"column", gap:"1.5rem",
              position:"relative", overflow:"hidden", transition:"border-color 0.2s, box-shadow 0.2s",
              cursor:"pointer" }}
            onClick={() => navigate("/auction/join")}
            onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor=`${INDIGO}50`; (e.currentTarget as HTMLDivElement).style.boxShadow=`0 0 60px ${INDIGO}14`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor="rgba(255,255,255,0.1)"; (e.currentTarget as HTMLDivElement).style.boxShadow="none"; }}>
            <div style={{ position:"absolute", top:-60, right:-60, width:260, height:260,
              borderRadius:"50%", background:`${INDIGO}08`, pointerEvents:"none" }} />
            <div style={{ display:"flex", justifyContent:"flex-end" }}>
              <span style={{ fontSize:"0.68rem", fontWeight:700, letterSpacing:"0.12em",
                textTransform:"uppercase", color:INDIGO, background:`${INDIGO}18`,
                border:`1px solid ${INDIGO}35`, padding:"4px 12px", borderRadius:20 }}>Join</span>
            </div>
            <div style={{ flex:1, display:"flex", flexDirection:"column", gap:"0.85rem" }}>
              <div style={{ width:44, height:44, borderRadius:12, background:`${INDIGO}18`,
                border:`1px solid ${INDIGO}30`, display:"flex", alignItems:"center",
                justifyContent:"center" }}>
                <Hash style={{ width:20, height:20, color:INDIGO }} />
              </div>
              <h2 style={{ margin:0, fontSize:"1.8rem", fontWeight:900, color:"#fff",
                letterSpacing:"-0.03em", lineHeight:1.1 }}>Join with a code</h2>
              <p style={{ margin:0, color:"rgba(255,255,255,0.4)", fontSize:"0.9rem", lineHeight:1.7 }}>
                Have an invite code from a friend? Enter it to join their lobby, set your team name, and get ready to bid.
              </p>
              <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
                {["Enter 6–8 character invite code",
                  "Preview room settings before joining",
                  "Set your team name in the lobby",
                  "Wait for host to start — then bid!"].map(t => (
                  <div key={t} style={{ display:"flex", alignItems:"center", gap:"0.5rem",
                    color:"rgba(255,255,255,0.38)", fontSize:"0.83rem" }}>
                    <div style={{ width:5, height:5, borderRadius:"50%",
                      background:`${INDIGO}80`, flexShrink:0 }} />
                    {t}
                  </div>
                ))}
              </div>
            </div>
            <button
              style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:"0.55rem",
                padding:"1rem 1.8rem", background:INDIGO,
                border:`1.5px solid ${INDIGO}`, borderRadius:14,
                color:"#fff", fontWeight:800, fontSize:"0.95rem", cursor:"pointer" }}>
              <span>Enter Auction</span><ArrowRight style={{ width:17, height:17 }} />
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
    </Layout>
  );
}
