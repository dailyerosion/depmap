import { describe, it, expect } from 'vitest';
import * as mapManager from '../src/mapManager.js';

describe('mapManager', () => {
  it('should import without errors', () => {
    expect(mapManager).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof mapManager).toBe('object');
  });
});
