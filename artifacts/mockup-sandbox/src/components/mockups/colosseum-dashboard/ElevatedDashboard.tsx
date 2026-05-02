import React, { useState } from "react";
import { 
  Trophy, 
  Wallet, 
  Users, 
  TrendingUp, 
  Clock, 
  ChevronRight, 
  Menu, 
  Bell, 
  Search,
  Activity,
  ChevronDown,
  Swords,
  ChevronLeft,
  Flame,
  Award
} from "lucide-react";

export function ElevatedDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const glassClass = "bg-white/[0.04] border border-white/[0.07] backdrop-blur-xl rounded-2xl";
  
  return (
    <div 
      className="flex min-h-[100vh] w-full text-white" 
      style={{ 
        backgroundColor: "#070b18",
        fontFamily: "'Nunito', sans-serif",
        overflowY: "auto"
      }}
    >
      {/* Sidebar */}
      <aside 
        className={`flex flex-col border-r border-white/[0.05] bg-[#070b18]/80 backdrop-blur-2xl transition-all duration-300 z-20 ${
          sidebarExpanded ? "w-64" : "w-20 items-center"
        }`}
      >
        <div className={`flex items-center h-20 ${sidebarExpanded ? "px-6 justify-between" : "justify-center"}`}>
          {sidebarExpanded && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-[#c0192c] to-red-900">
                <Trophy size={16} className="text-white" />
              </div>
              <span className="font-black text-xl tracking-tight">COLOSSEUM</span>
            </div>
          )}
          {!sidebarExpanded && (
            <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-[#c0192c] to-red-900 cursor-pointer" onClick={() => setSidebarExpanded(true)}>
              <Trophy size={20} className="text-white" />
            </div>
          )}
          {sidebarExpanded && (
            <button onClick={() => setSidebarExpanded(false)} className="text-white/40 hover:text-white transition-colors">
              <ChevronLeft size={20} />
            </button>
          )}
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-2 px-4">
          {[
            { icon: Activity, label: "Dashboard", active: true },
            { icon: Swords, label: "Matches" },
            { icon: Users, label: "My Teams" },
            { icon: Trophy, label: "Leaderboard" },
            { icon: Wallet, label: "Auction" },
          ].map((item, i) => (
            <button 
              key={i}
              className={`flex items-center ${sidebarExpanded ? "px-4" : "justify-center px-0 w-12 mx-auto"} py-3 rounded-xl transition-all duration-200 group ${
                item.active 
                  ? "bg-gradient-to-r from-[#c0192c]/20 to-transparent border border-[#c0192c]/30 text-white" 
                  : "text-white/40 hover:bg-white/[0.03] hover:text-white"
              }`}
            >
              <item.icon size={20} className={item.active ? "text-[#c0192c]" : "group-hover:text-white/80 transition-colors"} />
              {sidebarExpanded && (
                <span className={`ml-4 font-bold ${item.active ? "" : "font-semibold"}`}>{item.label}</span>
              )}
              {sidebarExpanded && item.active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#c0192c] shadow-[0_0_10px_rgba(192,25,44,0.8)]" />
              )}
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-white/[0.05]">
          <div className={`flex items-center ${sidebarExpanded ? "px-2" : "justify-center"} py-2`}>
            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20 shrink-0">
              <img src="https://api.dicebear.com/7.x/notionists/svg?seed=Arjun&backgroundColor=070b18" alt="Profile" className="w-full h-full object-cover opacity-80 mix-blend-screen" />
            </div>
            {sidebarExpanded && (
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="font-bold text-sm truncate">Arjun Sharma</div>
                <div className="text-xs text-white/40 font-mono">@arj_2026</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Decorative background glow */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#c0192c]/10 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Header */}
        <header className="h-20 px-8 flex items-center justify-between border-b border-white/[0.05] z-10 shrink-0">
          <div className="flex items-center gap-4 w-96">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={18} />
              <input 
                type="text" 
                placeholder="Search players, teams, matches..." 
                className="w-full bg-white/[0.03] border border-white/[0.05] rounded-full py-2.5 pl-11 pr-4 text-sm font-semibold focus:outline-none focus:border-[#c0192c]/50 transition-colors text-white placeholder:text-white/30"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="px-4 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#c0192c] animate-pulse" />
              <span className="text-xs font-bold tracking-widest uppercase text-white/60">Live Auction</span>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center relative hover:bg-white/[0.06] transition-colors">
              <Bell size={18} className="text-white/70" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#c0192c] border-2 border-[#070b18]" />
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 z-10 relative">
          <div className="max-w-6xl mx-auto space-y-8 pb-20">
            
            {/* Hero Strip */}
            <section className="relative overflow-hidden rounded-3xl p-8 border border-white/[0.08] bg-gradient-to-r from-white/[0.05] to-transparent">
              <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#c0192c]/10 to-transparent pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                    Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Arjun</span>
                  </h1>
                  <p className="text-white/50 font-semibold text-lg max-w-xl">
                    Your fantasy squad is performing 12% better than yesterday. You have 3 players in action today.
                  </p>
                </div>
                
                <div className="flex items-center gap-4 shrink-0 bg-[#070b18]/50 p-2 pl-4 rounded-2xl border border-white/10 backdrop-blur-md">
                  <div>
                    <div className="text-[10px] font-bold tracking-widest text-white/40 uppercase mb-1">Active Auction In</div>
                    <div className="font-mono text-xl text-[#c0192c] font-bold tracking-tight">02:14:45</div>
                  </div>
                  <button className="bg-[#c0192c] hover:bg-red-700 text-white px-5 py-3 rounded-xl font-bold transition-all shadow-[0_0_20px_rgba(192,25,44,0.3)] hover:shadow-[0_0_30px_rgba(192,25,44,0.5)]">
                    Enter Room
                  </button>
                </div>
              </div>
            </section>

            {/* Quick Stats Bento */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Global Rank", value: "#3", trend: "+2", icon: Trophy, color: "text-amber-400" },
                { label: "Total Points", value: "1,847", trend: "+124", icon: Award, color: "text-emerald-400" },
                { label: "Active Teams", value: "3", trend: "Maxed", icon: Users, color: "text-blue-400", neutral: true },
                { label: "Purse Balance", value: "₹84Cr", trend: "-₹2.4Cr", icon: Wallet, color: "text-[#c0192c]" },
              ].map((stat, i) => (
                <div key={i} className={`${glassClass} p-5 flex flex-col hover:bg-white/[0.06] transition-colors cursor-default`}>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-xs font-bold tracking-widest text-white/40 uppercase">{stat.label}</span>
                    <div className={`p-2 rounded-lg bg-white/[0.03] ${stat.color}`}>
                      <stat.icon size={16} />
                    </div>
                  </div>
                  <div className="flex items-end justify-between mt-auto">
                    <span className="text-3xl font-mono font-bold">{stat.value}</span>
                    <div className={`flex items-center text-xs font-bold ${stat.neutral ? 'text-white/40' : stat.trend.startsWith('+') ? 'text-emerald-400' : 'text-[#c0192c]'}`}>
                      {!stat.neutral && (
                        stat.trend.startsWith('+') ? <TrendingUp size={12} className="mr-1" /> : <TrendingUp size={12} className="mr-1 rotate-180" />
                      )}
                      {stat.trend}
                    </div>
                  </div>
                </div>
              ))}
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (Live + Upcoming) */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Live Match Card */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#c0192c] animate-pulse" />
                      LIVE MATCH
                    </h2>
                    <button className="text-xs font-bold tracking-widest text-white/40 uppercase hover:text-white flex items-center">
                      View Center <ChevronRight size={14} />
                    </button>
                  </div>
                  
                  <div className={`${glassClass} p-6 relative overflow-hidden group`}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none" />
                    
                    <div className="flex items-center justify-between relative z-10">
                      {/* Team 1 */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-blue-900/40 border-2 border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                          <span className="font-black text-xl text-blue-400">MI</span>
                        </div>
                        <div className="text-center">
                          <div className="font-mono text-2xl font-bold">184/4</div>
                          <div className="text-xs text-white/40 font-bold uppercase tracking-widest">18.2 Overs</div>
                        </div>
                      </div>

                      {/* VS & Status */}
                      <div className="flex flex-col items-center">
                        <div className="px-3 py-1 bg-[#c0192c]/20 border border-[#c0192c]/30 rounded-full text-[10px] font-bold text-[#c0192c] tracking-widest uppercase mb-4">
                          Innings 1
                        </div>
                        <Swords size={24} className="text-white/20 mb-4" />
                        <div className="text-sm font-semibold text-white/60">Required: --</div>
                      </div>

                      {/* Team 2 */}
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 rounded-full bg-yellow-900/40 border-2 border-yellow-500/30 flex items-center justify-center opacity-60">
                          <span className="font-black text-xl text-yellow-400">CSK</span>
                        </div>
                        <div className="text-center opacity-60">
                          <div className="font-mono text-2xl font-bold">Yet to bat</div>
                          <div className="text-xs text-white/40 font-bold uppercase tracking-widest">0.0 Overs</div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/[0.05] relative z-10 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold tracking-widest text-white/40 uppercase mb-2">Your Fantasy Impact</div>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            <div className="w-8 h-8 rounded-full border border-white/20 bg-blue-900 flex items-center justify-center text-xs font-bold">JB</div>
                            <div className="w-8 h-8 rounded-full border border-white/20 bg-blue-900 flex items-center justify-center text-xs font-bold">RS</div>
                          </div>
                          <span className="text-sm font-semibold"><span className="text-emerald-400 font-mono font-bold">+84</span> pts earned so far</span>
                        </div>
                      </div>
                      <button className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                        Track Squad
                      </button>
                    </div>
                  </div>
                </div>

                {/* Upcoming */}
                <div>
                  <h2 className="text-lg font-black tracking-tight mb-4 uppercase text-white/80">Upcoming Clashes</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { t1: "RCB", t1c: "bg-red-600", t2: "KKR", t2c: "bg-purple-800", time: "Tomorrow, 19:30", hasPicks: false },
                      { t1: "DC", t1c: "bg-blue-600", t2: "GT", t2c: "bg-teal-700", time: "Fri 12 Apr, 19:30", hasPicks: true },
                    ].map((match, i) => (
                      <div key={i} className={`${glassClass} p-4 flex items-center justify-between hover:border-white/20 transition-colors cursor-pointer`}>
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-1">
                            <div className={`w-6 h-6 rounded-md ${match.t1c} flex items-center justify-center shadow-lg border border-white/10`} />
                            <div className={`w-6 h-6 rounded-md ${match.t2c} flex items-center justify-center shadow-lg border border-white/10`} />
                          </div>
                          <div>
                            <div className="font-bold text-sm">{match.t1} vs {match.t2}</div>
                            <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5"><Clock size={10} className="inline mr-1" />{match.time}</div>
                          </div>
                        </div>
                        {match.hasPicks ? (
                          <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                            <span className="text-xs font-mono font-bold text-emerald-400">11</span>
                          </div>
                        ) : (
                          <button className="text-xs bg-[#c0192c]/20 text-[#c0192c] px-3 py-1.5 rounded-lg font-bold hover:bg-[#c0192c]/40 transition-colors">
                            Pick Team
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column (Performers) */}
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                    <Flame className="text-orange-500" size={18} />
                    HOT PICKS
                  </h2>
                </div>
                
                <div className={`${glassClass} p-1 h-[calc(100%-3rem)] flex flex-col gap-1`}>
                  {[
                    { name: "S. Yadav", role: "BAT", team: "MI", points: 142, price: "12Cr", trend: "+14%" },
                    { name: "R. Khan", role: "BOWL", team: "GT", points: 128, price: "14Cr", trend: "+8%" },
                    { name: "H. Pandya", role: "ALL", team: "MI", points: 115, price: "15Cr", trend: "-2%" },
                    { name: "V. Kohli", role: "BAT", team: "RCB", points: 104, price: "16Cr", trend: "+5%" },
                    { name: "J. Bumrah", role: "BOWL", team: "MI", points: 98, price: "14Cr", trend: "+11%" },
                  ].map((player, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl hover:bg-white/[0.04] transition-colors group cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                          <img src={`https://api.dicebear.com/7.x/notionists/svg?seed=${player.name}&backgroundColor=transparent`} className="w-8 h-8 opacity-70" alt={player.name} />
                        </div>
                        <div>
                          <div className="font-bold text-sm group-hover:text-[#c0192c] transition-colors">{player.name}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[9px] font-bold tracking-widest text-white/40 uppercase bg-white/5 px-1.5 py-0.5 rounded">{player.role}</span>
                            <span className="text-[10px] text-white/50">{player.team}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-sm">{player.points} <span className="text-xs text-white/30">pts</span></div>
                        <div className={`text-[10px] font-bold mt-0.5 ${player.trend.startsWith('+') ? 'text-emerald-400' : 'text-red-400'}`}>
                          {player.price} • {player.trend}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <button className="mt-auto m-2 py-3 border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] rounded-xl text-xs font-bold tracking-widest text-white/60 uppercase transition-colors">
                    View Full Market
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ElevatedDashboard;
