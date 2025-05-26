import { describe, it, expect } from 'vitest';
import { BACKEND, varnames, multipliers, levels, varunits } from '../src/constants.js';

describe('Constants', () => {
  describe('BACKEND', () => {
    it('should be defined as a string', () => {
      expect(typeof BACKEND).toBe('string');
      expect(BACKEND.length).toBeGreaterThan(0);
    });
  });

  describe('varnames', () => {
    it('should be an array of variable names', () => {
      expect(Array.isArray(varnames)).toBe(true);
      expect(varnames.length).toBeGreaterThan(0);
      expect(varnames.every(name => typeof name === 'string')).toBe(true);
    });
  });

  describe('multipliers', () => {
    it('should have multipliers for each variable', () => {
      expect(typeof multipliers).toBe('object');
      
      varnames.forEach(varname => {
        expect(multipliers[varname]).toBeDefined();
        expect(Array.isArray(multipliers[varname])).toBe(true);
        expect(multipliers[varname].length).toBe(2);
        expect(typeof multipliers[varname][0]).toBe('number');
        expect(typeof multipliers[varname][1]).toBe('number');
      });
    });
  });

  describe('levels', () => {
    it('should have level configurations for each variable', () => {
      expect(typeof levels).toBe('object');
      
      varnames.forEach(varname => {
        expect(levels[varname]).toBeDefined();
        expect(Array.isArray(levels[varname])).toBe(true);
      });
    });
  });

  describe('varunits', () => {
    it('should have units for each variable in both metric systems', () => {
      expect(typeof varunits).toBe('object');
      
      varnames.forEach(varname => {
        expect(varunits[varname]).toBeDefined();
        expect(Array.isArray(varunits[varname])).toBe(true);
        expect(varunits[varname].length).toBe(2);
        expect(typeof varunits[varname][0]).toBe('string');
        expect(typeof varunits[varname][1]).toBe('string');
      });
    });
  });
});
