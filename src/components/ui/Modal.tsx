import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeStyles = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = 'md',
  className,
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative w-full bg-popover border border-border rounded-t-3xl sm:rounded-3xl shadow-lg',
          'max-h-[90vh] overflow-y-auto touch-momentum',
          'animate-slide-up pb-safe',
          sizeStyles[size],
          className
        )}
      >
        {(title || description) && (
          <div className="sticky top-0 bg-popover border-b border-border px-6 py-4 flex items-start justify-between gap-4 rounded-t-3xl sm:rounded-t-3xl z-10">
            <div>
              {title && <h3 className="text-base font-bold text-foreground">{title}</h3>}
              {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition shrink-0"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export interface ToastProps {
  message: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'error';
  onClose?: () => void;
}

export function Toast({ message, icon, variant = 'default', onClose }: ToastProps) {
  const variantStyles = {
    default: 'bg-slate-900 text-white border-slate-800',
    success: 'bg-emerald-600 text-white border-emerald-500',
    error: 'bg-rose-600 text-white border-rose-500',
  };

  return (
    <div
      className={cn(
        'fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-auto z-50',
        'font-semibold px-5 py-3.5 rounded-xl shadow-lg flex items-center gap-2.5 border text-xs',
        'animate-slide-up',
        variantStyles[variant]
      )}
      role="alert"
    >
      {icon}
      <span className="flex-1">{message}</span>
      {onClose && (
        <button onClick={onClose} className="opacity-70 hover:opacity-100 transition" aria-label="Fechar">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
