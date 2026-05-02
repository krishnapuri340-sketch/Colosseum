import React, { useState } from 'react';
import { Menu, Home, Trophy, Users, Activity, Bell, ChevronRight, TrendingUp, CircleDollarSign, ArrowUpRight, Clock, Star } from 'lucide-react';

export function PremiumDashboard() {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div 
      className="flex h-screen overflow-hidden font-sans antialiased text-white"
      style={{ backgroundColor: '#0c0f1a' }}
    >
      {/* Sidebar */}
      <aside 
        className={`flex flex-col border-r border-white/5 transition-all duration-300 ${sidebarExpanded ? 'w-64' : 'w-16'}`}
        style={{ backgroundColor: '#0a0d1a' }}
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
      >
        <div className="h-16 flex items-center justify-center border-b border-white/5">
          <Menu className="w-5 h-5 text-white/50" />
        </div>
        
        <nav className="flex-1 py-4 flex flex-col gap-2 px-2">
          {[
            { icon: Home, label: 'Dashboard', active: true },
            { icon: Trophy, label: 'My Squads' },
            { icon: Users, label: 'Leaderboard' },
            { icon: Activity, label: 'Live Auction' },
          ].map((item, i) => (
            <button 
              key={i}
              className={`flex items-center p-3 rounded transition-colors group relative overflow-hidden ${item.active ? 'bg-[#c0192c]' : 'hover:bg-white/5'}`}
            >
              {item.active && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/20" />
              )}
              <item.icon className={`w-5 h-5 shrink-0 ${item.active ? 'text-white' : 'text-white/30 group-hover:text-white/70'}`} />
              <span className={`ml-4 text-sm font-semibold tracking-wide whitespace-nowrap transition-opacity duration-300 ${sidebarExpanded ? 'opacity-100' : 'opacity-0'} ${item.active ? 'text-white' : 'text-white/50'}`}>
                {item.label}
              </span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-white/5 flex items-center justify-between px-8" style={{ backgroundColor: '#0c0f1a' }}>
          <div className="flex items-baseline gap-3">
            <h1 className="text-xl font-black tracking-widest font-mono text-white">COLOSSEUM</h1>
            <span className="text-[10px] font-bold tracking-[0.2em] text-[#c0192c] uppercase">IPL 2026</span>
          </div>
          <button className="relative p-2 text-white/50 hover:text-white transition-colors rounded-full hover:bg-white/5">
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-[#c0192c] rounded-full border-2 border-[#0c0f1a]"></span>
          </button>
        </header>

        {/* Scrollable Area */}
        <main className="flex-1 overflow-y-auto p-8 space-y-8" style={{ minHeight: '100vh' }}>
          
          {/* Top Bento Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hero Card */}
            <div className="lg:col-span-2 rounded bg-[#131722] border border-white/10 p-8 relative overflow-hidden shadow-2xl flex flex-col justify-between">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#c0192c] opacity-5 blur-[100px] rounded-full pointer-events-none" />
              
              <div className="flex justify-between items-start mb-12">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#c0192c] animate-pulse" />
                  <span className="text-[10px] tracking-[0.2em] font-bold text-[#c0192c] uppercase">LIVE MATCH</span>
                </div>
                <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-mono">T20 • Wankhede</div>
              </div>

              <div>
                <div className="flex items-end gap-6 mb-2">
                  <h2 className="text-6xl font-black text-white tracking-tighter">187<span className="text-white/40">/4</span></h2>
                  <div className="text-sm font-bold text-white/60 mb-2 uppercase tracking-widest font-mono">18.2 OV</div>
                </div>
                <div className="flex items-center gap-4 text-xl font-bold uppercase tracking-widest text-white/80">
                  <span className="text-white">MI</span>
                  <span className="text-white/20 text-sm">VS</span>
                  <span>CSK</span>
                </div>
              </div>
            </div>

            {/* Stat Cards Column */}
            <div className="flex flex-col gap-4">
              {[
                { label: 'Global Rank', value: '#3', icon: TrendingUp, color: 'text-white' },
                { label: 'Total Points', value: '1,847', icon: Star, color: 'text-white' },
                { label: 'Purse Balance', value: '₹84Cr', icon: CircleDollarSign, color: 'text-emerald-400' }
              ].map((stat, i) => (
                <div key={i} className="flex-1 bg-[#131722] border border-white/10 rounded p-5 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-2">{stat.label}</div>
                    <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  </div>
                  <stat.icon className="w-6 h-6 text-white/10" />
                </div>
              ))}
            </div>
          </div>

          {/* Section: Your Squads & Leaderboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Squads */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b-2 border-[#c0192c] pb-1 inline-block">YOUR SQUADS</h3>
              </div>
              
              <div className="space-y-3">
                {[
                  { name: 'Alpha Strike', pts: '842', rank: '1', form: 'W W L W' },
                  { name: 'Mumbai Kings', pts: '756', rank: '4', form: 'W L W L' },
                ].map((squad, i) => (
                  <div key={i} className="bg-[#131722] border border-white/10 p-5 rounded flex items-center justify-between group hover:border-white/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded bg-white/5 flex items-center justify-center text-lg font-black text-white/80 font-mono border border-white/10 group-hover:border-white/30 transition-colors">
                        #{squad.rank}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg">{squad.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] tracking-[0.1em] text-white/40 uppercase font-mono">{squad.form}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <div className="text-2xl font-black text-white">{squad.pts} <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase">PTS</span></div>
                      
                      {/* Comp Bar */}
                      <div className="flex gap-1 mt-2 w-32 h-1.5 rounded-full overflow-hidden bg-white/5">
                        <div className="w-[40%] bg-blue-500/80" />
                        <div className="w-[30%] bg-emerald-500/80" />
                        <div className="w-[20%] bg-purple-500/80" />
                        <div className="w-[10%] bg-orange-500/80" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard Table */}
            <div className="lg:col-span-5 space-y-4">
               <div className="flex items-center gap-4 mb-6">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white border-b-2 border-[#c0192c] pb-1 inline-block">GLOBAL TOP 5</h3>
              </div>

              <div className="bg-[#131722] border border-white/10 rounded overflow-hidden">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white/5 text-[10px] tracking-[0.2em] text-white/40 uppercase">
                      <th className="p-3 font-semibold w-12 text-center">RK</th>
                      <th className="p-3 font-semibold">MANAGER</th>
                      <th className="p-3 font-semibold text-right">POINTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { rk: 1, name: 'VikramS', pts: 1984 },
                      { rk: 2, name: 'CricketGod99', pts: 1890 },
                      { rk: 3, name: 'You', pts: 1847, highlight: true },
                      { rk: 4, name: 'RohitFan', pts: 1812 },
                      { rk: 5, name: 'KingKohli', pts: 1795 },
                    ].map((user, i) => (
                      <tr key={i} className={`border-b border-white/5 last:border-0 ${user.highlight ? 'bg-[#c0192c]/10' : 'even:bg-white/[0.02]'}`}>
                        <td className={`p-3 text-center font-mono font-bold ${user.highlight ? 'text-[#c0192c]' : 'text-white/60'}`}>{user.rk}</td>
                        <td className={`p-3 font-bold ${user.highlight ? 'text-white' : 'text-white/80'}`}>
                          {user.name}
                          {user.highlight && <span className="ml-2 text-[8px] bg-[#c0192c] text-white px-1.5 py-0.5 rounded tracking-widest">YOU</span>}
                        </td>
                        <td className="p-3 text-right font-mono text-white/90">{user.pts.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Top Picks Row */}
          <div className="space-y-6 pt-4">
             <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-white">AUCTION WATCHLIST</h3>
              <button className="text-[10px] tracking-[0.2em] text-[#c0192c] hover:text-white uppercase font-bold flex items-center gap-1 transition-colors">
                View All <ChevronRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Suryakumar Y.', team: 'MI', role: 'BAT', price: '₹16.5Cr', avg: '84.2' },
                { name: 'Jasprit B.', team: 'MI', role: 'BOWL', price: '₹18.0Cr', avg: '92.5' },
                { name: 'Hardik P.', team: 'MI', role: 'AR', price: '₹15.0Cr', avg: '76.8' },
              ].map((player, i) => (
                <div key={i} className="bg-[#131722] border border-white/10 rounded p-6 group hover:border-[#c0192c]/50 transition-colors flex flex-col justify-between">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">{player.team}</div>
                      <h4 className="text-xl font-bold text-white group-hover:text-[#c0192c] transition-colors">{player.name}</h4>
                    </div>
                    <span className="text-[9px] font-bold tracking-widest border border-white/20 px-2 py-1 rounded text-white/60 bg-white/5">{player.role}</span>
                  </div>
                  
                  <div className="flex items-end justify-between border-t border-white/10 pt-4 mt-auto">
                    <div>
                      <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">AVG PTS</div>
                      <div className="text-lg font-mono font-bold text-white/90">{player.avg}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] tracking-[0.2em] text-white/40 uppercase mb-1">BASE PRICE</div>
                      <div className="text-lg font-mono font-bold text-emerald-400">{player.price}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Activity Strip */}
          <div className="pt-8 pb-12">
            <div className="bg-[#131722] border-y border-white/10 py-3 overflow-hidden flex items-center relative">
              <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-[#131722] to-transparent z-10" />
              <div className="flex items-center gap-8 px-8 whitespace-nowrap animate-[scroll_20s_linear_infinite]">
                {[...Array(6)].map((_, i) => (
                  <React.Fragment key={i}>
                    <div className="flex items-center gap-3">
                      <Clock className="w-3 h-3 text-[#c0192c]" />
                      <span className="text-xs font-mono text-white/60"><span className="text-white font-bold">VikramS</span> bought <span className="text-white font-bold">R. Sharma</span> for <span className="text-emerald-400">₹14Cr</span></span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
                  </React.Fragment>
                ))}
              </div>
              <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-[#131722] to-transparent z-10" />
            </div>
          </div>

        </main>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}} />
    </div>
  );
}

export default PremiumDashboard;
