import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Registration() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    vehicleNumber: "",
    emergencyContactEmail: "",
  });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState("Awaiting satellite signal…");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          setLocationStatus(`Signal Locked: ${latitude.toFixed(4)}N, ${longitude.toFixed(4)}E`);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationStatus("Signal Failed. IP-based tracking active.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      setLocationStatus("Geolocation not supported by device.");
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);
    try {
      const res = await axios.post(`${API_URL}/auth/register`, formData);
      
      // Update location immediately if available
      if (userLocation) {
        await axios.post(`${API_URL}/auth/update-location`, {
          vehicleNumber: formData.vehicleNumber,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        });
      }

      setStatus({
        type: "success",
        message: `System Online. ${res.data.user.name}, your vehicle ${formData.vehicleNumber} is now protected.`,
      });

      // Clear sensitive fields except vehicle and contact for reference if needed
      setFormData({
        name: "",
        email: res.data.user.email,
        password: "",
        vehicleNumber: formData.vehicleNumber,
        emergencyContactEmail: formData.emergencyContactEmail,
      });
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed. Please check network connectivity.";
      setStatus({ type: "error", message: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Active Vehicle Setup</h2>
          <p className="text-slate-500 mt-1">Configure your AI safety monitoring profile</p>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-widest ${
          userLocation ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-blue-500/10 border-blue-500/20 text-blue-400"
        }`}>
          <span className={`w-2 h-2 rounded-full ${userLocation ? "bg-green-500 animate-pulse" : "bg-blue-500"}`}></span>
          {locationStatus}
        </div>
      </div>

      {status.message && (
        <div className={`p-5 rounded-2xl border flex items-center gap-4 transition-all animate-in zoom-in-95 duration-300 ${
          status.type === "success" 
            ? "bg-green-500/10 border-green-500/20 text-green-300 shadow-lg shadow-green-500/5" 
            : "bg-red-500/10 border-red-500/20 text-red-300 shadow-lg shadow-red-500/5"
        }`}>
          <span className="text-2xl">{status.type === "success" ? "✅" : "⚠️"}</span>
          <div className="flex-1 font-medium">{status.message}</div>
          {status.type === "success" && (
            <Link to="/" className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm font-bold hover:bg-green-400 transition-colors">
              Access Dashboard
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/50 rounded-3xl p-8 border border-slate-800 shadow-xl space-y-6">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Operator Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
                <input
                  required
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="e.g. Michael Chen"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Account Email</label>
                <input
                  required
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="michael@safety.ai"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Vechicle Number</label>
                <input
                  required
                  type="text"
                  name="vehicleNumber"
                  value={formData.vehicleNumber}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-white font-mono focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="e.g. TN33AB1234"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Access Password</label>
                <input
                  required
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 px-4 text-white focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-600/5 rounded-3xl p-8 border border-blue-500/20 shadow-xl space-y-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <span className="text-6xl">🔔</span>
            </div>
            
            <div>
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-[0.2em] mb-1">Emergency Protocol</h3>
              <p className="text-slate-400 text-sm">Critical: This contact will receive real-time accident coordinates.</p>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Recipient Email</label>
              <input
                required
                type="email"
                name="emergencyContactEmail"
                value={formData.emergencyContactEmail}
                onChange={handleChange}
                className="w-full bg-slate-950/50 border border-blue-500/30 rounded-2xl py-4 px-5 text-white focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all font-semibold"
                placeholder="guardian@emergency.com"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
            <h4 className="font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-blue-500">🛡️</span> Workflow Logic
            </h4>
            <ul className="space-y-4">
              {[
                { icon: "📡", text: "AI continuously analyzes airbag telemetry" },
                { icon: "🗺️", text: "On impact, GPS pinpointing initiates" },
                { icon: "📩", text: "Immediate alerts sent to all contacts" },
                { icon: "🚑", text: "Nearest EMS dispatch notification" }
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="bg-slate-800 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-slate-700 text-sm">{step.icon}</span>
                  <span className="text-slate-400 text-sm leading-snug">{step.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full group bg-gradient-to-br from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 disabled:opacity-50 text-white font-black py-6 rounded-3xl shadow-xl shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-1"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-3">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Complete Setup <span className="group-hover:translate-x-1 transition-transform">→</span>
              </span>
            )}
          </button>
          
          <p className="text-center text-xs text-slate-500 px-4">
            By registering, you enable real-time safety monitoring via our AI Engine.
          </p>
        </div>
      </form>
    </div>
  );
}

export default Registration;
