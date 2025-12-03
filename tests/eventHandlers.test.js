import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setupRadioHandlers } from '../src/eventHandlers.js';

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
});
