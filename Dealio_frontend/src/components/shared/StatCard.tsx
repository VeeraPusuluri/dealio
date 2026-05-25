import { LucideIcon, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: string;
  prefix?: string;
  to?: string;
}

const StatCard = ({ title, value, change, icon: Icon, color, prefix, to }: StatCardProps) => {
  const navigate = useNavigate();
  const isLink = !!to;

  const handleClick = () => {
    if (to) navigate(to);
  };

  return (
    <div
      onClick={isLink ? handleClick : undefined}
      role={isLink ? 'button' : undefined}
      tabIndex={isLink ? 0 : undefined}
      onKeyDown={isLink ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(); } } : undefined}
      className={`group la-card p-5 border border-gray-100 transition-all duration-200 ${
        isLink ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5 hover:border-slate-200' : 'hover:shadow-md hover:-translate-y-0.5'
      }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] text-slate-500 font-medium flex items-center gap-1">
            {title}
            {isLink && (
              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            )}
          </p>
          <p className="text-2xl font-bold mt-1.5 text-slate-800">
            {prefix}{value}
          </p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${change >= 0 ? 'text-emerald-600' : 'text-destructive'}`}>
              {change >= 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              <span>{change >= 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, color: 'white' }}
        >
          <Icon size={18} className="text-white" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
