import { Link } from 'react-router-dom';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  variant?: 'default' | 'light';
  to?: string;
}

const sizes = {
  sm: { box: 'w-7 h-7',   radius: 7,  svg: 14, word: 'text-[15px]', gap: 'gap-2'   },
  md: { box: 'w-9 h-9',   radius: 9,  svg: 18, word: 'text-[18px]', gap: 'gap-2.5' },
  lg: { box: 'w-12 h-12', radius: 11, svg: 24, word: 'text-[24px]', gap: 'gap-3'   },
};

// New mark: an architectural D — thick left bar with orange window slots,
// the arc has wider proportions (building facade feel),
// and an orange accent dot sits on the upper arc.
const DMark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    {/* D silhouette — wider outer arc, narrower inner cutout */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3 2 H9 C16 2 18 6 18 10 C18 14 16 18 9 18 H3 Z
         M6 5.5 H9 C13.5 5.5 15 7.5 15 10 C15 12.5 13.5 14.5 9 14.5 H6 Z"
      fill="white"
      fillOpacity="0.94"
    />
    {/* Orange window slots on the left vertical bar */}
    <rect x="3" y="7.8"  width="3" height="1.4" rx="0.5" fill="#FF8930" fillOpacity="0.88"/>
    <rect x="3" y="11.4" width="3" height="1.4" rx="0.5" fill="#FF8930" fillOpacity="0.60"/>
    {/* Teal spire dot — top of the arc, reads as a rooftop light / premium accent */}
    <circle cx="16.2" cy="5.8" r="1.4" fill="#1CD8EE" fillOpacity="0.92"/>
  </svg>
);

export const DealioLogo = ({ size = 'md', showWordmark = true, variant = 'default', to }: Props) => {
  const s = sizes[size];
  const dealColor = variant === 'light' ? '#ffffff' : '#0D1F35';
  const ioColor   = variant === 'light' ? '#3ECDE2' : '#0A9CB5';

  const inner = (
    <div className={`inline-flex items-center ${s.gap}`}>

      {/* ── Icon mark ── */}
      <div
        className={`relative ${s.box} flex items-center justify-center flex-shrink-0`}
        style={{
          borderRadius: s.radius,
          background: 'linear-gradient(145deg, #0B1B2E 0%, #0E2542 60%, #112E50 100%)',
          boxShadow: [
            '0 1px 3px rgba(0,0,0,0.22)',
            '0 4px 16px rgba(0,0,0,0.32)',
            '0 0 0 1.5px rgba(28,216,238,0.2)',
            'inset 0 1px 0 rgba(255,255,255,0.06)',
          ].join(', '),
        }}
      >
        <DMark size={s.svg} />
      </div>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <span
          className={`${s.word} font-bold leading-none select-none`}
          style={{ color: dealColor, letterSpacing: '-0.03em' }}
        >
          Deal<span style={{ color: ioColor }}>io</span>
        </span>
      )}

    </div>
  );
  return to ? <Link to={to} className="inline-flex">{inner}</Link> : inner;
};

export default DealioLogo;