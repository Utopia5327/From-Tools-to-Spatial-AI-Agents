import urllib.request
import json
import os

BBOX = (40.728, -74.002, 40.734, -73.992)
min_lat, min_lon, max_lat, max_lon = BBOX

overpass_url = "https://overpass-api.de/api/interpreter"
overpass_query = f"""
[out:json];
(
  way["highway"]({min_lat},{min_lon},{max_lat},{max_lon});
);
out body;
>;
out skel qt;
"""

print("Fetching OSM Data for Roads...")
req = urllib.request.Request(overpass_url, data=overpass_query.encode('utf-8'))
with urllib.request.urlopen(req) as response:
    data = json.loads(response.read().decode('utf-8'))

nodes = {node['id']: (node['lon'], node['lat']) for node in data['elements'] if node['type'] == 'node'}
ways = [way for way in data['elements'] if way['type'] == 'way']

features = []
for way in ways:
    coords = [nodes[node_id] for node_id in way['nodes'] if node_id in nodes]
    if len(coords) > 1:
        feature = {
            "type": "Feature",
            "properties": way.get("tags", {}),
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            }
        }
        features.append(feature)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

output_path = os.path.join("public", "nyc_roads.geojson")
with open(output_path, 'w') as f:
    json.dump(geojson, f)

print(f"Saved {len(features)} roads to {output_path}")
