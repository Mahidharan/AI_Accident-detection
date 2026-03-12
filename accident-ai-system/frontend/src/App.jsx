import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import Home from "./pages/Home";
import Registration from "./pages/Registration";
import AccidentDashboard from "./pages/AccidentDashboard";
import Login from "./pages/Login";

// Component for layout wrapper
function Layout({ user, handleLogout, children }) {
  const location = useLocation();

  const navItems = [
    { path: "/", label: "System Overview", icon: "📊" },
    { path: "/register", label: "Vehicle Registry", icon: "🚗" },
    { path: "/accidents", label: "Safety Alerts", icon: "⚠️" },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col shadow-2xl z-20">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <span className="text-xl">🛡️</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400">
              SafetyNet AI
            </h1>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  location.pathname === item.path
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-lg shadow-inner">
              {user.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-red-500/30 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-200 font-medium text-sm"
          >
            <span>🚪</span> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Glow */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <header className="h-20 bg-slate-900/50 backdrop-blur-xl border-b border-slate-800/80 flex items-center justify-between px-10 z-10 sticky top-0">
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {navItems.find(i => i.path === location.pathname)?.label || "Dashboard"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Real-time Safety Monitoring System</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-800/80 border border-slate-700/50">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Live System Agent</span>
            </div>
            
            <div className="h-8 w-px bg-slate-700/50"></div>
            
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-500 leading-none">Registered Vehicle</p>
              <p className="text-sm font-mono font-bold text-blue-400 mt-1">{user.vehicleNumber}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  if (!user) {
    return (
      <Router>
        <Routes>
          <Route path="/register" element={<Registration />} />
          <Route path="*" element={<Login onLogin={handleLogin} />} />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <Layout user={user} handleLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/register" element={<Registration />} />
          <Route
            path="/accidents"
            element={<AccidentDashboard user={user} />}
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
