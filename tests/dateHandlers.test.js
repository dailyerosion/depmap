import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getState, setState, StateKeys } from '../src/state';
import { setupDatePickerHandlers } from '../src/eventHandlers';
import { makeDate } from '../src/dateUtils';

describe('Date handlers', () => {
    beforeEach(() => {
        const el = document.getElementById('datepicker');
        if (!el) {
            const datepicker = document.createElement('input');
            datepicker.id = 'datepicker';
            datepicker.type = 'date';
            document.body.appendChild(datepicker);
        }

        const el2 = document.getElementById('datepicker2');
        if (!el2) {
            const datepicker2 = document.createElement('input');
            datepicker2.id = 'datepicker2';
            datepicker2.type = 'date';
            document.body.appendChild(datepicker2);
        }

        const minusBtn = document.getElementById('minus1d');
        if (!minusBtn) {
            const minus = document.createElement('button');
            minus.id = 'minus1d';
            document.body.appendChild(minus);
        }

        const plusBtn = document.getElementById('plus1d');
        if (!plusBtn) {
            const plus = document.createElement('button');
            plus.id = 'plus1d';
            document.body.appendChild(plus);
        }

        const setDateBtn = document.getElementById('setDate');
        if (!setDateBtn) {
            const setDate = document.createElement('button');
            setDate.id = 'setdate';
            document.body.appendChild(setDate);
        }

    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('should update state when minus1d is clicked', () => {
        const initialDate = makeDate(2025, 5, 27);
        setState(StateKeys.DATE, initialDate);
        setupDatePickerHandlers();

        const minusButton = document.getElementById('minus1d');
        if (!minusButton) {
            throw new Error('minus1d button not found');
        }
        minusButton.click();

        const newDate = getState(StateKeys.DATE);
        expect(newDate.getDate()).toBe(26);
    });

    it('should update state when plus1d is clicked', () => {
        const initialDate = makeDate(2025, 5, 27);
        setState(StateKeys.DATE, initialDate);
        setupDatePickerHandlers();
        
        const plusButton = document.getElementById('plus1d');
        if (!plusButton) {
            throw new Error('plus1d button not found');
        }
        plusButton.click();
        
        const newDate = getState(StateKeys.DATE);
        expect(newDate.getDate()).toBe(28);
    });
});
