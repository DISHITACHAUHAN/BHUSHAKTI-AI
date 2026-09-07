/**
 * BHUSHAKTI AI - Controlled Environmental, Sensor & Disaster Simulation Engine
 * SIH 2026 Prototype Telemetry & Scenario Layer
 * 
 * Provides:
 * 1. Physically coherent, continuous ambient telemetry (AWS/MEMS)
 * 2. Simulated satellite InSAR and optical NDVI indicators
 * 3. Controlled 13-step deterministic Disaster Simulation scenario
 */

import {
  computeRiskScore,
  getRiskMeta,
  computeExplainableContributions,
  generateRiskExplanation,
  generateRecommendedAction,
  extractFactors,
} from "./riskEngine.js";

/**
 * 13-Step Deterministic Disaster Scenario Sequence
 * Represents full Sense -> Understand -> Predict -> Warn -> Act -> Learn lifecycle
 */
export const DISASTER_SCENARIO_STEPS = [
  {
    step: 1,
    title: "Normal Baseline Conditions",
    note: "All sensor clusters reporting normal operational baseline across Northeast India.",
    targetRainfall: 35,
    targetSoil: 40,
    slopeDeformationMm: 1.5,
    terrainDisturbance: "LOW",
    debrisDetected: "NO",
    roadObstructed: "NO",
    responseStatus: "STANDBY",
    emergency: false,
  },
  {
    step: 2,
    title: "Heavy Rainfall Begins",
    note: "Automated Weather Station (AWS) records initial intense precipitation surge (+20 mm/h).",
    targetRainfall: 52,
    targetSoil: 48,
    slopeDeformationMm: 2.8,
    terrainDisturbance: "LOW",
    debrisDetected: "NO",
    roadObstructed: "NO",
    responseStatus: "MONITORING",
    emergency: false,
  },
  {
    step: 3,
    title: "Rainfall Intensity Surges",
    note: "Precipitation rate crosses 48 mm/h; localized catchment runoff accelerates.",
    targetRainfall: 68,
    targetSoil: 58,
    slopeDeformationMm: 4.5,
    terrainDisturbance: "MODERATE",
    debrisDetected: "NO",
    roadObstructed: "NO",
    responseStatus: "MONITORING",
    emergency: false,
  },
  {
    step: 4,
    title: "Soil Moisture Saturation Increases",
    note: "In-situ piezometers report subsurface pore water pressure reaching advisory threshold (62 kPa).",
    targetRainfall: 76,
    targetSoil: 68,
    slopeDeformationMm: 7.2,
    terrainDisturbance: "MODERATE",
    debrisDetected: "NO",
    roadObstructed: "NO",
    responseStatus: "ADVISORY_ACTIVE",
    emergency: false,
  },
  {
    step: 5,
    title: "Composite Risk Score Increases",
    note: "Prototype risk engine computes elevated composite risk score crossing Moderate threshold.",
    targetRainfall: 82,
    targetSoil: 75,
    slopeDeformationMm: 9.8,
    terrainDisturbance: "MODERATE",
    debrisDetected: "NO",
    roadObstructed: "NO",
    responseStatus: "ALERT_PENDING",
    emergency: false,
  },
  {
    step: 6,
    title: "Risk Level Escalates to HIGH",
    note: "Multi-factor algorithm shifts district risk status to HIGH (Orange Alert).",
    targetRainfall: 88,
    targetSoil: 82,
    slopeDeformationMm: 12.4,
    terrainDisturbance: "HIGH",
    debrisDetected: "NO",
    roadObstructed: "PARTIAL",
    responseStatus: "TRAVEL_ADVISORY_ISSUED",
    emergency: false,
  },
  {
    step: 7,
    title: "Satellite InSAR & Field Warning Appears",
    note: "Sentinel-1 DInSAR surface deformation anomaly (>14mm/h) and slope crack confirmed by field sensor.",
    targetRainfall: 91,
    targetSoil: 86,
    slopeDeformationMm: 14.8,
    terrainDisturbance: "HIGH",
    debrisDetected: "YES",
    roadObstructed: "PARTIAL",
    responseStatus: "FIELD_TEAMS_ALERTED",
    emergency: false,
  },
  {
    step: 8,
    title: "Risk Breaches CRITICAL Threshold",
    note: "Extreme slope instability detected: composite score exceeds 80/100 (Red Critical Level).",
    targetRainfall: 96,
    targetSoil: 92,
    slopeDeformationMm: 18.2,
    terrainDisturbance: "CRITICAL",
    debrisDetected: "YES",
    roadObstructed: "YES",
    responseStatus: "RED_ALERT_TRIGGERED",
    emergency: true,
  },
  {
    step: 9,
    title: "Critical Early Warning Alert Broadcast",
    note: "Multi-channel automated early warning generated for district administration and emergency coordinators.",
    targetRainfall: 98,
    targetSoil: 95,
    slopeDeformationMm: 21.0,
    terrainDisturbance: "CRITICAL",
    debrisDetected: "YES",
    roadObstructed: "YES",
    responseStatus: "WARNING_BROADCAST",
    emergency: true,
  },
  {
    step: 10,
    title: "Affected Population Exposure Calculated",
    note: "Demographic risk overlay calculates 4,820 vulnerable residents across 5 exposed village settlements.",
    targetRainfall: 99,
    targetSoil: 96,
    slopeDeformationMm: 22.5,
    terrainDisturbance: "CRITICAL",
    debrisDetected: "YES",
    roadObstructed: "YES",
    responseStatus: "EVACUATION_MAPPED",
    emergency: true,
  },
  {
    step: 11,
    title: "Critical Infrastructure Exposure Mapped",
    note: "Corridor assessment identifies 2 road segments, 3 bridge spans, and 2 school centers in direct impact zone.",
    targetRainfall: 99,
    targetSoil: 97,
    slopeDeformationMm: 23.8,
    terrainDisturbance: "CRITICAL",
    debrisDetected: "YES",
    roadObstructed: "YES",
    responseStatus: "INFRASTRUCTURE_SECURED",
    emergency: true,
  },
  {
    step: 12,
    title: "Recommended Action Engine Generates Response",
    note: "Evacuation protocol generated: route evacuees to Shelter A (Anini Hall); close NH-13 corridor traffic.",
    targetRainfall: 99,
    targetSoil: 98,
    slopeDeformationMm: 24.5,
    terrainDisturbance: "CRITICAL",
    debrisDetected: "YES",
    roadObstructed: "YES",
    responseStatus: "ACTION_PLAN_ACTIVE",
    emergency: true,
  },
  {
    step: 13,
    title: "Emergency Response Status: DEPLOYED",
    note: "District Disaster Management Authority response teams deployed. Shelters active. Closed-loop verified.",
    targetRainfall: 99,
    targetSoil: 98,
    slopeDeformationMm: 25.0,
    terrainDisturbance: "CRITICAL",
    debrisDetected: "YES",
    roadObstructed: "YES",
    responseStatus: "DEPLOYED",
    emergency: true,
  },
];

/**
 * District specific elevation and base microclimate offsets
 */
const DISTRICT_CLIMATE_PROFILES = {
  tawang: { baseTemp: 14.2, baseHumidity: 88, stormSensitivity: 1.25, phaseOffset: 0.2 },
  dibang: { baseTemp: 17.5, baseHumidity: 94, stormSensitivity: 1.40, phaseOffset: 0.0 },
  esiang: { baseTemp: 24.1, baseHumidity: 82, stormSensitivity: 1.10, phaseOffset: 0.8 },
  wkameng: { baseTemp: 18.0, baseHumidity: 78, stormSensitivity: 0.95, phaseOffset: 1.4 },
  ekhasi: { baseTemp: 19.2, baseHumidity: 91, stormSensitivity: 1.20, phaseOffset: 2.1 },
  wgaro: { baseTemp: 26.4, baseHumidity: 72, stormSensitivity: 0.70, phaseOffset: 2.9 },
  ukhrul: { baseTemp: 18.8, baseHumidity: 76, stormSensitivity: 0.85, phaseOffset: 3.6 },
  aizawl: { baseTemp: 22.0, baseHumidity: 75, stormSensitivity: 0.80, phaseOffset: 4.2 },
  kohima: { baseTemp: 19.5, baseHumidity: 77, stormSensitivity: 0.85, phaseOffset: 4.9 },
  gangtok: { baseTemp: 16.8, baseHumidity: 86, stormSensitivity: 1.15, phaseOffset: 5.5 },
};

/**
 * Bounds a numerical value between min and max
 */
function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Computes a single controlled simulation tick for a given district
 */
export function simulateDistrictTelemetry(district, tick = 0, isPaused = false) {
  if (!district) return district;
  if (isPaused) return district;

  const profile = DISTRICT_CLIMATE_PROFILES[district.id] || {
    baseTemp: 20.0,
    baseHumidity: 80,
    stormSensitivity: 1.0,
    phaseOffset: 1.0,
  };

  // Coherent atmospheric wave (smooth cyclic variation with gentle trend harmonics)
  const primaryWave = Math.sin(tick * 0.12 + profile.phaseOffset);
  const secondaryWave = Math.cos(tick * 0.05 + profile.phaseOffset * 1.5) * 0.5;
  const combinedSignal = (primaryWave + secondaryWave) * profile.stormSensitivity;

  // Controlled drift delta (bounded between -1.5 and +1.5 units per tick)
  const rainDelta = combinedSignal * 1.2;
  const newRainfall = clamp(
    Math.round((district.rainfall + rainDelta) * 10) / 10,
    Math.max(5, (district.baseRainfall ?? district.rainfall) - 15),
    Math.min(99, (district.baseRainfall ?? district.rainfall) + 15)
  );

  // Hydrological inertia: soil saturation follows rainfall with gradual response
  const soilTarget = newRainfall * 0.92 + 8;
  const soilDelta = (soilTarget - district.soil) * 0.15;
  const newSoil = clamp(
    Math.round((district.soil + soilDelta) * 10) / 10,
    10,
    99
  );

  // Temperature drops slightly during rain peaks; humidity rises
  const rainEffect = (newRainfall - 50) / 50;
  const newTemp = Math.round((profile.baseTemp - rainEffect * 2.2 + Math.sin(tick * 0.08) * 0.4) * 10) / 10;
  const newHumidity = clamp(Math.round(profile.baseHumidity + rainEffect * 12 + Math.cos(tick * 0.1) * 2), 45, 99);

  // Derived real-world IoT sensor representations
  const precipitationRateMmH = Math.round((newRainfall * 0.72) * 10) / 10;
  const poreWaterPressureKPa = Math.round((newSoil * 0.68 + 12) * 10) / 10;
  const slopeTiltRateMmH = Math.round((Math.max(0, newRainfall + newSoil - 130) * 0.08) * 100) / 100;

  // Derived simulated satellite indicators
  const vegetationLossPct = Math.round(clamp(district.veg + (newRainfall > 75 ? 4 : 0), 5, 90));
  const slopeDeformationMm = Math.round((poreWaterPressureKPa * 0.22 + slopeTiltRateMmH * 10) * 10) / 10;
  const terrainDisturbance = newSoil > 85 ? "CRITICAL" : newSoil > 70 ? "HIGH" : newSoil > 50 ? "MODERATE" : "LOW";
  const debrisDetected = newRainfall > 80 && newSoil > 80 ? "YES" : district.debrisDetected || "NO";
  const roadObstructed = newRainfall > 85 && newSoil > 85 ? "YES" : newRainfall > 70 ? "PARTIAL" : "NO";

  // Construct updated factor payload
  const updatedFactors = {
    ...extractFactors(district),
    rainfall: Math.round(newRainfall),
    soil: Math.round(newSoil),
  };

  // Recalculate dynamic risk score & explainability from prototype risk engine
  const newScore = computeRiskScore(updatedFactors);
  const newMeta = getRiskMeta(newScore);
  const newContributions = computeExplainableContributions(updatedFactors);
  const newExplanation = generateRiskExplanation(district, updatedFactors);
  const newRecommendation = generateRecommendedAction(district, newScore);

  return {
    ...district,
    rainfall: Math.round(newRainfall),
    soil: Math.round(newSoil),
    temperature: newTemp,
    humidity: newHumidity,
    precipitationRateMmH,
    poreWaterPressureKPa,
    slopeTiltRateMmH,
    vegetationLossPct,
    slopeDeformationMm,
    terrainDisturbance,
    debrisDetected,
    roadObstructed,
    score: newScore,
    meta: newMeta,
    contributions: newContributions,
    explanation: newExplanation,
    recommendation: newRecommendation,
    isSimulated: true,
    sensorSource: "SIMULATED IOT SENSOR STREAM (AWS/MEMS)",
    satelliteSource: "SIMULATED SATELLITE DATA (Sentinel-1 DInSAR / Sentinel-2 NDVI)",
    lastSyncTimestamp: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }),
  };
}

/**
 * Applies a specific step of the Disaster Scenario to the target district
 */
export function applyDisasterScenarioStep(district, stepIndex) {
  const safeIndex = Math.max(0, Math.min(DISASTER_SCENARIO_STEPS.length - 1, stepIndex));
  const stepData = DISASTER_SCENARIO_STEPS[safeIndex];

  const updatedFactors = {
    ...extractFactors(district),
    rainfall: stepData.targetRainfall,
    soil: stepData.targetSoil,
    slope: Math.min(99, district.slope + Math.min(6, stepIndex)),
  };

  const newScore = computeRiskScore(updatedFactors);
  const newMeta = getRiskMeta(newScore);
  const newContributions = computeExplainableContributions(updatedFactors);
  const newExplanation = generateRiskExplanation(district, updatedFactors);
  const newRecommendation = generateRecommendedAction(district, newScore);

  const precipitationRateMmH = Math.round((stepData.targetRainfall * 0.72) * 10) / 10;
  const poreWaterPressureKPa = Math.round((stepData.targetSoil * 0.68 + 12) * 10) / 10;
  const newTemp = Math.round((18.0 - (stepData.targetRainfall - 40) * 0.08) * 10) / 10;
  const newHumidity = Math.min(99, 75 + Math.round(stepData.targetRainfall * 0.24));

  return {
    ...district,
    rainfall: stepData.targetRainfall,
    soil: stepData.targetSoil,
    temperature: newTemp,
    humidity: newHumidity,
    precipitationRateMmH,
    poreWaterPressureKPa,
    slopeDeformationMm: stepData.slopeDeformationMm,
    terrainDisturbance: stepData.terrainDisturbance,
    debrisDetected: stepData.debrisDetected,
    roadObstructed: stepData.roadObstructed,
    responseStatus: stepData.responseStatus,
    score: newScore,
    meta: newMeta,
    contributions: newContributions,
    explanation: newExplanation,
    recommendation: newRecommendation,
    scenarioStep: stepData.step,
    scenarioTitle: stepData.title,
    scenarioNote: stepData.note,
    isSimulated: true,
    sensorSource: "SIMULATED IOT SENSOR STREAM (AWS/MEMS)",
    satelliteSource: "SIMULATED SATELLITE DATA (Sentinel-1 DInSAR / Sentinel-2 NDVI)",
  };
}

/**
 * Steps the full list of districts forward by one controlled simulation tick
 */
export function stepSimulationFeed(districts, tick = 0, options = {}) {
  const { isPaused = false, activeScenarioTargetId = null, activeScenarioStep = null } = options;

  return districts.map((d) => {
    if (activeScenarioTargetId && d.id === activeScenarioTargetId && activeScenarioStep !== null) {
      return applyDisasterScenarioStep(d, activeScenarioStep);
    }
    return simulateDistrictTelemetry(d, tick, isPaused);
  });
}
