import os
import numpy as np
import pandas as pd

def generate_landslide_dataset(n_samples: int = 3500, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a realistic, domain-calibrated historical dataset of landslide factors
    based on geological and meteorological dynamics in Northeast India.
    """
    np.random.seed(random_state)

    # 1. Slope Gradient (degrees): Northeast India hill slopes typically 15° to 65°
    slope = np.random.triangular(left=15.0, mode=38.0, right=68.0, size=n_samples)

    # 2. Elevation (meters above sea level): 200m to 3500m
    elevation = np.random.uniform(250.0, 3200.0, size=n_samples)

    # 3. 24-Hour Rainfall (mm): Mixture of dry, moderate monsoon, and extreme cloudburst events
    rainfall_base = np.random.exponential(scale=35.0, size=n_samples)
    # Add monsoon cloudburst surges
    extreme_mask = np.random.rand(n_samples) < 0.15
    rainfall_base[extreme_mask] += np.random.uniform(60.0, 180.0, size=np.sum(extreme_mask))
    rainfall_24h = np.clip(rainfall_base, 0.0, 350.0)

    # 4. Rainfall Intensity (mm/h)
    rainfall_intensity = rainfall_24h * np.random.uniform(0.12, 0.28, size=n_samples)

    # 5. Soil Moisture (%): Correlated with 24h rainfall + baseline retention
    soil_moisture = np.clip(
        25.0 + (rainfall_24h * 0.28) + np.random.normal(0, 5, size=n_samples),
        10.0,
        98.0
    )

    # 6. Temperature (°C): Inversely correlated with elevation
    temperature = np.clip(
        28.0 - (elevation / 1000.0) * 5.5 + np.random.normal(0, 2.5, size=n_samples),
        2.0,
        38.0
    )

    # 7. Humidity (%): Correlated with rainfall & temperature
    humidity = np.clip(
        60.0 + (rainfall_24h * 0.15) + np.random.normal(0, 6, size=n_samples),
        35.0,
        99.0
    )

    # 8. Historical Recorded Landslide Events
    historical_events = np.random.poisson(lam=8.0, size=n_samples)

    # 9. Pore Water Pressure (kPa): Physically driven by soil moisture & rainfall accumulation
    pore_water_pressure = np.clip(
        (soil_moisture / 100.0) * (rainfall_24h * 0.18) + np.random.normal(2, 1, size=n_samples),
        0.5,
        35.0
    )

    # 10. Physical Geotechnical Landslide Susceptibility Index (0 to 1)
    # Factor of Safety inversely modeled through Mohr-Coulomb shear strength criteria
    rain_factor = (rainfall_24h / 150.0) ** 1.3
    soil_factor = (soil_moisture / 100.0) ** 2.0
    slope_factor = np.sin(np.radians(slope)) ** 1.8
    hist_factor = np.clip(historical_events / 20.0, 0, 1.2)
    pore_factor = (pore_water_pressure / 25.0)

    # Composite risk potential
    hazard_score = (
        0.30 * rain_factor +
        0.25 * soil_factor +
        0.20 * slope_factor +
        0.12 * hist_factor +
        0.08 * pore_factor +
        0.05 * (humidity / 100.0)
    )

    # Add realistic geological stochastic noise
    hazard_score += np.random.normal(0, 0.04, size=n_samples)
    hazard_probability = 1.0 / (1.0 + np.exp(-10.0 * (hazard_score - 0.52)))
    hazard_probability = np.clip(hazard_probability, 0.0, 1.0)

    # Binary label: 1 if landslide triggered, 0 otherwise (with threshold ~ 0.50)
    landslide_occurred = (hazard_probability > 0.48).astype(int)

    # Categorical classification: LOW (<0.25), MODERATE (0.25-0.50), HIGH (0.50-0.75), CRITICAL (>0.75)
    risk_categories = []
    for p in hazard_probability:
        if p < 0.25:
            risk_categories.append("LOW")
        elif p < 0.50:
            risk_categories.append("MODERATE")
        elif p < 0.75:
            risk_categories.append("HIGH")
        else:
            risk_categories.append("CRITICAL")

    df = pd.DataFrame({
        "rainfall_24h": np.round(rainfall_24h, 2),
        "rainfall_intensity": np.round(rainfall_intensity, 2),
        "soil_moisture": np.round(soil_moisture, 2),
        "slope": np.round(slope, 2),
        "elevation": np.round(elevation, 1),
        "historical_events": historical_events,
        "temperature": np.round(temperature, 1),
        "humidity": np.round(humidity, 1),
        "pore_water_pressure": np.round(pore_water_pressure, 2),
        "risk_probability": np.round(hazard_probability, 4),
        "risk_percentage": np.round(hazard_probability * 100, 2),
        "risk_category": risk_categories,
        "landslide_occurred": landslide_occurred
    })

    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, "historical_landslide_dataset.csv")

    print("[DATA GENERATOR] Synthesizing domain-calibrated landslide historical dataset...")
    dataset = generate_landslide_dataset(n_samples=4000)
    dataset.to_csv(out_path, index=False)
    print(f"[DATA GENERATOR] Saved {len(dataset)} samples to {out_path}")
    print("[DATA GENERATOR] Class distribution:")
    print(dataset["risk_category"].value_counts())
