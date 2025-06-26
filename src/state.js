export const StateKeys = {
    LTYPE: 'ltype',
    SIDEBAR_OPEN: 'sidebarOpen',
    LAST_DATE: 'lastdate',
    LAT: 'lat',
    LON: 'lon',
    ZOOM: 'zoom',
    DATE: 'date',
    DATE2: 'date2',
    METRIC: 'metric',
    HUC12: 'huc12',
};

const state = {
    [StateKeys.LTYPE]: 'qc_precip',
    [StateKeys.SIDEBAR_OPEN]: false,
    [StateKeys.LAST_DATE]: null,
    [StateKeys.LAT]: 42.1,
    [StateKeys.LON]: -94.5,
    [StateKeys.ZOOM]: 6,
    [StateKeys.DATE]: null,
    [StateKeys.DATE2]: null,
    [StateKeys.METRIC]: 0,
    [StateKeys.HUC12]: null,
};

const subscribers = {};

/**
 * Get the current state value for a given key
 * @param {string} key 
 * @returns {any} - The value of the state for the given key
 */
export function getState(key) {
    return state[key];
}

export function setState(key, value) {
    // console.error(`Setting state: ${key} = ${value}`);
    if (!key) {return;}
    state[key] = value;
    notifySubscribers(key);
}

export function subscribeToState(key, callback) {
    if (!subscribers[key]) {
        subscribers[key] = [];
    }
    if (typeof callback === 'function') {
        subscribers[key].push(callback);
    }
}

function notifySubscribers(key) {
    if (subscribers[key]) {
        subscribers[key].forEach((callback) => callback(state[key]));
    }
}
