import React from 'react';
import { cn } from '../../lib/cn';
import { GlassCard } from './GlassCard';

export type CardProps = React.ComponentPropsWithoutRef<'div'> & {
  variant?: 'default' | 'muted' | 'elevated' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
};

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6 sm:p-8',
};

export function Card({
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  children,
  ...props
}: CardProps) {
  return (
    <GlassCard
      className={cn(
        paddingStyles[padding],
        hover && 'hover:border-primary/30 transition-all duration-200 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </GlassCard>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1 mb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-sm font-semibold text-foreground tracking-tight', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-muted-foreground font-normal', className)} {...props}>
      {children}
    </p>
  );
}

export interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: React.ReactNode;
  trend?: { value: string; positive?: boolean };
  className?: string;
}

export function StatCard({ label, value, subtext, icon, trend, className }: StatCardProps) {
  return (
    <GlassCard className={cn('p-5 animate-slide-up', className)}>
      <div className="flex items-start justify-between mb-4">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-foreground tracking-tight mb-1">{value}</div>
      {(subtext || trend) && (
        <div className="flex items-center gap-2 flex-wrap">
          {subtext && <p className="text-[10px] text-muted-foreground">{subtext}</p>}
          {trend && (
            <span
              className={cn(
                'text-[10px] font-semibold',
                trend.positive ? 'text-emerald-400' : 'text-rose-400'
              )}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </GlassCard>
  );
}
