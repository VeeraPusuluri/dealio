import { Link } from 'react-router-dom';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  variant?: 'default' | 'light';
  to?: string;
}

const sizes = {
  sm: { box: 'w-8 h-8',   radius: 10, svg: 15, dot: 6,  word: 'text-[17px]', gap: 'gap-2' },
  md: { box: 'w-10 h-10', radius: 12, svg: 19, dot: 7,  word: 'text-xl',     gap: 'gap-2.5' },
  lg: { box: 'w-14 h-14', radius: 16, svg: 26, dot: 9,  word: 'text-[28px]', gap: 'gap-3' },
};

const DMark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    {/* Outlined D via evenodd — inner area shows background gradient */}
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M3.5 2L3.5 18L10.5 18Q18 18 18 10Q18 2 10.5 2L3.5 2Z M6.5 5.5L6.5 14.5L10.5 14.5Q14.5 14.5 14.5 10Q14.5 5.5 10.5 5.5L6.5 5.5Z"
      fill="white"
      fillOpacity="0.95"
    />
  </svg>
);

export const DealioLogo = ({ size = 'md', showWordmark = true, variant = 'default', to }: Props) => {
  const s = sizes[size];
  const wordColor = variant === 'light' ? 'text-white' : 'text-[#0F2035]';

  const inner = (
    <div className={`inline-flex items-center ${s.gap}`}>
      {/* Icon mark */}
      <div
        className={`relative ${s.box} flex items-center justify-center flex-shrink-0 overflow-hidden`}
        style={{
          borderRadius: s.radius,
          background: 'linear-gradient(150deg, #0DAABF 0%, #0A7E8C 28%, #1A3B5D 62%, #0F2035 100%)',
          boxShadow: [
            '0 0 0 1px rgba(255,255,255,0.1)',
            '0 4px 20px rgba(10,126,140,0.45)',
            '0 1px 4px rgba(0,0,0,0.3)',
          ].join(', '),
        }}
      >
        {/* Top-left glass shine */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 130% 65% at 30% -5%, rgba(255,255,255,0.2) 0%, transparent 60%)',
            borderRadius: s.radius,
          }}
        />

        <DMark size={s.svg} />

        {/* Accent dot */}
        <span
          className="absolute rounded-full"
          style={{
            width:  s.dot,
            height: s.dot,
            top:    3,
            right:  3,
            background: 'linear-gradient(135deg, #FCD34D 0%, #F59E0B 55%, #E87722 100%)',
            boxShadow: '0 1px 4px rgba(232,119,34,0.65)',
          }}
        />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <span
          className={`${s.word} font-black leading-none select-none ${wordColor}`}
          style={{ letterSpacing: '-0.03em' }}
        >
          Deal<span style={{ color: '#0A8C9E' }}>io</span>
        </span>
      )}
    </div>
  );

  return to ? <Link to={to} className="inline-flex">{inner}</Link> : inner;
};

export default DealioLogo;