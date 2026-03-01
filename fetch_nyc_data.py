import urllib.request
import json
import os

# New York City Building Footprints dataset (Socrata endpoint)
# We request it in GeoJSON format.
endpoint = "https://data.cityofnewyork.us/resource/5zhs-2jue.geojson"

# To get a specific interesting area, we can use a SoQL query.
# Let's get a small dense area in Manhattan (e.g., around Bryant Park / Times Square).
# Or just limit to a small subset of tall buildings in Manhattan (BBL starts with 1)
query = "?$limit=300&$where=height_roof>150%20AND%20base_bbl%20like%20'1%25'"
url = endpoint + query

print(f"Fetching data from {url}...")

req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
try:
    with urllib.request.urlopen(req) as response:
        data = json.loads(response.read().decode('utf-8'))
        
        # Save to the public assets folder of the React app
        output_path = os.path.join("public", "nyc_blocks.geojson")
        os.makedirs("public", exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(data, f)
            
        print(f"Successfully saved {len(data.get('features', []))} building footprints to {output_path}")
        
except Exception as e:
    print(f"Error fetching data: {e}")
