import type { ReactNode } from 'react';
import { motion } from 'motion/react';
import { cn } from '../../ui/utils';

interface PremiumSurfaceProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  onClick?: () => void;
}

export function PremiumSurface({ children, className, delay = 0, onClick }: PremiumSurfaceProps) {
  const Tag = onClick ? motion.button : motion.div;
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        'w-full text-left rounded-3xl border border-white/[0.06] bg-card/40 backdrop-blur-sm',
        'shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset]',
        onClick && 'active:scale-[0.99] transition-transform',
        className
      )}
    >
      {children}
    </Tag>
  );
}
