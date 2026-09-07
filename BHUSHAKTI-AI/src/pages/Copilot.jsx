import React, { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Send, Sparkles, ShieldAlert, AlertTriangle,
  MapPin, CloudRain, RefreshCw, ChevronDown, ChevronUp, Bot, User,
  CheckCircle2, Info, ArrowRight, ShieldCheck, Database, Zap
} from "lucide-react";
import { api } from "../services/api";

export default function Copilot({ initialLocationId = null, onNavigateToMap }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocationId, setSelectedLocationId] = useState(initialLocationId || "");
  const [quickPrompts, setQuickPrompts] = useState([]);
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "copilot",
      text: "👋 **Welcome to BHUSHAKTI AI Copilot.**\n\nI am your decision-support specialist grounded strictly in the **trained XGBoost ML model**, **TreeSHAP factor attributions**, **real-time simulated weather telemetry**, and **PostGIS infrastructure/shelter geodatabase** for Northeast India.\n\nSelect a district above or choose a suggested operational query below.",
      engine: "BHUSHAKTI Grounded Decision Engine",
      timestamp: new Date().toLocaleTimeString(),
      context: null,
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedContextId, setExpandedContextId] = useState(null);
  const messagesEndRef = useRef(null);

  // Load locations & quick prompts
  useEffect(() => {
    const initData = async () => {
      try {
        const [locs, prompts] = await Promise.all([
          api.getRiskZones().catch(() => []),
          api.getQuickPrompts().catch(() => []),
        ]);
        setLocations(locs);
        setQuickPrompts(prompts);
        if (!selectedLocationId && locs.length > 0) {
          setSelectedLocationId(locs[0].id);
        }
      } catch (err) {
        console.error("Failed to load initial Copilot data:", err);
      }
    };
    initData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (queryText = inputQuery, locId = selectedLocationId) => {
    const q = queryText.trim();
    if (!q || loading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.askCopilot(q, locId ? parseInt(locId) : null);
      const copilotMsg = {
        id: `copilot-${Date.now()}`,
        sender: "copilot",
        text: res.response,
        engine: res.engine || "Google Gemini 1.5 Flash (Grounded)",
        is_fallback: res.is_fallback,
        context: res.structured_context_used,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, copilotMsg]);
    } catch (err) {
      const errorMsg = {
        id: `copilot-error-${Date.now()}`,
        sender: "copilot",
        text: `⚠️ **Connection Error:** Unable to reach the decision-support backend (${err.message}). Please ensure FastAPI is running.`,
        engine: "System Alert",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const selectedLocObj = locations.find((l) => l.id === parseInt(selectedLocationId));

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-slate-900 flex flex-col h-[calc(100vh-4.5rem)] space-y-4 bg-slate-50">
      {/* TOP HEADER & DISTRICT CONTEXT DOCK */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-mono text-blue-600 font-semibold uppercase tracking-widest">
              AI Decision Support & Explainability Engine
            </span>
          </div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            BHUSHAKTI Copilot
          </h1>
        </div>

        {/* District Selector & Real-Time Telemetry Bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-300 shadow-xs">
            <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-800 outline-none cursor-pointer"
            >
              <option value="" className="bg-white text-slate-900">
                🌐 Regional Overview (All Districts)
              </option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="bg-white text-slate-900">
                  📍 {loc.name} ({loc.state}) — {loc.current_risk_score ?? loc.baseline_risk_score}% Risk
                </option>
              ))}
            </select>
          </div>

          {selectedLocObj && (
            <div className="hidden sm:flex items-center gap-3 text-xs font-mono bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200">
              <span className="text-slate-600">
                Slope: <strong className="text-slate-900">{selectedLocObj.slope_deg}°</strong>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                24h Rain:{" "}
                <strong className="text-slate-900">
                  {selectedLocObj.latest_weather?.rainfall_24h_mm ?? "—"}mm
                </strong>
              </span>
              <span className="text-slate-300">•</span>
              <span
                className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                  selectedLocObj.baseline_risk_score >= 75
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : selectedLocObj.baseline_risk_score >= 50
                    ? "bg-orange-100 text-orange-700 border border-orange-200"
                    : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                }`}
              >
                {selectedLocObj.baseline_risk_score}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* QUICK OPERATIONAL PROMPT CHIPS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1 flex-shrink-0">
          <Zap className="w-3.5 h-3.5 text-blue-600" />
          Suggested:
        </span>
        {quickPrompts.map((p) => (
          <button
            key={p.id}
            onClick={() => {
              if (p.location_id) setSelectedLocationId(p.location_id);
              handleSend(p.query, p.location_id || selectedLocationId);
            }}
            className="px-3.5 py-1 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 rounded-lg text-xs font-medium border border-slate-200 hover:border-blue-300 transition flex-shrink-0 shadow-xs flex items-center gap-1.5"
          >
            <span>{p.title}</span>
            <ArrowRight className="w-3 h-3 text-blue-600" />
          </button>
        ))}
      </div>

      {/* CHAT STREAM CONTAINER */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 md:p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.map((msg) => {
          const isCopilot = msg.sender === "copilot";
          const isContextExpanded = expandedContextId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isCopilot ? "justify-start" : "justify-end"}`}
            >
              {isCopilot && (
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 space-y-2 text-xs md:text-sm shadow-xs ${
                  isCopilot
                    ? "bg-slate-50 border border-slate-200 text-slate-800"
                    : "bg-blue-600 text-white rounded-tr-none"
                }`}
              >
                {/* Engine Source Badge for Copilot */}
                {isCopilot && (
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 text-[10px] font-mono text-slate-500">
                    <span className="flex items-center gap-1.5 text-blue-700 font-bold">
                      <Sparkles className="w-3 h-3 text-blue-600" />
                      {msg.engine || "BHUSHAKTI Grounded AI"}
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                )}

                {/* Message Body (Rich Text) */}
                <div className="whitespace-pre-line leading-relaxed space-y-2">
                  {msg.text}
                </div>

                {/* Structured Context Provenance Drawer */}
                {isCopilot && msg.context && (
                  <div className="mt-3 pt-2 border-t border-slate-200">
                    <button
                      onClick={() =>
                        setExpandedContextId(isContextExpanded ? null : msg.id)
                      }
                      className="text-[10px] font-mono font-semibold text-slate-500 hover:text-blue-700 flex items-center gap-1 transition"
                    >
                      <Database className="w-3 h-3 text-blue-600" />
                      <span>
                        {isContextExpanded
                          ? "Hide Verified Telemetry Context"
                          : "View Grounded Context Ingested by Model"}
                      </span>
                      {isContextExpanded ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>

                    {isContextExpanded && (
                      <div className="mt-2 p-3 bg-white rounded-lg border border-slate-200 space-y-2 text-[11px] font-mono shadow-xs">
                        <div className="text-blue-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Zero Hallucination Verification Matrix
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-slate-700">
                          <div>
                            Sector: <strong>{msg.context.location?.name || "N/A"}</strong>
                          </div>
                          <div>
                            Slope: <strong>{msg.context.location?.slope_deg}°</strong>
                          </div>
                          <div>
                            Rainfall 24h:{" "}
                            <strong>{msg.context.weather?.rainfall_24h_mm} mm</strong>
                          </div>
                          <div>
                            Soil Moisture:{" "}
                            <strong>{msg.context.weather?.soil_moisture_pct} %</strong>
                          </div>
                          <div>
                            XGBoost Risk:{" "}
                            <strong className="text-red-600">
                              {msg.context.prediction?.risk_percentage}%
                            </strong>
                          </div>
                          <div>
                            Active Alerts:{" "}
                            <strong>{msg.context.active_warnings?.length || 0}</strong>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {!isCopilot && (
                <div className="w-8 h-8 rounded-xl bg-slate-200 flex items-center justify-center text-slate-700 flex-shrink-0 shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {loading && (
          <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white flex-shrink-0 animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs font-mono text-slate-600 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
              <span>Ingesting live telemetry, XGBoost inferences, and reasoning...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* INPUT BAR */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="bg-white border border-slate-200 p-2.5 rounded-2xl flex items-center gap-2 shadow-sm"
      >
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          placeholder={
            selectedLocObj
              ? `Ask Copilot about ${selectedLocObj.name} (e.g. "What is the evacuation directive?", "Why is risk elevated?")...`
              : "Ask Copilot for Northeast regional risk assessment or disaster response directives..."
          }
          className="flex-1 bg-transparent px-3 py-2 text-xs md:text-sm text-slate-900 placeholder-slate-400 outline-none"
        />

        <button
          type="submit"
          disabled={loading || !inputQuery.trim()}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask Copilot</span>
        </button>
      </form>
    </div>
  );
}
