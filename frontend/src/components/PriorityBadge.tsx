import type { Priority } from "@/types";
import { cn } from "@/lib/utils";

const styles: Record<Priority, string> = {
  low: "bg-priority-low/10 text-priority-low border-priority-low/20",
  medium: "bg-priority-medium/10 text-priority-medium border-priority-medium/30",
  high: "bg-priority-high/10 text-priority-high border-priority-high/30",
};

const labels: Record<Priority, string> = { low: "Low", medium: "Medium", high: "High" };

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", styles[priority], className)}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: "currentColor" }} />
      {labels[priority]}
    </span>
  );
}
