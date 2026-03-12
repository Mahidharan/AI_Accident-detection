import React, { useState, useEffect, useCallback } from "react";
import { getDashboardStats, getLiveActivity } from "../services/api";

function Home({ user }) {
  const [stats, setStats] = useState({ alertsSent: 0 });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const vehicleNumber = user?.vehicleNumber;

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        getDashboardStats(vehicleNumber),
        getLiveActivity(vehicleNumber)
      ]);
      setStats({ alertsSent: statsRes.data.alertsSent || 0 });
      setActivities(activityRes.data || []);
    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
    } finally {
      setLoading(false);
    }
  }, [vehicleNumber]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const cards = [
    {
      title: "Alerts Dispatched",
      value: stats.alertsSent,
      sub: "Total alerts sent today",
      icon: "📧",
      color: "blue"
    },
    {
      title: "Vehicle Status",
      value: "SECURED",
      sub: "Active monitoring enabled",
      icon: "🚗",
      color: "green"
    },
    {
      title: "Emergency Link",
      value: user.emergencyContactEmail?.split('@')[0],
      sub: user.emergencyContactEmail,
      icon: "🔔",
      color: "indigo"
    },
    {
      title: "System Latency",
      value: "24ms",
      sub: "Real-time AI processing",
      icon: "⚡",
      color: "amber"
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">System Console</h2>
          <p className="text-slate-500 mt-1">Real-time safety telemetry and monitoring nodes</p>
        </div>
        <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-blue-400">
          Uptime: 99.98% • Node: IN-BOM-1
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="group relative bg-slate-900 border border-slate-800 p-6 rounded-3xl overflow-hidden hover:border-slate-700 transition-all duration-300">
            <div className={`absolute top-0 left-0 w-1.5 h-full ${
              card.color === 'blue' ? 'bg-blue-500' : 
              card.color === 'green' ? 'bg-green-500' : 
              card.color === 'indigo' ? 'bg-indigo-500' : 'bg-amber-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <span className="text-2xl group-hover:scale-110 transition-transform">{card.icon}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest ${
                card.color === 'blue' ? 'bg-blue-500/10 text-blue-400' : 
                card.color === 'green' ? 'bg-green-500/10 text-green-400' : 
                card.color === 'indigo' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-amber-500/10 text-amber-400'
              }`}>Active</span>
            </div>
            
            <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest">{card.title}</h3>
            <p className="text-3xl font-black text-white mt-1 truncate">
              {loading ? <span className="inline-block w-8 h-8 bg-slate-800 animate-pulse rounded"></span> : card.value}
            </p>
            <p className="text-xs text-slate-500 mt-2 truncate font-medium">{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Activity Stream */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              Live Activity Stream
            </h3>
            <button onClick={fetchData} className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Refresh Nodes</button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {loading ? (
              <div className="space-y-4 p-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-16 bg-slate-800/50 animate-pulse rounded-2xl"></div>
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-600 space-y-4">
                <span className="text-5xl opacity-20">📡</span>
                <p className="font-medium">No safety events recorded in the last 24h</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((act, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl hover:bg-slate-800/30 transition-colors group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                      act.airbagDeployed ? 'bg-red-500/10 text-red-500' : 'bg-blue-500/10 text-blue-500'
                    }`}>
                      {act.airbagDeployed ? '💥' : '🧿'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`font-bold text-sm ${act.airbagDeployed ? 'text-red-400' : 'text-slate-200'}`}>
                          {act.airbagDeployed ? 'ACCIDENT DETECTED' : 'SYSTEM PING'}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">{new Date(act.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate italic">
                        Node location: {act.location.latitude.toFixed(4)}, {act.location.longitude.toFixed(4)}
                      </p>
                    </div>
                    <div className="text-right shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] font-bold bg-slate-800 text-slate-400 px-2 py-1 rounded-lg uppercase tracking-widest">Details</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Panel */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-8 rounded-3xl border border-indigo-500/20 shadow-xl relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-20%] w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full"></div>
            <h4 className="text-indigo-400 font-bold text-xs uppercase tracking-[0.2em] mb-4">Emergency Dispatch</h4>
            <div className="space-y-4 relative z-10">
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Primary Guardian</p>
                <p className="text-sm font-bold text-white truncate">{user.emergencyContactEmail}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Protocol Status</p>
                <div className="flex items-center gap-2 text-green-400 text-sm font-bold">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                  Ready to Dispatch
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-indigo-500/20">
              <p className="text-xs text-slate-400 leading-relaxed italic">
                "In the event of kinetic impact detection, local EMS and police stations within 5km will be auto-notified."
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
            <h4 className="text-slate-500 font-bold text-[10px] uppercase tracking-widest mb-4">AI Engine Health</h4>
            <div className="space-y-3">
              {[
                { label: 'Neural Network', val: '98%' },
                { icon: '📡', label: 'CV Processor', val: 'Active' },
                { icon: '🌡️', label: 'Node Core', val: '42°C' },
              ].map((h, i) => (
                <div key={i} className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{h.label}</span>
                  <span className="font-mono text-slate-200">{h.val}</span>
                </div>
              ))}
              <div className="h-1 bg-slate-800 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500 w-[94%]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
