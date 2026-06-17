import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const htmlPath = path.join(process.cwd(), 'index.html');
const html = readFileSync(htmlPath, 'utf8');
const documentFragment = new DOMParser().parseFromString(html, 'text/html');

describe('print modal markup', () => {
  it('uses a modal form with labeled date inputs and submit action', () => {
    const form = documentFragment.getElementById('mapprintform');
    const startLabel = documentFragment.querySelector('label[for="mapprint-sdate"]');
    const endLabel = documentFragment.querySelector('label[for="mapprint-edate"]');
    const submit = documentFragment.querySelector('button[form="mapprintform"]');

    expect(form).not.toBeNull();
    expect(startLabel?.textContent?.trim()).toBe('Start date');
    expect(endLabel?.textContent?.trim()).toBe('End date');
    expect(submit?.getAttribute('type')).toBe('submit');
  });

  it('provides extent choices and a state list for single-state printing', () => {
    const printButton = documentFragment.getElementById('mapprint');
    const extentOptions = documentFragment.querySelectorAll('input[name="mapprint-extent"]');
    const stateOptions = documentFragment.querySelectorAll('input[name="mapprint-state"]');
    const annualAverage = documentFragment.getElementById('mapprint-annual');

    expect(printButton?.getAttribute('data-bs-target')).toBe('#printModal');
    expect(extentOptions).toHaveLength(3);
    expect(stateOptions).toHaveLength(8);
    expect(annualAverage?.getAttribute('value')).toBe('1');
  });
});