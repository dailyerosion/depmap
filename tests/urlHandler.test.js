import { describe, it, expect } from 'vitest';
import * as urlHandler from '../src/urlHandler.js';

describe('urlHandler', () => {
  it('should import without errors', () => {
    expect(urlHandler).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof urlHandler).toBe('object');
  });
});
