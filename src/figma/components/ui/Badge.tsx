import type { ReactNode } from "react";
import { cn } from "./utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "danger" | "accent" | "ghost";

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/15 text-primary border border-primary/20",
  success: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
  warning: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  danger: "bg-rose-500/15 text-rose-400 border border-rose-500/20",
  accent: "bg-accent/15 text-accent border border-accent/20",
  ghost: "bg-transparent text-muted-foreground border border-border",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-muted-foreground",
  primary: "bg-primary",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  danger: "bg-rose-400",
  accent: "bg-accent",
  ghost: "bg-muted-foreground",
};

export function Badge({ children, variant = "default", className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium",
        variants[variant],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])} />}
      {children}
    </span>
  );
}
