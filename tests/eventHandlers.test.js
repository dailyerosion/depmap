import { describe, it, expect } from 'vitest';
import * as eventHandlers from '../src/eventHandlers.js';

describe('eventHandlers', () => {
  it('should import without errors', () => {
    expect(eventHandlers).toBeDefined();
  });

  it('should export functions as expected', () => {
    expect(typeof eventHandlers).toBe('object');
  });
});
