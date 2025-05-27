import { transform } from 'ol/proj';
import { getState, setState, StateKeys } from './state';
import { getMap } from './mapManager';
import { makeDate } from './dateUtils';

export function readUrlParams() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('date')) {
        setState(StateKeys.DATE, makeDateFromString(params.get('date')));
    }

    if (params.has('date2')) {
        setState(StateKeys.DATE2, makeDateFromString(params.get('date2')));
    }

    if (params.has('ltype')) {
        setState(StateKeys.LTYPE, params.get('ltype'));
        const input = document.querySelector(`input[value="${params.get('ltype')}"]`);
        if (input && input instanceof HTMLInputElement) {
            input.checked = true;
        }
    }

    if (params.has('lon') && params.has('lat') && params.has('zoom')) {
        const lat = params.get('lat');
        if (lat) {
            setState(StateKeys.LAT, parseFloat(lat));
        }
        const lon = params.get('lon');
        if (lon) {
            setState(StateKeys.LON, parseFloat(lon));
        }
        const zoom = params.get('zoom');
        if (zoom) {
            setState(StateKeys.ZOOM, parseFloat(zoom));
        }
    }

    if (params.has('metric')) {
        const metric = params.get('metric');
        if (metric) {
            setState(StateKeys.METRIC, parseInt(metric));
        }
        const unitInput = document.querySelector(`#units_radio input[value="${params.get('metric')}"]`);
        if (unitInput && unitInput instanceof HTMLInputElement) {
            unitInput.checked = true;
        }
    }
}

export function setQueryParams() {
    const queryParams = new URLSearchParams(window.location.search);

    /** @type {Date} */
    const date = getState(StateKeys.DATE);
    /** @type {Date} */
    const date2 = getState(StateKeys.DATE2);
    const ltype = getState(StateKeys.LTYPE);
    const metric = getState(StateKeys.METRIC);
    
    if (date instanceof Date && !Number.isNaN(date.getTime())) {
        queryParams.set('date', formatDateForQuery(date));
    }
    if (date2 instanceof Date && !Number.isNaN(date2.getTime())) {
        queryParams.set('date2', formatDateForQuery(date2));
    }
    queryParams.set('ltype', ltype);

    const center = transform(getMap().getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    queryParams.set('lon', center[0].toFixed(2));
    queryParams.set('lat', center[1].toFixed(2));
    queryParams.set('zoom', getMap().getView().getZoom().toFixed(0));

    if (metric !== undefined) {
        queryParams.set('metric', metric.toString());
    }

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
}

function formatDateForQuery(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}


function makeDateFromString(dateStr) {
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2));
    const day = parseInt(dateStr.substr(6, 2));
    return makeDate(year, month, day);
}

export function migrateHashToQueryParams() {
    const hash = window.location.hash.substring(1); // Remove the '#' character
    if (hash) {
        const queryParams = new URLSearchParams(window.location.search);
        const hashParts = hash.split('/');
        if (hashParts.length > 0) {queryParams.set('date', hashParts[0]);}
        if (hashParts.length > 1) {queryParams.set('date2', hashParts[1]);}
        if (hashParts.length > 2) {queryParams.set('ltype', hashParts[2]);}
        if (hashParts.length > 5) {
            queryParams.set('lon', hashParts[3]);
            queryParams.set('lat', hashParts[4]);
            queryParams.set('zoom', hashParts[5]);
        }
        if (hashParts.length > 6) {queryParams.set('feature', hashParts[6]);}
        if (hashParts.length > 7) {queryParams.set('metric', hashParts[7]);}

        const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
    }
}