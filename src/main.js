import './style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { scenario } from './constants';
import { defaultCenter, defaultZoom } from './mapConfig';
import { readUrlParams, migrateHashToQueryParams } from './urlHandler';
import { setDate, checkDates, setDateSelection } from './dateUtils';
import { initializeMap, createOverlayLayers } from './mapInitializer';
import { setupMapEventHandlers, setupDatePickerHandlers, setupRadioHandlers, setupSearchHandlers, setupStateNavigationHandlers, setupMapControlHandlers, setupInlineEventHandlers } from './eventHandlers';
import { initializeBootstrapComponents } from './bootstrapComponents';
import { getState, StateKeys } from './state';
import { setStatus } from './toaster';
import { showVersions, makeLayerSwitcher, setupSidebarEvents } from './uiManager';
import { remap } from './mapRenderer';


// Our main entry point for the application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Migrate any old hash-based URL parameters to query parameters
    migrateHashToQueryParams();

    // 2. Read URL parameters to set initial state
    readUrlParams(defaultCenter, defaultZoom);

    // Initialize map and layers
    const mapResult = initializeMap();

    // Create overlay layers
    createOverlayLayers(mapResult.map);

    // Setup event handlers
    setupMapEventHandlers(mapResult.map, mapResult.popup);
    setupDatePickerHandlers();
    setupRadioHandlers(mapResult.map, mapResult.vectorLayer);
    setupSearchHandlers();
    setupStateNavigationHandlers(mapResult.map);
    setupMapControlHandlers(mapResult.map, setStatus);
    setupInlineEventHandlers(setDateSelection);
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
    makeLayerSwitcher(mapResult.map);
    showVersions();

    // Initialize Bootstrap components
    initializeBootstrapComponents();

    remap();
});
