import { Link } from 'react-router-dom';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  variant?: 'default' | 'light';
  to?: string;
}

const sizes = {
  sm: { box: 'w-7 h-7',   radius: 9,  svg: 14, word: 'text-[15px]', gap: 'gap-2'   },
  md: { box: 'w-9 h-9',   radius: 11, svg: 18, word: 'text-[18px]', gap: 'gap-2.5' },
  lg: { box: 'w-12 h-12', radius: 14, svg: 24, word: 'text-[24px]', gap: 'gap-3'   },
};

// Clean geometric D — outer shape + inner cutout via evenodd
// Left vertical bar: x 3.5→6, height 3→17
// Right arc: from (6,3)/(9,3) curving to (9,17)/(6,17), radius 7 outer / 4.5 inner
const DMark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 3 H9 A7 7 0 0 1 9 17 H3.5 Z M6 5.5 H9 A4.5 4.5 0 0 1 9 14.5 H6 Z"
      fill="white"
      fillOpacity="0.96"
    />
  </svg>
);

export const DealioLogo = ({ size = 'md', showWordmark = true, variant = 'default', to }: Props) => {
  const s = sizes[size];
  const dealColor   = variant === 'light' ? '#ffffff'  : '#0F2035';
  const ioColor     = variant === 'light' ? '#7AE0EC'  : '#0A7E8C';

  const inner = (
    <div className={`inline-flex items-center ${s.gap}`}>

      {/* ── Icon mark ──────────────────────────────────────────────────────── */}
      <div
        className={`relative ${s.box} flex items-center justify-center flex-shrink-0`}
        style={{
          borderRadius: s.radius,
          background: 'linear-gradient(145deg, #0FA5BB 0%, #0A7E8C 100%)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.10), 0 4px 14px rgba(10,126,140,0.28)',
        }}
      >
        <DMark size={s.svg} />
      </div>

      {/* ── Wordmark ───────────────────────────────────────────────────────── */}
      {showWordmark && (
        <span
          className={`${s.word} font-bold leading-none select-none tracking-tight`}
          style={{ color: dealColor, letterSpacing: '-0.02em' }}
        >
          Deal<span style={{ color: ioColor }}>io</span>
        </span>
      )}

    </div>
  );

  return to ? <Link to={to} className="inline-flex">{inner}</Link> : inner;
};

export default DealioLogo;