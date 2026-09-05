import math
import hashlib
import random

EARTH_RADIUS_KM = 6371.0

def haversine_distance_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in kilometers between two latitude/longitude pairs."""
    if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
        return None
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_KM * c

def fuzz_coordinates(lat: float, lon: float, user_id: str = None) -> tuple:
    """
    Fuzz exact GPS coordinates by ~500m-1.5km deterministically based on user ID or seed
    to prevent triangulation while keeping local clustering accurate.
    """
    if lat is None or lon is None:
        return None, None
    
    if user_id:
        # Deterministic fuzzing based on user_id hash so jitter stays consistent for a given user
        h = int(hashlib.sha256(user_id.encode('utf-8')).hexdigest()[:8], 16)
        angle = (h % 360) * (math.pi / 180.0)
        # Distance between 0.005 and 0.015 degrees (~500m to 1.5km)
        radius = 0.005 + ((h >> 8) % 100) * 0.0001
    else:
        angle = random.uniform(0, 2 * math.pi)
        radius = random.uniform(0.005, 0.015)
        
    fuzzed_lat = lat + radius * math.cos(angle)
    fuzzed_lon = lon + (radius * math.sin(angle)) / math.cos(math.radians(lat))
    return round(fuzzed_lat, 4), round(fuzzed_lon, 4)

def format_distance_bucket(distance_km: float) -> str:
    """Format exact distance into human privacy-friendly bucket."""
    if distance_km is None:
        return "Somewhere on Earth"
    if distance_km < 2.0:
        return "< 2 km away"
    elif distance_km <= 5.0:
        return "2–5 km away"
    elif distance_km <= 10.0:
        return "5–10 km away"
    elif distance_km <= 25.0:
        return "10–25 km away"
    elif distance_km <= 50.0:
        return "25–50 km away"
    elif distance_km <= 100.0:
        return "50–100 km away"
    else:
        return "100+ km away"
