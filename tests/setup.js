// Test setup file for Vitest
import { vi } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();

// Polyfill ResizeObserver required by OpenLayers in jsdom
if (typeof global.ResizeObserver === 'undefined') {
	global.ResizeObserver = class {
		constructor(callback) { this.callback = callback; }
		observe() { /* noop */ }
		unobserve() { /* noop */ }
		disconnect() { /* noop */ }
	};
}
