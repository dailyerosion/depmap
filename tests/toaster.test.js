import { describe, it, expect } from 'vitest';
import * as toaster from '../src/toaster.js';

describe('toaster', () => {
  it('should import without errors', () => {
    expect(toaster).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof toaster).toBe('object');
  });
});
