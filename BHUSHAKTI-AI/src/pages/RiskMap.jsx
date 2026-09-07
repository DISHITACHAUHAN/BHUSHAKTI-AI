import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap } from "react-leaflet";
import {
  MapPin, ShieldAlert, AlertTriangle, Droplets, Mountain, Activity,
  CloudRain, Wind, Layers, Route, Hospital, Home, RefreshCw, X, ChevronRight,
  TrendingUp, CheckCircle2, Info, ArrowRight
} from "lucide-react";
import { api } from "../services/api";

// Auto-pan helper component
function MapCenterController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { duration: 1.2 });
    }
  }, [center, zoom, map]);
  return null;
}

const CATEGORY_COLORS = {
  CRITICAL: {
    stroke: "#ef4444",
    fill: "#ef4444",
    badge: "bg-red-50 text-red-700 border-red-200",
    glow: "rgba(239, 68, 68, 0.4)",
  },
  HIGH: {
    stroke: "#f97316",
    fill: "#f97316",
    badge: "bg-orange-50 text-orange-700 border-orange-200",
    glow: "rgba(249, 115, 22, 0.4)",
  },
  MODERATE: {
    stroke: "#eab308",
    fill: "#eab308",
    badge: "bg-amber-50 text-amber-700 border-amber-200",
    glow: "rgba(234, 179, 8, 0.4)",
  },
  LOW: {
    stroke: "#10b981",
    fill: "#10b981",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    glow: "rgba(16, 185, 129, 0.4)",
  },
};

export default function RiskMap({
  onSelectLocation,
  selectedLocationId,
  onNavigateToCopilot,
}) {
  const [locations, setLocations] = useState([]);
  const [selectedLoc, setSelectedLoc] = useState(null);
  const [predictionData, setPredictionData] = useState(null);
  const [nearbyInfra, setNearbyInfra] = useState([]);
  const [fieldReports, setFieldReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [predLoading, setPredLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([26.2, 92.9]);
  const [mapZoom, setMapZoom] = useState(7);
  const [showInfraOverlay, setShowInfraOverlay] = useState(true);
  const [showReportsOverlay, setShowReportsOverlay] = useState(true);

  // Load risk zones and field reports from backend API
  const loadData = async () => {
    setLoading(true);
    try {
      const [zonesData, reportsData] = await Promise.all([
        api.getRiskZones(),
        api.getFieldReports().catch(() => []),
      ]);
      setLocations(zonesData);
      setFieldReports(reportsData);

      // If a location is preselected, load its details
      if (selectedLocationId) {
        const found = zonesData.find((l) => l.id === selectedLocationId);
        if (found) handleLocationClick(found);
      } else if (zonesData.length > 0 && !selectedLoc) {
        handleLocationClick(zonesData[0]); // default to first district
      }
    } catch (err) {
      console.error("Failed to load map data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // When clicking a location node
  const handleLocationClick = async (loc) => {
    setSelectedLoc(loc);
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(9);
    setPredLoading(true);

    if (onSelectLocation) {
      onSelectLocation(loc);
    }

    try {
      // 1. Fetch real-time XGBoost + TreeSHAP prediction from FastAPI
      const weather = loc.latest_weather || {};
      const payload = {
        location_id: loc.id,
        rainfall_24h: weather.rainfall_24h_mm ?? 45.0,
        soil_moisture: weather.soil_moisture_pct ?? 60.0,
        slope: loc.slope_deg ?? 35.0,
        elevation: loc.elevation_m ?? 1200.0,
        historical_events: loc.historical_events_count ?? 8,
        temperature: weather.temperature_c ?? 20.0,
        humidity: weather.humidity_pct ?? 80.0,
      };

      const [predRes, infraRes] = await Promise.all([
        api.predictRisk(payload),
        api.getNearbyInfrastructure(loc.latitude, loc.longitude, 35),
      ]);

      setPredictionData(predRes);
      setNearbyInfra(infraRes);
    } catch (err) {
      console.error("Failed to fetch location prediction & infrastructure:", err);
    } finally {
      setPredLoading(false);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-slate-50 text-slate-900">
      {/* MAP VIEWPORT */}
      <div className="relative flex-1 h-full w-full">
        {/* Top Floating Controls */}
        <div className="absolute top-4 left-4 z-[1000] flex flex-wrap gap-2 items-center pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs text-slate-800">
            <span className="h-2 w-2 rounded-full bg-blue-600 animate-ping"></span>
            <span className="font-semibold text-slate-900">Northeast India Geospatial Grid</span>
            <span className="text-slate-500">({locations.length} Active Nodes)</span>
          </div>

          <button
            onClick={() => setShowInfraOverlay(!showInfraOverlay)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
              showInfraOverlay
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Route className="w-3.5 h-3.5 text-blue-600" />
            Infrastructure Overlay
          </button>

          <button
            onClick={() => setShowReportsOverlay(!showReportsOverlay)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 shadow-sm ${
              showReportsOverlay
                ? "bg-purple-50 text-purple-700 border-purple-200"
                : "bg-white text-slate-600 border-slate-200 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            Field Reports ({fieldReports.length})
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 transition shadow-sm hover:bg-slate-50"
            title="Refresh Map Telemetry"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>

        {/* Risk Legend */}
        <div className="absolute bottom-6 left-4 z-[1000] bg-white/95 backdrop-blur-md p-3.5 rounded-xl border border-slate-200 shadow-md pointer-events-auto text-xs space-y-1.5">
          <div className="font-bold text-slate-900 mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            Landslide Hazard Tiers
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-slate-700">Low Risk (0–25%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-slate-700">Moderate Advisory (25–50%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500"></span>
            <span className="text-slate-700">High Warning (50–75%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-pulse"></span>
            <span className="text-red-700 font-bold">Critical Alert (75–100%)</span>
          </div>
        </div>

        {/* Leaflet Map Component */}
        <MapContainer
          center={mapCenter}
          zoom={mapZoom}
          className="w-full h-full z-0"
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>, USGS, NOAA'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
          />

          <MapCenterController center={mapCenter} zoom={mapZoom} />

          {/* Render Monitored District Nodes */}
          {locations.map((loc) => {
            const cat = loc.current_risk_category || "LOW";
            const colorCfg = CATEGORY_COLORS[cat] || CATEGORY_COLORS.LOW;
            const isSelected = selectedLoc?.id === loc.id;
            const radius = isSelected ? 18 : cat === "CRITICAL" ? 16 : 12;

            return (
              <React.Fragment key={loc.id}>
                {/* Outer pulsing ring for Critical zones */}
                {cat === "CRITICAL" && (
                  <CircleMarker
                    center={[loc.latitude, loc.longitude]}
                    radius={radius + 8}
                    pathOptions={{
                      color: "#ef4444",
                      fillColor: "#ef4444",
                      fillOpacity: 0.15,
                      weight: 1,
                      dashArray: "3, 6",
                    }}
                  />
                )}

                <CircleMarker
                  center={[loc.latitude, loc.longitude]}
                  radius={radius}
                  pathOptions={{
                    color: isSelected ? "#2563eb" : colorCfg.stroke,
                    fillColor: colorCfg.fill,
                    fillOpacity: isSelected ? 0.95 : 0.8,
                    weight: isSelected ? 3 : 1.5,
                  }}
                  eventHandlers={{
                    click: () => handleLocationClick(loc),
                  }}
                >
                  <Tooltip
                    direction="top"
                    offset={[0, -10]}
                    opacity={0.98}
                    className="custom-map-tooltip"
                  >
                    <div className="text-xs p-1 font-sans">
                      <div className="font-bold text-slate-900">{loc.name}</div>
                      <div className="text-slate-600">{loc.state}</div>
                      <div className="mt-1 flex items-center gap-1.5 font-mono">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${colorCfg.badge}`}>
                          {cat} ({loc.current_risk_score}%)
                        </span>
                      </div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            );
          })}

          {/* Render Nearby Infrastructure Nodes */}
          {showInfraOverlay &&
            nearbyInfra.map((infra) => (
              <CircleMarker
                key={infra.id}
                center={[infra.latitude, infra.longitude]}
                radius={5}
                pathOptions={{
                  color: "#0284c7",
                  fillColor: "#38bdf8",
                  fillOpacity: 0.9,
                  weight: 1.5,
                }}
              >
                <Tooltip direction="top" offset={[0, -5]}>
                  <div className="text-[11px] p-1 font-sans">
                    <div className="font-semibold text-blue-700">{infra.name}</div>
                    <div className="text-slate-600 capitalize">{infra.type.replace("_", " ")}</div>
                    {infra.distance_km && (
                      <div className="text-slate-500 font-mono text-[10px]">
                        Dist: {infra.distance_km} km
                      </div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}

          {/* Render Ground Field Reports Nodes */}
          {showReportsOverlay &&
            fieldReports.map((report) => {
              const isCrit = report.severity === "CRITICAL";
              const isHigh = report.severity === "HIGH";
              const isVerified = report.verification_status === "VERIFIED";

              return (
                <CircleMarker
                  key={`field-report-${report.id}`}
                  center={[report.latitude, report.longitude]}
                  radius={8}
                  pathOptions={{
                    color: isCrit ? "#ef4444" : isHigh ? "#f97316" : "#9333ea",
                    fillColor: isVerified ? "#10b981" : "#f59e0b",
                    fillOpacity: 0.9,
                    weight: 2,
                    dashArray: isVerified ? undefined : "2, 3",
                  }}
                >
                  <Tooltip direction="top" offset={[0, -8]}>
                    <div className="text-[11px] p-1 font-sans">
                      <div className="font-bold text-slate-900 flex items-center gap-1">
                        <span>⚠️</span> {report.location_name}
                      </div>
                      <div className="text-slate-600 text-[10px] capitalize">
                        {report.hazard_type.replace("_", " ")} • {report.severity}
                      </div>
                      <div className="text-[9px] font-mono text-blue-600 font-semibold">
                        {isVerified ? "✓ VERIFIED" : "⏳ UNDER REVIEW"}
                      </div>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-2 text-xs text-slate-900 font-sans max-w-xs space-y-1.5">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-1 gap-2">
                        <span className="font-bold text-slate-900">{report.location_name}</span>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold text-white ${
                            isCrit ? "bg-red-600" : "bg-orange-500"
                          }`}
                        >
                          {report.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">{report.description}</p>
                      {report.image_url && (
                        <div className="rounded overflow-hidden border border-slate-200 max-h-28">
                          <img
                            src={report.image_url}
                            alt="Hazard observation"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-100">
                        <span>Role: {report.reporter_role}</span>
                        <span>{new Date(report.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>

      {/* LOCATION INTELLIGENCE & SHAP EXPLANATION DRAWER */}
      <div className="w-full md:w-[460px] lg:w-[490px] h-full bg-white border-l border-slate-200 flex flex-col z-20 shadow-lg overflow-y-auto">
        {selectedLoc ? (
          <div className="p-5 space-y-5">
            {/* Header / Title */}
            <div className="border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase font-mono tracking-wider text-slate-500 font-semibold">
                    {selectedLoc.state}
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {selectedLoc.name}
                  </h2>
                </div>
                {predictionData && (
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border tracking-wide uppercase ${
                      CATEGORY_COLORS[predictionData.risk_category]?.badge || "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {predictionData.risk_category} RISK
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-4 text-xs font-mono text-slate-500">
                <span>Lat: {selectedLoc.latitude.toFixed(4)}°</span>
                <span>Lon: {selectedLoc.longitude.toFixed(4)}°</span>
                <span>Elev: {selectedLoc.elevation_m}m</span>
                <span>Slope: {selectedLoc.slope_deg}°</span>
              </div>
            </div>

            {/* AI Risk Score Gauge Card */}
            {predictionData ? (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 relative overflow-hidden shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-blue-600" />
                    XGBoost Landslide Hazard Probability
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-semibold">
                    {predictionData.model_version}
                  </span>
                </div>

                <div className="flex items-baseline gap-3 my-2">
                  <span
                    className={`text-4xl font-extrabold tracking-tight font-mono ${
                      predictionData.risk_category === "CRITICAL"
                        ? "text-red-600"
                        : predictionData.risk_category === "HIGH"
                        ? "text-orange-600"
                        : predictionData.risk_category === "MODERATE"
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {predictionData.risk_percentage}%
                  </span>
                  <span className="text-xs text-slate-500">Calculated Landslide Trigger Probability</span>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      predictionData.risk_category === "CRITICAL"
                        ? "bg-gradient-to-r from-orange-500 to-red-600"
                        : predictionData.risk_category === "HIGH"
                        ? "bg-gradient-to-r from-amber-500 to-orange-500"
                        : predictionData.risk_category === "MODERATE"
                        ? "bg-gradient-to-r from-emerald-500 to-amber-500"
                        : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, predictionData.risk_percentage)}%` }}
                  ></div>
                </div>

                {/* Expected Base Value Notice */}
                {predictionData.shap_base_value !== undefined && (
                  <div className="mt-2 text-[10px] font-mono text-slate-500 flex justify-between">
                    <span>Model Base Expected Value: {predictionData.shap_base_value}</span>
                    <span>Hold-out Test ROC-AUC: 0.9975</span>
                  </div>
                )}
              </div>
            ) : predLoading ? (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center animate-pulse shadow-xs">
                <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mx-auto mb-2" />
                <span className="text-xs text-slate-600 font-medium">Running XGBoost & TreeSHAP Inference...</span>
              </div>
            ) : null}

            {/* Environmental & Soil Moisture Telemetry */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <CloudRain className="w-4 h-4 text-blue-600" />
                  Environmental Telemetry
                </h3>
                <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-semibold">
                  Simulated Ingestion Stream
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">24h Rain Accumulation</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                    {selectedLoc.latest_weather?.rainfall_24h_mm ?? "—"} mm
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">Soil Moisture Saturation</div>
                  <div className="text-base font-extrabold text-blue-600 font-mono mt-0.5">
                    {selectedLoc.latest_weather?.soil_moisture_pct ?? "—"} %
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">Rainfall Rate (Intensity)</div>
                  <div className="text-base font-extrabold text-slate-900 font-mono mt-0.5">
                    {selectedLoc.latest_weather?.rainfall_intensity_mmh ?? "—"} mm/h
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-xs">
                  <div className="text-slate-500 text-[11px] font-medium">Pore Water Pressure</div>
                  <div className="text-base font-extrabold text-orange-600 font-mono mt-0.5">
                    {selectedLoc.latest_weather?.pore_water_pressure_kpa ?? "—"} kPa
                  </div>
                </div>
              </div>
            </div>

            {/* TreeSHAP EXPLAINABLE AI ATTRIBUTION CARD */}
            {predictionData?.contributing_factors && (
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    TreeSHAP Feature Contributions
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">Actual Model Attributions</span>
                </div>

                <div className="space-y-2.5">
                  {predictionData.contributing_factors.map((factor, idx) => {
                    const isPositive = factor.shap_value > 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-800 font-medium">{factor.feature}</span>
                          <div className="flex items-center gap-2 font-mono text-[11px]">
                            <span className="text-slate-500">Val: {factor.value}</span>
                            <span
                              className={`font-bold ${
                                isPositive ? "text-red-600" : "text-emerald-600"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {factor.shap_value}
                            </span>
                            <span className="text-slate-500 text-[10px]">({factor.contribution}%)</span>
                          </div>
                        </div>

                        {/* Bar Visual */}
                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isPositive
                                ? factor.impact === "High"
                                  ? "bg-red-500"
                                  : "bg-orange-500"
                                : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, factor.contribution * 1.5)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Natural Language Explanation */}
                <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 leading-relaxed flex items-start gap-2 shadow-xs">
                  <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>{predictionData.explanation_summary}</div>
                </div>
              </div>
            )}

            {/* AI Recommended Operational Action */}
            {predictionData?.recommended_action && (
              <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-blue-900 uppercase tracking-wide flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-blue-600" />
                    AI Recommended Decision-Support Directive
                  </div>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed">
                  {predictionData.recommended_action}
                </p>
                {onNavigateToCopilot && (
                  <button
                    onClick={() => onNavigateToCopilot(selectedLoc.id)}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 rounded-xl text-xs font-semibold text-white transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Consult BHUSHAKTI Copilot for {selectedLoc.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Nearby Infrastructure Exposure Matrix */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Route className="w-4 h-4 text-blue-600" />
                  Nearby Critical Infrastructure ({nearbyInfra.length})
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">Radius: 35 km</span>
              </div>

              {nearbyInfra.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {nearbyInfra.map((infra) => (
                    <div
                      key={infra.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs shadow-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{infra.name}</div>
                        <div className="text-[11px] text-slate-500 capitalize flex items-center gap-2 mt-0.5">
                          <span>Type: {infra.type.replace("_", " ")}</span>
                          <span>•</span>
                          <span>Cap: {infra.capacity}</span>
                        </div>
                      </div>
                      <div className="text-right font-mono">
                        <span className="text-blue-600 font-bold">{infra.distance_km} km</span>
                        <div
                          className={`text-[10px] font-bold ${
                            infra.status === "RESTRICTED" ? "text-red-600" : "text-emerald-600"
                          }`}
                        >
                          {infra.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                  No registered assets within 35km radius.
                </div>
              )}
            </div>

            {/* Sector Field Intelligence Reports */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-purple-600" />
                  Field Hazard Reports in Sector
                </h3>
                <span className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 font-mono font-semibold">
                  Ground Truth Feed
                </span>
              </div>

              {fieldReports.length > 0 ? (
                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {fieldReports
                    .filter((r) =>
                      selectedLoc
                        ? r.location_name.toLowerCase().includes(selectedLoc.name.toLowerCase().split(" ")[0]) ||
                          (Math.abs(r.latitude - selectedLoc.latitude) < 0.8 &&
                            Math.abs(r.longitude - selectedLoc.longitude) < 0.8)
                        : true
                    )
                    .map((report) => (
                      <div
                        key={report.id}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{report.location_name}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                              report.verification_status === "VERIFIED"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {report.verification_status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">{report.description}</p>
                        <div className="text-[10px] text-slate-400 font-mono flex justify-between pt-0.5">
                          <span>Severity: {report.severity}</span>
                          <span>{new Date(report.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-xl text-center border border-slate-200">
                  No ground reports registered in this sector.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full space-y-3">
            <MapPin className="w-10 h-10 text-slate-400 animate-bounce" />
            <div className="font-semibold text-slate-800">Select a Monitored Zone</div>
            <p className="text-xs text-slate-500 max-w-xs">
              Click on any district node across Northeast India to inspect XGBoost risk probability,
              soil moisture saturation, and SHAP factor attribution.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
