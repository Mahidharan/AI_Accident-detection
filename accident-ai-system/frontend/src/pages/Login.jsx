import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsLoading(true);
    try {
      const res = await axios.post(`${API_URL}/auth/login`, formData);
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      onLogin(res.data.user);
      navigate("/");
    } catch (err) {
      const msg =
        err.response?.data?.message || "Invalid credentials. Please try again.";
      setStatus({ type: "error", message: msg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex font-sans overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Left side: Branding/Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-center px-16 z-10">
        <div className="space-y-8 max-w-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <span className="text-3xl">🛡️</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-white italic">SafetyNet AI</h1>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 leading-tight">
              Advanced Real-time Accident Detection.
            </h2>
            <p className="text-xl text-slate-400 leading-relaxed">
              Every second counts. Our AI-driven system monitors, detects, and dispatches emergency alerts in milliseconds.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-10">
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white mb-1">99.9%</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Detection Accuracy</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
              <p className="text-2xl font-bold text-white mb-1">&lt; 3s</p>
              <p className="text-sm text-slate-500 font-medium uppercase tracking-wider">Response Time</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 z-10">
        <div className="w-full max-w-md">
          <div className="bg-slate-900/40 backdrop-blur-2xl p-10 rounded-[2.5rem] border border-slate-800/80 shadow-2xl relative">
            {/* Top accent line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-blue-500/50 to-transparent rounded-full"></div>

            <div className="text-center mb-10">
              <h3 className="text-2xl font-bold text-white mb-2">Welcome Back</h3>
              <p className="text-slate-400">Enter your credentials to access the safety console</p>
            </div>

            {status.message && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-medium flex items-center gap-3">
                <span className="text-lg">🚨</span>
                {status.message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                  Security Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-500 transition-colors">
                    📧
                  </div>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 placeholder:text-slate-700"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center ml-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Access Token
                  </label>
                  <a href="#" className="text-xs font-bold text-blue-500 hover:text-blue-400 tracking-tight">Forgot Token?</a>
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-500 transition-colors">
                    🔑
                  </div>
                  <input
                    required
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3.5 pl-11 pr-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 placeholder:text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                disabled={isLoading}
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white font-bold py-4 px-4 rounded-2xl shadow-lg shadow-blue-600/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-2 group"
              >
                {isLoading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    Secure Login 
                    <span className="group-hover:translate-x-1 transition-transform">→</span>
                  </>
                )}
              </button>

              <div className="text-center pt-4">
                <p className="text-sm text-slate-500">
                  New operator?{" "}
                  <a href="/register" className="text-blue-500 hover:text-blue-400 font-bold transition-colors">
                    Register a new vehicle
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
