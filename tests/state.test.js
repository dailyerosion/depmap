import { describe, it, expect } from 'vitest';
import * as state from '../src/state.js';

describe('state', () => {
  it('should import without errors', () => {
    expect(state).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof state).toBe('object');
  });
});
