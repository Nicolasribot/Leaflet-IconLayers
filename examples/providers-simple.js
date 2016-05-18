var providers_simple = {};

var marker1 = L.marker([51.5, -0.09]), marker2 = L.marker([51.0, -0.1]), 
        marker3 = L.marker([51.55, -0.09]), marker4 = L.marker([50.7, -0.19]);

providers_simple['Marker'] = {
    title: 'Marker',
    icon: 'icons/marker.png',
    layer: L.layerGroup([marker2, marker1, marker2, marker4])
};

providers_simple['Circle'] = {
    title: 'Circle',
    icon: 'icons/circle.png',
    layer: L.circle([51.508, -0.11], 500, {
        color: 'red',
        fillColor: '#f03',
        fillOpacity: 0.5
    })
};

providers_simple['Polygon'] = {
    title: 'Polygon',
    icon: 'icons/polygon.png',
    layer: L.polygon([
        [51.509, -0.08],
        [51.503, -0.06],
        [51.51, -0.047]
    ])
};
