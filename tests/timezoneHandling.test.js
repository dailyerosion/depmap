import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { getState, setState, StateKeys } from '../src/state';
import { checkDates } from '../src/dataFetchers';

describe('Timezone handling', () => {
    let mockFetch = null;

    beforeEach(() => {
        mockFetch = vi.fn();
        global.fetch = mockFetch;
        
        // Reset state
        setState(StateKeys.DATE, null);
        setState(StateKeys.LAST_DATE, null);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should parse date string as local date to avoid timezone shifts', async () => {
        // Mock fetch to return a date string in YYYY-MM-DD format
        const dateString = '2025-06-24';
        mockFetch.mockResolvedValue({
            json: () => Promise.resolve({ last_date: dateString })
        });

        // Call checkDates
        await checkDates();

        // Wait for async operations
        await new Promise(resolve => setTimeout(resolve, 0));

        // Verify that the date was parsed correctly as local date
        const lastDate = getState(StateKeys.LAST_DATE);
        expect(lastDate).toBeInstanceOf(Date);
        expect(lastDate.getFullYear()).toBe(2025);
        expect(lastDate.getMonth()).toBe(5); // June (0-indexed)
        expect(lastDate.getDate()).toBe(24); // Should be 24, not shifted to 23
        
        // Verify the date was also set as current date (since no date was set)
        const currentDate = getState(StateKeys.DATE);
        expect(currentDate).toBeInstanceOf(Date);
        expect(currentDate.getFullYear()).toBe(2025);
        expect(currentDate.getMonth()).toBe(5); // June (0-indexed)
        expect(currentDate.getDate()).toBe(24); // Should be 24, not shifted to 23
    });
});
