import { BACKEND, varunits, multipliers } from './constants';
import { getState, setState, StateKeys } from './state';
import strftime from 'strftime';
import { requireElement, requireInputElement } from 'iemjs/domUtils';
import { setYearInterval, setDateFromString, setDate } from './dateUtils.js';
import { Modal } from 'bootstrap';
import { getVectorLayer, getMap, makeDetailedFeature } from './mapManager.js';

/**
 * Set up event delegation for dynamically created modal content
 */
export function setupHUC12EventHandlers() {

    // Event delegation for HUC12 search results
    const searchRes = requireElement('huc12searchres');
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

    // Event delegation for events modal date links
    const eventsResults = requireElement('eventsres');
    eventsResults.addEventListener('click', (event) => {
        const target = event.target;
        if (target instanceof HTMLAnchorElement && target.classList.contains('date-link')) {
            event.preventDefault();
            const date = target.getAttribute('data-date');
            const functionName = target.getAttribute('data-function');

            // Get the modal instance to hide it
            const eventsModalElement = requireElement('eventsModal');
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

    // Event delegation for details panel (handles dynamically injected content)
    const detailsContainer = requireElement('details_details');
    detailsContainer.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        
        const action = target.getAttribute('data-action');
        if (!action) {
            return;
        }
        
        event.preventDefault();
        
        switch (action) {
            case 'view-events': {
                const huc12 = target.getAttribute('data-huc12');
                const period = target.getAttribute('data-period');
                if (huc12 && period && (period === 'daily' || period === 'yearly')) {
                    viewEvents(huc12, period);
                }
                break;
            }
            case 'set-date': {
                const year = target.getAttribute('data-year');
                const month = target.getAttribute('data-month');
                const day = target.getAttribute('data-day');
                if (year && month && day) {
                    setDate(parseInt(year), parseInt(month), parseInt(day));
                }
                break;
            }
        }
    });
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

    // 2. Find the feature and zoom to it
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
                        padding: [50, 50, 50, 50],
                        maxZoom: 12
                    });
                }
            }
            // 3. Select the feature and load details (same as double-click)
            makeDetailedFeature(feature);
            return;
        }
    }

    // Fallback if feature not found - just load details by ID
    updateDetails(huc12, true);
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
        modalLabel: requireElement('eventsModalLabel'),
        results: requireElement('eventsres'),
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
                        <th>Hillslope Soil Delivery [${varunits.avg_loss[metric]}]</th>
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
 * Format a date string (YYYY-MM-DD) for display
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDateDisplay(dateStr) {
    const date = new Date(`${dateStr}T00:00:00`);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Format a date string for the summary header
 * @param {Date} date - Date object
 * @returns {string} Formatted date string (e.g., "01 Jan 2025")
 */
function formatSummaryDate(date) {
    return strftime('%d %b %Y', date);
}

/**
 * Populate the HUC12 details panel from JSON data
 * @param {Object} data - JSON response from the API
 * @param {string} huc12 - HUC12 identifier
 * @param {Date} date - Current date
 */
function populateDetailsPanel(data, huc12, date) {
    const { name, qc_precip, avg_runoff, avg_loss, avg_delivery, punit, lunit, top10 } = data;
    
    // Format numeric values to 2 decimal places
    const formatNum = (val) => Number(val).toFixed(2);
    
    // Update simple text elements
    requireElement('details_name').textContent = name;
    requireElement('details_huc12_display').textContent = huc12;
    requireInputElement('details_huc12').value = huc12;
    requireElement('details_summary_title').textContent = `${formatSummaryDate(date)} Summary`;
    
    // Update summary values
    requireElement('details_precip').textContent = `${formatNum(qc_precip)} ${punit}`;
    requireElement('details_runoff').textContent = `${formatNum(avg_runoff)} ${punit}`;
    requireElement('details_loss').textContent = `${formatNum(avg_loss)} ${lunit}`;
    requireElement('details_delivery').textContent = `${formatNum(avg_delivery)} ${lunit}`;
    
    // Update buttons with HUC12 data attribute
    requireElement('details_btn_daily').setAttribute('data-huc12', huc12);
    requireElement('details_btn_yearly').setAttribute('data-huc12', huc12);
    
    // Update top 10 table header units
    requireElement('details_top10_punit').textContent = punit;
    requireElement('details_top10_punit2').textContent = punit;
    requireElement('details_top10_lunit').textContent = lunit;
    requireElement('details_top10_lunit2').textContent = lunit;
    
    // Build top 10 table rows with full data
    const top10Body = requireElement('details_top10');
    let top10HTML = '';
    
    for (let i = 0; i < top10.length; i++) {
        const item = top10[i];
        const [year, month, day] = item.date.split('-');
        const shortYear = year.slice(2);
        top10HTML += `<tr>
            <td><a href="#" data-action="set-date" data-year="${year}" data-month="${month}" data-day="${day}" title="${formatDateDisplay(item.date)}">${month}/${day}/${shortYear}</a></td>
            <td>${formatValue(item.qc_precip)}</td>
            <td>${formatValue(item.avg_runoff)}</td>
            <td>${formatValue(item.avg_loss)}</td>
            <td>${formatValue(item.avg_delivery)}</td>
        </tr>`;
    }
    
    top10Body.innerHTML = top10HTML;
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
        sidebarToggle: requireElement('btnq1'),
        dataTab: requireElement('data-tab'),
        hidden: requireElement('details_hidden'),
        details: requireElement('details_details'),
        loading: requireElement('details_loading'),
    };

    return Object.values(elements).every(el => el) ? elements : null;
};

/**
 * Update the HUC12 details widget panel
 * @param {string} huc12 - HUC12 identifier
 * @param {boolean} focusTab - Whether to focus the Data tab
 */
export async function updateDetails(huc12, focusTab) {
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

    if (focusTab) {
        // Show Data Tab in side bar
        elements.dataTab.click();
    }

    // Update display states
    elements.hidden.style.display = 'none';
    elements.details.style.display = 'none';
    elements.loading.style.display = 'block';

    try {
        const date = getState(StateKeys.DATE);
        const date2 = getState(StateKeys.DATE2);
        
        if (!date) {
            elements.loading.style.display = 'none';
            elements.details.style.display = 'block';
            elements.details.innerHTML = '<p>Please wait for date to be loaded...</p>';
            return;
        }

        const searchParams = new URLSearchParams({
            huc12,
            date: strftime('%Y-%m-%d', date),
            metric: String(getState(StateKeys.METRIC)),
        });
        if (date2) {
            searchParams.set('date2', strftime('%Y-%m-%d', date2));
        }

        const response = await fetch(`${BACKEND}/auto/huc12_details.py?${searchParams}`);
        const data = await response.json();

        elements.loading.style.display = 'none';
        elements.details.style.display = 'block';
        populateDetailsPanel(data, huc12, date);
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
