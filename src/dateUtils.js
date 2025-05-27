import { BACKEND, scenario } from './constants';
import { getState, setState, StateKeys } from './state';
import { showToast } from './toaster';

const myDateFormat = 'M d, yy';

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
 * A crude date formatter that formats a date object into a string
 * @param {string} fmt
 * @param {Date} dt
 * @returns {string} - The formatted date string
 */
export function formatDate(fmt, dt) {
    return fmt
        .replace('yy', String(dt.getFullYear()))
        .replace('mm', String(dt.getMonth() + 1).padStart(2, '0'))
        .replace('dd', String(dt.getDate()).padStart(2, '0'));
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
    const setToday = document.getElementById('settoday');
    if (setToday) {
        setToday.style.display = 'none';
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
                            elem.innerHTML = formatDate(myDateFormat, newdate);
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
            showToast(`New data check failed ${error.message}`);
        });
}

export { myDateFormat };
