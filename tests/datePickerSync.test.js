import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setState, StateKeys } from '../src/state';
import { setupDatePickerHandlers } from '../src/eventHandlers';
import { makeDate } from '../src/dateUtils';

describe('Date picker synchronization', () => {
    beforeEach(() => {
        // Create required DOM elements
        const datepicker = document.createElement('input');
        datepicker.id = 'datepicker';
        datepicker.type = 'date';
        document.body.appendChild(datepicker);

        const datepicker2 = document.createElement('input');
        datepicker2.id = 'datepicker2';
        datepicker2.type = 'date';
        document.body.appendChild(datepicker2);

        const minusBtn = document.createElement('button');
        minusBtn.id = 'minus1d';
        document.body.appendChild(minusBtn);

        const plusBtn = document.createElement('button');
        plusBtn.id = 'plus1d';
        document.body.appendChild(plusBtn);

        const setDateBtn = document.createElement('button');
        setDateBtn.id = 'setdate';
        document.body.appendChild(setDateBtn);

        // Set up the date picker handlers
        setupDatePickerHandlers();
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('should update date picker when DATE state changes', () => {
        const datepicker = document.getElementById('datepicker');
        const testDate = makeDate(2025, 6, 24);
        
        if (!datepicker || !(datepicker instanceof HTMLInputElement)) {
            throw new Error('datepicker not found');
        }
        
        // Initially empty
        expect(datepicker.value).toBe('');
        
        // Set the date state
        setState(StateKeys.DATE, testDate);
        
        // Date picker should be updated
        expect(datepicker.value).toBe('2025-06-24');
    });

    it('should update date picker 2 when DATE2 state changes', () => {
        const datepicker2 = document.getElementById('datepicker2');
        const testDate = makeDate(2025, 6, 25);
        
        if (!datepicker2 || !(datepicker2 instanceof HTMLInputElement)) {
            throw new Error('datepicker2 not found');
        }
        
        // Initially empty
        expect(datepicker2.value).toBe('');
        
        // Set the date2 state
        setState(StateKeys.DATE2, testDate);
        
        // Date picker 2 should be updated
        expect(datepicker2.value).toBe('2025-06-25');
    });

    it('should clear date picker when date state is set to null', () => {
        const datepicker = document.getElementById('datepicker');
        
        if (!datepicker || !(datepicker instanceof HTMLInputElement)) {
            throw new Error('datepicker not found');
        }
        
        // Set a date first
        setState(StateKeys.DATE, makeDate(2025, 6, 24));
        expect(datepicker.value).toBe('2025-06-24');
        
        // Clear the date
        setState(StateKeys.DATE, null);
        
        // Date picker should be cleared
        expect(datepicker.value).toBe('');
    });
});
