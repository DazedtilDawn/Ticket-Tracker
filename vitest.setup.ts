import { vi } from 'vitest';
import '@testing-library/jest-dom';

// Polyfill ResizeObserver for component tests
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).ResizeObserver = ResizeObserver;

// Polyfill IntersectionObserver for component tests
class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as any).IntersectionObserver = IntersectionObserver;

// Optional: mock scrollIntoView for jsdom
Element.prototype.scrollIntoView = vi.fn();

// Mock HTMLMediaElement methods
if (typeof HTMLMediaElement !== 'undefined') {
  HTMLMediaElement.prototype.load = vi.fn();
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined);
  HTMLMediaElement.prototype.pause = vi.fn();
}