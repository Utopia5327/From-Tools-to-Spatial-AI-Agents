import urllib.request
import json
import os
import urllib.parse

# Washington Square Park Bounding Box (Manhattan)
# min_lat, min_lon, max_lat, max_lon
BBOX = (40.728, -74.002, 40.734, -73.992)
min_lat, min_lon, max_lat, max_lon = BBOX

# Socrata within_box function format:
# within_box(the_geom, max_lat, min_lon, min_lat, max_lon)
# Wait, Socrata docs: within_box(location_column, NW_lat, NW_lon, SE_lat, SE_lon)
# NW = (max_lat, min_lon), SE = (min_lat, max_lon)
soql_box = f"within_box(the_geom, {max_lat}, {min_lon}, {min_lat}, {max_lon})"
encoded_box = urllib.parse.quote(soql_box)

datasets = {
    "nyc_buildings.geojson": f"https://data.cityofnewyork.us/resource/5zhs-2jue.geojson?$limit=5000&$where={encoded_box}",
    "nyc_lots.geojson": f"https://data.cityofnewyork.us/resource/64uk-42ks.geojson?$limit=5000&$where={encoded_box}"
}

os.makedirs("public", exist_ok=True)

for filename, url in datasets.items():
    print(f"Fetching {filename}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode('utf-8'))
            output_path = os.path.join("public", filename)
            with open(output_path, 'w') as f:
                json.dump(data, f)
            print(f"Successfully saved {len(data.get('features', []))} features to {output_path}")
    except Exception as e:
        print(f"Error fetching {filename}: {e}")
