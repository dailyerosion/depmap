
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
        id: 'depdata-layer',
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
});