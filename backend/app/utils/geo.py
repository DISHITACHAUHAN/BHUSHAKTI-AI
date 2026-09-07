import math
from typing import Tuple, List, Dict, Any

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculates the great circle distance between two points on the Earth's surface (in kilometers)
    using the Haversine formula.
    """
    R = 6371.0  # Earth's radius in km

    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1))
        * math.cos(math.radians(lat2))
        * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    return round(distance, 2)

def is_within_radius(
    lat1: float, lon1: float, lat2: float, lon2: float, radius_km: float
) -> Tuple[bool, float]:
    """
    Returns a tuple (in_range, distance_km).
    """
    dist = haversine_distance_km(lat1, lon1, lat2, lon2)
    return (dist <= radius_km, dist)
