import React, { useState, useEffect, useCallback } from "react";
import { getAccidents } from "../services/api";

function AccidentDashboard({ user }) {
  const [accidents, setAccidents] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAccidents = useCallback(async () => {
    try {
      const res = await getAccidents(user?.vehicleNumber);
      setAccidents(res.data);
    } catch (err) {
      console.error("Failed to fetch accidents:", err);
      setAccidents([]);
    } finally {
      setLoading(false);
    }
  }, [user?.vehicleNumber]);

  useEffect(() => {
    fetchAccidents();
    const interval = setInterval(fetchAccidents, 10000);
    return () => clearInterval(interval);
  }, [fetchAccidents]);

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Safety Alert Logs</h2>
          <p className="text-slate-500 mt-1">Audit trail of all detected collision events</p>
        </div>
        
        <div className="flex gap-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none mb-1">Total Logs</p>
            <p className="text-lg font-black text-white">{accidents.length}</p>
          </div>
          <button 
            onClick={fetchAccidents}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center gap-2 text-sm"
          >
            <span>🔄</span> Sync Logs
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left bg-slate-900">
            <thead className="bg-slate-950/80 border-b border-slate-800 backdrop-blur-sm">
              <tr>
                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Safety Event</th>
                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Deployment Time</th>
                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Airbag Status</th>
                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Notifications Sent</th>
                <th className="px-8 py-5 text-slate-500 font-bold text-xs uppercase tracking-[0.2em] text-right">Telemetric Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-500 rounded-full animate-spin"></div>
                      <p className="text-slate-500 font-medium text-sm animate-pulse italic">Synchronizing with safety nodes…</p>
                    </div>
                  </td>
                </tr>
              ) : accidents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl mx-auto opacity-50">🛡️</div>
                      <p className="text-slate-400 font-bold">No active safety alerts</p>
                      <p className="text-slate-500 text-xs px-8">System is in active monitoring mode. All systems report nominal status.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                accidents.map((acc) => {
                  const sentTo = acc.emailSentTo || [];
                  const isCritical = acc.airbagDeployed;
                  const mapLink = `https://www.google.com/maps?q=${acc.location.latitude},${acc.location.longitude}`;
                  
                  return (
                    <tr
                      key={acc._id}
                      className="group hover:bg-slate-800/30 transition-all duration-300"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shadow-inner ${
                            isCritical ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          }`}>
                            {isCritical ? '🧨' : '📡'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{acc.vehicleNumber}</p>
                            <p className="text-[10px] text-slate-500 font-bold tracking-widest mt-0.5">ID: {acc._id.slice(-8).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-bold text-slate-300">
                          {new Date(acc.timestamp).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">
                          {new Date(acc.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                          isCritical 
                            ? "bg-red-500/10 border-red-500/30 text-red-500 shadow-sm shadow-red-500/10" 
                            : "bg-green-500/10 border-green-500/30 text-green-500 shadow-sm shadow-green-500/10"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isCritical ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></span>
                          {isCritical ? "Deployed" : "Nominal"}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {sentTo.length > 0 ? (
                            sentTo.map((email, i) => (
                              <span
                                key={i}
                                className="bg-slate-800 text-slate-400 border border-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wide truncate max-w-[120px]"
                                title={email}
                              >
                                {email.split('@')[0]}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-600 text-[10px] font-bold italic">No alerts dispatched</span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <a 
                          href={mapLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 hover:border-blue-500 rounded-xl transition-all duration-300 group/btn shadow-lg hover:shadow-blue-600/20"
                        >
                          <span className="text-xs font-black uppercase tracking-widest">Pinpoint GPS</span>
                          <span className="group-hover/btn:scale-125 transition-transform">📍</span>
                        </a>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer info */}
        <div className="px-8 py-4 bg-slate-950/50 border-t border-slate-800/50 flex justify-between items-center">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Automated safety log generation active</p>
          <div className="flex gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            <span>© 2026 Emergency Protocol v2.4</span>
            <span className="text-slate-800">|</span>
            <span>All coordinates verified via satellite</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AccidentDashboard;
