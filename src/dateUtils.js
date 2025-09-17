import { setState, StateKeys } from './state';
import { requireElement } from 'iemjs/domUtils';

/**
 * Update the date selection type single or multi
 * @param {string} newval - The date selection type ('single' or 'multi')
 */
export function setDateSelection(newval) {
    const dp2 = requireElement('dp2');
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


/**
 *
 * @param {number} year
 * @param {number} month
 * @param {number} day
 */
export function setDate(year, month, day) {
    setState(StateKeys.DATE, makeDate(year, month, day));
    setState(StateKeys.DATE2, null);
    const dp2 = requireElement('dp2');
    dp2.style.display = 'none';
}

export function setYearInterval(syear, eventsModal) {
    if (eventsModal) {
        eventsModal.hide();
    }

    setState(StateKeys.DATE, makeDate(syear, 1, 1));
    setState(StateKeys.DATE2, makeDate(syear, 12, 31));
    const dp2 = requireElement('dp2');
    dp2.style.display = 'block';
}

export function setDateFromString(dateString, eventsModal) {
    if (eventsModal) {
        eventsModal.hide();
    }
    
    // Parse date string properly to avoid timezone issues
    // Assume dateString is in format "YYYY-MM-DD"
    if (dateString.includes('-') && dateString.length === 10) {
        const dateParts = dateString.split('-');
        const year = parseInt(dateParts[0], 10);
        const month = parseInt(dateParts[1], 10);
        const day = parseInt(dateParts[2], 10);
        setDate(year, month, day);
    } else {
        // Fallback to original method for other formats
        const dt = new Date(dateString);
        setDate(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
    }
}
