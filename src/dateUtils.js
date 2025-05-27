import { getState, setState, StateKeys } from './state';

/**
 * Update the date selection type single or multi
 * @param {string} newval - The date selection type ('single' or 'multi')
 */
export function setDateSelection(newval) {
    const dp2 = document.getElementById('dp2');
    if (!dp2) {
        return;
    }
    if (newval === 'single') {
        setState(StateKeys.DATE2, null);
        dp2.style.display = 'none';
    } else {
        dp2.style.display = 'block';
    }
}


/**
 * Make a date
 * @param {number} year
 * @param {number} month
 * @param {number} day
 * @returns
 */
export function makeDate(year, month, day) {
    return new Date(year, month - 1, day);
}

export function setToday() {
    const lastdate = getState(StateKeys.LAST_DATE);
    if (lastdate) {
        setDate(
            lastdate.getFullYear(),
            lastdate.getMonth() + 1,
            lastdate.getDate()
        );
    }
    const setTodayElem = document.getElementById('settoday');
    if (setTodayElem) {
        setTodayElem.style.display = 'none';
    }
}

/**
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
export function setDate(year, month, day) {
    setState(StateKeys.DATE, makeDate(year, month, day));
    setState(StateKeys.DATE2, null);
    const dp2 = document.getElementById('dp2');
    if (dp2) {
        dp2.style.display = 'none';
    }
}

export function setYearInterval(syear, eventsModal) {
    if (eventsModal) {
        eventsModal.hide();
    }

    setState(StateKeys.DATE, makeDate(syear, 1, 1));
    setState(StateKeys.DATE2, makeDate(syear, 12, 31));
    const dp2 = document.getElementById('dp2');
    if (dp2) {
        dp2.style.display = 'block';
    }
}

export function setDateFromString(s, eventsModal) {
    if (eventsModal) {
        eventsModal.hide();
    }
    const dt = new Date(s);
    setDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}
