import React from 'react';
import { Card } from '@/components/ui/Card';
import { TrendingUp, TrendingDown, LucideIcon } from 'lucide-react';

interface ResponsiveStatCardProps {
  label: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  color: 'emerald' | 'blue' | 'purple' | 'green';
  loading?: boolean;
}

export const ResponsiveStatCard: React.FC<ResponsiveStatCardProps> = ({
  label,
  value,
  change,
  changeType,
  icon: Icon,
  color,
  loading = false
}) => {
  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
        return 'from-emerald-500 to-green-600';
      case 'blue':
        return 'from-blue-500 to-cyan-600';
      case 'purple':
        return 'from-purple-500 to-indigo-600';
      default:
        return 'from-green-500 to-emerald-600';
    }
  };

  const getTrendIcon = () => {
    if (changeType === 'positive') return TrendingUp;
    if (changeType === 'negative') return TrendingDown;
    return TrendingUp;
  };

  const TrendIcon = getTrendIcon();

  return (
    <Card className="p-4 sm:p-6 border-0 bg-white/60 backdrop-blur-sm hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-slate-600 mb-1 truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold text-slate-900 mb-2 break-words">
            {loading ? '...' : value}
          </p>
          <div className={`flex items-center text-xs sm:text-sm ${
            changeType === 'positive' ? 'text-emerald-600' : 
            changeType === 'negative' ? 'text-red-600' : 'text-slate-600'
          }`}>
            <TrendIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{loading ? '...' : change}</span>
          </div>
        </div>
        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${getColorClasses(color)} flex-shrink-0 ml-3`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
      </div>
    </Card>
  );
};
