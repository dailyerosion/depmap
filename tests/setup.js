// Test setup file for Vitest
import { vi } from 'vitest';

// Mock fetch API
global.fetch = vi.fn();
