import React, { useState, useEffect } from "react";
import {
  Route, Hospital, School, Home, Building2, MapPin, ShieldAlert,
  AlertTriangle, CheckCircle2, ChevronRight, RefreshCw, Filter,
  Layers, Users, Compass, ShieldCheck
} from "lucide-react";
import { api } from "../services/api";

const TYPE_ICONS = {
  highway_corridor: Route,
  bridge: Compass,
  hospital: Hospital,
  school: School,
  village: Home,
  shelter: ShieldCheck,
};

export default function Infrastructure() {
  const [locations, setLocations] = useState([]);
  const [selectedLocId, setSelectedLocId] = useState(null);
  const [radiusKm, setRadiusKm] = useState(35);
  const [impactData, setImpactData] = useState(null);
  const [activeTypeFilter, setActiveTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [impactLoading, setImpactLoading] = useState(false);

  // Load all monitored districts
  useEffect(() => {
    const loadDistricts = async () => {
      try {
        const zones = await api.getRiskZones();
        setLocations(zones);
        if (zones.length > 0) {
          // Default to highest risk district or first
          const sorted = [...zones].sort((a, b) => b.baseline_risk_score - a.baseline_risk_score);
          setSelectedLocId(sorted[0].id);
        }
      } catch (err) {
        console.error("Failed to load districts:", err);
      } finally {
        setLoading(false);
      }
    };
    loadDistricts();
  }, []);

  // Fetch hotspot infrastructure impact whenever selected location or radius changes
  useEffect(() => {
    if (!selectedLocId) return;

    const fetchImpact = async () => {
      setImpactLoading(true);
      try {
        const data = await api.getHotspotInfrastructureImpact(selectedLocId, radiusKm);
        setImpactData(data);
      } catch (err) {
        console.error("Failed to fetch infrastructure impact:", err);
      } finally {
        setImpactLoading(false);
      }
    };
    fetchImpact();
  }, [selectedLocId, radiusKm]);

  // Consolidate all infrastructure for current hotspot
  const allAssets = impactData
    ? [
        ...(impactData.highway_corridors || []),
        ...(impactData.critical_bridges || []),
        ...(impactData.medical_facilities || []),
        ...(impactData.schools || []),
        ...(impactData.vulnerable_villages || []),
        ...(impactData.emergency_shelters || []),
      ]
    : [];

  const filteredAssets = allAssets.filter((a) => {
    if (activeTypeFilter === "ALL") return true;
    return a.type === activeTypeFilter;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-slate-900 space-y-6 bg-slate-50 min-h-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-mono text-blue-600 font-semibold uppercase tracking-widest">
              Geospatial Infrastructure Monitoring & Evacuation Routing
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <Route className="w-7 h-7 text-blue-600" />
            Infrastructure Risk & Exposure Matrix
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Spatial proximity assessment of mountain highways, bridges, medical facilities, and designated relief shelters.
          </p>
        </div>

        {/* Hotspot District Selector Dropdown */}
        <div className="flex items-center gap-3">
          <div className="bg-white border border-slate-200 p-1.5 rounded-xl flex items-center gap-2 shadow-xs">
            <span className="text-xs text-slate-500 font-semibold pl-2">Hotspot:</span>
            <select
              value={selectedLocId || ""}
              onChange={(e) => setSelectedLocId(parseInt(e.target.value))}
              className="bg-slate-50 text-slate-900 text-xs font-bold rounded-lg px-3 py-1.5 border border-slate-300 outline-none focus:border-blue-500 cursor-pointer"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.state}) — {loc.current_risk_score}% Risk
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* SEARCH RADIUS & HOTSPOT SUMMARY BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Hotspot details */}
        {impactData?.hotspot && (
          <div className="flex items-center gap-4 text-xs">
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block font-mono font-semibold">Epicenter Sector</span>
              <span className="font-extrabold text-slate-900 text-sm">{impactData.hotspot.name}</span>
              <span className="text-[11px] text-blue-700 block font-mono font-semibold">
                {impactData.hotspot.state} • Elev: {impactData.hotspot.elevation_m}m
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 uppercase block font-mono font-semibold">Model Hazard Score</span>
              <span
                className={`font-extrabold text-sm font-mono ${
                  impactData.hotspot.current_risk_score >= 75
                    ? "text-red-600"
                    : impactData.hotspot.current_risk_score >= 50
                    ? "text-orange-600"
                    : "text-amber-600"
                }`}
              >
                {impactData.hotspot.current_risk_score}%
              </span>
              <span className="text-[11px] text-slate-500 block font-mono">
                Slope: {impactData.hotspot.slope_deg}°
              </span>
            </div>
          </div>
        )}

        {/* Radius Slider */}
        <div className="w-full md:w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
          <div className="flex justify-between font-mono">
            <span className="text-slate-600 font-medium">Proximity Radius:</span>
            <span className="text-blue-700 font-bold">{radiusKm} km</span>
          </div>
          <input
            type="range"
            min="10"
            max="60"
            step="5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(parseInt(e.target.value))}
            className="w-full accent-blue-600 bg-slate-200 rounded cursor-pointer"
          />
        </div>
      </div>

      {/* SUMMARY KPI GRID */}
      {impactData?.impact_summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <Route className="w-5 h-5 text-orange-600 mx-auto mb-1" />
            <div className="font-mono font-extrabold text-lg text-slate-900">
              {impactData.impact_summary.highways_count}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Highway Corridors</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <Compass className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="font-mono font-extrabold text-lg text-slate-900">
              {impactData.impact_summary.bridges_count}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Critical Bridges</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <Hospital className="w-5 h-5 text-red-600 mx-auto mb-1" />
            <div className="font-mono font-extrabold text-lg text-slate-900">
              {impactData.impact_summary.hospitals_count}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Hospitals & Trauma</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <Home className="w-5 h-5 text-amber-600 mx-auto mb-1" />
            <div className="font-mono font-extrabold text-lg text-slate-900">
              {impactData.impact_summary.villages_count}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Vulnerable Villages</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <School className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
            <div className="font-mono font-extrabold text-lg text-slate-900">
              {impactData.impact_summary.schools_count}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Schools / Campuses</div>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-slate-200 text-center shadow-xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 mx-auto mb-1" />
            <div className="font-mono font-extrabold text-lg text-blue-600">
              {impactData.impact_summary.total_shelter_capacity.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Shelter Capacity</div>
          </div>
        </div>
      )}

      {/* FILTER BUTTONS */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2.5 rounded-xl border border-slate-200 text-xs shadow-xs">
        <span className="text-slate-500 font-semibold mr-1 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          Filter Type:
        </span>
        {[
          { id: "ALL", label: "All Infrastructure" },
          { id: "highway_corridor", label: "Highways & Roads" },
          { id: "bridge", label: "Bridges" },
          { id: "hospital", label: "Hospitals" },
          { id: "shelter", label: "Relief Shelters" },
          { id: "village", label: "Villages" },
          { id: "school", label: "Schools" },
        ].map((btn) => (
          <button
            key={btn.id}
            onClick={() => setActiveTypeFilter(btn.id)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              activeTypeFilter === btn.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* MAIN ASSET LIST */}
      <div className="space-y-3">
        {filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => {
            const IconComponent = TYPE_ICONS[asset.type] || Building2;
            const isRestricted = asset.status === "RESTRICTED" || asset.status === "VULNERABLE";
            return (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-300 transition shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3.5 flex-1">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center flex-shrink-0 text-blue-600 shadow-xs">
                    <IconComponent className="w-5 h-5" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{asset.name}</h3>
                      <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-700 capitalize border border-slate-200">
                        {asset.type.replace("_", " ")}
                      </span>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                          isRestricted
                            ? "bg-red-100 text-red-700 border border-red-200"
                            : "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {asset.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-slate-500 font-mono text-[11px]">
                      <span>Capacity: {asset.capacity?.toLocaleString()} persons</span>
                      <span>•</span>
                      <span>Criticality: {asset.criticality}</span>
                      {asset.blockage_probability !== null && asset.blockage_probability !== undefined && (
                        <>
                          <span>•</span>
                          <span className="text-orange-700 font-bold">
                            Blockage Risk: {asset.blockage_probability}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Distance readout */}
                <div className="text-right flex-shrink-0 font-mono pl-4 border-l border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Distance from Hotspot</div>
                  <div className="text-xl font-extrabold text-blue-700">{asset.distance_km} km</div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
            <div className="font-bold text-slate-800">No Assets Under Selected Filter</div>
            <p className="text-xs text-slate-500">
              Try increasing the search radius or selecting another asset type.
            </p>
          </div>
        )}
      </div>

      {/* EVACUATION SHELTER ROUTING SUMMARY */}
      {impactData?.emergency_shelters && impactData.emergency_shelters.length > 0 && (
        <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Designated Evacuation Shelters for {impactData.hotspot.name}
            </h3>
            <span className="text-xs font-mono text-blue-700 font-bold">
              Closest Open Route Matching
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {impactData.emergency_shelters.map((shelter, idx) => (
              <div
                key={idx}
                className="p-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {shelter.name}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Capacity: {shelter.capacity} evacuees • Status: {shelter.status}
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="text-blue-700 font-bold">{shelter.distance_km} km</span>
                  <div className="text-[10px] text-emerald-700 font-bold">DIRECT ROUTE</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
