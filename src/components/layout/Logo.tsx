import React from 'react';
import { cn } from '../../lib/cn';
import { Wordmark } from '../Wordmark';

interface LogoProps {
  subtitle?: string;
  showBadge?: boolean;
  badgeLabel?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function Logo({ subtitle, showBadge, badgeLabel = 'Pro', size = 'md', className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3 min-w-0', className)}>
      <div className="flex flex-col min-w-0">
        <Wordmark size={size} />
        {subtitle && (
          <span className="text-[10px] text-muted-foreground truncate mt-0.5">{subtitle}</span>
        )}
      </div>
      {showBadge && (
        <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/20 shrink-0">
          {badgeLabel}
        </span>
      )}
    </div>
  );
}
