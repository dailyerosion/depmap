import { describe, it, expect, beforeEach } from 'vitest';
import * as uiManager from '../src/uiManager.js';
import { initializeMap } from '../src/mapManager.js';
import { requireElement } from 'iemjs/domUtils';

function setupDOM() {
  // Containers for layer switcher
  const baseUl = document.createElement('ul');
  baseUl.id = 'ls-base-layers';
  document.body.appendChild(baseUl);
  const overUl = document.createElement('ul');
  overUl.id = 'ls-overlay-layers';
  document.body.appendChild(overUl);
  // Map target element
  const mapDiv = document.createElement('div');
  mapDiv.id = 'map';
  document.body.appendChild(mapDiv);
  // Popup element used by mapManager
  const fdetails = document.createElement('div');
  fdetails.id = 'fdetails';
  document.body.appendChild(fdetails);
  // Info elements required
  ['info-name','info-huc12','info-loss','info-runoff','info-delivery','info-precip'].forEach(id => {
    const span = document.createElement('span');
    span.id = id;
    document.body.appendChild(span);
  });
}

describe('uiManager', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    setupDOM();
    initializeMap();
  });
  it('should import without errors', () => {
    expect(uiManager).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof uiManager).toBe('object');
  });

  it('builds layer switcher and toggles base layers', () => {
    uiManager.makeLayerSwitcher();
    const baseList = requireElement('ls-base-layers');
    // Two base layers expected (OSM + Global Imagery)
    const inputs = baseList.querySelectorAll('input[type="radio"][name="base"]');
    expect(inputs.length).toBeGreaterThanOrEqual(2);
    const first = inputs[0];
    const second = inputs[1];
    // First (OSM) should start visible
    expect(first.checked).toBe(true);
    // Simulate switching to second layer
    second.checked = true;
    second.dispatchEvent(new Event('change'));
    // After change: second visible, first not
    expect(second.checked).toBe(true);
    expect(first.checked).toBe(false);
  });
});
