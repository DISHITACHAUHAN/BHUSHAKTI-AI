import React, { useState, useEffect } from "react";
import {
  Mountain, Home, LayoutDashboard, Map as MapIcon, Sliders, AlertTriangle,
  Route, FileText, MessageSquare, ShieldCheck, Wifi, WifiOff,
  RefreshCw, CheckCircle2, ChevronRight, Menu, X, Bell
} from "lucide-react";
import Landing from "./pages/Landing";
import CommandCenter from "./pages/CommandCenter";
import RiskMap from "./pages/RiskMap";
import Prediction from "./pages/Prediction";
import Warnings from "./pages/Warnings";
import Infrastructure from "./pages/Infrastructure";
import FieldReports from "./pages/FieldReports";
import Copilot from "./pages/Copilot";
import { api } from "./services/api";

export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedLocationId, setSelectedLocationId] = useState(null);
  const [backendHealthy, setBackendHealthy] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWarningsCount, setActiveWarningsCount] = useState(0);

  // Check backend health and active warnings periodically
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const [healthRes, warnRes] = await Promise.all([
          api.getHealth(),
          api.getWarnings("", false).catch(() => []),
        ]);
        setBackendHealthy(healthRes.status === "HEALTHY");
        setActiveWarningsCount(warnRes.length);
      } catch {
        setBackendHealthy(false);
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 12000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "command", label: "Command Center", icon: LayoutDashboard },
    { id: "map", label: "Live Risk Map", icon: MapIcon },
    { id: "predict", label: "AI Predictor", icon: Sliders },
    { id: "warnings", label: "Early Warnings", icon: AlertTriangle, badge: activeWarningsCount },
    { id: "infra", label: "Infrastructure", icon: Route },
    { id: "reports", label: "Field Reports", icon: FileText },
    { id: "copilot", label: "AI Copilot", icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* TOP COMMAND NAVIGATION BAR - LIGHT THEME */}
      <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 flex items-center justify-between z-30 sticky top-0 shadow-xs">
        {/* Brand & Tagline */}
        <button
          onClick={() => setActiveTab("home")}
          className="flex items-center gap-3 text-left focus:outline-none group"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-sm text-white group-hover:bg-blue-700 transition">
            <Mountain className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight text-slate-900 font-mono">
                BHUSHAKTI <span className="text-blue-600">AI</span>
              </span>
            </div>
            <div className="text-[10px] text-slate-500 tracking-wider uppercase font-mono hidden sm:block">
              Predict. Prepare. Protect.
            </div>
          </div>
        </button>

        {/* Center Desktop Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAct = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 relative ${
                  isAct
                    ? "bg-white text-blue-700 border border-slate-200/80 shadow-xs font-bold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isAct ? "text-blue-600" : "text-slate-500"}`} />
                {item.label}
                {item.badge > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-red-500 text-white font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Status & Controls */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono border transition-all ${
              backendHealthy
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
              }`}
            ></span>
            <span className="hidden sm:inline font-medium">
              {backendHealthy ? "FastAPI + XGBoost Live" : "Connecting Backend..."}
            </span>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg bg-slate-100 text-slate-700 hover:text-slate-900 border border-slate-200"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 p-3 space-y-1 z-30 shadow-md">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isAct = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                  isAct
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500 text-white font-mono">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN VIEWPORT ROUTER */}
      <main className="flex-1 w-full overflow-hidden bg-slate-50">
        {activeTab === "home" && (
          <Landing
            onNavigateToCommand={() => setActiveTab("command")}
            onNavigateToMap={() => setActiveTab("map")}
          />
        )}

        {activeTab === "command" && (
          <CommandCenter
            onNavigateToMap={() => setActiveTab("map")}
            onNavigateToReports={() => setActiveTab("reports")}
            onNavigateToWarnings={() => setActiveTab("warnings")}
            onSelectDistrict={(id) => {
              setSelectedLocationId(id);
              setActiveTab("map");
            }}
          />
        )}

        {activeTab === "map" && (
          <RiskMap
            selectedLocationId={selectedLocationId}
            onSelectLocation={(loc) => setSelectedLocationId(loc.id)}
            onNavigateToCopilot={(locId) => {
              if (locId) setSelectedLocationId(locId);
              setActiveTab("copilot");
            }}
          />
        )}

        {activeTab === "predict" && <Prediction />}

        {activeTab === "warnings" && <Warnings />}

        {activeTab === "infra" && <Infrastructure />}

        {activeTab === "reports" && (
          <FieldReports onNavigateToMap={() => setActiveTab("map")} />
        )}

        {activeTab === "copilot" && (
          <Copilot
            initialLocationId={selectedLocationId}
            onNavigateToMap={() => setActiveTab("map")}
          />
        )}
      </main>
    </div>
  );
}
