import React from 'react';
import { cn } from '../../lib/cn';

type BadgeVariant = 'default' | 'brand' | 'primary' | 'success' | 'warning' | 'danger' | 'accent' | 'outline';

export type BadgeProps = React.ComponentPropsWithoutRef<'span'> & {
  variant?: BadgeVariant;
  dot?: boolean;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-muted text-muted-foreground',
  brand: 'bg-primary/15 text-primary border border-primary/20',
  primary: 'bg-primary/15 text-primary border border-primary/20',
  success: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
  danger: 'bg-rose-500/15 text-rose-400 border border-rose-500/20',
  accent: 'bg-accent/15 text-accent border border-accent/20',
  outline: 'bg-transparent text-muted-foreground border border-border',
};

const dotColors: Record<BadgeVariant, string> = {
  default: 'bg-muted-foreground',
  brand: 'bg-primary',
  primary: 'bg-primary',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-rose-400',
  accent: 'bg-accent',
  outline: 'bg-muted-foreground',
};

export function Badge({ variant = 'default', dot, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function Avatar({ src, alt, name, size = 'md', className }: {
  src?: string;
  alt?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  const initials = name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

  if (src) {
    return (
      <img
        src={src}
        alt={alt || name || 'Avatar'}
        className={cn('rounded-full object-cover border-2 border-border', sizes[size], className)}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-gradient-to-br from-primary to-accent font-bold flex items-center justify-center text-white border-2 border-background',
        sizes[size],
        className
      )}
    >
      {initials || '?'}
    </div>
  );
}
