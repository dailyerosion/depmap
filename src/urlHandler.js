import { transform } from 'ol/proj';

export function readUrlParams(appstate, defaultCenter, defaultZoom) {
    const params = new URLSearchParams(window.location.search);
    const hash = window.location.hash.substring(1); // Remove the '#' character

    if (params.has('date')) {
        appstate.date = makeDateFromString(params.get('date'));
    } else if (hash) {
        const tokens = hash.split("/");
        if (tokens.length > 0 && tokens[0] !== '') {
            appstate.date = makeDate(tokens[0].substr(1, 4), tokens[0].substr(5, 2), tokens[0].substr(7, 2));
        }
    }

    if (params.has('date2')) {
        appstate.date2 = makeDateFromString(params.get('date2'));
    } else if (hash) {
        const tokens = hash.split("/");
        if (tokens.length > 1 && tokens[1] !== '') {
            appstate.date2 = makeDate(tokens[1].substr(0, 4), tokens[1].substr(4, 2), tokens[1].substr(6, 2));
        }
    }

    if (params.has('ltype')) {
        appstate.ltype = params.get('ltype');
        const input = document.querySelector(`input[value="${appstate.ltype}"]`);
        if (input) {
            input.checked = true;
        }
    } else if (hash) {
        const tokens = hash.split("/");
        if (tokens.length > 2 && tokens[2] !== '') {
            appstate.ltype = tokens[2];
            const input = document.querySelector(`input[value="${tokens[2]}"]`);
            if (input) {
                input.checked = true;
            }
        }
    }

    if (params.has('lon') && params.has('lat') && params.has('zoom')) {
        defaultCenter = transform([parseFloat(params.get('lon')), parseFloat(params.get('lat'))], 'EPSG:4326', 'EPSG:3857');
        defaultZoom = parseFloat(params.get('zoom'));
    } else if (hash) {
        const tokens = hash.split("/");
        if (tokens.length > 5 && tokens[3] !== '' && tokens[4] !== '' && tokens[5] !== '') {
            defaultCenter = transform([parseFloat(tokens[3]), parseFloat(tokens[4])], 'EPSG:4326', 'EPSG:3857');
            defaultZoom = parseFloat(tokens[5]);
        }
    }

    if (params.has('metric')) {
        appstate.metric = parseInt(params.get('metric'));
        const unitInput = document.querySelector(`#units_radio input[value="${appstate.metric}"]`);
        if (unitInput) {
            unitInput.checked = true;
        }
    } else if (hash) {
        const tokens = hash.split("/");
        if (tokens.length > 7 && tokens[7].length === 1) {
            appstate.metric = parseInt(tokens[7]);
            const unitInput = document.querySelector(`#units_radio input[value="${tokens[7]}"]`);
            if (unitInput) {
                unitInput.checked = true;
            }
        }
    }
}

export function setQueryParams(appstate, map) {
    const queryParams = new URLSearchParams(window.location.search);
    if (appstate.date instanceof Date && !isNaN(appstate.date)) {
        queryParams.set('date', formatDateForQuery(appstate.date));
    }
    if (appstate.date2 instanceof Date && !isNaN(appstate.date2)) {
        queryParams.set('date2', formatDateForQuery(appstate.date2));
    }
    queryParams.set('ltype', appstate.ltype);

    const center = transform(map.getView().getCenter(), 'EPSG:3857', 'EPSG:4326');
    queryParams.set('lon', center[0].toFixed(2));
    queryParams.set('lat', center[1].toFixed(2));
    queryParams.set('zoom', map.getView().getZoom().toFixed(0));

    if (appstate.metric !== undefined) {
        queryParams.set('metric', appstate.metric.toString());
    }

    const newUrl = `${window.location.pathname}?${queryParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
}

function formatDateForQuery(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

function makeDate(year, month, day) {
    return new Date(year, month - 1, day);
}

function makeDateFromString(dateStr) {
    const year = parseInt(dateStr.substr(0, 4));
    const month = parseInt(dateStr.substr(4, 2));
    const day = parseInt(dateStr.substr(6, 2));
    return makeDate(year, month, day);
}
