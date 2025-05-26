import { BACKEND, varunits, multipliers } from './constants';
import { formatDate } from './dateUtils';
import { getState, setState, StateKeys } from './state';

/**
 * Perform HUC12 search based on user input
 */
export function doHUC12Search() {
    document.getElementById('huc12searchres').innerHTML = '<p><img src="images/wait24trans.gif" /> Searching...</p>';
    var txt = document.getElementById('huc12searchtext').value;
    fetch(BACKEND + '/geojson/hsearch.py?' + new URLSearchParams({ q: txt }))
        .then(response => response.json())
        .then(res => {
            var tbl = "<table class='table table-striped'><thead><tr><th>ID</th><th>Name</th></tr></thead>";
            res.results.forEach(function (result) {
                tbl += "<tr><td><a href=\"javascript: setHUC12('" + result.huc_12 + "');\">" + result.huc_12 + "</a></td><td>" + result.name + "</td></tr>";
            });
            tbl += "</table>";
            document.getElementById('huc12searchres').innerHTML = tbl;
        })
        .catch(error => {
            document.getElementById('huc12searchres').innerHTML = "<p>Search failed, sorry</p>";
        });
}

/**
 * Create popup table for given huc12
 * @param {string} huc12 - HUC12 identifier
 * @param {string} mode - Mode ('daily' or 'yearly')
 */
export function viewEvents(huc12, mode) {
    function pprint(val, _mode) {
        if (val == null) return "0";
        return val.toFixed(2);
    }
    function pprint2(val, _mode) {
        if (_mode === 'daily') return "";
        return ` (${val})`;
    }
    var colLabel = (mode == 'daily') ? "Date" : "Year";
    var lbl = ((mode == 'daily') ? 'Daily events' : 'Yearly summary (# daily events)');
    document.getElementById('eventsModalLabel').innerHTML = `${lbl} for ${huc12}`;
    document.getElementById('eventsres').innerHTML = '<p><img src="images/wait24trans.gif" /> Loading...</p>';
    fetch(BACKEND + '/geojson/huc12_events.py?' + new URLSearchParams({ huc12: huc12, mode: mode }))
        .then(response => response.json())
        .then(res => {
            var myfunc = ((mode == 'yearly') ? 'setYearInterval(' : 'setDateFromString(');
            var tbl = '<button class="btn btn-primary" ' +
                'onclick="javascript: window.open(\'' + BACKEND + '/geojson/huc12_events.py?huc12=' + huc12 + '&amp;mode=' + mode + '&amp;format=xlsx\');">' +
                '<i class="bi-download"></i> Excel Download</button><br />' +
                '<table class="table table-striped header-fixed" id="depdt">' +
                "<thead><tr><th>" + colLabel + "</th><th>Precip [" + varunits['qc_precip'][getState(StateKeys.METRIC)] +
                "]</th><th>Runoff [" + varunits['qc_precip'][getState(StateKeys.METRIC)] +
                "]</th><th>Detach [" + varunits['avg_loss'][getState(StateKeys.METRIC)] +
                "]</th><th>Hillslope Soil Loss [" + varunits['avg_loss'][getState(StateKeys.METRIC)] +
                "]</th></tr></thead>";
            res.results.forEach(function (result) {
                var dt = ((mode == 'daily') ? result.date : result.date.substring(0, 4));
                tbl += "<tr><td><a href=\"javascript: " + myfunc + "'" + dt + "');\">" + dt + "</a></td><td>" +
                    pprint(result.qc_precip * multipliers['qc_precip'][getState(StateKeys.METRIC)]) + pprint2(result.qc_precip_events, mode) + "</td><td>" +
                    pprint(result.avg_runoff * multipliers['avg_runoff'][getState(StateKeys.METRIC)]) + pprint2(result.avg_runoff_events, mode) + "</td><td>" +
                    pprint(result.avg_loss * multipliers['avg_loss'][getState(StateKeys.METRIC)]) + pprint2(result.avg_loss_events, mode) + "</td><td>" +
                    pprint(result.avg_delivery * multipliers['avg_delivery'][getState(StateKeys.METRIC)]) + pprint2(result.avg_delivery_events, mode) + "</td></tr>";
            });
            tbl += "</table>";
            if (mode == 'yearly') {
                tbl += "<h4>Monthly Averages</h4>";
                tbl += '<p><img src="' + BACKEND + '/auto/huc12_bymonth.py?huc12=' + huc12 + '" class="img img-responsive"></p>';
            }

            document.getElementById('eventsres').innerHTML = tbl;
            // Initialize DataTable - Note: This requires DataTable library to be loaded
            if (window.DataTable) {
                new DataTable(document.getElementById("depdt"));
            }
        })
        .catch(error => {
            document.getElementById('eventsres').innerHTML = "<p>Something failed, sorry</p>";
        });
}

/**
 * Update the HUC12 details widget panel
 * @param {string} huc12 - HUC12 identifier
 */
export function updateDetails(huc12) {
    // Show side panel
    if (!getState(StateKeys.SIDEBAR_OPEN)) {
        document.getElementById("btnq1").click();
        // State will be updated by Bootstrap event listeners
    }
    // Show Data Tab in side bar
    document.getElementById("data-tab").click();
    document.getElementById('details_hidden').style.display = 'none';
    document.getElementById('details_details').style.display = 'none';
    document.getElementById('details_loading').style.display = 'block';
    fetch(`${BACKEND}/huc12-details.php?` + new URLSearchParams({
        huc12,
        date: formatDate("yy-mm-dd", getState(StateKeys.DATE)),
        date2: formatDate("yy-mm-dd", getState(StateKeys.DATE2)),
        metric: getState(StateKeys.METRIC)
    }))
        .then(response => response.text())
        .then(data => {
            document.getElementById('details_details').style.display = 'block';
            document.getElementById('details_loading').style.display = 'none';
            document.getElementById('details_details').innerHTML = data;
        })
        .catch(error => {
            document.getElementById('details_details').style.display = 'block';
            document.getElementById('details_loading').style.display = 'none';
            document.getElementById('details_details').innerHTML = '<p>Error loading details</p>';
        });
}

/**
 * Hide the details panel
 */
export function hideDetails() {
    document.getElementById('details_hidden').style.display = 'block';
    document.getElementById('details_details').style.display = 'none';
    document.getElementById('details_loading').style.display = 'none';
}
