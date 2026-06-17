import { describe, it, expect, beforeEach, vi } from 'vitest';
import { buildMapPrintUrl, setupMapControlHandlers, setupRadioHandlers, setupSearchHandlers } from '../src/eventHandlers.js';
import { doHUC12Search } from '../src/huc12Utils.js';

const mockView = {
  calculateExtent: vi.fn(() => [-10000000, 4000000, -9000000, 5000000]),
  setZoom: vi.fn(),
  setCenter: vi.fn(),
};

const mockMap = {
  getView: vi.fn(() => mockView),
  getSize: vi.fn(() => [800, 600]),
};

vi.mock('../src/mapManager', () => ({
  rerender_vectors: vi.fn(),
  getMap: vi.fn(() => mockMap),
  getVectorLayer: vi.fn(() => ({
    getOpacity: vi.fn(() => 1),
    setOpacity: vi.fn(),
  })),
}));

vi.mock('../src/state', () => ({
  setState: vi.fn(),
  getState: vi.fn((key) => {
    if (key === 'ltype') {
      return 'avg_loss';
    }
    if (key === 'date') {
      return new Date(2026, 0, 2);
    }
    if (key === 'date2') {
      return new Date(2026, 0, 5);
    }
    return null;
  }),
  subscribeToState: vi.fn(),
  StateKeys: {
    LTYPE: 'ltype',
    DATE: 'date',
    DATE2: 'date2',
  },
}));

vi.mock('../src/huc12Utils', () => ({
  doHUC12Search: vi.fn(),
}));

vi.mock('../src/toaster', () => ({
  setStatus: vi.fn(),
}));

vi.mock('../src/uiManager', () => ({
  handleSideBarClick: vi.fn(),
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

  describe('map print controls', () => {
    it('builds a mapper URL with state and annual options', () => {
      document.body.innerHTML = `
        <input id="mapprint-sdate" value="2026-01-02">
        <input id="mapprint-edate" value="2026-01-05">
        <input type="radio" name="mapprint-extent" value="domain">
        <input type="radio" name="mapprint-extent" value="current">
        <input type="radio" name="mapprint-extent" value="state" checked>
        <input type="radio" name="mapprint-state" value="IL" checked>
        <input type="radio" name="mapprint-annual" value="0">
        <input type="radio" name="mapprint-annual" value="1" checked>
      `;

      expect(buildMapPrintUrl()).toBe(
        'https://mesonet-dep.agron.iastate.edu/auto/mapper.png?sdate=2026-01-02&edate=2026-01-05&v=avg_loss&state=IL&annual=1'
      );
    });

    it('syncs the modal defaults and opens the current extent URL on submit', () => {
      document.body.innerHTML = `
        <div id="mapcontrols">
          <button id="mapplus"></button>
          <button id="mapminus"></button>
          <button id="mapprint"></button>
          <button id="mapinfo"></button>
        </div>
        <form id="mapprintform">
          <input id="mapprint-sdate">
          <input id="mapprint-edate">
          <input type="radio" name="mapprint-extent" id="mapprint-extent-domain" value="domain">
          <input type="radio" name="mapprint-extent" id="mapprint-extent-current" value="current" checked>
          <input type="radio" name="mapprint-extent" id="mapprint-extent-state" value="state">
          <div id="mapprint-state-options"></div>
          <input type="radio" name="mapprint-state" value="IL" checked>
          <input type="radio" name="mapprint-annual" value="0" checked>
          <input type="radio" name="mapprint-annual" value="1">
        </form>
      `;
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

      setupMapControlHandlers();

      document.getElementById('mapprint').dispatchEvent(new Event('click', { bubbles: true }));

      expect(document.getElementById('mapprint-sdate').value).toBe('2026-01-02');
      expect(document.getElementById('mapprint-edate').value).toBe('2026-01-05');

      document.getElementById('mapprintform').dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));

      expect(openSpy).toHaveBeenCalledWith(
        'https://mesonet-dep.agron.iastate.edu/auto/mapper.png?sdate=2026-01-02&edate=2026-01-05&v=avg_loss&extent=-89.8315%2C33.7852%2C-80.8484%2C40.9163'
      );
    });
  });
});
