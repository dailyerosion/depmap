import { describe, it, expect } from 'vitest';
import * as dataFetchers from '../src/dataFetchers.js';

describe('dataFetchers', () => {
  it('should import without errors', () => {
    expect(dataFetchers).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof dataFetchers).toBe('object');
  });
});
