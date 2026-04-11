// ABOUTME: Test setup file that extends Vitest matchers with jest-dom.
// ABOUTME: Provides DOM-specific assertions like toBeInTheDocument().
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});
