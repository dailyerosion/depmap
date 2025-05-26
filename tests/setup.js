// Test setup file for Vitest
import { vi } from 'vitest';

// Mock global objects that might not be available in test environment
global.fetch = vi.fn();

// Mock DOM APIs that might be needed
Object.defineProperty(global, 'window', {
  value: {
    location: {
      href: 'http://localhost:3000',
      search: '',
      hash: '',
      hostname: 'localhost',
      host: 'localhost:3000',
      port: '3000',
      protocol: 'http:',
      origin: 'http://localhost:3000'
    },
    setInterval: vi.fn(),
    localStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    },
    sessionStorage: {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    }
  },
  writable: true
});

// Mock document
Object.defineProperty(global, 'document', {
  value: {
    getElementById: vi.fn(() => ({
      addEventListener: vi.fn(),
      style: { display: 'block' },
      textContent: '',
      classList: { add: vi.fn(), remove: vi.fn() }
    })),
    querySelector: vi.fn(() => ({
      addEventListener: vi.fn()
    })),
    querySelectorAll: vi.fn(() => []),
    addEventListener: vi.fn()
  },
  writable: true
});

// Reset all mocks before each test
beforeEach(() => {
  vi.clearAllMocks();
});
