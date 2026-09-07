import React, { useState, useEffect } from "react";
import {
  Activity, Sliders, Play, RotateCcw, AlertTriangle, ShieldAlert,
  TrendingUp, Info, CheckCircle2, CloudRain, Droplets, Mountain
} from "lucide-react";
import { api } from "../services/api";

const PRESETS = [
  {
    name: "🌧️ Extreme Monsoon Cloudburst",
    description: "Sudden 120mm rainfall with 88% soil moisture saturation",
    values: {
      rainfall_24h: 120.0,
      soil_moisture: 88.0,
      slope: 52.0,
      elevation: 2100.0,
      historical_events: 15,
      temperature: 15.0,
      humidity: 95.0,
    },
  },
  {
    name: "☀️ Post-Monsoon Dry Baseline",
    description: "Minimal precipitation and low soil saturation",
    values: {
      rainfall_24h: 8.0,
      soil_moisture: 22.0,
      slope: 30.0,
      elevation: 1100.0,
      historical_events: 3,
      temperature: 24.0,
      humidity: 58.0,
    },
  },
  {
    name: "🚜 Heavy Slope Cutting & Moderate Rain",
    description: "Steep 60° slope angle with moderate 45mm rainfall",
    values: {
      rainfall_24h: 45.0,
      soil_moisture: 65.0,
      slope: 60.0,
      elevation: 1650.0,
      historical_events: 12,
      temperature: 19.0,
      humidity: 82.0,
    },
  },
];

export default function Prediction() {
  const [params, setParams] = useState(PRESETS[0].values);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runPrediction = async (customParams = params) => {
    setLoading(true);
    try {
      const res = await api.predictRisk(customParams);
      setResult(res);
    } catch (err) {
      console.error("Prediction error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runPrediction();
  }, []);

  const handleChange = (key, val) => {
    const updated = { ...params, [key]: parseFloat(val) };
    setParams(updated);
  };

  const applyPreset = (preset) => {
    setParams(preset.values);
    runPrediction(preset.values);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-slate-900 space-y-6 bg-slate-50 min-h-full">
      <div className="border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-600"></span>
          <span className="text-xs font-mono text-blue-600 font-semibold uppercase tracking-widest">
            XGBoost + TreeSHAP Inference Engine
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          AI Landslide Risk & What-If Simulator
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Simulate geological and meteorological scenarios through the trained machine learning pipeline.
        </p>
      </div>

      {/* PRESETS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => applyPreset(p)}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 text-left transition-all shadow-xs group"
          >
            <div className="font-bold text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
              {p.name}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">{p.description}</div>
          </button>
        ))}
      </div>

      {/* MAIN SPLIT: Sliders vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sliders Panel (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-blue-600" />
              Input Environmental Parameters
            </h2>
            <button
              onClick={() => runPrediction()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Re-Calculate Risk
            </button>
          </div>

          <div className="space-y-4 text-xs">
            {/* 24h Rain */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-700 font-medium">24-Hour Rainfall (mm)</span>
                <span className="text-blue-700 font-bold">{params.rainfall_24h} mm</span>
              </div>
              <input
                type="range"
                min="0"
                max="250"
                step="1"
                value={params.rainfall_24h}
                onChange={(e) => handleChange("rainfall_24h", e.target.value)}
                className="w-full accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Soil Moisture */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-700 font-medium">Soil Moisture Saturation (%)</span>
                <span className="text-blue-700 font-bold">{params.soil_moisture} %</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="1"
                value={params.soil_moisture}
                onChange={(e) => handleChange("soil_moisture", e.target.value)}
                className="w-full accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Slope */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-700 font-medium">Slope Gradient (degrees)</span>
                <span className="text-blue-700 font-bold">{params.slope}°</span>
              </div>
              <input
                type="range"
                min="15"
                max="75"
                step="1"
                value={params.slope}
                onChange={(e) => handleChange("slope", e.target.value)}
                className="w-full accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Elevation */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-700 font-medium">Elevation (meters)</span>
                <span className="text-blue-700 font-bold">{params.elevation} m</span>
              </div>
              <input
                type="range"
                min="200"
                max="3500"
                step="50"
                value={params.elevation}
                onChange={(e) => handleChange("elevation", e.target.value)}
                className="w-full accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Historical Events */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-700 font-medium">Historical Recorded Landslides</span>
                <span className="text-blue-700 font-bold">{params.historical_events} events</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={params.historical_events}
                onChange={(e) => handleChange("historical_events", e.target.value)}
                className="w-full accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>

            {/* Humidity */}
            <div>
              <div className="flex justify-between font-mono mb-1">
                <span className="text-slate-700 font-medium">Ambient Humidity (%)</span>
                <span className="text-blue-700 font-bold">{params.humidity} %</span>
              </div>
              <input
                type="range"
                min="30"
                max="100"
                step="1"
                value={params.humidity}
                onChange={(e) => handleChange("humidity", e.target.value)}
                className="w-full accent-blue-600 bg-slate-200 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Prediction Results & SHAP Explanation (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200 p-5 rounded-xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              Real-Time Model Output
            </h2>
            <span className="text-[10px] font-mono text-blue-700 font-bold">
              {result?.model_version || "XGBoost v1.0"}
            </span>
          </div>

          {result ? (
            <div className="space-y-4">
              {/* Risk Gauge Card */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Landslide Hazard Probability</div>
                  <div
                    className={`text-3xl font-extrabold font-mono mt-1 ${
                      result.risk_category === "CRITICAL"
                        ? "text-red-600"
                        : result.risk_category === "HIGH"
                        ? "text-orange-600"
                        : result.risk_category === "MODERATE"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {result.risk_percentage}%
                  </div>
                </div>

                <div
                  className={`px-4 py-1.5 rounded-full text-xs font-bold border tracking-wider uppercase ${
                    result.risk_category === "CRITICAL"
                      ? "bg-red-100 text-red-700 border-red-200"
                      : result.risk_category === "HIGH"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : result.risk_category === "MODERATE"
                      ? "bg-amber-100 text-amber-800 border-amber-200"
                      : "bg-emerald-100 text-emerald-700 border-emerald-200"
                  }`}
                >
                  {result.risk_category}
                </div>
              </div>

              {/* SHAP Factor Bars */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center justify-between">
                  <span>TreeSHAP Feature Attributions</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Base: {result.shap_base_value ?? -1.727}
                  </span>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {result.contributing_factors.map((f, i) => {
                    const isPos = f.shap_value > 0;
                    return (
                      <div key={i} className="text-xs space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-700 font-medium">{f.feature}</span>
                          <span
                            className={`font-mono font-bold ${
                              isPos ? "text-red-600" : "text-emerald-600"
                            }`}
                          >
                            {isPos ? "+" : ""}
                            {f.shap_value} ({f.contribution}%)
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isPos ? "bg-red-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, f.contribution * 1.5)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Directive */}
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1 text-xs">
                <div className="font-bold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Recommended Action Directive
                </div>
                <p className="text-slate-800 leading-relaxed">{result.recommended_action}</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 p-8">Loading inference results...</div>
          )}
        </div>
      </div>
    </div>
  );
}
