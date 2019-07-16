
mapboxgl.accessToken = 'pk.eyJ1IjoiYWtyaGVyeiIsImEiOiJjanNveG5sOWowcm0yNDlwMXlsbXVpeXJoIn0.Qwjhi5VK_ADPbHd2jz01Sw';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/akrherz/cjsoxovvf0hcc1fp8e3jrxm32'
});

map.on("load", function() {
    map.addSource('depdata', {
        type: 'geojson',
        data: BACKEND + '/geojson/huc12.py?date=2018-06-30'
    });

    map.addLayer({
        id: 'depdata-data',
        source: 'depdata',
        type: 'fill',
        paint: {
            'fill-color': [
                'interpolate',
                ['linear'],
                ['get', 'avg_runoff'],
                0, '#F2F12D',
                0.2, '#EED322',
                0.4, '#E6B71E',
                0.8, '#DA9C20',
                1.0, '#CA8323',
                1.2, '#B86B25',
                2.0, '#A25626',
                3.0, '#8B4225',
                4.0, '#723122'
            ]
        }
    });

    map.addLayer({
        id: "depdata-label",
        type: "symbol",
        source: "depdata",
        layout: {
            "icon-allow-overlap": true, // speed optimization
            "text-field": "{avg_runoff}",
            "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
            "text-size": 12
        }
    });

    map.on('click', 'depdata-data', function (e) {
        new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML(renderHUC12PopupHTML(e.features[0].properties))
            .addTo(map);
        });

});

function renderHUC12PopupHTML(props){
    return "<p><strong>Avg Runoff:</strong> " + props.avg_runoff + "</p>";
};