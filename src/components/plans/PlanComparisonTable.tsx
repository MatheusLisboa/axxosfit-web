import { Check, Minus } from 'lucide-react';
import {
  PLAN_CATALOG_LIST,
  PLAN_COMPARISON_ROWS,
  PLAN_DISPLAY_NAMES,
  type CanonicalPlanSlug,
} from '../../lib/plans';
import { cn } from '../../lib/cn';

interface PlanComparisonTableProps {
  className?: string;
  highlightSlug?: CanonicalPlanSlug;
}

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-400">
        <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground/40">
        <Minus className="w-3.5 h-3.5" />
      </span>
    );
  }
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

export function PlanComparisonTable({ className, highlightSlug }: PlanComparisonTableProps) {
  const slugs: CanonicalPlanSlug[] = ['starter', 'pro', 'studio'];

  return (
    <div className={cn('overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0', className)}>
      <table className="w-full min-w-[640px] border-collapse text-left">
        <thead>
          <tr className="border-b border-border">
            <th className="py-4 pr-4 text-xs font-medium text-muted-foreground w-[40%]">Recurso</th>
            {slugs.map((slug) => {
              const plan = PLAN_CATALOG_LIST.find((p) => p.slug === slug)!;
              const highlighted = highlightSlug === slug;
              return (
                <th
                  key={slug}
                  className={cn(
                    'py-4 px-3 text-center',
                    highlighted && 'bg-primary/5 rounded-t-xl'
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{PLAN_DISPLAY_NAMES[slug]}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">R$ {plan.price}/mês</p>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {PLAN_COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="border-b border-border/60">
              <td className="py-3 pr-4 text-xs text-muted-foreground">{row.label}</td>
              {slugs.map((slug) => {
                const highlighted = highlightSlug === slug;
                const value = row[slug];
                return (
                  <td
                    key={slug}
                    className={cn(
                      'py-3 px-3 text-center',
                      highlighted && 'bg-primary/5'
                    )}
                  >
                    <div className="flex justify-center">
                      <CellValue value={value} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
