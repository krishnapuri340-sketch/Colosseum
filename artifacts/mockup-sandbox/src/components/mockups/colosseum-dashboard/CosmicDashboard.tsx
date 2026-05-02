import React, { useState, useEffect } from 'react';
import { 
  Rocket, Satellite, Globe, Zap, Crosshair, Cpu, 
  Terminal, ShieldAlert, Wifi, Activity, BarChart2,
  Menu, Bell, Settings, Search, ChevronRight
} from 'lucide-react';

const TEAM_COLORS: Record<string, string> = {
  MI: '#004BA0',
  CSK: '#FFFF3C',
  RCB: '#EC1C24',
  KKR: '#3A225D',
  SRH: '#FF822A',
  DC: '#17479E',
  PBKS: '#ED1B24',
  GT: '#1B2133',
  LSG: '#0057E2',
  RR: '#EA1A85'
};

const STAR_FIELD = Array.from({ length: 60 }).map(() => ({
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: Math.random() * 2 + 1,
  opacity: Math.random() * 0.8 + 0.2,
  delay: Math.random() * 5
}));

export function CosmicDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div 
      className="flex h-screen w-full font-sans text-slate-300 overflow-hidden"
      style={{ 
        backgroundColor: '#030508',
        backgroundImage: 'radial-gradient(circle at 50% 0%, #1a0b2e 0%, #030508 60%)',
        minHeight: '100vh',
        overflowY: 'auto'
      }}
    >
      {/* Star Field Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {STAR_FIELD.map((star, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px rgba(255,255,255,0.8)`,
              animation: `pulse ${3 + star.delay}s infinite alternate`
            }}
          />
        ))}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Nunito:wght@300;400;600;700;900&display=swap');
        @keyframes pulse { 0% { opacity: 0.2; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1.2); } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes radar { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .font-sans { font-family: 'Nunito', sans-serif; }
        .hud-border { border: 1px solid rgba(139, 92, 246, 0.3); box-shadow: 0 0 15px rgba(139, 92, 246, 0.1), inset 0 0 20px rgba(139, 92, 246, 0.05); }
        .crimson-glow { text-shadow: 0 0 10px rgba(192, 25, 44, 0.8); }
        .purple-glow { text-shadow: 0 0 10px rgba(139, 92, 246, 0.8); }
        .glass-panel { background: rgba(17, 12, 34, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(139, 92, 246, 0.2); }
        
        /* Custom scrollbar */
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: rgba(0,0,0,0.3); }
        ::-webkit-scrollbar-thumb { background: rgba(139, 92, 246, 0.4); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(192, 25, 44, 0.6); }
      `}} />

      {/* Sidebar */}
      <aside 
        className={`relative z-20 flex flex-col transition-all duration-300 ease-in-out border-r border-purple-500/20 glass-panel
          ${sidebarOpen ? 'w-64' : 'w-20'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-crimson-600 flex items-center justify-center shadow-[0_0_15px_rgba(192,25,44,0.5)]">
                <Zap size={18} className="text-white" />
              </div>
              <span className="font-black tracking-widest text-white text-lg">COLOSSEUM</span>
            </div>
          )}
          {!sidebarOpen && (
            <div className="w-8 h-8 mx-auto rounded-full bg-gradient-to-br from-purple-600 to-crimson-600 flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {[
            { icon: Activity, label: 'COMMAND', active: true },
            { icon: Crosshair, label: 'AUCTION' },
            { icon: Globe, label: 'GALAXY' },
            { icon: Satellite, label: 'TEAMS' },
            { icon: Terminal, label: 'LOGS' },
          ].map((item, i) => (
            <button
              key={i}
              className={`w-full flex items-center gap-4 px-3 py-3 rounded-lg transition-all
                ${item.active 
                  ? 'bg-purple-900/40 border border-purple-500/40 shadow-[0_0_15px_rgba(139,92,246,0.2)] text-white' 
                  : 'hover:bg-white/5 text-slate-400 hover:text-purple-300'
                }
              `}
            >
              <item.icon size={20} className={item.active ? 'text-purple-400' : ''} />
              {sidebarOpen && <span className="font-bold tracking-wider text-sm">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-purple-500/20">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex justify-center p-2 rounded hover:bg-white/5 text-slate-400"
          >
            <Menu size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        
        {/* Header */}
        <header className="h-16 border-b border-purple-500/20 glass-panel flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-900/20">
              <div className="w-2 h-2 rounded-full bg-[#c0192c] animate-pulse" style={{ boxShadow: '0 0 8px #c0192c' }} />
              <span className="font-mono text-xs text-purple-200 tracking-widest">SYSTEM ONLINE</span>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="font-mono text-sm tracking-wider text-purple-300">
              {currentTime.toUTCString().split(' ')[4]} UTC
            </div>
            <div className="flex gap-4 border-l border-purple-500/30 pl-6">
              <button className="relative text-slate-400 hover:text-white transition-colors">
                <Bell size={20} />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#c0192c] shadow-[0_0_8px_#c0192c]"></span>
              </button>
              <button className="text-slate-400 hover:text-white transition-colors">
                <Settings size={20} />
              </button>
              <div className="w-8 h-8 rounded-full border border-purple-500/50 bg-purple-900/50 flex items-center justify-center">
                <span className="font-black text-xs text-purple-200">OP</span>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
          
          {/* Hero Banner */}
          <div className="relative rounded-xl overflow-hidden border border-[#c0192c]/30 shadow-[0_0_30px_rgba(192,25,44,0.15)] bg-gradient-to-r from-[#11081a] via-[#1a0a20] to-[#0a0410]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-[#c0192c]/20 to-transparent blur-xl"></div>
            
            <div className="relative z-10 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <h2 className="font-mono text-purple-400 text-sm tracking-[0.3em] mb-2">INITIALIZING</h2>
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-2" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                  MISSION CONTROL
                </h1>
                <p className="text-slate-400 max-w-lg font-mono text-sm">
                  Uplink established. Fantasy trajectory nominal. Monitoring 10 entities in the IPL sector.
                </p>
              </div>
              
              <div className="flex flex-col items-end">
                <div className="px-4 py-2 rounded border border-[#c0192c]/50 bg-[#c0192c]/10 text-[#c0192c] font-mono text-xl font-bold tracking-widest shadow-[inset_0_0_15px_rgba(192,25,44,0.2)]">
                  T-MINUS 14:22:09
                </div>
                <div className="mt-2 text-xs font-mono text-slate-500 tracking-widest">UNTIL MEGA AUCTION</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Live Match Radar */}
            <div className="lg:col-span-2 hud-border rounded-xl bg-indigo-950/20 p-6 relative overflow-hidden flex flex-col">
              <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
              
              <div className="flex justify-between items-center mb-8 relative z-10">
                <div className="flex items-center gap-3">
                  <Activity size={24} className="text-[#c0192c]" />
                  <h3 className="font-bold tracking-widest text-lg text-white">LIVE TELEMETRY</h3>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 rounded text-[10px] font-mono border border-[#c0192c]/50 text-[#c0192c] bg-[#c0192c]/10 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#c0192c] animate-pulse"></span>
                    IN PROGRESS
                  </span>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-center relative z-10">
                <div className="flex justify-between items-center px-4 md:px-12">
                  <div className="text-center">
                    <div className="text-5xl md:text-7xl font-black font-mono tracking-tighter text-blue-400" style={{ textShadow: '0 0 30px rgba(96,165,250,0.5)' }}>MI</div>
                    <div className="text-2xl md:text-3xl font-mono text-white mt-2">184/4</div>
                    <div className="text-sm font-mono text-slate-400 mt-1">18.2 OV</div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-full border border-purple-500/30 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-t-2 border-[#c0192c] animate-[radar_2s_linear_infinite]"></div>
                      <span className="font-mono text-xs text-purple-300">VS</span>
                    </div>
                    <div className="mt-4 px-3 py-1 bg-white/5 rounded border border-white/10 font-mono text-xs text-slate-300">CRR: 10.1</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-5xl md:text-7xl font-black font-mono tracking-tighter text-yellow-400" style={{ textShadow: '0 0 30px rgba(250,204,21,0.5)' }}>CSK</div>
                    <div className="text-2xl md:text-3xl font-mono text-slate-500 mt-2">YTB</div>
                    <div className="text-sm font-mono text-slate-500 mt-1">-- OV</div>
                  </div>
                </div>

                <div className="mt-12 w-full h-1 bg-white/5 rounded-full relative">
                  <div className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-[#c0192c] rounded-full" style={{ width: '65%', boxShadow: '0 0 10px rgba(192,25,44,0.5)' }}></div>
                  <div className="absolute top-1/2 left-[65%] -translate-y-1/2 -translate-x-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"></div>
                </div>
                <div className="flex justify-between mt-2 text-[10px] font-mono text-slate-500">
                  <span>INNINGS 1</span>
                  <span>PROJECTED: 205</span>
                </div>
              </div>
            </div>

            {/* Galaxy Standings */}
            <div className="hud-border rounded-xl bg-indigo-950/20 p-6 relative overflow-hidden flex flex-col items-center">
              <h3 className="font-bold tracking-widest text-sm text-purple-300 w-full text-center mb-8 border-b border-purple-500/20 pb-4">ORBITAL STANDINGS</h3>
              
              <div className="relative w-48 h-48 my-auto">
                <div className="absolute inset-0 rounded-full border border-purple-500/20"></div>
                <div className="absolute inset-4 rounded-full border border-purple-500/10"></div>
                <div className="absolute inset-8 rounded-full border border-purple-500/5"></div>
                
                {/* Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-purple-600 shadow-[0_0_20px_#9333ea]"></div>
                
                {Object.entries(TEAM_COLORS).map(([team, color], i) => {
                  const angle = (i * 36) * (Math.PI / 180);
                  const radius = 90 + Math.random() * 20 - 10;
                  const x = Math.cos(angle) * radius;
                  const y = Math.sin(angle) * radius;
                  const size = 12 + Math.random() * 8;
                  
                  return (
                    <div 
                      key={team}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                      style={{ transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))` }}
                    >
                      <div 
                        className="rounded-full border border-white/50 transition-transform group-hover:scale-150"
                        style={{ 
                          width: `${size}px`, 
                          height: `${size}px`, 
                          backgroundColor: color,
                          boxShadow: `0 0 10px ${color}`
                        }}
                      ></div>
                      <span className="absolute top-full left-1/2 -translate-x-1/2 mt-1 text-[10px] font-mono opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-1 rounded">
                        {team}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Squad Modules */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex justify-between items-end border-b border-purple-500/20 pb-2">
                <h3 className="font-bold tracking-widest text-lg text-white">SQUAD MODULES</h3>
                <button className="text-xs font-mono text-purple-400 hover:text-white flex items-center gap-1">
                  VIEW ALL <ChevronRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { name: 'STARCRUISER XI', points: 12450, rank: 1, trend: '+450' },
                  { name: 'NEBULA KNIGHTS', points: 11820, rank: 4, trend: '-120' }
                ].map((squad, i) => (
                  <div key={i} className="hud-border rounded-lg bg-black/40 p-5 group hover:bg-purple-900/10 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="text-[10px] font-mono text-slate-500 mb-1">MODULE 0{i+1}</div>
                        <h4 className="font-black tracking-wider text-purple-100">{squad.name}</h4>
                      </div>
                      <div className="w-8 h-8 rounded border border-purple-500/30 flex items-center justify-center font-mono text-xs text-purple-300">
                        #{squad.rank}
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <div className="text-3xl font-mono text-white tracking-tight group-hover:text-purple-300 transition-colors">
                          {squad.points.toLocaleString()}
                        </div>
                        <div className="text-xs font-mono text-slate-500">TOTAL PTS</div>
                      </div>
                      <div className={`font-mono text-sm ${squad.trend.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
                        {squad.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Terminal Log */}
            <div className="hud-border rounded-xl bg-[#050510] p-0 relative overflow-hidden flex flex-col h-[300px]">
              <div className="bg-purple-900/20 px-4 py-2 border-b border-purple-500/20 flex items-center gap-2">
                <Terminal size={14} className="text-purple-400" />
                <span className="font-mono text-xs text-purple-300 tracking-widest">SYS.LOG</span>
              </div>
              <div className="p-4 overflow-y-auto font-mono text-[11px] text-slate-400 space-y-2 flex-1 relative">
                <div className="absolute top-0 left-0 w-full h-[20px] bg-gradient-to-b from-[#050510] to-transparent pointer-events-none z-10"></div>
                
                <div className="flex gap-4">
                  <span className="text-purple-500/50">14:22:01</span>
                  <span className="text-green-400">SUCCESS: Link established with Auction Node Alpha.</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-purple-500/50">14:21:45</span>
                  <span className="text-slate-300">INFO: User 'OP' accessed dashboard.</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-purple-500/50">14:15:22</span>
                  <span className="text-[#c0192c]">WARN: Unspent budget detected in Module 02.</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-purple-500/50">14:10:05</span>
                  <span className="text-slate-300">UPDATE: Live telemetry stream connected.</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-purple-500/50">13:55:10</span>
                  <span className="text-blue-400">DATA: Player statistics synchronized.</span>
                </div>
                <div className="flex gap-4 opacity-50">
                  <span className="text-purple-500/50">13:40:00</span>
                  <span className="text-slate-300">SYS: Scheduled maintenance completed.</span>
                </div>
                
                <div className="absolute bottom-0 left-0 w-full h-[20px] bg-gradient-to-t from-[#050510] to-transparent pointer-events-none z-10"></div>
              </div>
              <div className="px-4 py-2 border-t border-purple-500/20 bg-black/40 flex items-center gap-2">
                <span className="text-purple-500 animate-pulse">{'>'}</span>
                <input type="text" className="bg-transparent border-none outline-none font-mono text-[11px] text-white w-full placeholder-slate-600" placeholder="Enter command..." />
              </div>
            </div>
            
          </div>
          
        </div>
      </main>
    </div>
  );
}

export default CosmicDashboard;
