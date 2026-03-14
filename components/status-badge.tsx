import { cn } from "@/lib/format";

const statusMap: Record<string, string> = {
  compliant: "bg-emerald-100 text-emerald-700",
  review_needed: "bg-amber-100 text-amber-700",
  non_compliant: "bg-rose-100 text-rose-700",
  in_progress: "bg-emerald-100 text-emerald-700",
  on_track: "bg-emerald-100 text-emerald-700",
  behind: "bg-amber-100 text-amber-700",
  achieved: "bg-sky-100 text-sky-700",
  active: "bg-emerald-100 text-emerald-700",
  maintenance: "bg-rose-100 text-rose-700",
  high: "bg-rose-100 text-rose-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-sky-100 text-sky-700",
};

interface StatusBadgeProps {
  value: string;
  label?: string;
}

export function StatusBadge({ value, label }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-1 text-xs font-medium",
        statusMap[value] ?? "bg-slate-100 text-slate-700",
      )}
    >
      {label ?? value.replaceAll("_", " ")}
    </span>
  );
}
