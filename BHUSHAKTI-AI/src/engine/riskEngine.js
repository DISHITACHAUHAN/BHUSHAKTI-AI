/**
 * BHUSHAKTI AI - Prototype Risk & Recommendation Engine
 * SIH 2026 Prototype Engine Layer
 * 
 * Implements:
 * 1. Multi-factor weighted risk scoring
 * 2. Risk level classification (SAFE: 0-19, WATCH: 20-39, MODERATE: 40-59, HIGH: 60-79, CRITICAL: 80-100)
 * 3. Explainable factor contributions (SHAP-like attribution breakdown)
 * 4. Rule-based Response Recommendation Engine
 * 5. Population & Infrastructure Exposure Calculator
 * 6. Dynamic Early Warning Alert Formatter
 */

import { RISK_WEIGHTS, FACTOR_LABELS, FACTOR_METADATA } from "../data/districtsData.js";

/**
 * Extracts normalized factor values from a district or telemetry object
 */
export function extractFactors(d) {
  if (!d) return {};
  return {
    rainfall: d.rainfall ?? 0,
    soil: d.soil ?? 0,
    slope: d.slope ?? 0,
    historical: d.historical ?? 0,
    veg: d.veg ?? 0,
    road: d.road ?? 0,
    satellite: d.satellite ?? 0,
  };
}

/**
 * Computes the composite weighted risk score (0–100)
 */
export function computeRiskScore(factors, weights = RISK_WEIGHTS) {
  const f = typeof factors === "object" && factors !== null ? factors : {};
  const w = typeof weights === "object" && weights !== null ? weights : RISK_WEIGHTS;
  const sum = Object.keys(w).reduce((acc, k) => {
    const val = f[k] ?? 0;
    const wt = w[k] ?? 0;
    return acc + val * wt;
  }, 0);
  return Math.max(0, Math.min(100, Math.round(sum)));
}

/**
 * Maps a risk score to standard UI presentation tokens, color codes, and risk level
 * Exact Thresholds:
 * 0–19    SAFE
 * 20–39   WATCH
 * 40–59   MODERATE
 * 60–79   HIGH
 * 80–100  CRITICAL
 */
export function getRiskMeta(score) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  if (s >= 80) {
    return {
      level: "CRITICAL",
      threshold: "80-100",
      hex: "#dc2626",
      dot: "bg-red-600",
      text: "text-red-700",
      bg: "bg-red-50",
      border: "border-red-200",
      ring: "ring-red-500/50",
      glow: "shadow-red-500/10",
    };
  }
  if (s >= 60) {
    return {
      level: "HIGH",
      threshold: "60-79",
      hex: "#ea580c",
      dot: "bg-orange-500",
      text: "text-orange-700",
      bg: "bg-orange-50",
      border: "border-orange-200",
      ring: "ring-orange-500/50",
      glow: "shadow-orange-500/10",
    };
  }
  if (s >= 40) {
    return {
      level: "MODERATE",
      threshold: "40-59",
      hex: "#d97706",
      dot: "bg-amber-500",
      text: "text-amber-800",
      bg: "bg-amber-50",
      border: "border-amber-200",
      ring: "ring-amber-400/50",
      glow: "shadow-amber-500/10",
    };
  }
  if (s >= 20) {
    return {
      level: "WATCH",
      threshold: "20-39",
      hex: "#0284c7",
      dot: "bg-sky-500",
      text: "text-sky-800",
      bg: "bg-sky-50",
      border: "border-sky-200",
      ring: "ring-sky-400/50",
      glow: "shadow-sky-500/10",
    };
  }
  return {
    level: "SAFE",
    threshold: "0-19",
    hex: "#059669",
    dot: "bg-emerald-600",
    text: "text-emerald-800",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    ring: "ring-emerald-500/50",
    glow: "shadow-emerald-500/10",
  };
}

/**
 * Returns alert badge configuration for early warning feeds
 */
export function getSeverityAlertBadge(score) {
  const s = Math.round(score);
  if (s >= 80) return { label: "RED", sub: "EVACUATE", cls: "bg-red-500 text-white" };
  if (s >= 60) return { label: "ORANGE", sub: "PREPARE", cls: "bg-orange-500 text-white" };
  if (s >= 40) return { label: "YELLOW", sub: "ADVISORY", cls: "bg-amber-400 text-slate-950" };
  if (s >= 20) return { label: "BLUE", sub: "WATCH", cls: "bg-sky-500 text-white" };
  return { label: "GREEN", sub: "NORMAL", cls: "bg-emerald-500 text-white" };
}

/**
 * Calculates explainable factor contributions (SHAP-like percentage share)
 */
export function computeExplainableContributions(factors, weights = RISK_WEIGHTS) {
  const f = typeof factors === "object" && factors !== null ? factors : {};
  const w = typeof weights === "object" && weights !== null ? weights : RISK_WEIGHTS;
  const raw = Object.keys(w).map((k) => {
    const val = f[k] ?? 0;
    const wt = w[k] ?? 0;
    const contribution = val * wt;
    return {
      key: k,
      label: FACTOR_LABELS[k] || k,
      value: val,
      weight: wt,
      contribution,
      meta: FACTOR_METADATA[k] || null,
    };
  });

  const total = raw.reduce((s, r) => s + r.contribution, 0) || 1;
  return raw
    .map((r) => ({
      ...r,
      pct: Math.round((r.contribution / total) * 100),
    }))
    .sort((a, b) => b.contribution - a.contribution);
}

/**
 * Dynamically generates a domain-accurate, explainable risk explanation
 */
export function generateRiskExplanation(district, factors) {
  const f = factors || extractFactors(district);
  const c = computeExplainableContributions(f);
  const top = c[0] || { label: "Precipitation Intensity", value: 50 };
  const second = c[1] || { label: "Soil Saturation", value: 45 };
  const name = district?.name || "Target Sector";

  return `Risk is elevated primarily due to ${top.label.toLowerCase()} at ${top.value}%, compounded by ${second.label.toLowerCase()} at ${second.value}%, consistent with terrain gradients and historical landslide patterns recorded within a 5km radius of ${name}.`;
}

/**
 * Response Recommendation Engine:
 * Small, reusable, transparent rule-based recommendation function
 * 
 * Rules:
 * Risk < 40: Continue routine monitoring.
 * Risk 40–59: Increase monitoring frequency and pre-position resources.
 * Risk 60–79: Restrict access to vulnerable road sections and deploy monitoring teams.
 * Risk >= 80: Prepare evacuation of vulnerable settlements and restrict all traffic.
 */
export function generateRecommendedAction(district, score) {
  const s = Math.max(0, Math.min(100, Math.round(score)));
  const keyRoad = district?.keyRoad || "primary transport artery";
  const villages = district?.villagesExposed ?? 2;
  const name = district?.name || "the district sector";

  if (s >= 80) {
    return `Initiate emergency coordination immediately: prepare evacuation of ${villages} vulnerable settlement(s) near ${name}, restrict all transport on ${keyRoad}, and mobilize district quick-response teams.`;
  }
  if (s >= 60) {
    return `Restrict access to vulnerable road sections on ${keyRoad}, issue localized travel advisories, and deploy field monitoring teams to high-slope sections.`;
  }
  if (s >= 40) {
    return `Increase sensor polling frequency, pre-position emergency response resources near ${name}, and notify village disaster management committees.`;
  }
  return `Continue routine automated monitoring. All environmental indicators remain within operational baseline.`;
}

/**
 * Exposure Calculator: Computes population and infrastructure exposure metrics
 */
export function calculateExposureSummary(districts) {
  const list = Array.isArray(districts) ? districts : [districts];
  return list.reduce(
    (acc, d) => ({
      population: acc.population + (d?.population || 0),
      roads: acc.roads + (d?.roadsAffected || 0),
      bridges: acc.bridges + (d?.bridges || 0),
      schools: acc.schools + (d?.schools || 0),
      hospitals: acc.hospitals + (d?.hospitals || 0),
      powerAssets: acc.powerAssets + (d?.powerAssets || 0),
      villagesExposed: acc.villagesExposed + (d?.villagesExposed || 0),
    }),
    {
      population: 0,
      roads: 0,
      bridges: 0,
      schools: 0,
      hospitals: 0,
      powerAssets: 0,
      villagesExposed: 0,
    }
  );
}

/**
 * Formats a dynamic early warning alert payload for decision-support
 */
export function formatEarlyWarningAlert(district, score) {
  const s = Math.round(score);
  const meta = getRiskMeta(s);
  const badge = getSeverityAlertBadge(s);
  const contribs = computeExplainableContributions(extractFactors(district));
  const recommendation = generateRecommendedAction(district, s);

  return {
    id: `alert-${district.id}-${Date.now()}`,
    districtId: district.id,
    location: `${district.name}, ${district.state}`,
    score: s,
    level: meta.level,
    badge,
    affectedPopulation: district.population,
    affectedInfrastructure: {
      roads: district.roadsAffected,
      bridges: district.bridges || 1,
      schools: district.schools || 2,
      hospitals: district.hospitals || 1,
      powerAssets: district.powerAssets || 1,
      keyRoad: district.keyRoad,
    },
    topContributors: contribs.slice(0, 2).map((c) => `${c.label} (${c.pct}%)`),
    recommendedAction: recommendation,
    timestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: false }),
    disclaimer: "Prototype decision-support recommendation (Simulated)",
  };
}

/**
 * Enriches a raw district object with all calculated risk parameters and exposure data
 */
export function enrichDistrictWithRisk(district, weights = RISK_WEIGHTS) {
  if (!district) return null;
  const w = typeof weights === "object" && weights !== null ? weights : RISK_WEIGHTS;
  const factors = extractFactors(district);
  const score = computeRiskScore(factors, w);
  const meta = getRiskMeta(score);
  const contributions = computeExplainableContributions(factors, w);
  const explanation = generateRiskExplanation(district, factors);
  const recommendation = generateRecommendedAction(district, score);

  return {
    ...district,
    score,
    meta,
    contributions,
    explanation,
    recommendation,
  };
}
