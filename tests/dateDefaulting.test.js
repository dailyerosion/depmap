import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getState, setState, StateKeys } from '../src/state';
import { checkDates } from '../src/dataFetchers';
import { makeDate } from '../src/dateUtils';

describe('Date defaulting logic', () => {
    let mockFetch;

    beforeEach(() => {
        // Mock fetch globally
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        
        // Reset state
        setState(StateKeys.DATE, null);
        setState(StateKeys.LAST_DATE, null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should automatically set date when no date is set and checkDates gets a response', async () => {
        // Setup: No date is set initially
        expect(getState(StateKeys.DATE)).toBe(null);
        
        // Mock fetch to return a last_date
        const lastDate = '2025-06-25';
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({ last_date: lastDate })
        });

        // Call checkDates
        await checkDates();

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify that DATE was set to the most recent date
        const currentDate = getState(StateKeys.DATE);
        expect(currentDate).toBeInstanceOf(Date);
        expect(currentDate.getFullYear()).toBe(2025);
        expect(currentDate.getMonth()).toBe(5); // June (0-indexed)
        expect(currentDate.getDate()).toBe(25);
    });

    it('should not change date when a date is already set from URL', async () => {
        // Setup: Date is already set (like from URL parameter)
        const urlDate = makeDate(2025, 6, 20);
        setState(StateKeys.DATE, urlDate);
        
        // Mock fetch to return a different last_date
        const lastDate = '2025-06-25';
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({ last_date: lastDate })
        });

        // Call checkDates
        await checkDates();

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify that DATE was not changed
        const currentDate = getState(StateKeys.DATE);
        expect(currentDate).toBe(urlDate);
        expect(currentDate.getDate()).toBe(20); // Should still be the URL date
    });

    it('should update LAST_DATE to track most recent available date', async () => {
        // Setup: Some date is already set
        setState(StateKeys.DATE, makeDate(2025, 6, 20));
        
        // Mock fetch to return a later last_date
        const lastDate = '2025-06-25';
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({ last_date: lastDate })
        });

        // Call checkDates
        await checkDates();

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify that LAST_DATE was updated
        const mostRecentDate = getState(StateKeys.LAST_DATE);
        expect(mostRecentDate).toBeInstanceOf(Date);
        expect(mostRecentDate.getFullYear()).toBe(2025);
        expect(mostRecentDate.getMonth()).toBe(5); // June (0-indexed)
        expect(mostRecentDate.getDate()).toBe(25);
    });

    it('should handle fetch errors gracefully', async () => {
        // Setup: No date is set initially
        setState(StateKeys.DATE, null);
        
        // Mock fetch to throw an error
        mockFetch.mockRejectedValue(new Error('Network error'));

        // Call checkDates - should not throw and should return undefined
        expect(() => checkDates()).not.toThrow();

        // Wait for async operations to complete
        await new Promise(resolve => setTimeout(resolve, 10));

        // Verify that DATE remains null
        expect(getState(StateKeys.DATE)).toBe(null);
        expect(getState(StateKeys.LAST_DATE)).toBe(null);
    });
});
