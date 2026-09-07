import asyncio
import math
import random
from datetime import datetime, timezone
from typing import Dict, Any, List
from backend.app.database.session import SessionLocal
from backend.app.models.location import Location
from backend.app.models.weather import WeatherObservation
from backend.app.models.warning import EarlyWarning
from backend.app.services.ml_service import ml_service
from backend.app.services.shap_service import shap_service

class WeatherSimulatorService:
    def __init__(self):
        self.is_running = False
        self.interval_seconds = 10
        self.tick_count = 0
        self.current_scenario = "DYNAMIC_CYCLE"  # DYNAMIC_CYCLE, MONSOON_SURGE, FLASH_CLOUDBURST, DRY_STABILIZATION
        self.last_updated_at = None
        self._task = None

    async def start(self):
        """Starts the background periodic weather simulation loop."""
        if self.is_running:
            return
        self.is_running = True
        print(f"[WEATHER SIMULATOR] Started simulated ingestion stream (Scenario: {self.current_scenario}, Interval: {self.interval_seconds}s)")
        self._task = asyncio.create_task(self._simulation_loop())

    async def stop(self):
        """Stops the simulation loop."""
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        print("[WEATHER SIMULATOR] Simulation loop stopped.")

    async def _simulation_loop(self):
        while self.is_running:
            try:
                await asyncio.sleep(self.interval_seconds)
                self.step_simulation()
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"[WEATHER SIMULATOR] Error in simulation step: {e}")

    def step_simulation(self, scenario_override: str = None) -> List[Dict[str, Any]]:
        """
        Executes one discrete simulation step:
        1. Updates environmental telemetry for each district according to physical waveforms.
        2. Feeds updated variables directly through the actual XGBoost ML model.
        3. Updates database state and triggers early warnings when risk thresholds are crossed.
        """
        scenario = scenario_override or self.current_scenario
        self.tick_count += 1
        self.last_updated_at = datetime.now(timezone.utc)
        db = SessionLocal()

        results = []
        try:
            locations = db.query(Location).all()
            phase = (self.tick_count * 0.25) % (2 * math.pi)

            for loc in locations:
                latest_w = (
                    db.query(WeatherObservation)
                    .filter(WeatherObservation.location_id == loc.id)
                    .order_by(WeatherObservation.timestamp.desc())
                    .first()
                )

                # Base seed parameters
                base_rain = latest_w.rainfall_24h_mm if latest_w else 35.0
                base_soil = latest_w.soil_moisture_pct if latest_w else 55.0

                # Scenario Dynamics
                if scenario == "MONSOON_SURGE":
                    # Monotonic increase in rainfall & pore water pressure
                    delta_rain = random.uniform(8.0, 22.0)
                    new_rain = min(220.0, base_rain + delta_rain)
                    new_soil = min(98.0, base_soil + (delta_rain * 0.35))
                    intensity = round(new_rain * random.uniform(0.18, 0.28), 1)
                    humidity = min(99.0, 80.0 + (new_rain * 0.1))
                elif scenario == "FLASH_CLOUDBURST":
                    # Severe spike in high-slope districts (Dibang Valley, North Sikkim, Sohra)
                    if loc.slope_deg >= 40.0:
                        new_rain = random.uniform(110.0, 190.0)
                        new_soil = random.uniform(86.0, 96.0)
                        intensity = round(random.uniform(22.0, 45.0), 1)
                        humidity = random.uniform(92.0, 98.0)
                    else:
                        new_rain = max(10.0, base_rain + random.uniform(-5.0, 10.0))
                        new_soil = max(20.0, base_soil + random.uniform(-2.0, 5.0))
                        intensity = round(new_rain * 0.12, 1)
                        humidity = 78.0
                elif scenario == "DRY_STABILIZATION":
                    # Gradual soil drainage & clearing skies
                    new_rain = max(2.0, base_rain * 0.65)
                    new_soil = max(15.0, base_soil * 0.85)
                    intensity = round(max(0.0, new_rain * 0.05), 1)
                    humidity = max(45.0, 70.0 - (self.tick_count * 2.0))
                else:  # DYNAMIC_CYCLE
                    # Harmonic diurnal wave + stochastic perturbation
                    wave = math.sin(phase + (loc.id * 0.6))
                    noise = random.uniform(-3.0, 3.0)
                    new_rain = round(max(5.0, min(140.0, 45.0 + (wave * 35.0) + noise)), 1)
                    new_soil = round(max(20.0, min(95.0, 30.0 + (new_rain * 0.45) + (wave * 8.0))), 1)
                    intensity = round(max(0.5, new_rain * 0.15), 1)
                    humidity = round(max(50.0, min(98.0, 65.0 + (wave * 15.0))), 1)

                temp = round(max(10.0, min(32.0, 24.0 - (loc.elevation_m / 1000.0) * 4.5 + random.uniform(-1.0, 1.0))), 1)
                pore_pressure = round(max(1.0, min(35.0, (new_soil / 100.0) * (new_rain * 0.22))), 1)

                # Persist updated simulated weather observation
                weather_record = WeatherObservation(
                    location_id=loc.id,
                    rainfall_24h_mm=new_rain,
                    rainfall_intensity_mmh=intensity,
                    soil_moisture_pct=new_soil,
                    temperature_c=temp,
                    humidity_pct=humidity,
                    pore_water_pressure_kpa=pore_pressure,
                    is_simulated=True,
                    data_source="SIMULATED_INGESTION_ENGINE",
                    timestamp=datetime.now(timezone.utc)
                )
                db.add(weather_record)

                # 2. EVALUATE DIRECTLY THROUGH REAL XGBOOST PIPELINE
                features_payload = {
                    "rainfall_24h": new_rain,
                    "soil_moisture": new_soil,
                    "slope": loc.slope_deg,
                    "elevation": loc.elevation_m,
                    "historical_events": loc.historical_events_count,
                    "temperature": temp,
                    "humidity": humidity
                }

                ml_pred = ml_service.predict_risk(features_payload)
                evaluated_prob = ml_pred["risk_probability"]
                evaluated_pct = ml_pred["risk_percentage"]
                evaluated_cat = ml_pred["risk_category"]

                # Update location baseline risk score with real model prediction
                loc.baseline_risk_score = evaluated_pct

                # 3. AUTO-TRIGGER / UPDATE EARLY WARNINGS FOR HIGH & CRITICAL
                if evaluated_pct >= 50.0:
                    existing_warning = (
                        db.query(EarlyWarning)
                        .filter(EarlyWarning.location_id == loc.id, EarlyWarning.acknowledged == False)
                        .first()
                    )
                    action_msg = ml_pred["recommended_action"]
                    triggers = f"Rainfall: {new_rain}mm, Soil Saturation: {new_soil}%, Slope: {loc.slope_deg}°"

                    if existing_warning:
                        existing_warning.severity = evaluated_cat
                        existing_warning.risk_probability = evaluated_pct
                        existing_warning.main_factors = triggers
                        existing_warning.recommended_action = action_msg
                    else:
                        new_warn = EarlyWarning(
                            location_id=loc.id,
                            severity=evaluated_cat,
                            risk_probability=evaluated_pct,
                            main_factors=triggers,
                            recommended_action=action_msg,
                            acknowledged=False,
                            created_at=datetime.now(timezone.utc)
                        )
                        db.add(new_warn)

                results.append({
                    "location_id": loc.id,
                    "name": loc.name,
                    "rainfall_24h": new_rain,
                    "soil_moisture": new_soil,
                    "calculated_risk_pct": evaluated_pct,
                    "risk_category": evaluated_cat,
                    "pore_water_pressure": pore_pressure
                })

            db.commit()
            return results
        except Exception as e:
            db.rollback()
            print(f"[WEATHER SIMULATOR] Error during step execution: {e}")
            raise e
        finally:
            db.close()

    def set_scenario(self, scenario_name: str):
        valid = ["DYNAMIC_CYCLE", "MONSOON_SURGE", "FLASH_CLOUDBURST", "DRY_STABILIZATION"]
        if scenario_name in valid:
            self.current_scenario = scenario_name
            print(f"[WEATHER SIMULATOR] Scenario switched to: {scenario_name}")
            return True
        return False

# Singleton instance
weather_simulator = WeatherSimulatorService()
