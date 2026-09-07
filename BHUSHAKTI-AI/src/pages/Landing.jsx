import React from "react";
import { ChevronRight, Map as MapIcon, LayoutDashboard } from "lucide-react";

export default function Landing({ onNavigateToCommand, onNavigateToMap }) {
  const stats = [
    { value: "10", label: "NER Districts Monitored" },
    { value: "147", label: "Simulated IoT Sensor Streams" },
    { value: "6h-24h", label: "Early Warning Horizon" },
    { value: "7 Factors", label: "Weighted Risk Matrix" },
  ];

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-slate-50 bg-[radial-gradient(ellipse_80%_80%_at_80%_-20%,rgba(219,234,254,0.45),rgba(255,255,255,0))] text-slate-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full mx-auto flex flex-col items-center text-center space-y-8">
        

        {/* 1. Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold tracking-wider uppercase shadow-xs">
          <span className="w-2 h-2 rounded-full bg-blue-600"></span>
          DISASTER INTELLIGENCE PLATFORM
        </div>

        {/* 2. Headline (3 lines, bold, dark navy/near-black) */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl">
          AI-Based Early Warning &<br className="hidden sm:inline" />
          {" "}Landslide Risk Monitoring<br className="hidden sm:inline" />
          {" "}for Northeast India
        </h1>

        {/* 3. Subtext */}
        <p className="text-slate-600 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl">
          Multi-factor geological hazard forecasting combining rainfall telemetry, soil saturation, slope gradient, historical frequency, and simulated Sentinel-1/2 satellite indicators into explainable early warning intelligence.
        </p>

        {/* 4. Two Centered CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 w-full sm:w-auto">
          <button
            onClick={onNavigateToCommand}
            className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Enter Command Center
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={onNavigateToMap}
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-xl text-sm border border-slate-300 transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
          >
            <MapIcon className="w-4 h-4 text-blue-600" />
            Explore Live Risk Map
          </button>
        </div>

        {/* 5. Thin light-gray divider, full content width */}
        <div className="w-full border-t border-slate-200 pt-4"></div>

        {/* 6. Stat Row (4 cards, evenly spaced, white background, light border, rounded, subtle shadow) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:border-blue-300 transition text-center"
            >
              <div className="text-2xl sm:text-3xl font-extrabold text-blue-600 font-mono">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 font-medium mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
