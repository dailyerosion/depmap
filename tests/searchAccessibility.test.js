import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const htmlPath = path.join(process.cwd(), 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const documentFragment = new DOMParser().parseFromString(html, 'text/html');

describe('search modal accessibility markup', () => {
  it('uses a submit form for HUC12 search', () => {
    const modalBody = documentFragment.querySelector('#myModal .modal-body');
    const form = documentFragment.getElementById('huc12searchform');
    const button = documentFragment.getElementById('huc12searchbtn');

    expect(modalBody?.getAttribute('onkeypress')).toBeNull();
    expect(form).not.toBeNull();
    expect(button?.getAttribute('type')).toBe('submit');
  });

  it('provides a programmatic label and help text for the search field', () => {
    const label = documentFragment.querySelector('label[for="huc12searchtext"]');
    const input = documentFragment.getElementById('huc12searchtext');
    const help = documentFragment.getElementById('huc12searchhelp');

    expect(label?.textContent?.trim()).toBe('Search for watershed by name or HUC12 ID');
    expect(input?.getAttribute('aria-describedby')).toBe('huc12searchhelp');
    expect(help?.textContent).toContain('press Enter or activate Search');
  });
});