// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { setState, StateKeys } from '../src/state';
import { setupBranding } from '../src/brandingOverlay';
import { makeDate } from '../src/dateUtils';
import { vartitle } from '../src/constants';

describe('Branding Overlay', () => {
    beforeEach(() => {
        // Create maptitle element for testing
        const titleElement = document.createElement('div');
        titleElement.id = 'maptitle';
        document.body.appendChild(titleElement);

        // Initialize required state
        setState(StateKeys.LTYPE, 'avg_runoff');
        setState(StateKeys.DATE, makeDate(2025, 5, 7));
        setState(StateKeys.DATE2, null);
    });

    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
    });

    it('should update title when ltype changes', () => {
        setupBranding();
        const titleElement = document.getElementById('maptitle');
        expect(titleElement.textContent).toContain(vartitle.avg_runoff);
        
        setState(StateKeys.LTYPE, 'qc_precip');
        expect(titleElement.textContent).toContain(vartitle.qc_precip);
    });

    it('should update title when date changes', () => {
        setupBranding();
        const titleElement = document.getElementById('maptitle');
        expect(titleElement.textContent).toContain(' 7 May 2025');
        
        setState(StateKeys.DATE, makeDate(2025, 5, 8));
        expect(titleElement.textContent).toContain(' 8 May 2025');
    });

    it('should handle date range when DATE2 is set', () => {
        setupBranding();
        const titleElement = document.getElementById('maptitle');
        expect(titleElement.textContent).not.toContain('to');
        
        setState(StateKeys.DATE2, makeDate(2025, 5, 8));
        expect(titleElement.textContent).toContain('to');
        expect(titleElement.textContent).toContain(' 8 May 2025');
    });

});
