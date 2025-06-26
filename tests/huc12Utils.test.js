// @ts-nocheck
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setHUC12, setupHUC12EventHandlers } from '../src/huc12Utils.js';

// Mock the mapManager functions
vi.mock('../src/mapManager.js', () => ({
    getVectorLayer: vi.fn(() => ({
        getSource: vi.fn(() => ({
            getFeatureById: vi.fn(() => ({
                getGeometry: vi.fn(() => ({}))
            }))
        }))
    })),
    getMap: vi.fn(() => ({
        getView: vi.fn(() => ({
            fit: vi.fn()
        }))
    }))
}));

// Mock Bootstrap Modal
vi.mock('bootstrap', () => ({
    Modal: {
        getInstance: vi.fn(() => ({
            hide: vi.fn()
        }))
    }
}));

describe('huc12Utils', () => {
    beforeEach(() => {
        // Clear any existing DOM elements
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }

        // Create mock DOM elements
        const searchRes = document.createElement('div');
        searchRes.id = 'huc12searchres';
        document.body.appendChild(searchRes);

        const eventsRes = document.createElement('div');
        eventsRes.id = 'eventsres';
        document.body.appendChild(eventsRes);

        // Create modal element for setHUC12 test
        const modal = document.createElement('div');
        modal.id = 'myModal';
        document.body.appendChild(modal);

        // Create required elements for updateDetails function
        const btnq1 = document.createElement('button');
        btnq1.id = 'btnq1';
        btnq1.click = vi.fn();
        document.body.appendChild(btnq1);

        const dataTab = document.createElement('button');
        dataTab.id = 'data-tab';
        dataTab.click = vi.fn();
        document.body.appendChild(dataTab);

        const detailsHidden = document.createElement('div');
        detailsHidden.id = 'details_hidden';
        detailsHidden.style = { display: 'block' };
        document.body.appendChild(detailsHidden);

        const detailsDetails = document.createElement('div');
        detailsDetails.id = 'details_details';
        detailsDetails.style = { display: 'none' };
        document.body.appendChild(detailsDetails);

        const detailsLoading = document.createElement('div');
        detailsLoading.id = 'details_loading';
        detailsLoading.style = { display: 'none' };
        document.body.appendChild(detailsLoading);

        // Reset modules and mocks
        vi.resetModules();
        vi.clearAllMocks();
    });

    describe('setHUC12', () => {
        it('should close modal, zoom to feature, and load details', async () => {
            const { Modal } = await import('bootstrap');
            const { getVectorLayer, getMap } = await import('../src/mapManager.js');
            const { setState, StateKeys } = await import('../src/state.js');
            const { makeDate } = await import('../src/dateUtils.js');
            const { setHUC12 } = await import('../src/huc12Utils.js');
            
            // Set up state with a valid date so the fetch will be called
            setState(StateKeys.DATE, makeDate(2025, 6, 25));
            setState(StateKeys.METRIC, 0);
            
            // Mock fetch for updateDetails - return a resolved promise
            const mockFetch = vi.fn(() => 
                Promise.resolve({
                    text: () => Promise.resolve('<p>Mock details content</p>')
                })
            );
            global.fetch = mockFetch;

            const mockModalInstance = { hide: vi.fn() };
            Modal.getInstance.mockReturnValue(mockModalInstance);

            const mockFeature = {
                getGeometry: vi.fn(() => ({}))
            };
            const mockSource = {
                getFeatureById: vi.fn(() => mockFeature)
            };
            const mockVectorLayer = {
                getSource: vi.fn(() => mockSource)
            };
            getVectorLayer.mockReturnValue(mockVectorLayer);

            const mockFit = vi.fn();
            const mockView = {
                fit: mockFit
            };
            const mockMap = {
                getView: vi.fn(() => mockView)
            };
            getMap.mockReturnValue(mockMap);
            
            // Call setHUC12 and wait for async operations to complete
            setHUC12('123456789012');
            
            // Wait for the fetch promise to resolve
            await vi.waitFor(() => {
                expect(mockFetch).toHaveBeenCalled();
            });
            
            // Wait for all pending promises
            await new Promise(resolve => setTimeout(resolve, 0));

            // Verify modal is closed
            expect(Modal.getInstance).toHaveBeenCalledWith(document.getElementById('myModal'));
            expect(mockModalInstance.hide).toHaveBeenCalled();

            // Verify feature lookup and zoom
            expect(getVectorLayer).toHaveBeenCalled();
            expect(mockSource.getFeatureById).toHaveBeenCalledWith('123456789012');
            expect(mockFeature.getGeometry).toHaveBeenCalled();
            expect(mockFit).toHaveBeenCalledWith({}, {
                padding: [50, 50, 50, 50],
                maxZoom: 12
            });

            // Verify details panel elements were manipulated (after async operations complete)
            const detailsHidden = document.getElementById('details_hidden');
            const detailsDetails = document.getElementById('details_details');
            const detailsLoading = document.getElementById('details_loading');
            
            expect(detailsHidden.style.display).toBe('none');
            expect(detailsDetails.style.display).toBe('block');
            expect(detailsLoading.style.display).toBe('none');
        });
    });

    describe('setupHUC12EventHandlers', () => {
        it('should set up event listeners for search results and events', () => {
            const searchRes = document.getElementById('huc12searchres');
            const eventsRes = document.getElementById('eventsres');
            
            const searchSpy = vi.spyOn(searchRes, 'addEventListener');
            const eventsSpy = vi.spyOn(eventsRes, 'addEventListener');

            setupHUC12EventHandlers();

            expect(searchSpy).toHaveBeenCalledWith('click', expect.any(Function));
            expect(eventsSpy).toHaveBeenCalledWith('click', expect.any(Function));
        });
    });
});
