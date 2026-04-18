// ABOUTME: Banner renders only when is_mock=true; text is explicit about synthetic data.
// ABOUTME: Static import of the read layer — the mocked data path has is_mock=true.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PreviewBanner } from '@/components/landing/preview-banner';

describe('PreviewBanner', () => {
  it('renders the synthetic-data notice', () => {
    render(<PreviewBanner show />);
    expect(screen.getByRole('alert')).toHaveTextContent(/synthetic preview data/i);
  });

  it('renders nothing when show=false', () => {
    const { container } = render(<PreviewBanner show={false} />);
    expect(container).toBeEmptyDOMElement();
  });
});
