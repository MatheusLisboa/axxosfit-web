import React from 'react';
import { AlertCircle, Inbox, RefreshCw } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button } from './Button';

export function LoadingSpinner({
  size = 'md',
  label,
  className,
}: {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
}) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'border-[3px] border-indigo-200 border-t-indigo-600 rounded-full animate-spin',
          sizes[size]
        )}
        role="status"
        aria-label={label || 'Carregando'}
      />
      {label && <p className="text-xs font-medium text-slate-500 animate-pulse">{label}</p>}
    </div>
  );
}

export function LoadingScreen({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="min-h-screen dark bg-background text-foreground flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" label={label} />
    </div>
  );
}

export function Skeleton({
  className,
  lines = 1,
}: {
  className?: string;
  lines?: number;
}) {
  if (lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="skeleton h-4 w-full" style={{ width: `${100 - i * 15}%` }} />
        ))}
      </div>
    );
  }
  return <div className={cn('skeleton h-4 w-full', className)} />;
}

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        'bg-slate-50 border border-dashed border-slate-200 rounded-2xl animate-fade-in',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
        {icon || <Inbox className="w-7 h-7" />}
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      {description && <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Algo deu errado',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6',
        'bg-rose-50/50 border border-rose-100 rounded-2xl animate-fade-in',
        className
      )}
    >
      <div className="w-14 h-14 rounded-2xl bg-rose-100 flex items-center justify-center text-rose-500 mb-4">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h3 className="text-sm font-bold text-foreground mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-5" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}
