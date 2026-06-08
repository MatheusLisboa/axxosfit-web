import React from 'react';
import { cn } from '../../lib/cn';

export type GlassCardProps = React.ComponentPropsWithoutRef<'div'>;

export function GlassCard({ className, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-border bg-card text-card-foreground backdrop-blur-xl',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
