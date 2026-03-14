import { Bell, Info, ShieldAlert, TriangleAlert } from "lucide-react";
import Link from "next/link";

import { AlertReadButton, MarkAllReadButton } from "@/components/alerts-actions";
import { EmptyState } from "@/components/empty-state";
import { getAlerts, getFacilities } from "@/lib/data";
import { cn, titleCase } from "@/lib/format";

interface AlertsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const severities = ["all", "high", "medium", "low"] as const;

function getBorderClass(severity: string) {
  if (severity === "high") {
    return "border-rose-500";
  }

  if (severity === "medium") {
    return "border-amber-500";
  }

  return "border-sky-500";
}

function getSeverityIcon(severity: string) {
  if (severity === "high") {
    return TriangleAlert;
  }

  if (severity === "medium") {
    return ShieldAlert;
  }

  return Info;
}

export default async function AlertsPage({ searchParams }: AlertsPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;
  const severity =
    typeof params.severity === "string" ? params.severity : "all";

  const [facilities, alerts] = await Promise.all([
    getFacilities(),
    getAlerts(facilityId),
  ]);

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const filteredAlerts =
    severity === "all"
      ? alerts
      : alerts.filter((alert) => alert.severity === severity);
  const unreadFilteredAlerts = filteredAlerts.filter((alert) => !alert.is_read);
  const unreadAlertIds = filteredAlerts
    .filter((alert) => !alert.is_read)
    .map((alert) => alert.id);

  return (
    <div className="space-y-6">
      <section className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Alert Center</h2>
          <p className="text-sm text-slate-500">
            Filter by severity and update alert state directly in the app.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap gap-2">
            {severities.map((option) => (
              <Link
                key={option}
                href={`/alerts${facilityId ? `?facility=${facilityId}&severity=${option}` : `?severity=${option}`}`}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  severity === option
                    ? "bg-brand text-white"
                    : "bg-slate-100 text-slate-600 hover:text-brand",
                )}
              >
                {titleCase(option)}
              </Link>
            ))}
          </div>
          <MarkAllReadButton alertIds={unreadAlertIds} />
        </div>
      </section>

      {unreadFilteredAlerts.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="No unread alerts"
          description="Everything is under control for the current filter. Any existing alerts are already marked as read."
        />
      ) : (
        <div className="space-y-4">
          {filteredAlerts.map((alert) => {
            const Icon = getSeverityIcon(alert.severity);

            return (
              <div
                key={alert.id}
                className={`card border-l-4 ${getBorderClass(alert.severity)}`}
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <Icon className="h-5 w-5 text-brand" />
                    </div>
                    <div>
                      <div className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                        {titleCase(alert.severity)} severity
                      </div>
                      <h3 className="mt-1 text-lg font-semibold text-slate-900">
                        {titleCase(alert.type)} alert
                      </h3>
                      <p className="mt-2 text-sm text-slate-600">{alert.message}</p>
                      <div className="mt-3 text-xs text-slate-400">
                        {facilityMap.get(alert.facility_id) ?? "Unknown facility"} •{" "}
                        {new Date(alert.created_at).toLocaleString("en-IN")}
                      </div>
                    </div>
                  </div>
                  <AlertReadButton alertId={alert.id} disabled={alert.is_read} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
