import { cn } from '../lib/cn';

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'h-7',
  md: 'h-9',
  lg: 'h-10 sm:h-11',
};

export function Wordmark({ size = 'md', className }: WordmarkProps) {
  return (
    <img
      src="/wordmark.svg"
      alt="AxxosFit"
      className={cn('w-auto max-w-full object-contain object-left', sizeClasses[size], className)}
      width={280}
      height={52}
      decoding="async"
    />
  );
}
