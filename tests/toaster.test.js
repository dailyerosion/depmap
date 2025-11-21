import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { setStatus, showToast } from '../src/toaster.js';

describe('toaster', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('showToast', () => {
    it('should create toast container if it does not exist', () => {
      expect(document.getElementById('toast-container')).toBeNull();
      
      showToast('Test message');
      
      const container = document.getElementById('toast-container');
      expect(container).not.toBeNull();
      expect(container.style.position).toBe('fixed');
    });

    it('should display a toast message with correct type', () => {
      showToast('Success message', 'success');
      
      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toBe('Success message');
      expect(toast.classList.contains('toast-success')).toBe(true);
    });

    it('should remove toast after duration', () => {
      showToast('Temporary message', 'info', 1000);
      
      const toast = document.querySelector('.toast');
      expect(toast).not.toBeNull();
      
      vi.advanceTimersByTime(1000);
      
      expect(toast.classList.contains('fade-out')).toBe(true);
    });

    it('should support multiple toast types', () => {
      showToast('Info message', 'info');
      showToast('Error message', 'error');
      showToast('Warning message', 'warning');
      
      const toasts = document.querySelectorAll('.toast');
      expect(toasts.length).toBe(3);
      expect(toasts[0].classList.contains('toast-info')).toBe(true);
      expect(toasts[1].classList.contains('toast-error')).toBe(true);
      expect(toasts[2].classList.contains('toast-warning')).toBe(true);
    });
  });

  describe('setStatus', () => {
    it('should call showToast with default info type', () => {
      setStatus('Status message');
      
      const toast = document.querySelector('.toast-info');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toBe('Status message');
    });

    it('should call showToast with custom type', () => {
      setStatus('Error occurred', 'error');
      
      const toast = document.querySelector('.toast-error');
      expect(toast).not.toBeNull();
      expect(toast.textContent).toBe('Error occurred');
    });
  });
});
