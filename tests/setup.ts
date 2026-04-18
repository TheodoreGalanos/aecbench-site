// ABOUTME: Test setup file that extends Vitest matchers with jest-dom.
// ABOUTME: Provides DOM-specific assertions like toBeInTheDocument().
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Mock IntersectionObserver for Framer Motion's whileInView
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

afterEach(() => {
  cleanup();
});
