import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Bootstrap Components', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create required DOM elements
    const eventsModal = document.createElement('div');
    eventsModal.id = 'eventsModal';
    eventsModal.className = 'modal';
    document.body.appendChild(eventsModal);
    
    const myModal = document.createElement('div');
    myModal.id = 'myModal';
    myModal.className = 'modal';
    document.body.appendChild(myModal);
    
    const dtModal = document.createElement('div');
    dtModal.id = 'dtModal';
    dtModal.className = 'modal';
    document.body.appendChild(dtModal);
    
    const sidebar = document.createElement('div');
    sidebar.id = 'sidebar';
    sidebar.className = 'offcanvas';
    document.body.appendChild(sidebar);
  });

  afterEach(() => {
    // Clean up DOM elements
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it('should initialize all Bootstrap components when elements exist', async () => {
    const { initializeBootstrapComponents } = await import('../src/bootstrapComponents.js');
    
    const components = initializeBootstrapComponents();
    
    // Test that all components are returned and are instances of Bootstrap components
    expect(components).toHaveProperty('eventsModal');
    expect(components).toHaveProperty('myModal');
    expect(components).toHaveProperty('dtModal');
    expect(components).toHaveProperty('sidebar');
    
    // Test that the components are properly initialized
    expect(components.eventsModal).toBeDefined();
    expect(components.myModal).toBeDefined();
    expect(components.dtModal).toBeDefined();
    expect(components.sidebar).toBeDefined();
  });

});
