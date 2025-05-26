import './style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { defaultCenter, defaultZoom } from './mapConfig';
import { tilecache, BACKEND, varnames, multipliers, levels, varunits } from './constants';
import { readUrlParams, setQueryParams, migrateHashToQueryParams } from './urlHandler';
import { showToast } from './toaster';
import { formatDate, setDate, setYearInterval, setDateFromString, checkDates } from './dateUtils';
import { drawColorbar, getJSONURL, rerender_vectors, setTitle } from './mapRenderer';
import { doHUC12Search, updateDetails } from './huc12Utils';
import { initializeMap, createOverlayLayers } from './mapInitializer';
import { setupMapEventHandlers, setupDatePickerHandlers, setupRadioHandlers, setupSearchHandlers, setupStateNavigationHandlers, setupMapControlHandlers, setupInlineEventHandlers } from './eventHandlers';
import { initializeBootstrapComponents } from './bootstrapComponents';
import { getState, setState, StateKeys } from './state';

// Initialize Bootstrap components
let eventsModal = null;
let myModal = null;
let dtModal = null;
let sidebar = null;

let map = null;
let vectorLayer = null;
let scenario = 0;
let quickFeature = null;
let detailedFeature = null;
let hoverOverlayLayer = null;
let clickOverlayLayer = null;
let popup = null;

function handleSideBarClick() {
    // Toggle the sidebar state - Bootstrap handles the actual display
    setState(StateKeys.SIDEBAR_OPEN, !getState(StateKeys.SIDEBAR_OPEN));
}

function setupSidebarEvents() {
    const sidebarElement = document.getElementById('sidebar');
    if (sidebarElement) {
        sidebarElement.addEventListener('shown.bs.offcanvas', () => {
            setState(StateKeys.SIDEBAR_OPEN, true);
        });
        sidebarElement.addEventListener('hidden.bs.offcanvas', () => {
            setState(StateKeys.SIDEBAR_OPEN, false);
        });
    }
}

// Update the status box on the page with the given text
function setStatus(text, type = 'info') {
    showToast(text, type);
}

function showVersions() {
    // Update the UI with what versions we have at play here.
    fetch(`${BACKEND}/auto/version.py?scenario=${scenario}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById("dv_label").textContent = data["label"];
            document.getElementById("dv_wepp").textContent = data["wepp"];
            document.getElementById("dv_acpf").textContent = data["acpf"];
            document.getElementById("dv_flowpath").textContent = data["flowpath"];
            document.getElementById("dv_gssurgo").textContent = data["gssurgo"];
            document.getElementById("dv_software").textContent = data["software"];
            document.getElementById("dv_tillage").textContent = data["tillage"];
        })
        .catch(error => {
            setStatus(`DEP version check failed ${error.message}`);
        });

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

function remap() {
    // Our main function for updating the map data
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);

    // Abort if we have no date set
    if (date == null) return;

    //console.log("remap() called"+ detailedFeature);
    if (date2 != null && date2 <= date) {
        setStatus("Please ensure that 'To Date' is later than 'Date'");
        return;
    }
    setStatus("Fetching new data to display...");
    
    fetch(getJSONURL())
        .then(response => response.json())
        .then(json => {
            var vsource = vectorLayer.getSource();
            // Zero out current data
            vsource.getFeatures().forEach(function (feat) {
                feat.setProperties({
                    'avg_delivery': 0,
                    'qc_precip': 0
                }, true);
            });
            // Merge in JSON provided data
            json.data.forEach(function (entry) {
                var feat = vsource.getFeatureById(entry.huc_12);
                if (feat === null) {
                    return;
                }
                feat.setProperties(entry, true);
            });

            // Setup what was provided to use by the JSON service for levels,
            // we also do the unit conversion so that we have levels in metric
            for (var i = 0; i < varnames.length; i++) {
                levels[varnames[i]][0] = json.ramps[varnames[i]];
                levels[varnames[i]][2] = json.max_values[varnames[i]];
                for (var j = 0; j < levels[varnames[i]][0].length; j++) {
                    levels[varnames[i]][1][j] = levels[varnames[i]][0][j] * multipliers[varnames[i]][1];
                }
                levels[varnames[i]][3] = json.max_values[varnames[i]] * multipliers[varnames[i]][1];

            }
            drawColorbar();

            if (detailedFeature) {
                clickOverlayLayer.getSource().removeFeature(detailedFeature);
                detailedFeature = vectorLayer.getSource().getFeatureById(detailedFeature.getId());
                clickOverlayLayer.getSource().addFeature(detailedFeature);
                updateDetails(detailedFeature.getId());
            }
            drawColorbar();
            vectorLayer.changed();
        })
        .catch(error => {
            setStatus(`Failed to fetch map data: ${error.message}`, 'error');
        });
    
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
    
    setTitle(currentState);
    setQueryParams(currentState, map);
}

function make_iem_tms(title, layername, visible, type) {
    return new TileLayer({
        title: title,
        visible: visible,
        type: type,
        maxZoom: (layername == 'depmask') ? 9 : 21,
        source: new XYZ({
            url: tilecache + '/c/tile.py/1.0.0/' + layername + '/{z}/{x}/{y}.png'
        })
    })
}
function setHUC12(huc12) {
    feature = vectorLayer.getSource().getFeatureById(huc12);
    makeDetailedFeature(feature);
    if (myModal) {
        myModal.hide();
    }
}

function makeDetailedFeature(feature) {
    if (feature == null) {
        return;
    }

    if (feature != detailedFeature) {
        if (detailedFeature) {
            detailedFeature.set('clicked', false);
            clickOverlayLayer.getSource().removeFeature(detailedFeature);
        }
        if (feature) {
            clickOverlayLayer.getSource().addFeature(feature);
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

function layerVisible(lyr, visible) {
    lyr.setVisible(visible);
    if (visible && lyr.get('type') === 'base') {
        // Hide all other base layers regardless of grouping
        map.getLayers().getArray().forEach(function (l) {
            if (l != lyr && l.get('type') === 'base') {
                l.setVisible(false);
            }
        });
    }

}
function makeLayerSwitcher() {
    var base_elem = document.getElementById("ls-base-layers");
    var over_elem = document.getElementById("ls-overlay-layers");
    map.getLayers().getArray().forEach(function (lyr, i) {
        var lyrTitle = lyr.get('title');
        if (lyrTitle === undefined) return;
        var lid = 'oll' + i;
        var li = document.createElement('li');
        var input = document.createElement('input');
        input.id = lid;
        var label = document.createElement('label');
        label.htmlFor = lid;
        if (lyr.get('type') === 'base') {
            input.type = 'radio';
            input.name = 'base';
        } else {
            input.type = 'checkbox';
        }
        input.checked = lyr.get('visible');
        input.addEventListener("change", function (e) {
            layerVisible(lyr, e.target.checked);
        });
        label.innerHTML = "&nbsp; " + lyrTitle;
        li.appendChild(input);
        li.appendChild(label);
        if (lyr.get('type') === 'base') {
            base_elem.appendChild(li);
        } else {
            over_elem.appendChild(li);
        }

    });
}
function displayFeatureInfo(evt) {
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
                hoverOverlayLayer.getSource().removeFeature(quickFeature);
            }
            if (feature) {
                hoverOverlayLayer.getSource().addFeature(feature);
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

/**
 * Update the date selection type single or multi
 * @param {*} newval
 */
function setDateSelection(newval) {
    if (newval === 'single') {
        setState(StateKeys.DATE2, null);
        document.getElementById("dp2").style.display = 'none';
        remap();
    } else {
        document.getElementById("dp2").style.display = 'block';
        //var dt = $("#datepicker2").datepicker("getDate");
        //appstate.date2 = makeDate(dt.getUTCFullYear(), dt.getUTCMonth() + 1,
        //    dt.getUTCDate());
    }
}


function build() {
    // Create a state object for functions that still expect it during initialization
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
    
    readUrlParams(defaultCenter, defaultZoom);

    document.getElementById('btnq1').addEventListener('click', (event) => {
        handleSideBarClick();
    });

    // Initialize map and layers
    const mapResult = initializeMap(make_iem_tms);
    map = mapResult.map;
    vectorLayer = mapResult.vectorLayer;
    popup = mapResult.popup;

    // Create overlay layers
    const overlayResult = createOverlayLayers(map);
    hoverOverlayLayer = overlayResult.hoverOverlayLayer;
    clickOverlayLayer = overlayResult.clickOverlayLayer;

    // Setup event handlers
    setupMapEventHandlers(map, setStatus, makeDetailedFeature, displayFeatureInfo);
    setupDatePickerHandlers(remap);
    setupRadioHandlers(map, vectorLayer);
    setupSearchHandlers();
    setupStateNavigationHandlers(map);
    setupMapControlHandlers(map, handleMapControlsClick, setStatus);
    setupInlineEventHandlers(getShapefile, setUnits, setDateSelection, changeOpacity);
    setupSidebarEvents();

    // Initialize date display
    if (getState(StateKeys.DATE2)) {
        document.getElementById("dp2").style.display = 'block';
    }

    // Initialize other components
    checkDates(scenario, setDate);
    window.setInterval(() => {
        checkDates(scenario, setDate);
    }, 600000);
    makeLayerSwitcher();
    showVersions();

    // Initialize Bootstrap components
    const bootstrapComponents = initializeBootstrapComponents();
    eventsModal = bootstrapComponents.eventsModal;
    myModal = bootstrapComponents.myModal;
    dtModal = bootstrapComponents.dtModal;
    sidebar = bootstrapComponents.sidebar;
}; // End of build


document.addEventListener('DOMContentLoaded', () => {
    migrateHashToQueryParams();
    build();

    document.getElementById('huc12searchbtn').addEventListener('click', () => {
        doHUC12Search();
    });
});

// Global wrapper functions for dynamically generated HTML calls
window.setYearInterval = function(syear) {
    setYearInterval(syear, remap, eventsModal);
};

window.setDateFromString = function(s) {
    setDateFromString(s, remap, eventsModal);
};

window.setHUC12 = setHUC12;

