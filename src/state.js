export const StateKeys = {
    LTYPE: 'ltype',
    SIDEBAR_OPEN: 'sidebarOpen',
    LAST_DATE: 'lastdate',
    LAT: 'lat',
    LON: 'lon',
    DATE: 'date',
    DATE2: 'date2',
    METRIC: 'metric'
};

const state = {
    [StateKeys.LTYPE]: 'qc_precip',
    [StateKeys.SIDEBAR_OPEN]: false,
    [StateKeys.LAST_DATE]: null,
    [StateKeys.LAT]: null,
    [StateKeys.LON]: null,
    [StateKeys.DATE]: null,
    [StateKeys.DATE2]: null,
    [StateKeys.METRIC]: 0
};

const subscribers = {};

export function getState(key) {
    return state[key];
}

export function setState(key, value) {
    // console.error(`Setting state: ${key} = ${value}`);
    if (!key) return;
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
