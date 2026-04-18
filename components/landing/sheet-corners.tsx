// ABOUTME: Drafting-sheet corner annotations positioned top-left and bottom-right of a section.
// ABOUTME: Parent section must be position:relative for these to anchor correctly.
interface SheetCornersProps {
  figNumber: number;
  figName: string;
  totalSheets?: number;
}

export function SheetCorners({ figNumber, figName, totalSheets = 6 }: SheetCornersProps) {
  const paddedN = String(figNumber).padStart(2, '0');
  const paddedT = String(totalSheets).padStart(2, '0');
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute left-4 top-3 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[#555]"
      >
        FIG. {paddedN} / {figName}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-3 right-4 font-mono text-[0.55rem] uppercase tracking-[0.12em] text-[#555]"
      >
        SHEET {paddedN} OF {paddedT}
      </div>
    </>
  );
}
