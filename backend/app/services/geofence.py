from math import atan2, cos, radians, sin, sqrt


def haversine_distance_meters(
    latitude_a: float,
    longitude_a: float,
    latitude_b: float,
    longitude_b: float,
) -> float:
    earth_radius_m = 6371000
    lat1 = radians(latitude_a)
    lon1 = radians(longitude_a)
    lat2 = radians(latitude_b)
    lon2 = radians(longitude_b)

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * atan2(sqrt(a), sqrt(1 - a))
    return earth_radius_m * c
