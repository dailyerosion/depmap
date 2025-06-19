import { describe, it, expect } from 'vitest';
import { VERSION_INFO } from '../src/version.js';

describe('version', () => {
  it('should import without errors', () => {
    expect(VERSION_INFO).toBeDefined();
  });

  it('should export VERSION_INFO as expected', () => {
    expect(typeof VERSION_INFO).toBe('object');
    expect(VERSION_INFO).toHaveProperty('version');
    expect(VERSION_INFO).toHaveProperty('buildTime');
  });
});
