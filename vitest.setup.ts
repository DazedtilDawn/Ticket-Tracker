import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfill ResizeObserver for component tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserver;

// Optional: mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();