const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api";

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP Error ${res.status}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // System Health
  getHealth: () => fetchApi("/health"),

  // Risk Overview & Zones
  getRiskOverview: () => fetchApi("/risk-overview"),
  getRiskZones: () => fetchApi("/risk-zones"),
  getRiskZoneById: (id) => fetchApi(`/risk/${id}`),

  // Weather Telemetry & Simulation Controls
  getLatestWeather: () => fetchApi("/weather/latest"),
  getWeatherHistory: (locationId, limit = 50) =>
    fetchApi(`/weather/history?limit=${limit}${locationId ? `&location_id=${locationId}` : ""}`),
  getSimulatorStatus: () => fetchApi("/weather/simulator/status"),
  setSimulatorScenario: (scenario) =>
    fetchApi("/weather/simulator/scenario", {
      method: "POST",
      body: JSON.stringify({ scenario }),
    }),
  triggerSimulatorTick: () =>
    fetchApi("/weather/simulator/trigger-tick", {
      method: "POST",
    }),

  // AI & SHAP Prediction
  predictRisk: (payload) =>
    fetchApi("/predict", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  // Infrastructure & Geospatial Hotspot Impact
  getAllInfrastructure: (type = "") =>
    fetchApi(`/infrastructure${type ? `?infra_type=${type}` : ""}`),
  getNearbyInfrastructure: (lat, lon, radiusKm = 35, type = "") =>
    fetchApi(
      `/infrastructure/nearby?latitude=${lat}&longitude=${lon}&radius_km=${radiusKm}${type ? `&infra_type=${type}` : ""}`
    ),
  getHotspotInfrastructureImpact: (locationId, radiusKm = 40) =>
    fetchApi(`/infrastructure/hotspot/${locationId}/impact?radius_km=${radiusKm}`),

  // Early Warnings
  getWarnings: (severity = "", acknowledged = null) => {
    const params = new URLSearchParams();
    if (severity) params.append("severity", severity);
    if (acknowledged !== null) params.append("acknowledged", acknowledged);
    const qs = params.toString();
    return fetchApi(`/warnings${qs ? `?${qs}` : ""}`);
  },
  getWarningThresholds: () => fetchApi("/warnings/thresholds"),
  acknowledgeWarning: (warningId, operatorName = "NDMA_DUTY_OFFICER") =>
    fetchApi(`/warnings/${warningId}/acknowledge`, {
      method: "POST",
      body: JSON.stringify({ operator_name: operatorName }),
    }),
  broadcastWarning: (warningId, channels = ["SMS", "CAP_BROADCAST", "RADIO_SIREN"]) =>
    fetchApi(`/warnings/${warningId}/broadcast`, {
      method: "POST",
      body: JSON.stringify({ channels }),
    }),

  // Field Reports
  getFieldReports: () => fetchApi("/field-reports"),
  submitFieldReport: (report) =>
    fetchApi("/field-reports", {
      method: "POST",
      body: JSON.stringify(report),
    }),
  updateFieldReportStatus: (reportId, verificationStatus) =>
    fetchApi(`/field-reports/${reportId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ verification_status: verificationStatus }),
    }),

  // Copilot
  getQuickPrompts: () => fetchApi("/copilot/quick-prompts"),
  askCopilot: (query, locationId = null, contextData = {}) =>
    fetchApi("/copilot", {
      method: "POST",
      body: JSON.stringify({
        query,
        location_id: locationId,
        context_data: contextData,
      }),
    }),
};
