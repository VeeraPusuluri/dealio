import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: LucideIcon;
  color: string;
  prefix?: string;
}

const StatCard = ({ title, value, change, icon: Icon, color, prefix }: StatCardProps) => {
  return (
    <div className="la-card p-5 border border-gray-100 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-[13px] text-slate-500 font-medium">{title}</p>
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
