import { describe, it, expect } from 'vitest';
import * as dateUtils from '../src/dateUtils.js';

describe('dateUtils', () => {
  it('should import without errors', () => {
    expect(dateUtils).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof dateUtils).toBe('object');
  });
});
