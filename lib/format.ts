import type { SustainabilityGoal } from "@/types";

export const chartPalette = [
  "#0d4f3c",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#ef4444",
];

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number) {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}

export function formatDate(value: string | null) {
  if (!value) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function daysUntil(value: string | null) {
  if (!value) {
    return null;
  }

  const today = new Date();
  const target = new Date(value);
  const diff = target.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getMonthKey(dateInput: string | Date) {
  const date = new Date(dateInput);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${date.getFullYear()}-${month}`;
}

export function getMonthLabel(dateInput: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "2-digit",
  }).format(new Date(dateInput));
}

export function addMonths(dateInput: Date, amount: number) {
  const date = new Date(dateInput);
  date.setMonth(date.getMonth() + amount);
  return date;
}

export function startOfMonth(dateInput: Date) {
  return new Date(dateInput.getFullYear(), dateInput.getMonth(), 1);
}

export function getQuarterLabel(dateInput: Date) {
  const quarter = Math.floor(dateInput.getMonth() / 3) + 1;
  return `Q${quarter} ${dateInput.getFullYear()}`;
}

export function calculateGoalProgress(goal: SustainabilityGoal) {
  const target = goal.target_value ?? 0;
  const current = goal.current_value ?? 0;

  if (target <= 0) {
    return current <= 0 ? 100 : 0;
  }

  return Math.max(0, Math.min(100, (current / target) * 100));
}

export function getGoalStatus(goal: SustainabilityGoal) {
  const progress = calculateGoalProgress(goal);
  const remaining = daysUntil(goal.deadline);

  if (goal.status === "achieved" || progress >= 100) {
    return "achieved";
  }

  if (remaining !== null && remaining < 30 && progress < 75) {
    return "behind";
  }

  return "on_track";
}

export function getGoalStatusLabel(goal: SustainabilityGoal) {
  const status = getGoalStatus(goal);

  if (status === "achieved") {
    return "Achieved";
  }

  if (status === "behind") {
    return "Behind";
  }

  return "On Track";
}

export function titleCase(value: string) {
  return value
    .split(/[_\s-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
