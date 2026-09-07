import React, { useState, useEffect } from "react";
import {
  ShieldAlert, AlertTriangle, Radio, CheckCircle2, Clock, Send,
  RefreshCw, Filter, Info, Bell, Users, Volume2, ShieldCheck, Check
} from "lucide-react";
import { api } from "../services/api";

const SEVERITY_STYLES = {
  CRITICAL: {
    card: "border-red-200 bg-red-50/70",
    badge: "bg-red-100 text-red-700 border-red-200",
    pulse: "bg-red-600 animate-ping",
    text: "text-red-600",
  },
  HIGH: {
    card: "border-orange-200 bg-orange-50/60",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    pulse: "bg-orange-500",
    text: "text-orange-600",
  },
  MODERATE: {
    card: "border-amber-200 bg-amber-50/60",
    badge: "bg-amber-100 text-amber-800 border-amber-200",
    pulse: "bg-amber-500",
    text: "text-amber-600",
  },
  LOW: {
    card: "border-emerald-200 bg-emerald-50/60",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    pulse: "bg-emerald-500",
    text: "text-emerald-600",
  },
};

export default function Warnings() {
  const [warnings, setWarnings] = useState([]);
  const [thresholds, setThresholds] = useState(null);
  const [filterSeverity, setFilterSeverity] = useState("ALL");
  const [filterAck, setFilterAck] = useState("ALL"); // ALL, PENDING, ACKNOWLEDGED
  const [loading, setLoading] = useState(true);
  const [broadcastLog, setBroadcastLog] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchWarningsData = async () => {
    setLoading(true);
    try {
      const [warnRes, threshRes] = await Promise.all([
        api.getWarnings(),
        api.getWarningThresholds().catch(() => null),
      ]);
      setWarnings(warnRes);
      setThresholds(threshRes);
    } catch (err) {
      console.error("Failed to load warnings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarningsData();
    const interval = setInterval(fetchWarningsData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (warningId) => {
    setActionLoading(true);
    try {
      await api.acknowledgeWarning(warningId, "NDMA_COMMAND_DUTY_OFFICER");
      await fetchWarningsData();
    } catch (err) {
      console.error("Acknowledgment error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBroadcast = async (warningId) => {
    setActionLoading(true);
    try {
      const res = await api.broadcastWarning(warningId, ["SMS", "CAP_BROADCAST", "RADIO_SIREN"]);
      setBroadcastLog(res);
    } catch (err) {
      console.error("Broadcast error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredWarnings = warnings.filter((w) => {
    if (filterSeverity !== "ALL" && w.severity !== filterSeverity) return false;
    if (filterAck === "PENDING" && w.acknowledged) return false;
    if (filterAck === "ACKNOWLEDGED" && !w.acknowledged) return false;
    return true;
  });

  const pendingCount = warnings.filter((w) => !w.acknowledged).length;

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-slate-900 space-y-6 bg-slate-50 min-h-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-ping"></span>
            <span className="text-xs font-mono text-red-600 font-semibold uppercase tracking-widest">
              Dynamic Early Warning Engine
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <ShieldAlert className="w-7 h-7 text-red-600" />
            Landslide Hazard Warnings & Alerts
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated threshold trigger system for SDRF, DDMA, and local emergency response teams.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 border border-red-200 px-3.5 py-1.5 rounded-xl text-xs font-mono text-red-700 flex items-center gap-2 shadow-xs font-bold">
            <Bell className="w-3.5 h-3.5 text-red-600 animate-bounce" />
            <span>{pendingCount} Pending Action</span>
          </div>
          <button
            onClick={fetchWarningsData}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* OPERATIONAL THRESHOLDS CARD & DISCLAIMER */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Info className="w-4 h-4 text-blue-600" />
            Standard Operational Hazard Thresholds
          </h3>
          <span className="text-[10px] font-mono text-slate-500">Auto-Generated by Thresholds</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="font-bold text-emerald-700">0 – 25% : LOW</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Routine geological monitoring</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
            <div className="font-bold text-amber-800">25 – 50% : MODERATE</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Yellow Advisory on vulnerable toes</div>
          </div>
          <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
            <div className="font-bold text-orange-800">50 – 75% : HIGH</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Orange Warning · Restrict transit</div>
          </div>
          <div className="p-3 rounded-lg bg-red-50 border border-red-200">
            <div className="font-bold text-red-700">75 – 100% : CRITICAL</div>
            <div className="text-[11px] text-slate-600 mt-0.5">Red Alert · Evacuation order</div>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 italic pt-1 border-t border-slate-200">
          ⚠️ <strong>Operational Disclaimer:</strong> These thresholds represent operational safety
          guidelines calibrated for decision support and require formal domain verification before issuing field orders.
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Severity:
          </span>
          {["ALL", "CRITICAL", "HIGH", "MODERATE"].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterSeverity === sev
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-500 font-semibold">Status:</span>
          {["ALL", "PENDING", "ACKNOWLEDGED"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterAck(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                filterAck === st
                  ? "bg-slate-800 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* WARNINGS LIST */}
      <div className="space-y-4">
        {filteredWarnings.length > 0 ? (
          filteredWarnings.map((w) => {
            const styleCfg = SEVERITY_STYLES[w.severity] || SEVERITY_STYLES.LOW;
            return (
              <div
                key={w.id}
                className={`p-5 rounded-xl border shadow-xs transition-all ${styleCfg.card} flex flex-col md:flex-row md:items-start justify-between gap-4`}
              >
                {/* Left Info */}
                <div className="space-y-2.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wider uppercase ${styleCfg.badge}`}
                    >
                      {w.severity} ALERT
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900">{w.location_name}</h2>
                    <span className="text-xs text-blue-700 font-mono font-semibold">({w.state})</span>
                    {w.acknowledged ? (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Acknowledged by {w.acknowledged_by}
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 border border-red-200 animate-pulse">
                        ● Pending Action
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 font-medium">
                    <span className="text-slate-500">Primary Triggers: </span>
                    <span className="font-mono text-slate-900 font-semibold">{w.main_factors}</span>
                  </div>

                  <div className="p-3 bg-white/90 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed shadow-xs">
                    <strong className="text-blue-700 block mb-0.5">Directive Action:</strong>
                    {w.recommended_action}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] font-mono text-slate-500">
                    <span>Generated: {new Date(w.created_at).toLocaleString()}</span>
                    {w.latitude && <span>Coordinates: {w.latitude.toFixed(3)}°N, {w.longitude.toFixed(3)}°E</span>}
                  </div>
                </div>

                {/* Right Actions & Score */}
                <div className="flex flex-col items-end justify-between gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] text-slate-500 font-medium">XGBoost Risk</div>
                    <div className={`text-3xl font-extrabold font-mono ${styleCfg.text}`}>
                      {w.risk_probability}%
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {!w.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(w.id)}
                        disabled={actionLoading}
                        className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Acknowledge Alert
                      </button>
                    )}

                    <button
                      onClick={() => handleBroadcast(w.id)}
                      disabled={actionLoading}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition shadow-xs flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Broadcast Emergency
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center p-12 bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2 shadow-xs">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <div className="font-bold text-slate-800">No Warnings Under Current Filter</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              All monitored regions currently satisfy stability thresholds or selected filter criteria.
            </p>
          </div>
        )}
      </div>

      {/* BROADCAST LOG MODAL / CARD */}
      {broadcastLog && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 max-w-lg w-full rounded-2xl p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-600 animate-pulse" />
                <h3 className="font-bold text-slate-900 text-base">Emergency Broadcast Dissemination</h3>
              </div>
              <button
                onClick={() => setBroadcastLog(null)}
                className="text-slate-500 hover:text-slate-800 text-xs font-bold px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded"
              >
                Close
              </button>
            </div>

            <div className="text-xs text-slate-700 space-y-3">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Target Location:</span>
                <span className="font-bold text-slate-900 text-sm">{broadcastLog.location}</span>
                <span className="text-[11px] text-blue-700 font-semibold block mt-0.5">Status: {broadcastLog.status}</span>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-slate-700 text-xs uppercase tracking-wider block">
                  Dissemination Channels Triggered:
                </span>
                {broadcastLog.channels_broadcasted.map((ch, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-0.5"
                  >
                    <div className="flex justify-between font-bold text-blue-700">
                      <span>{ch.channel}</span>
                      <span className="text-emerald-700 text-[10px] font-mono">{ch.status}</span>
                    </div>
                    <div className="text-slate-600 text-[11px]">{ch.target}</div>
                    {ch.message && <div className="text-slate-800 italic text-[11px] mt-1">"{ch.message}"</div>}
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setBroadcastLog(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              Dismiss Broadcast Log
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
