const https = require('https');
const fs = require('fs');

const url = 'https://data.cityofnewyork.us/resource/5rq2-4hqu.json?$where=within_circle(the_geom,%2040.7308,%20-73.9973,%20450)';

https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
        try {
            const trees = JSON.parse(data);
            if (!Array.isArray(trees)) {
                console.error("API Error Response:", data.substring(0, 500));
                return;
            }

            const validTrees = trees.filter(t => t.longitude && t.latitude);

            const geojson = {
                type: 'FeatureCollection',
                features: validTrees.map(t => ({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(t.longitude), parseFloat(t.latitude)]
                    },
                    properties: { name: t.spc_common || 'Unknown Tree' }
                }))
            };

            fs.writeFileSync('./public/nyc_trees.geojson', JSON.stringify(geojson));
            console.log('Successfully saved ' + validTrees.length + ' trees to nyc_trees.geojson!');
        } catch (e) {
            console.error('Error parsing response:', e);
        }
    });
}).on('error', err => {
    console.error('Request failed:', err.message);
});
