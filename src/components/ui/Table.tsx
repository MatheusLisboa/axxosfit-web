import React from 'react';
import { cn } from '../../lib/cn';

export interface TableProps {
  children: React.ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-slate-200', className)}>
      <table className="w-full text-xs text-left">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <thead className={cn('bg-slate-50 border-b border-slate-200', className)}>
      {children}
    </thead>
  );
}

export function TableBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return <tbody className={cn('divide-y divide-slate-100 bg-white', className)}>{children}</tbody>;
}

export function TableRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={cn(
        'transition-colors duration-150',
        onClick && 'cursor-pointer hover:bg-slate-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap',
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-4 py-3.5 text-slate-700 font-medium whitespace-nowrap', className)}>
      {children}
    </td>
  );
}

/* Mobile-friendly card row alternative */
export function TableCardRow({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={cn(
        'md:hidden bg-white border border-slate-200 rounded-xl p-4 space-y-2 shadow-card',
        onClick && 'cursor-pointer active:bg-slate-50',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
