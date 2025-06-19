import { describe, it, expect } from 'vitest';
import * as uiManager from '../src/uiManager.js';

describe('uiManager', () => {
  it('should import without errors', () => {
    expect(uiManager).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof uiManager).toBe('object');
  });
});
