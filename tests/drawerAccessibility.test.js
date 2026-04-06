import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const htmlPath = path.join(process.cwd(), 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const documentFragment = new DOMParser().parseFromString(html, 'text/html');

describe('drawer accessibility markup', () => {
  it('provides accessible naming for the menu trigger and drawer', () => {
    const sidebarToggle = documentFragment.getElementById('btnq1');
    const sidebar = documentFragment.getElementById('sidebar');
    const sidebarTitle = documentFragment.getElementById('sidebar-title');

    expect(sidebarToggle?.getAttribute('aria-label')).toBe('Open menu');
    expect(sidebarToggle?.getAttribute('aria-expanded')).toBe('false');
    expect(sidebar?.getAttribute('aria-labelledby')).toBe('sidebar-title');
    expect(sidebarTitle?.textContent).toContain('Daily Erosion Project');
  });

  it('keeps drawer controls programmatically labeled', () => {
    const dateLabel = documentFragment.querySelector('label[for="datepicker"]');
    const dateRangeLabel = documentFragment.querySelector('label[for="datepicker2"]');
    const decreaseOpacity = documentFragment.querySelector('[data-action="decrease-opacity"]');
    const increaseOpacity = documentFragment.querySelector('[data-action="increase-opacity"]');
    const tillageInfo = documentFragment.querySelector('[data-bs-target="#dtModal"]');

    expect(dateLabel?.textContent?.trim()).toBe('Date');
    expect(dateRangeLabel?.textContent?.trim()).toBe('To Date:');
    expect(decreaseOpacity?.getAttribute('aria-label')).toBe('Decrease opacity');
    expect(increaseOpacity?.getAttribute('aria-label')).toBe('Increase opacity');
    expect(tillageInfo?.getAttribute('aria-label')).toBe('More information about dominant tillage practice');
  });
});