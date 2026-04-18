// ABOUTME: Five inline SVG placeholder glyphs for engineering disciplines.
// ABOUTME: Decorative; parent marks aria-hidden. Designer to iterate later.
type GlyphProps = { className?: string };

const base = 'h-10 w-10 stroke-accent-teal fill-none';

export function CivilGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden="true" strokeWidth="1.5">
      <path d="M4 30 Q12 18 20 24 T36 20" />
      <path d="M4 34 L36 34" strokeDasharray="2 2" />
      <circle cx="12" cy="26" r="1.5" />
      <circle cx="22" cy="23" r="1.5" />
      <circle cx="30" cy="22" r="1.5" />
    </svg>
  );
}

export function ElectricalGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden="true" strokeWidth="1.5">
      <path d="M22 4 L12 22 L20 22 L16 36 L28 18 L20 18 Z" />
    </svg>
  );
}

export function GroundGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden="true" strokeWidth="1.5">
      <path d="M4 14 L36 14" />
      <path d="M4 22 L36 22" strokeDasharray="2 2" />
      <path d="M4 30 L36 30" strokeDasharray="3 3" />
      <path d="M14 6 L14 34" />
    </svg>
  );
}

export function MechanicalGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden="true" strokeWidth="1.5">
      <circle cx="20" cy="20" r="5" />
      <path d="M20 4 L20 10 M20 30 L20 36 M4 20 L10 20 M30 20 L36 20 M8 8 L13 13 M27 27 L32 32 M32 8 L27 13 M13 27 L8 32" />
    </svg>
  );
}

export function StructuralGlyph({ className = '' }: GlyphProps) {
  return (
    <svg viewBox="0 0 40 40" className={`${base} ${className}`} aria-hidden="true" strokeWidth="1.5">
      <path d="M6 6 L34 6 L34 34 L6 34 Z" />
      <path d="M6 6 L34 34 M34 6 L6 34" />
    </svg>
  );
}
