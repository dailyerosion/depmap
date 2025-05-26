import { transform } from 'ol/proj';
import { setToday, makeDate, formatDate } from './dateUtils';
import { rerender_vectors, setTitle } from './mapRenderer';
import { doHUC12Search } from './huc12Utils';
import { setQueryParams } from './urlHandler';
import { BACKEND, multipliers, varunits } from './constants';
import { getState, setState, StateKeys } from './state';
import { setStatus } from './toaster';
import { getClickOverlayLayer, getHoverOverlayLayer } from './mapInitializer';
import { handleSideBarClick } from './uiManager';

let quickFeature = null;
let detailedFeature = null;

function makeDetailedFeature(feature) {
    if (feature == null) {
        return;
    }

    if (feature != detailedFeature) {
        if (detailedFeature) {
            detailedFeature.set('clicked', false);
            getClickOverlayLayer().getSource().removeFeature(detailedFeature);
        }
        if (feature) {
            getClickOverlayLayer().getSource().addFeature(feature);
        }
        detailedFeature = feature;
    }
    
    // Create a state object for the updateDetails function
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
    
    updateDetails(feature.getId(), currentState);
    setQueryParams(currentState, map);
}

function displayFeatureInfo(map, popup, evt) {
    const metric = getState(StateKeys.METRIC);

    var features = map.getFeaturesAtPixel(map.getEventPixel(evt.originalEvent));
    var feature;
    if (features.length > 0) {
        feature = features[0];
        popup.element.hidden = false;
        popup.setPosition(evt.coordinate);
        document.getElementById('info-name').innerHTML = feature.get('name');
        document.getElementById('info-huc12').innerHTML = feature.getId();
        document.getElementById('info-loss').innerHTML = (feature.get('avg_loss') * multipliers['avg_loss'][metric]).toFixed(2) + ' ' + varunits['avg_loss'][metric];
        document.getElementById('info-runoff').innerHTML = (feature.get('avg_runoff') * multipliers['avg_runoff'][metric]).toFixed(2) + ' ' + varunits['avg_runoff'][metric];
        document.getElementById('info-delivery').innerHTML = (feature.get('avg_delivery') * multipliers['avg_delivery'][metric]).toFixed(2) + ' ' + varunits['avg_delivery'][metric];
        document.getElementById('info-precip').innerHTML = (feature.get('qc_precip') * multipliers['qc_precip'][metric]).toFixed(2) + ' ' + varunits['qc_precip'][metric];
    } else {
        popup.element.hidden = true;
        document.getElementById('info-name').innerHTML = '&nbsp;';
        document.getElementById('info-huc12').innerHTML = '&nbsp;';
        document.getElementById('info-loss').innerHTML = '&nbsp;';
        document.getElementById('info-runoff').innerHTML = '&nbsp;';
        document.getElementById('info-delivery').innerHTML = '&nbsp;';
        document.getElementById('info-precip').innerHTML = '&nbsp;';
    }

    // Keep only one selected
    if (feature) {
        if (feature !== quickFeature) {
            if (quickFeature) {
                getHoverOverlayLayer().getSource().removeFeature(quickFeature);
            }
            if (feature) {
                getHoverOverlayLayer().getSource().addFeature(feature);
            }
            quickFeature = feature;
        }
    }

};

function changeOpacity(amount) {
    vectorLayer.setOpacity(vectorLayer.getOpacity() + amount);
}

function handleMapControlsClick(event) {
    const btnid = event.currentTarget.id;
    document.querySelectorAll("#mapcontrols button").forEach(btn => btn.classList.remove("active"));
    document.getElementById(btnid).classList.add("active");
}

/**
 * Update the metric and re-render the vectors
 * @param {*} newunit 
 */
function setUnits(newunit) {
    setState(StateKeys.METRIC, parseInt(newunit));
    
    // Create a state object for functions that still expect it
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
}

// When user clicks the "Get Shapefile" Button
function getShapefile() {
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);
    const metric = getState(StateKeys.METRIC);
    
    const dt = formatDate("yy-mm-dd", date);
    const states = [];
    document.querySelectorAll("input[name='dlstates']:checked").forEach(input => {
        states.push(input.value);
    });
    let uri = `${BACKEND}/dl/shapefile.py?dt=${dt}&states=${states.join(",")}`;
    if (date2 !== null) {
        uri = `${uri}&dt2=${formatDate("yy-mm-dd", date2)}`;
    }
    uri = `${uri}&conv=${(metric == 0) ? 'english' : 'metric'}`;
    window.location.href = uri;
}

export function setupMapEventHandlers(map, popup) {
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
        displayFeatureInfo(map, popup, evt);
    });

    map.on('click', function (evt) {
        if (evt.dragging) {
            return;
        }
        displayFeatureInfo(map, popup, evt);
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

export function setupDatePickerHandlers() {
    const datepicker = document.getElementById('datepicker');
    const datepicker2 = document.getElementById('datepicker2');

    datepicker.addEventListener('change', () => {
        const [year, month, day] = datepicker.value.split('-');
        setState(StateKeys.DATE, makeDate(year, month, day));
        if (getState(StateKeys.DATE) < getState(StateKeys.LAST_DATE)) {
            document.getElementById('settoday').style.display = 'block';
        }
    });

    datepicker2.addEventListener('change', () => {
        const [year, month, day] = datepicker2.value.split('-');
        setState(StateKeys.DATE2, makeDate(year, month, day));
    });

    document.getElementById('settoday').addEventListener('click', () => {
        setToday();
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

export function setupMapControlHandlers(map) {
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

export function setupInlineEventHandlers(setDateSelection) {

    document.getElementById('btnq1').addEventListener('click', (event) => {
        handleSideBarClick();
    });
    
    document.getElementById('huc12searchbtn').addEventListener('click', () => {
        doHUC12Search();
    });
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
