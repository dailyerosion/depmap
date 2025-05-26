import { transform } from 'ol/proj';
import { setToday, makeDate, formatDate } from './dateUtils';
import { rerender_vectors, setTitle } from './mapRenderer';
import { doHUC12Search } from './huc12Utils';
import { setQueryParams } from './urlHandler';
import { BACKEND } from './constants';
import { getState, setState, StateKeys } from './state';

export function setupMapEventHandlers(map, setStatus, makeDetailedFeature, displayFeatureInfo) {
    map.on('moveend', function () {
        const currentState = {
            date: getState(StateKeys.DATE),
            date2: getState(StateKeys.DATE2),
            ltype: getState(StateKeys.LTYPE),
            metric: getState(StateKeys.METRIC),
            lat: getState(StateKeys.LAT),
            lon: getState(StateKeys.LON),
            sidebarOpen: getState(StateKeys.SIDEBAR_OPEN),
            lastdate: getState(StateKeys.LAST_DATE)
        };
        setQueryParams(currentState, map);
    });

    map.on('pointermove', function (evt) {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(evt);
    });

    map.on('click', function (evt) {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(evt);
    });

    map.on('dblclick', function (evt) {
        evt.stopPropagation();
        var pixel = map.getEventPixel(evt.originalEvent);
        var features = map.getFeaturesAtPixel(pixel);
        if (features.length > 0) {
            makeDetailedFeature(features[0]);
        } else {
            setStatus("No features found for where you double clicked on the map.");
        }
    });
}

export function setupDatePickerHandlers(remap) {
    const datepicker = document.getElementById('datepicker');
    const datepicker2 = document.getElementById('datepicker2');

    datepicker.addEventListener('change', () => {
        const [year, month, day] = datepicker.value.split('-');
        setState(StateKeys.DATE, makeDate(year, month, day));
        remap();
        if (getState(StateKeys.DATE) < getState(StateKeys.LAST_DATE)) {
            document.getElementById('settoday').style.display = 'block';
        }
    });

    datepicker2.addEventListener('change', () => {
        const [year, month, day] = datepicker2.value.split('-');
        setState(StateKeys.DATE2, makeDate(year, month, day));
        remap();
    });

    document.getElementById('settoday').addEventListener('click', () => {
        setToday(remap);
    });
}

export function setupRadioHandlers(map, vectorLayer) {
    document.querySelectorAll("input[type=radio][name=whichlayer]").forEach(radio => {
        radio.addEventListener('change', function () {
            setState(StateKeys.LTYPE, this.value);
            
            const currentState = {
                date: getState(StateKeys.DATE),
                date2: getState(StateKeys.DATE2),
                ltype: getState(StateKeys.LTYPE),
                metric: getState(StateKeys.METRIC),
                lat: getState(StateKeys.LAT),
                lon: getState(StateKeys.LON),
                sidebarOpen: getState(StateKeys.SIDEBAR_OPEN),
                lastdate: getState(StateKeys.LAST_DATE)
            };
            
            rerender_vectors(currentState, map, vectorLayer, () => setTitle(currentState));
        });
    });

    document.querySelectorAll("#units_radio input[type=radio]").forEach(radio => {
        radio.addEventListener('change', function () {
            // Handle units change
        });
    });
}

export function setupSearchHandlers() {
    document.getElementById('huc12searchtext').addEventListener('keypress', function (event) {
        if (event.which === 13) {
            doHUC12Search();
        }
    });

    document.getElementById('huc12searchbtn').addEventListener('click', function () {
        doHUC12Search();
    });
}

export function setupStateNavigationHandlers(map) {
    document.getElementById('il').addEventListener('click', function () {
        map.getView().setCenter(transform([-88.75, 40.14], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        this.blur();
    });
    
    document.getElementById('wi').addEventListener('click', () => {
        map.getView().setCenter(transform([-91.2, 45.11], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
    });
    
    document.getElementById('ia').addEventListener('click', function () {
        map.getView().setCenter(transform([-93.5, 42.07], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        this.blur();
    });
    
    document.getElementById('mn').addEventListener('click', function () {
        map.getView().setCenter(transform([-93.21, 46.05], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        this.blur();
    });
    
    document.getElementById('ks').addEventListener('click', function () {
        map.getView().setCenter(transform([-98.38, 38.48], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(7);
        this.blur();
    });
    
    document.getElementById('ne').addEventListener('click', function () {
        map.getView().setCenter(transform([-96.01, 40.55], 'EPSG:4326', 'EPSG:3857'));
        map.getView().setZoom(8);
        this.blur();
    });
}

export function setupMapControlHandlers(map, handleMapControlsClick, setStatus) {
    document.querySelectorAll("#mapcontrols button").forEach(button => {
        button.addEventListener('click', handleMapControlsClick);
    });
    
    document.getElementById("mapplus").addEventListener('click', function () {
        map.getView().setZoom(map.getView().getZoom() + 1);
    });
    
    document.getElementById("mapminus").addEventListener('click', function () {
        map.getView().setZoom(map.getView().getZoom() - 1);
    });
    
    document.getElementById("mapprint").addEventListener('click', () => {
        const date = getState(StateKeys.DATE);
        const date2 = getState(StateKeys.DATE2);
        const ltype = getState(StateKeys.LTYPE);
        
        const url = BACKEND + "/auto/" + formatDate("yymmdd", date) +
            "_" + formatDate("yymmdd", date2 || date) +
            "_0_" + ltype + ".png";
        window.open(url);
    });
    
    document.getElementById("mapinfo").addEventListener('click', function () {
        setStatus("Double click HUC12 for detailed data.");
    });
}

export function setupInlineEventHandlers(getShapefile, setUnits, setDateSelection, changeOpacity) {
    // Unit selection radio buttons
    document.querySelectorAll('input[name="units"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            setUnits(parseInt(event.target.value));
        });
    });

    // Date selection radio buttons
    document.querySelectorAll('input[name="t"]').forEach(radio => {
        radio.addEventListener('change', (event) => {
            setDateSelection(event.target.value);
        });
    });

    // Shapefile download button
    const shapefileBtn = document.querySelector('button[data-action="download-shapefile"]');
    if (shapefileBtn) {
        shapefileBtn.addEventListener('click', () => {
            getShapefile();
        });
    }

    // Opacity control buttons
    const opacityDecreaseBtn = document.querySelector('button[data-action="decrease-opacity"]');
    if (opacityDecreaseBtn) {
        opacityDecreaseBtn.addEventListener('click', () => {
            changeOpacity(-0.1);
        });
    }

    const opacityIncreaseBtn = document.querySelector('button[data-action="increase-opacity"]');
    if (opacityIncreaseBtn) {
        opacityIncreaseBtn.addEventListener('click', () => {
            changeOpacity(0.1);
        });
    }
}
