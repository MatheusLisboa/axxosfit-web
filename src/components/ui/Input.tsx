import React from 'react';
import { cn } from '../../lib/cn';

export type InputProps = React.ComponentPropsWithoutRef<'input'> & {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'light' | 'dark';
};

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  variant = 'light',
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  const isDark = variant === 'dark';

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-muted-foreground"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
            {leftIcon}
          </span>
        )}
        <input
          id={inputId}
          className={cn(
            'w-full text-xs px-3.5 py-2.5 rounded-xl font-medium transition-all duration-200',
            'bg-input-background border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-primary',
            'disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            {rightIcon}
          </span>
        )}
      </div>
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
      {hint && !error && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
}

export type TextareaProps = React.ComponentPropsWithoutRef<'textarea'> & {
  label?: string;
  error?: string;
};

export function Textarea({ label, error, className, id, ...props }: TextareaProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground">
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        className={cn(
          'w-full text-xs px-3.5 py-2.5 bg-input-background border border-border rounded-xl',
          'text-foreground placeholder:text-muted-foreground font-normal resize-none',
          'transition-all duration-200 min-h-[80px]',
          'focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-primary',
          error && 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}

export type SelectProps = React.ComponentPropsWithoutRef<'select'> & {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
};

export function Select({ label, error, options, className, id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-semibold text-muted-foreground">
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={cn(
          'w-full text-xs px-3.5 py-2.5 bg-input-background border border-border rounded-xl',
          'text-foreground font-medium appearance-none cursor-pointer',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-ring/25 focus:border-primary',
          error && 'border-rose-300',
          className
        )}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-[11px] text-rose-600 font-medium">{error}</p>}
    </div>
  );
}
