import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupRadioHandlers, setupSearchHandlers } from '../src/eventHandlers.js';
import { doHUC12Search } from '../src/huc12Utils.js';

// Mock dependencies
vi.mock('../src/mapManager', () => ({
  rerender_vectors: vi.fn(),
}));

vi.mock('../src/state', () => ({
  setState: vi.fn(),
  getState: vi.fn(),
  StateKeys: {
    LTYPE: 'ltype',
  },
}));

vi.mock('../src/huc12Utils', () => ({
  doHUC12Search: vi.fn(),
}));

describe('eventHandlers', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  describe('setupRadioHandlers', () => {
    it('should set initial description for checked output radio', () => {
      document.body.innerHTML = `
        <ul>
          <li data-category="output">
            <input type="radio" name="whichlayer" value="qc_precip" checked data-description="Test precipitation description">
          </li>
        </ul>
        <p id="layer-description"></p>
        <div id="units_radio"></div>
      `;

      setupRadioHandlers();

      const layerDesc = document.getElementById('layer-description');
      expect(layerDesc.textContent).toBe('Test precipitation description');
    });

    it('should update description when different radio is selected', () => {
      document.body.innerHTML = `
        <ul>
          <li data-category="output">
            <input type="radio" name="whichlayer" value="qc_precip" data-description="Output description">
          </li>
          <li data-category="metadata">
            <input type="radio" name="whichlayer" value="slp" data-description="Metadata description">
          </li>
        </ul>
        <p id="layer-description"></p>
        <div id="units_radio"></div>
      `;

      const outputRadio = document.querySelector('[value="qc_precip"]');
      const metadataRadio = document.querySelector('[value="slp"]');
      
      setupRadioHandlers();
      
      metadataRadio.dispatchEvent(new Event('change'));
      expect(document.getElementById('layer-description').textContent).toBe('Metadata description');

      outputRadio.dispatchEvent(new Event('change'));
      expect(document.getElementById('layer-description').textContent).toBe('Output description');
    });
  });

  describe('setupSearchHandlers', () => {
    it('submits the HUC12 search form when the form submit event fires', () => {
      document.body.innerHTML = `
        <form id="huc12searchform" name="huc12search">
          <input type="text" id="huc12searchtext" name="q">
          <button id="huc12searchbtn" type="submit">Search</button>
        </form>
      `;

      setupSearchHandlers();

      const form = document.getElementById('huc12searchform');
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(doHUC12Search).toHaveBeenCalledTimes(1);
    });
  });
});
