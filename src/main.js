import './style.css';
import 'bootstrap/dist/css/bootstrap.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import { VERSION_DISPLAY } from './version.js';
import { readUrlParams, migrateHashToQueryParams, updateUrlOnStateChange } from './urlHandler';
import { setDateSelection } from './dateUtils';
import { checkDates, remap } from './dataFetchers';
import { initializeMap } from './mapManager';
import {
    setupDatePickerHandlers,
    setupRadioHandlers,
    setupSearchHandlers,
    setupStateNavigationHandlers,
    setupMapControlHandlers,
    setupInlineEventHandlers,
} from './eventHandlers';
import { setupHUC12EventHandlers } from './huc12Utils';
import { initializeBootstrapComponents } from './bootstrapComponents';
import { getState, StateKeys, subscribeToState } from './state';
import {
    showVersions,
    makeLayerSwitcher,
    setupSidebarEvents,
} from './uiManager';
import { setupBranding } from './brandingOverlay';
import { requireElement } from 'iemjs/domUtils';

/**
 * Initialize version display in the UI
 */
export function initializeVersionDisplay() {
    // Update the web interface version element
    const webInterfaceElement = requireElement('dv_web_interface');
    webInterfaceElement.textContent = VERSION_DISPLAY;
}

// Our main entry point for the application
document.addEventListener('DOMContentLoaded', () => {
    // 0. Setup things not requiring other things to be initialized
    setupBranding();

    // 1. Migrate any old hash-based URL parameters to query parameters
    migrateHashToQueryParams();

    // 2. Read URL parameters to set initial state and listen for changes
    readUrlParams();
    updateUrlOnStateChange();

    // 3. Set up subscription to remap when date changes
    subscribeToState(StateKeys.DATE, () => {
        // Only remap if we have a valid date
        const currentDate = getState(StateKeys.DATE);
        if (currentDate instanceof Date) {
            remap();
        }
    });
    subscribeToState(StateKeys.DATE2, () => {
        // Remap when date2 changes (for range selections)
        remap();
    });

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
    setupHUC12EventHandlers();

    // Initialize date display
    if (getState(StateKeys.DATE2)) {
        const dp2 = requireElement('dp2');
        dp2.style.display = 'block';
    }

    // Initialize other components
    checkDates();
    window.setInterval(() => {
        checkDates();
    }, 600000);
    makeLayerSwitcher();
    showVersions();
    
    // Initialize version display
    initializeVersionDisplay();

    // Initialize Bootstrap components
    initializeBootstrapComponents();
});
