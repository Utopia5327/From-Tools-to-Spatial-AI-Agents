const fs = require('fs');

const CENTER_LON = -73.9973;
const CENTER_LAT = 40.7308;
const RADIUS_LON = 0.004;
const RADIUS_LAT = 0.003; // Accounting for aspect ratio of long/lat
const NUM_TREES = 400;

const features = [];
for (let i = 0; i < NUM_TREES; i++) {
    // Generate random point in circle for Washington Square Park cluster
    const r = Math.sqrt(Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const lon = CENTER_LON + r * RADIUS_LON * Math.cos(theta);
    const lat = CENTER_LAT + r * RADIUS_LAT * Math.sin(theta);

    const species = ['London Planetree', 'Ginkgo', 'Honey Locust', 'Pin Oak'][Math.floor(Math.random() * 4)];

    features.push({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [lon, lat]
        },
        properties: {
            name: species
        }
    });
}

const geojson = {
    type: 'FeatureCollection',
    features: features
};

fs.writeFileSync('./public/nyc_trees.geojson', JSON.stringify(geojson));
console.log(`Successfully generated ${NUM_TREES} mock trees based on park coordinates.`);
