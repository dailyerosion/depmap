import { BACKEND, varunits, multipliers } from './constants';
import { getState, setState, StateKeys } from './state';
import strftime from 'strftime';
import { requireElement, requireInputElement } from 'iemjs/domUtils';
import { setYearInterval, setDateFromString } from './dateUtils.js';
import { Modal } from 'bootstrap';
import { getVectorLayer, getMap } from './mapManager.js';

/**
 * Set up event delegation for dynamically created modal content
 */
export function setupHUC12EventHandlers() {

    // Event delegation for HUC12 search results
    const searchRes = document.getElementById('huc12searchres');
    if (searchRes) {
        searchRes.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof HTMLAnchorElement && target.classList.contains('huc12-link')) {
                event.preventDefault();
                const huc12 = target.getAttribute('data-huc12');
                if (huc12) {
                    setHUC12(huc12);
                }
            }
        });
    }

    // Event delegation for events modal date links
    const eventsResults = document.getElementById('eventsres');
    if (eventsResults) {
        eventsResults.addEventListener('click', (event) => {
            const target = event.target;
            if (target instanceof HTMLAnchorElement && target.classList.contains('date-link')) {
                event.preventDefault();
                const date = target.getAttribute('data-date');
                const functionName = target.getAttribute('data-function');
                
                // Get the modal instance to hide it
                const eventsModalElement = document.getElementById('eventsModal');
                const eventsModal = eventsModalElement ? Modal.getInstance(eventsModalElement) : null;
                
                if (date && functionName) {
                    if (functionName === 'setYearInterval') {
                        setYearInterval(date, eventsModal);
                    } else if (functionName === 'setDateFromString') {
                        setDateFromString(date, eventsModal);
                    }
                }
            }
        });
    }
}

/**
 * callback function to set the HUC12 value
 * @param {String} huc12 
 */
export function setHUC12(huc12) {
    // 1. Close the huc12 search modal
    const modalElement = requireElement('myModal');
    const modal = Modal.getInstance(modalElement);
    if (modal) {
        modal.hide();
    }

    // 2. Find and zoom to the HUC12 geometry
    const vectorLayer = getVectorLayer();
    if (vectorLayer?.getSource()) {
        const feature = vectorLayer.getSource().getFeatureById(huc12);
        if (feature) {
            const geometry = feature.getGeometry();
            if (geometry) {
                const map = getMap();
                if (map) {
                    // Fit the map view to the feature's extent
                    map.getView().fit(geometry, {
                        padding: [50, 50, 50, 50], // Add some padding around the feature
                        maxZoom: 12 // Don't zoom in too close
                    });
                }
            }
        }
    }

    // 3. Switch to Data tab and load detailed huc12 information
    updateDetails(huc12);
}

/**
 * Perform HUC12 search based on user input
 */
export async function doHUC12Search() {
    const searchRes = requireElement('huc12searchres');

    const loadingHtml = '<p><img src="images/wait24trans.gif" alt="Loading" /> Searching...</p>';
    searchRes.innerHTML = loadingHtml;

    const huc12searchtext = requireInputElement('huc12searchtext');

    const searchParams = new URLSearchParams({ q: huc12searchtext.value });
    try {
        const response = await fetch(`${BACKEND}/geojson/hsearch.py?${searchParams}`);
        const data = await response.json();
        
        const tableRows = data.results.map(result => `
            <tr>
                <td><a href="#" data-huc12="${result.huc_12}" class="huc12-link">${result.huc_12}</a></td>
                <td>${result.name}</td>
            </tr>
        `).join('');

        const tableHtml = `
            <table class="table table-striped">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        `;

        searchRes.innerHTML = tableHtml;
    } catch (error) {
        searchRes.innerHTML = `<p>Search failed: ${error.message}</p>`;
    }
}

/**
 * Create popup table for given huc12
 * @param {string} huc12 - HUC12 identifier
 * @param {string} mode - Mode ('daily' or 'yearly')
 */
/**
 * Format a numeric value with 2 decimal places
 * @param {number | null} val - The value to format
 * @returns {string} Formatted value
 */
/**
 * Format a numeric value for display
 * @param {number | null} val - Value to format
 * @returns {string} Formatted value
 */
const formatValue = (val) => {
    if (val === null) {
        return '0';
    }
    return val.toFixed(2);
};

/**
 * Format event count for display
 * @param {number} val - Event count
 * @param {string} mode - Display mode ('daily' or 'yearly')
 * @returns {string} Formatted count
 */
const formatEventCount = (val, mode) => (mode === 'daily' ? '' : ` (${val})`);

/**
 * Create table row for event data
 * @param {Object} result - Event data
 * @param {string} mode - Display mode
 * @param {number} metric - Metric value
 * @returns {string} HTML table row
 */
const createEventRow = (result, mode, metric) => {
    const dt = mode === 'daily' ? result.date : result.date.substring(0, 4);
    const myfunc = mode === 'yearly' ? 'setYearInterval' : 'setDateFromString';
    
    return `
        <tr>
            <td><a href="#" data-date="${dt}" data-function="${myfunc}" class="date-link">${dt}</a></td>
            <td>${formatValue(result.qc_precip * multipliers.qc_precip[metric])}${formatEventCount(result.qc_precip_events, mode)}</td>
            <td>${formatValue(result.avg_runoff * multipliers.avg_runoff[metric])}${formatEventCount(result.avg_runoff_events, mode)}</td>
            <td>${formatValue(result.avg_loss * multipliers.avg_loss[metric])}${formatEventCount(result.avg_loss_events, mode)}</td>
            <td>${formatValue(result.avg_delivery * multipliers.avg_delivery[metric])}${formatEventCount(result.avg_delivery_events, mode)}</td>
        </tr>
    `;
};

/**
 * Display events for a given HUC12
 * @param {string} huc12 - HUC12 identifier
 * @param {'daily' | 'yearly'} mode - Display mode
 */
export async function viewEvents(huc12, mode) {
    const metric = getState(StateKeys.METRIC);
    const colLabel = mode === 'daily' ? 'Date' : 'Year';
    const lbl = mode === 'daily' ? 'Daily events' : 'Yearly summary (# daily events)';

    // Get and validate required DOM elements
    const elements = {
        modalLabel: document.getElementById('eventsModalLabel'),
        results: document.getElementById('eventsres'),
    };

    if (!elements.modalLabel || !elements.results) {
        console.error('Required modal elements not found');
        return;
    }

    elements.modalLabel.innerHTML = `${lbl} for ${huc12}`;
    elements.results.innerHTML = '<p><img src="images/wait24trans.gif" alt="Loading" /> Loading...</p>';

    try {
        const searchParams = new URLSearchParams({ huc12, mode });
        const response = await fetch(`${BACKEND}/geojson/huc12_events.py?${searchParams}`);
        const data = await response.json();

        // Build the download button
        const downloadButton = `
            <button class="btn btn-primary" onclick="window.open('${BACKEND}/geojson/huc12_events.py?huc12=${huc12}&mode=${mode}&format=xlsx')">
                <i class="bi-download"></i> Excel Download
            </button><br />
        `;

        // Build the table header
        const tableHeader = `
            <table class="table table-striped header-fixed" id="depdt">
                <thead>
                    <tr>
                        <th>${colLabel}</th>
                        <th>Precip [${varunits.qc_precip[metric]}]</th>
                        <th>Runoff [${varunits.qc_precip[metric]}]</th>
                        <th>Detach [${varunits.avg_loss[metric]}]</th>
                        <th>Hillslope Soil Loss [${varunits.avg_loss[metric]}]</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.results.map(result => createEventRow(result, mode, metric)).join('')}
                </tbody>
            </table>
        `;

        // Add monthly averages section for yearly mode
        const monthlyAverages = mode === 'yearly' ? `
            <h4>Monthly Averages</h4>
            <p><img src="${BACKEND}/auto/huc12_bymonth.py?huc12=${huc12}" class="img img-responsive" alt="Monthly averages chart" /></p>
        ` : '';

        elements.results.innerHTML = downloadButton + tableHeader + monthlyAverages;
    } catch (error) {
        elements.results.innerHTML = `<p>Error loading events: ${error.message}</p>`;
    }
}

/**
 * Update the HUC12 details widget panel
 * @param {string} huc12 - HUC12 identifier
 */
/**
 * Get required DOM elements for details panel
 * @returns {Object} Object containing DOM elements or null if any are missing
 */
const getDetailsElements = () => {
    const elements = {
        sidebarToggle: document.getElementById('btnq1'),
        dataTab: document.getElementById('data-tab'),
        hidden: document.getElementById('details_hidden'),
        details: document.getElementById('details_details'),
        loading: document.getElementById('details_loading'),
    };

    return Object.values(elements).every(el => el) ? elements : null;
};

/**
 * Update the HUC12 details widget panel
 * @param {string} huc12 - HUC12 identifier
 */
export async function updateDetails(huc12) {
    setState(StateKeys.HUC12, huc12);
    const elements = getDetailsElements();
    if (!elements) {
        console.error('Required details panel elements not found');
        return;
    }

    // Show side panel if needed
    if (!getState(StateKeys.SIDEBAR_OPEN)) {
        elements.sidebarToggle.click();
    }

    // Show Data Tab in side bar
    elements.dataTab.click();

    // Update display states
    elements.hidden.style.display = 'none';
    elements.details.style.display = 'none';
    elements.loading.style.display = 'block';

    try {
        const searchParams = new URLSearchParams({
            huc12,
            date: strftime('%Y-%m-%d', getState(StateKeys.DATE)),
            date2: strftime('%Y-%m-%d', getState(StateKeys.DATE2)),
            metric: String(getState(StateKeys.METRIC)),
        });

        const response = await fetch(`${BACKEND}/huc12-details.php?${searchParams}`);
        const data = await response.text();

        elements.details.style.display = 'block';
        elements.loading.style.display = 'none';
        elements.details.innerHTML = data;
    } catch (error) {
        elements.details.style.display = 'block';
        elements.loading.style.display = 'none';
        elements.details.innerHTML = '<p>Error loading details</p>';
        console.error('Failed to load details:', error);
    }
}

/**
 * Hide the details panel
 */
/**
 * Hide the details panel
 */
export function hideDetails() {
    const elements = getDetailsElements();
    if (!elements) {
        console.error('Required details panel elements not found');
        return;
    }

    elements.hidden.style.display = 'block';
    elements.details.style.display = 'none';
    elements.loading.style.display = 'none';
}
