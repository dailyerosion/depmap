import { describe, it, expect } from 'vitest';
import * as main from '../src/main.js';

describe('main', () => {
  it('should import without errors', () => {
    expect(main).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof main).toBe('object');
  });
});
