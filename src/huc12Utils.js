import { BACKEND, varunits, multipliers } from './constants';
import { formatDate } from './dateUtils';
import { getState, StateKeys } from './state';

/**
 * Perform HUC12 search based on user input
 */
export async function doHUC12Search() {
    const searchRes = document.getElementById('huc12searchres');
    if (!searchRes) {
        console.error('Search results element not found');
        return;
    }

    const loadingHtml = '<p><img src="images/wait24trans.gif" alt="Loading" /> Searching...</p>';
    searchRes.innerHTML = loadingHtml;

    const huc12searchtext = document.getElementById('huc12searchtext');
    if (!huc12searchtext || !(huc12searchtext instanceof HTMLInputElement)) {
        console.error('Search input element not found');
        return;
    }

    const searchParams = new URLSearchParams({ q: huc12searchtext.value });
    try {
        const response = await fetch(`${BACKEND}/geojson/hsearch.py?${searchParams}`);
        const data = await response.json();
        
        const tableRows = data.results.map(result => `
            <tr>
                <td><a href="javascript: setHUC12('${result.huc_12}');">${result.huc_12}</a></td>
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
    if (val == null) return '0';
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
            <td><a href="javascript: ${myfunc}('${dt}');">${dt}</a></td>
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
            date: formatDate('yy-mm-dd', getState(StateKeys.DATE)),
            date2: formatDate('yy-mm-dd', getState(StateKeys.DATE2)),
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
