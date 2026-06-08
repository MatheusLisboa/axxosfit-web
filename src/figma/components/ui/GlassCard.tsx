import type { Key, ReactNode } from "react";
import { cn } from "./utils";

interface GlassCardProps {
  key?: Key;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  glow?: boolean;
}

export function GlassCard({ children, className, onClick, hover = false, glow = false }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "relative rounded-xl border border-border bg-card backdrop-blur-xl",
        "transition-all duration-300",
        hover && "cursor-pointer hover:border-primary/30 hover:bg-card/80 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5",
        glow && "shadow-lg shadow-primary/10",
        onClick && "cursor-pointer",
        className
      )}
    >
      {children}
    </div>
  );
}
