// Functions that make API calls to fetch data
import {
    BACKEND,
    scenario,
    varnames,
    levels,
    multipliers,
} from './constants.js';
import { getState, setState, StateKeys } from './state.js';
import { setStatus } from './toaster.js';
import { formatDate, setDate } from './dateUtils.js';
import { drawColorbar, getVectorLayer } from './mapManager';

export function checkDates() {
    fetch(`${BACKEND}/geojson/timedomain.py?scenario=${scenario}`)
        .then((response) => response.json())
        .then((data) => {
            if (data['last_date']) {
                const newdate = new Date(data['last_date']);
                const lastdate = getState(StateKeys.LAST_DATE);
                const currentDate = getState(StateKeys.DATE);

                if (
                    newdate > lastdate &&
                    (currentDate == null ||
                        newdate.getTime() !== currentDate.getTime())
                ) {
                    setState(StateKeys.LAST_DATE, newdate);
                    if (currentDate != null) {
                        const elem = document.getElementById('newdate-thedate');
                        if (elem) {
                            elem.innerHTML = formatDate('M d, yy', newdate);
                        }
                    } else {
                        setDate(
                            newdate.getFullYear(),
                            newdate.getMonth() + 1,
                            newdate.getDate()
                        );
                    }
                }
            }
        })
        .catch((error) => {
            setStatus(`New data check failed ${error.message}`);
        });
}

export function remap() {
    // Our main function for updating the map data
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);

    // Abort if we have no date set
    if (date == null) return;

    if (date2 != null && date2 <= date) {
        setStatus(`Please ensure that 'To Date' is later than 'Date'`);
        return;
    }
    setStatus('Fetching new data to display...');

    fetch(getJSONURL())
        .then((response) => response.json())
        .then((json) => {
            const vsource = getVectorLayer().getSource();
            // Zero out current data
            vsource.getFeatures().forEach((feat) => {
                feat.setProperties(
                    {
                        avg_delivery: 0,
                        qc_precip: 0,
                    },
                    true
                );
            });
            // Merge in JSON provided data
            json.data.forEach((entry) => {
                const feat = vsource.getFeatureById(entry.huc_12);
                if (feat === null) {
                    return;
                }
                feat.setProperties(entry, true);
            });

            // Setup what was provided to use by the JSON service for levels,
            // we also do the unit conversion so that we have levels in metric
            for (let i = 0; i < varnames.length; i++) {
                levels[varnames[i]][0] = json.ramps[varnames[i]];
                levels[varnames[i]][2] = json.max_values[varnames[i]];
                for (let j = 0; j < levels[varnames[i]][0].length; j++) {
                    levels[varnames[i]][1][j] =
                        levels[varnames[i]][0][j] * multipliers[varnames[i]][1];
                }
                levels[varnames[i]][3] =
                    json.max_values[varnames[i]] * multipliers[varnames[i]][1];
            }
            drawColorbar();
            getVectorLayer().changed();
        })
        .catch((error) => {
            setStatus(`Failed to fetch map data: ${error.message}`, 'error');
        });
}

/**
 * Get the JSON URL for fetching map data
 * @returns {string} JSON URL
 */
export function getJSONURL() {
    const date = getState(StateKeys.DATE);
    const date2 = getState(StateKeys.DATE2);

    return `${BACKEND}/auto/${formatDate('yymmdd', date)}_${formatDate('yymmdd', date2 || date)}.json`;
}
