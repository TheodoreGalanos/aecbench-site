// ABOUTME: Tests for shared landing primitives SectionAnno, SheetCorners, BlueprintBg.
// ABOUTME: Verifies text content and structural props render correctly.
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SectionAnno } from '@/components/landing/section-anno';
import { SheetCorners } from '@/components/landing/sheet-corners';
import { BlueprintBg } from '@/components/landing/blueprint-bg';

describe('SectionAnno', () => {
  it('renders formatted section label', () => {
    render(<SectionAnno number={2} name="Current Standings" />);
    expect(screen.getByText(/SECTION 02 \/ CURRENT STANDINGS/)).toBeInTheDocument();
  });
});

describe('SheetCorners', () => {
  it('renders fig and sheet labels', () => {
    render(<SheetCorners figNumber={4} figName="DISCIPLINES" totalSheets={6} />);
    expect(screen.getByText('FIG. 04 / DISCIPLINES')).toBeInTheDocument();
    expect(screen.getByText('SHEET 04 OF 06')).toBeInTheDocument();
  });
});

describe('BlueprintBg', () => {
  it('renders children inside a section wrapper', () => {
    render(<BlueprintBg><p>content</p></BlueprintBg>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });
});
