/* ─── Soft-pastel placeholder for projects with no cover image ─── */
const PASTELS = [
  { bg: '#fdf2f8', letter: '#d09ab8' }, // blush rose
  { bg: '#f0fdf4', letter: '#7ab89a' }, // sage green
  { bg: '#fff7ed', letter: '#d8a07a' }, // warm peach
  { bg: '#f5f3ff', letter: '#a898d0' }, // soft lavender
  { bg: '#f0fdfa', letter: '#6aaba8' }, // aqua mint
  { bg: '#fefce8', letter: '#c0a050' }, // warm gold
];

export default function ProjectPlaceholder({ seed, name }: { seed: number; name?: string }) {
  const p = PASTELS[Math.abs(seed) % PASTELS.length];
  const initial = name?.trim().charAt(0).toUpperCase() ?? '';

  return (
    <div
      className="w-full h-full flex items-center justify-center select-none"
      style={{ background: p.bg }}
    >
      <span
        style={{
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontWeight: 200,
          fontSize: 'clamp(56px, 35%, 140px)',
          color: p.letter,
          lineHeight: 1,
          letterSpacing: '-0.03em',
        }}
      >
        {initial}
      </span>
    </div>
  );
}