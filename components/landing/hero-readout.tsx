// ABOUTME: Decorative terminal readout anchored top-right of the hero.
// ABOUTME: Pure static content — no data streaming, no motion. Hidden on narrow viewports.
export function HeroReadout() {
  return (
    <aside
      aria-label="bench run sample output"
      className="hidden md:block absolute right-6 top-10 w-[280px] rounded-md border border-landing-border bg-[rgba(5,5,5,0.75)] p-3 font-mono text-[0.65rem] leading-relaxed text-[#c7c7c7] backdrop-blur"
    >
      <div className="mb-2 flex gap-1">
        <span className="h-2 w-2 rounded-full bg-landing-border" />
        <span className="h-2 w-2 rounded-full bg-landing-border" />
        <span className="h-2 w-2 rounded-full bg-landing-border" />
      </div>
      <div>
        <span className="text-accent-teal">aec-bench ~ $</span>{' '}
        <span className="text-landing-text">bench run --all</span>
      </div>
      <div className="text-[#666]">› loading tasks … <span className="text-[#6fd08a]">547 ok</span></div>
      <div className="text-[#666]">› eval <span className="text-accent-amber">claude-sonnet-4</span></div>
      <div>&nbsp;&nbsp;reward <span className="text-accent-amber">0.72</span> · tok <span className="text-accent-amber">12.4k</span></div>
      <div className="text-[#666]">› eval <span className="text-accent-amber">gpt-4.1</span></div>
      <div>&nbsp;&nbsp;reward <span className="text-accent-amber">0.68</span> · tok <span className="text-accent-amber">9.1k</span></div>
      <div className="mt-1 text-[#666]">› stream → /leaderboard_</div>
    </aside>
  );
}
