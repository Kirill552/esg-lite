import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LucideIcon } from 'lucide-react';

interface ResponsiveActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  onClick: () => void;
  gradient: {
    from: string;
    to: string;
    iconFrom: string;
    iconTo: string;
  };
}

export const ResponsiveActionCard: React.FC<ResponsiveActionCardProps> = ({
  title,
  description,
  icon: Icon,
  buttonText,
  onClick,
  gradient
}) => {
  return (
    <Card className={`p-4 sm:p-6 hover:shadow-lg transition-shadow border-0 bg-gradient-to-br ${gradient.from} ${gradient.to}`}>
      <div className="flex items-center mb-3 sm:mb-4">
        <div className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${gradient.iconFrom} ${gradient.iconTo} rounded-xl flex items-center justify-center flex-shrink-0`}>
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="ml-3 sm:ml-4 min-w-0 flex-1">
          <h3 className="font-semibold text-slate-900 text-sm sm:text-base">{title}</h3>
          <p className="text-xs sm:text-sm text-slate-600 truncate">{description}</p>
        </div>
      </div>
      <Button 
        variant="secondary" 
        size="sm" 
        className="w-full text-sm"
        onClick={onClick}
      >
        {buttonText}
      </Button>
    </Card>
  );
};
