from datetime import datetime, timezone, timedelta
from backend.app.database.session import SessionLocal, init_db
from backend.app.models.location import Location
from backend.app.models.weather import WeatherObservation
from backend.app.models.infrastructure import Infrastructure
from backend.app.models.field_report import FieldReport
from backend.app.models.warning import EarlyWarning

DISTRICTS_DATA = [
    {
        "name": "Dibang Valley",
        "state": "Arunachal Pradesh",
        "latitude": 28.6258,
        "longitude": 95.8398,
        "elevation_m": 1968.0,
        "slope_deg": 48.5,
        "soil_type": "Gneissic Schist / Loamy Residual",
        "historical_events_count": 14,
        "population_exposed": 8000,
        "baseline_risk_score": 78.0,
        "weather": {
            "rainfall_24h_mm": 68.4,
            "rainfall_intensity_mmh": 14.2,
            "soil_moisture_pct": 74.5,
            "temperature_c": 17.5,
            "humidity_pct": 92.0,
            "pore_water_pressure_kpa": 16.8
        }
    },
    {
        "name": "East Khasi Hills (Sohra)",
        "state": "Meghalaya",
        "latitude": 25.2986,
        "longitude": 91.7322,
        "elevation_m": 1430.0,
        "slope_deg": 38.0,
        "soil_type": "Limestone Karst / Sandstone Silt",
        "historical_events_count": 22,
        "population_exposed": 825000,
        "baseline_risk_score": 64.0,
        "weather": {
            "rainfall_24h_mm": 52.0,
            "rainfall_intensity_mmh": 10.8,
            "soil_moisture_pct": 68.0,
            "temperature_c": 19.0,
            "humidity_pct": 89.0,
            "pore_water_pressure_kpa": 12.4
        }
    },
    {
        "name": "East Sikkim (Gangtok)",
        "state": "Sikkim",
        "latitude": 27.3389,
        "longitude": 88.6065,
        "elevation_m": 1650.0,
        "slope_deg": 42.0,
        "soil_type": "Phyllites & Schist Colluvium",
        "historical_events_count": 18,
        "population_exposed": 283000,
        "baseline_risk_score": 58.0,
        "weather": {
            "rainfall_24h_mm": 38.5,
            "rainfall_intensity_mmh": 6.4,
            "soil_moisture_pct": 59.2,
            "temperature_c": 16.0,
            "humidity_pct": 84.0,
            "pore_water_pressure_kpa": 9.8
        }
    },
    {
        "name": "Papum Pare (Itanagar)",
        "state": "Arunachal Pradesh",
        "latitude": 27.0844,
        "longitude": 93.6053,
        "elevation_m": 320.0,
        "slope_deg": 28.0,
        "soil_type": "Siwalik Sandstone / Clay Silt",
        "historical_events_count": 9,
        "population_exposed": 176000,
        "baseline_risk_score": 38.0,
        "weather": {
            "rainfall_24h_mm": 22.0,
            "rainfall_intensity_mmh": 4.1,
            "soil_moisture_pct": 44.0,
            "temperature_c": 24.5,
            "humidity_pct": 78.0,
            "pore_water_pressure_kpa": 5.2
        }
    },
    {
        "name": "Kohima",
        "state": "Nagaland",
        "latitude": 25.6751,
        "longitude": 94.1086,
        "elevation_m": 1444.0,
        "slope_deg": 36.5,
        "soil_type": "Disang Shale / Clay Residual",
        "historical_events_count": 16,
        "population_exposed": 267000,
        "baseline_risk_score": 52.0,
        "weather": {
            "rainfall_24h_mm": 31.0,
            "rainfall_intensity_mmh": 5.6,
            "soil_moisture_pct": 53.0,
            "temperature_c": 18.2,
            "humidity_pct": 81.0,
            "pore_water_pressure_kpa": 7.6
        }
    },
    {
        "name": "Aizawl",
        "state": "Mizoram",
        "latitude": 23.7271,
        "longitude": 92.7176,
        "elevation_m": 1132.0,
        "slope_deg": 41.0,
        "soil_type": "Surma Group Sandstone & Shale",
        "historical_events_count": 19,
        "population_exposed": 400000,
        "baseline_risk_score": 54.0,
        "weather": {
            "rainfall_24h_mm": 29.5,
            "rainfall_intensity_mmh": 4.8,
            "soil_moisture_pct": 51.5,
            "temperature_c": 21.0,
            "humidity_pct": 79.0,
            "pore_water_pressure_kpa": 6.9
        }
    },
    {
        "name": "Senapati",
        "state": "Manipur",
        "latitude": 25.2677,
        "longitude": 94.0186,
        "elevation_m": 1250.0,
        "slope_deg": 34.0,
        "soil_type": "Barail Sandstone / Alluvial Silt",
        "historical_events_count": 11,
        "population_exposed": 479000,
        "baseline_risk_score": 42.0,
        "weather": {
            "rainfall_24h_mm": 24.0,
            "rainfall_intensity_mmh": 3.9,
            "soil_moisture_pct": 46.0,
            "temperature_c": 22.4,
            "humidity_pct": 76.0,
            "pore_water_pressure_kpa": 5.8
        }
    },
    {
        "name": "North Sikkim (Mangan)",
        "state": "Sikkim",
        "latitude": 27.5086,
        "longitude": 88.5294,
        "elevation_m": 1310.0,
        "slope_deg": 52.0,
        "soil_type": "High Grade Gneiss / Morainic Scree",
        "historical_events_count": 27,
        "population_exposed": 43000,
        "baseline_risk_score": 72.0,
        "weather": {
            "rainfall_24h_mm": 62.0,
            "rainfall_intensity_mmh": 12.5,
            "soil_moisture_pct": 71.0,
            "temperature_c": 14.5,
            "humidity_pct": 91.0,
            "pore_water_pressure_kpa": 15.2
        }
    },
    {
        "name": "West Kameng (Bomdila)",
        "state": "Arunachal Pradesh",
        "latitude": 27.2645,
        "longitude": 92.4208,
        "elevation_m": 2217.0,
        "slope_deg": 44.0,
        "soil_type": "Buxa Dolomite / Phyllitic Slate",
        "historical_events_count": 13,
        "population_exposed": 84000,
        "baseline_risk_score": 49.0,
        "weather": {
            "rainfall_24h_mm": 28.0,
            "rainfall_intensity_mmh": 5.0,
            "soil_moisture_pct": 49.0,
            "temperature_c": 15.0,
            "humidity_pct": 82.0,
            "pore_water_pressure_kpa": 7.0
        }
    },
    {
        "name": "West Jaintia Hills (Jowai)",
        "state": "Meghalaya",
        "latitude": 25.4497,
        "longitude": 92.2036,
        "elevation_m": 1380.0,
        "slope_deg": 31.0,
        "soil_type": "Sedimentary Sandstone / Laterite",
        "historical_events_count": 8,
        "population_exposed": 270000,
        "baseline_risk_score": 34.0,
        "weather": {
            "rainfall_24h_mm": 18.0,
            "rainfall_intensity_mmh": 3.2,
            "soil_moisture_pct": 41.0,
            "temperature_c": 20.5,
            "humidity_pct": 74.0,
            "pore_water_pressure_kpa": 4.5
        }
    }
]

INFRASTRUCTURE_DATA = [
    # Dibang Valley Sector
    {"name": "NH-13 Trans-Arunachal Highway (Anini Sector)", "type": "highway_corridor", "latitude": 28.6180, "longitude": 95.8450, "location_name": "Dibang Valley", "capacity": 1200, "criticality": "CRITICAL", "status": "RESTRICTED"},
    {"name": "Dibang River Suspension Bridge", "type": "bridge", "latitude": 28.6010, "longitude": 95.8210, "location_name": "Dibang Valley", "capacity": 400, "criticality": "CRITICAL", "status": "OPERATIONAL"},
    {"name": "Anini District Hospital & Trauma Centre", "type": "hospital", "latitude": 28.6290, "longitude": 95.8410, "location_name": "Dibang Valley", "capacity": 150, "criticality": "CRITICAL", "status": "OPERATIONAL"},
    {"name": "Anini Government Higher Secondary School", "type": "school", "latitude": 28.6240, "longitude": 95.8360, "location_name": "Dibang Valley", "capacity": 450, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Malinye Mountain Village", "type": "village", "latitude": 28.6410, "longitude": 95.8520, "location_name": "Dibang Valley", "capacity": 620, "criticality": "HIGH", "status": "VULNERABLE"},
    {"name": "Anini Community Emergency Shelter A", "type": "shelter", "latitude": 28.6320, "longitude": 95.8350, "location_name": "Dibang Valley", "capacity": 850, "criticality": "HIGH", "status": "OPERATIONAL"},

    # East Khasi Hills / Sohra Sector
    {"name": "Sohra-Shella Mountain Pass Road", "type": "highway_corridor", "latitude": 25.2850, "longitude": 91.7210, "location_name": "East Khasi Hills (Sohra)", "capacity": 2000, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Cherrapunji Civil Hospital", "type": "hospital", "latitude": 25.3020, "longitude": 91.7350, "location_name": "East Khasi Hills (Sohra)", "capacity": 220, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Sohra Higher Secondary School", "type": "school", "latitude": 25.2910, "longitude": 91.7290, "location_name": "East Khasi Hills (Sohra)", "capacity": 600, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Nohkalikai Valley Village", "type": "village", "latitude": 25.2750, "longitude": 91.7150, "location_name": "East Khasi Hills (Sohra)", "capacity": 1400, "criticality": "HIGH", "status": "VULNERABLE"},
    {"name": "Sohra Multipurpose Cyclone/Disaster Shelter", "type": "shelter", "latitude": 25.2950, "longitude": 91.7400, "location_name": "East Khasi Hills (Sohra)", "capacity": 1200, "criticality": "HIGH", "status": "OPERATIONAL"},

    # Sikkim Sector (Gangtok & Mangan)
    {"name": "NH-10 Sevoke-Gangtok Highway Corridor", "type": "highway_corridor", "latitude": 27.3290, "longitude": 88.5980, "location_name": "East Sikkim (Gangtok)", "capacity": 5000, "criticality": "CRITICAL", "status": "OPERATIONAL"},
    {"name": "STNM Multi-Speciality Hospital Gangtok", "type": "hospital", "latitude": 27.3450, "longitude": 88.6120, "location_name": "East Sikkim (Gangtok)", "capacity": 600, "criticality": "CRITICAL", "status": "OPERATIONAL"},
    {"name": "Tathangchen Relief Camp", "type": "shelter", "latitude": 27.3410, "longitude": 88.6180, "location_name": "East Sikkim (Gangtok)", "capacity": 900, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Mangan North Sikkim Lifeline Highway", "type": "highway_corridor", "latitude": 27.5120, "longitude": 88.5350, "location_name": "North Sikkim (Mangan)", "capacity": 800, "criticality": "CRITICAL", "status": "RESTRICTED"},
    {"name": "Chungthang River Suspension Bridge", "type": "bridge", "latitude": 27.5250, "longitude": 88.5420, "location_name": "North Sikkim (Mangan)", "capacity": 350, "criticality": "CRITICAL", "status": "OPERATIONAL"},
    {"name": "Chungthang Mountain Settlement", "type": "village", "latitude": 27.5300, "longitude": 88.5480, "location_name": "North Sikkim (Mangan)", "capacity": 1100, "criticality": "HIGH", "status": "VULNERABLE"},
    {"name": "Mangan District Disaster Shelter", "type": "shelter", "latitude": 27.5050, "longitude": 88.5250, "location_name": "North Sikkim (Mangan)", "capacity": 650, "criticality": "HIGH", "status": "OPERATIONAL"},

    # Nagaland (Kohima) Sector
    {"name": "NH-29 Kohima-Dimapur Bypass", "type": "highway_corridor", "latitude": 25.6810, "longitude": 94.0950, "location_name": "Kohima", "capacity": 3500, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Naga Hospital Authority Kohima", "type": "hospital", "latitude": 25.6700, "longitude": 94.1120, "location_name": "Kohima", "capacity": 350, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Khonoma Mountain Eco-Village", "type": "village", "latitude": 25.6520, "longitude": 94.0210, "location_name": "Kohima", "capacity": 1900, "criticality": "HIGH", "status": "VULNERABLE"},
    {"name": "Kohima State Disaster Relief Shelter", "type": "shelter", "latitude": 25.6780, "longitude": 94.1050, "location_name": "Kohima", "capacity": 1100, "criticality": "HIGH", "status": "OPERATIONAL"},

    # Mizoram (Aizawl) Sector
    {"name": "NH-54 Aizawl-Silchar Transit Corridor", "type": "highway_corridor", "latitude": 23.7350, "longitude": 92.7250, "location_name": "Aizawl", "capacity": 2800, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Aizawl Civil Hospital", "type": "hospital", "latitude": 23.7250, "longitude": 92.7150, "location_name": "Aizawl", "capacity": 300, "criticality": "HIGH", "status": "OPERATIONAL"},
    {"name": "Durtlang Ridge Village", "type": "village", "latitude": 23.7650, "longitude": 92.7380, "location_name": "Aizawl", "capacity": 2200, "criticality": "HIGH", "status": "VULNERABLE"},
    {"name": "Aizawl Multipurpose Disaster Hall", "type": "shelter", "latitude": 23.7310, "longitude": 92.7210, "location_name": "Aizawl", "capacity": 950, "criticality": "HIGH", "status": "OPERATIONAL"}
]

FIELD_REPORTS_DATA = [
    {
        "location_name": "Dibang Valley NH-13 KM-42 Cut",
        "latitude": 28.6210,
        "longitude": 95.8420,
        "hazard_type": "slope_crack",
        "severity": "CRITICAL",
        "description": "Active longitudinal tension cracks (12cm width) observed across upper slope cutting following continuous 14mm/h rain.",
        "reporter_role": "FIELD_RANGER",
        "verification_status": "VERIFIED"
    },
    {
        "location_name": "Sohra Eco-Park Cliff Face",
        "latitude": 25.2920,
        "longitude": 91.7280,
        "hazard_type": "rockfall",
        "severity": "HIGH",
        "description": "Minor rock detachment and debris accumulation blocking single lane of Shella road.",
        "reporter_role": "CITIZEN",
        "verification_status": "UNDER_REVIEW"
    },
    {
        "location_name": "Mangan-Chungthang Road Junction",
        "latitude": 27.5150,
        "longitude": 88.5320,
        "hazard_type": "water_seepage",
        "severity": "HIGH",
        "description": "Heavy muddy water seepage on retaining wall with visible bulging.",
        "reporter_role": "FIELD_RANGER",
        "verification_status": "UNDER_REVIEW"
    }
]

def seed_database(force_refresh: bool = False):
    """Initializes schema and populates initial geodatabase records."""
    print("[BHUSHAKTI SEEDER] Initializing database tables...")
    init_db()
    db = SessionLocal()

    try:
        existing_loc_count = db.query(Location).count()
        if existing_loc_count > 0 and not force_refresh:
            print(f"[BHUSHAKTI SEEDER] Database already contains {existing_loc_count} locations. Updating infrastructure if missing...")
            existing_infra_count = db.query(Infrastructure).count()
            if existing_infra_count < len(INFRASTRUCTURE_DATA):
                db.query(Infrastructure).delete()
                loc_map = {loc.name: loc for loc in db.query(Location).all()}
                for inf in INFRASTRUCTURE_DATA:
                    loc = loc_map.get(inf["location_name"])
                    infra = Infrastructure(
                        name=inf["name"],
                        type=inf["type"],
                        latitude=inf["latitude"],
                        longitude=inf["longitude"],
                        location_id=loc.id if loc else None,
                        capacity=inf["capacity"],
                        criticality=inf["criticality"],
                        status=inf["status"]
                    )
                    db.add(infra)
                db.commit()
                print(f"[BHUSHAKTI SEEDER] Re-seeded {len(INFRASTRUCTURE_DATA)} infrastructure records.")
            return

        print("[BHUSHAKTI SEEDER] Seeding 10 Northeast India vulnerable districts...")
        loc_map = {}
        for d in DISTRICTS_DATA:
            loc = Location(
                name=d["name"],
                state=d["state"],
                latitude=d["latitude"],
                longitude=d["longitude"],
                elevation_m=d["elevation_m"],
                slope_deg=d["slope_deg"],
                soil_type=d["soil_type"],
                historical_events_count=d["historical_events_count"],
                population_exposed=d["population_exposed"],
                baseline_risk_score=d["baseline_risk_score"]
            )
            db.add(loc)
            db.flush()
            loc_map[d["name"]] = loc

            # Add baseline weather observation
            w = d["weather"]
            weather_obs = WeatherObservation(
                location_id=loc.id,
                rainfall_24h_mm=w["rainfall_24h_mm"],
                rainfall_intensity_mmh=w["rainfall_intensity_mmh"],
                soil_moisture_pct=w["soil_moisture_pct"],
                temperature_c=w["temperature_c"],
                humidity_pct=w["humidity_pct"],
                pore_water_pressure_kpa=w["pore_water_pressure_kpa"],
                is_simulated=True,
                data_source="SIMULATED_INGESTION_ENGINE",
                timestamp=datetime.now(timezone.utc)
            )
            db.add(weather_obs)

            # If risk is HIGH or CRITICAL, add initial warning
            if d["baseline_risk_score"] >= 60.0:
                severity = "CRITICAL" if d["baseline_risk_score"] >= 75.0 else "HIGH"
                warning = EarlyWarning(
                    location_id=loc.id,
                    severity=severity,
                    risk_probability=d["baseline_risk_score"],
                    main_factors="Rainfall intensity, High slope gradient, Elevated soil saturation",
                    recommended_action="Issue transit caution on connecting highways and alert District Disaster Management Authority (DDMA).",
                    acknowledged=False,
                    created_at=datetime.now(timezone.utc) - timedelta(minutes=15)
                )
                db.add(warning)

        print("[BHUSHAKTI SEEDER] Seeding critical infrastructure...")
        for inf in INFRASTRUCTURE_DATA:
            loc = loc_map.get(inf["location_name"])
            infra = Infrastructure(
                name=inf["name"],
                type=inf["type"],
                latitude=inf["latitude"],
                longitude=inf["longitude"],
                location_id=loc.id if loc else None,
                capacity=inf["capacity"],
                criticality=inf["criticality"],
                status=inf["status"]
            )
            db.add(infra)

        print("[BHUSHAKTI SEEDER] Seeding ground field reports...")
        for fr in FIELD_REPORTS_DATA:
            report = FieldReport(
                location_name=fr["location_name"],
                latitude=fr["latitude"],
                longitude=fr["longitude"],
                hazard_type=fr["hazard_type"],
                severity=fr["severity"],
                description=fr["description"],
                reporter_role=fr["reporter_role"],
                verification_status=fr["verification_status"],
                created_at=datetime.now(timezone.utc) - timedelta(hours=1)
            )
            db.add(report)

        db.commit()
        print("[BHUSHAKTI SEEDER] Seeding completed successfully!")
    except Exception as e:
        db.rollback()
        print(f"[BHUSHAKTI SEEDER] Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
