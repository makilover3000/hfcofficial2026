import json
import math
import httpx
from typing import Dict, Any, List, Tuple
from pathlib import Path
from datetime import datetime
from collections import defaultdict
from ..models.metrics import EnvironmentData

def calculate_centroid(coordinates: List) -> Tuple[float, float]:
    if not coordinates:
        return (0, 0)

    # Handle nested coordinate structures (Polygon has [ring, ring, ...])
    # Each ring is a list of [lon, lat] pairs
    coords = coordinates

    # Dig down to get the actual coordinate pairs
    while coords and isinstance(coords, list):
        if len(coords) > 0 and isinstance(coords[0], list):
            if len(coords[0]) > 0 and isinstance(coords[0][0], list):
                # Still nested, go deeper (get first ring)
                coords = coords[0]
            else:
                # coords[0] is a coordinate pair [lon, lat]
                break
        else:
            break

    if not coords:
        return (0, 0)

    lons = []
    lats = []
    for c in coords:
        if isinstance(c, list) and len(c) >= 2 and isinstance(c[0], (int, float)):
            lons.append(c[0])
            lats.append(c[1])

    if not lons or not lats:
        return (0, 0)

    return (sum(lons) / len(lons), sum(lats) / len(lats))

def load_geojson(filepath: str) -> Dict[str, Any]:
    sites = {}

    path = Path(filepath)
    if not path.exists():
        print(f"GeoJSON file not found: {filepath}")
        return sites

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    all_features = data.get('features', [])

    # Step 1: Compute centroids and neighbor counts for all features
    centroids = []
    for i, feat in enumerate(all_features):
        coords = feat.get('geometry', {}).get('coordinates', [])
        centroid = calculate_centroid(coords)
        centroids.append((i, centroid[0], centroid[1]))

    neighbor_counts = [0] * len(centroids)
    radius_km = 0.5
    for i, (_, lon1, lat1) in enumerate(centroids):
        for j, (_, lon2, lat2) in enumerate(centroids):
            if i >= j:
                continue
            lat_diff = abs(lat1 - lat2) * 111
            lon_diff = abs(lon1 - lon2) * 111 * math.cos(math.radians(lat1))
            if math.sqrt(lat_diff ** 2 + lon_diff ** 2) < radius_km:
                neighbor_counts[i] += 1
                neighbor_counts[j] += 1

    # Step 2: Keep only dense sites (6+ neighbors)
    dense_indices = [i for i, cnt in enumerate(neighbor_counts) if cnt >= 6]

    # Step 3: Grid-sample to spread nicely across the map (top 5 densest per ~1.5km region)
    cell_size = 1.5 / 111.0
    grid = defaultdict(list)
    for idx in dense_indices:
        _, lon, lat = centroids[idx]
        cell = (round(lon / cell_size), round(lat / cell_size))
        grid[cell].append((idx, neighbor_counts[idx]))

    selected_indices = []
    for cell, entries in grid.items():
        entries.sort(key=lambda x: x[1], reverse=True)
        selected_indices.extend([idx for idx, _ in entries[:5]])

    print(f"Filtered {len(all_features)} total -> {len(selected_indices)} clustered sites across {len(grid)} regions")

    # Step 4: Build site dict from selected features
    for rank, orig_idx in enumerate(selected_indices):
        feature = all_features[orig_idx]
        props = feature.get('properties', {})
        geometry = feature.get('geometry', {})

        site_id = f"site_{rank}"
        blk_no = props.get('BLK_NO', '')
        if blk_no:
            name = f"Blk {blk_no}"
        else:
            name = props.get('NAME', props.get('name', f'Site {rank}'))

        coords = geometry.get('coordinates', [])
        centroid = calculate_centroid(coords)

        sites[site_id] = {
            'id': site_id,
            'name': name,
            'status': props.get('STATUS', 'Under Construction'),
            'contractor': props.get('CTRCTR_NAME', props.get('contractor', 'Unknown')),
            'start_date': props.get('ESTMT_CNSTRN_CMCMNT', ''),
            'completion_date': props.get('ESTMT_CNSTRN_CMPLTN', ''),
            'geometry': geometry,
            'centroid': list(centroid),
            'noise_level': 45.0,
            'dust_level': 15.0,
            'dust_suppression': 50.0,
            'state': 'normal',
            'is_selected': False,
            'agent_controlled': True
        }

    print(f"Loaded {len(sites)} construction sites")
    return sites

async def fetch_environment_data() -> EnvironmentData:
    env_data = EnvironmentData()

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get('https://api.data.gov.sg/v1/environment/pm25')
            if response.status_code == 200:
                data = response.json()
                readings = data.get('items', [{}])[0].get('readings', {})
                # PM2.5 readings are nested: {"pm25_one_hourly": {"west": 10, "east": 13, ...}}
                pm25_data = readings.get('pm25_one_hourly', readings)
                if isinstance(pm25_data, dict):
                    values = [v for v in pm25_data.values() if isinstance(v, (int, float))]
                    if values:
                        env_data.pm25 = sum(values) / len(values)
        except Exception as e:
            print(f"Error fetching PM2.5: {e}")

        try:
            response = await client.get('https://api.data.gov.sg/v1/environment/air-temperature')
            if response.status_code == 200:
                data = response.json()
                readings = data.get('items', [{}])[0].get('readings', [])
                if readings:
                    temps = [r.get('value', 30) for r in readings if 'value' in r]
                    if temps:
                        env_data.temperature = sum(temps) / len(temps)
        except Exception as e:
            print(f"Error fetching temperature: {e}")

        try:
            response = await client.get('https://api.data.gov.sg/v1/environment/relative-humidity')
            if response.status_code == 200:
                data = response.json()
                readings = data.get('items', [{}])[0].get('readings', [])
                if readings:
                    humidities = [r.get('value', 75) for r in readings if 'value' in r]
                    if humidities:
                        env_data.humidity = sum(humidities) / len(humidities)
        except Exception as e:
            print(f"Error fetching humidity: {e}")

        try:
            response = await client.get('https://api.data.gov.sg/v1/environment/wind-speed')
            if response.status_code == 200:
                data = response.json()
                readings = data.get('items', [{}])[0].get('readings', [])
                if readings:
                    speeds = [r.get('value', 3) for r in readings if 'value' in r]
                    if speeds:
                        env_data.wind_speed = sum(speeds) / len(speeds)
        except Exception as e:
            print(f"Error fetching wind speed: {e}")

    env_data.last_update = datetime.now()
    return env_data
