import './style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { readUrlParams, migrateHashToQueryParams } from './urlHandler';
import { checkDates, setDateSelection } from './dateUtils';
import { initializeMap, remap, setupMapEventHandlers } from './mapManager';
import { setupDatePickerHandlers, setupRadioHandlers, setupSearchHandlers, setupStateNavigationHandlers, setupMapControlHandlers, setupInlineEventHandlers } from './eventHandlers';
import { initializeBootstrapComponents } from './bootstrapComponents';
import { getState, StateKeys } from './state';
import { showVersions, makeLayerSwitcher, setupSidebarEvents } from './uiManager';


// Our main entry point for the application
document.addEventListener('DOMContentLoaded', () => {
    // 1. Migrate any old hash-based URL parameters to query parameters
    migrateHashToQueryParams();

    // 2. Read URL parameters to set initial state
    readUrlParams();

    // Initialize map and layers
    initializeMap();

    // Setup event handlers
    setupDatePickerHandlers();
    setupRadioHandlers();
    setupSearchHandlers();
    setupStateNavigationHandlers();
    setupMapControlHandlers();
    setupInlineEventHandlers(setDateSelection);
    setupSidebarEvents();

    // Initialize date display
    if (getState(StateKeys.DATE2)) {
        const dp2 = document.getElementById("dp2");
        if (dp2) {
            dp2.style.display = 'block';
        }
    }

    // Initialize other components
    checkDates();
    window.setInterval(() => {
        checkDates();
    }, 600000);
    makeLayerSwitcher();
    showVersions();

    // Initialize Bootstrap components
    initializeBootstrapComponents();

});
