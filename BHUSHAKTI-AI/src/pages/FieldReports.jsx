import React, { useState, useEffect } from "react";
import {
  FileText, Plus, CheckCircle2, AlertTriangle, ShieldAlert,
  Camera, MapPin, Send, RefreshCw, Filter, Clock, Check, X, Eye
} from "lucide-react";
import { api } from "../services/api";

const HAZARD_TYPES = [
  { id: "landslide", label: "Landslide / Debris Slide" },
  { id: "slope_crack", label: "Tension Cracks on Slope" },
  { id: "rockfall", label: "Rockfall Detachment" },
  { id: "road_blockage", label: "Corridor / Road Blockage" },
  { id: "water_seepage", label: "Muddy Water Seepage / Wall Bulging" },
];

const PRESET_COORDS = [
  { name: "Dibang Valley NH-13 KM-42 Cut", lat: 28.6210, lon: 95.8420 },
  { name: "Sohra Eco-Park Cliff Face", lat: 25.2920, lon: 91.7280 },
  { name: "Mangan-Chungthang Road Junction", lat: 27.5150, lon: 88.5320 },
  { name: "Kohima NH-29 Bypass Cut", lat: 25.6810, lon: 94.0950 },
  { name: "Aizawl Durtlang Ridge", lat: 23.7650, lon: 92.7380 },
];

export default function FieldReports({ onNavigateToMap }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL, VERIFIED, UNDER_REVIEW
  const [showForm, setShowForm] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    location_name: "",
    latitude: 28.6210,
    longitude: 95.8420,
    hazard_type: "landslide",
    severity: "HIGH",
    description: "",
    image_url: "",
    reporter_role: "FIELD_RANGER",
  });
  const [formSuccess, setFormSuccess] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.getFieldReports();
      setReports(data);
    } catch (err) {
      console.error("Failed to fetch field reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePresetSelect = (preset) => {
    setFormData((prev) => ({
      ...prev,
      location_name: preset.name,
      latitude: preset.lat,
      longitude: preset.lon,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.location_name || !formData.description) return;

    setSubmitting(true);
    try {
      await api.submitFieldReport(formData);
      setFormSuccess(true);
      setFormData({
        location_name: "",
        latitude: 28.6210,
        longitude: 95.8420,
        hazard_type: "landslide",
        severity: "HIGH",
        description: "",
        image_url: "",
        reporter_role: "FIELD_RANGER",
      });
      await fetchReports();
      setTimeout(() => {
        setFormSuccess(false);
        setShowForm(false);
      }, 2000);
    } catch (err) {
      console.error("Error submitting report:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyStatus = async (reportId, newStatus) => {
    try {
      await api.updateFieldReportStatus(reportId, newStatus);
      await fetchReports();
    } catch (err) {
      console.error("Failed to update report status:", err);
    }
  };

  const filteredReports = reports.filter((r) => {
    if (statusFilter === "ALL") return true;
    return r.verification_status === statusFilter;
  });

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto text-slate-900 space-y-6 bg-slate-50 min-h-full">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-600"></span>
            <span className="text-xs font-mono text-blue-600 font-semibold uppercase tracking-widest">
              Ground Intelligence & Field Observations
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-blue-600" />
            Field Hazard Reports & Verification
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Crowdsourced and ranger-verified ground observation feeds calibrated to the risk model.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-2"
          >
            {showForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showForm ? "Cancel Submission" : "Submit Ground Report"}
          </button>
          <button
            onClick={fetchReports}
            className="p-2 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 transition shadow-xs hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
          </button>
        </div>
      </div>

      {/* REPORT SUBMISSION FORM MODAL / PANEL */}
      {showForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" />
              Submit Ground Hazard Observation
            </h2>
            <span className="text-xs font-mono text-blue-700 font-semibold">PostGIS Ingestion API</span>
          </div>

          {formSuccess ? (
            <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div className="font-bold text-emerald-800 text-sm">
                Report Submitted Successfully!
              </div>
              <p className="text-xs text-slate-600">
                Ground observation logged and forwarded to District Disaster Management for verification.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Presets Row */}
              <div>
                <label className="text-slate-700 font-semibold mb-1.5 block">
                  Quick Location Presets:
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COORDS.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handlePresetSelect(p)}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[11px] text-slate-800 font-medium transition"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Location / Highway Cut Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. NH-13 KM-42 Mountain Cutting"
                    value={formData.location_name}
                    onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Latitude (°N)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Longitude (°E)</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Hazard Type *</label>
                  <select
                    value={formData.hazard_type}
                    onChange={(e) => setFormData({ ...formData, hazard_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  >
                    {HAZARD_TYPES.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Observed Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="CRITICAL">CRITICAL (Direct Impending Failure)</option>
                    <option value="HIGH">HIGH (Debris detachment / Cracks)</option>
                    <option value="MODERATE">MODERATE (Seepage / Road Slumping)</option>
                    <option value="LOW">LOW (Minor Scour)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-700 font-semibold mb-1 block">Reporter Role</label>
                  <select
                    value={formData.reporter_role}
                    onChange={(e) => setFormData({ ...formData, reporter_role: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500"
                  >
                    <option value="FIELD_RANGER">Field Ranger / SDRF Officer</option>
                    <option value="CITIZEN">Citizen Volunteer / Local Resident</option>
                    <option value="NDMA_OFFICER">NDMA Inspection Officer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Detailed Ground Description *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Describe ground displacement, crack width, pore water seepage, road blockage dimensions, and downslope habitations..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg p-3 text-slate-900 outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div>
                <label className="text-slate-700 font-semibold mb-1 block">Image URL / Proof (Optional)</label>
                <input
                  type="text"
                  placeholder="https://... or photo metadata"
                  value={formData.image_url || ""}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-slate-900 outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition shadow-xs flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submitting ? "Transmitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* FILTER BAR */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 text-xs shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-blue-600" />
            Verification Status:
          </span>
          {["ALL", "VERIFIED", "UNDER_REVIEW"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                statusFilter === st
                  ? "bg-blue-600 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        <span className="text-slate-500 font-mono text-[11px] font-semibold">
          {filteredReports.length} Ground Reports
        </span>
      </div>

      {/* REPORTS LIST */}
      <div className="space-y-3">
        {filteredReports.length > 0 ? (
          filteredReports.map((report) => {
            const isVerified = report.verification_status === "VERIFIED";
            const isCrit = report.severity === "CRITICAL";

            return (
              <div
                key={report.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition shadow-xs space-y-3 text-xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${
                        isCrit
                          ? "bg-red-100 text-red-700 border-red-200"
                          : "bg-orange-100 text-orange-700 border-orange-200"
                      }`}
                    >
                      {report.severity}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-sm">{report.location_name}</h3>
                    <span className="text-[10px] text-blue-700 font-mono font-semibold capitalize">
                      Hazard: {report.hazard_type.replace("_", " ")}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                        isVerified
                          ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {report.verification_status}
                    </span>

                    {/* Verification Action Buttons */}
                    {!isVerified && (
                      <button
                        onClick={() => handleVerifyStatus(report.id, "VERIFIED")}
                        className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold transition flex items-center gap-1 shadow-xs"
                      >
                        <Check className="w-3 h-3" /> Verify Report
                      </button>
                    )}
                  </div>
                </div>

                <p className="text-slate-700 text-xs leading-relaxed">{report.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span>Coordinates: {report.latitude.toFixed(4)}°N, {report.longitude.toFixed(4)}°E</span>
                    <span>•</span>
                    <span>Role: {report.reporter_role}</span>
                  </div>
                  <span>Timestamp: {new Date(report.created_at).toLocaleString()}</span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-blue-600 mx-auto" />
            <div className="font-bold text-slate-800">No Ground Reports Under Selected Filter</div>
            <p className="text-xs text-slate-500">
              Submit a new field report using the button above.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
