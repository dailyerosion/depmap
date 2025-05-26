import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Bootstrap
vi.mock('bootstrap', () => ({
  Modal: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
    toggle: vi.fn()
  })),
  Offcanvas: vi.fn().mockImplementation(() => ({
    show: vi.fn(),
    hide: vi.fn(),
    toggle: vi.fn()
  }))
}));

// Mock DOM elements
const mockElement = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  classList: {
    add: vi.fn(),
    remove: vi.fn(),
    contains: vi.fn()
  }
};

global.document = {
  getElementById: vi.fn((id) => {
    if (['eventsModal', 'myModal', 'dtModal', 'sidebar'].includes(id)) {
      return mockElement;
    }
    return null;
  })
};

describe('Bootstrap Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize all Bootstrap components when elements exist', async () => {
    const { initializeBootstrapComponents } = await import('../src/bootstrapComponents.js');
    const { Modal, Offcanvas } = await import('bootstrap');
    
    const components = initializeBootstrapComponents();
    
    expect(Modal).toHaveBeenCalledTimes(3); // eventsModal, myModal, dtModal
    expect(Offcanvas).toHaveBeenCalledTimes(1); // sidebar
    
    expect(components).toHaveProperty('eventsModal');
    expect(components).toHaveProperty('myModal');
    expect(components).toHaveProperty('dtModal');
    expect(components).toHaveProperty('sidebar');
  });

  it('should handle missing DOM elements gracefully', async () => {
    // Mock getElementById to return null for missing elements
    global.document.getElementById = vi.fn(() => null);
    
    const { initializeBootstrapComponents } = await import('../src/bootstrapComponents.js');
    
    const components = initializeBootstrapComponents();
    
    expect(components.eventsModal).toBeNull();
    expect(components.myModal).toBeNull();
    expect(components.dtModal).toBeNull();
    expect(components.sidebar).toBeNull();
  });
});
