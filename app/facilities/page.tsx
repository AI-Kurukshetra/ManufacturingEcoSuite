import { Building2, Factory, MapPin, Ruler } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getFacilitySummaries } from "@/lib/data";
import { formatCompactNumber, formatNumber } from "@/lib/format";

export default async function FacilitiesPage() {
  const facilities = await getFacilitySummaries();

  if (facilities.length === 0) {
    return (
      <EmptyState
        icon={Building2}
        title="No facilities found"
        description="Add a facility from the Admin Console to populate this portfolio view."
      />
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {facilities.map((summary) => (
        <Link
          key={summary.facility.id}
          href={`/facilities/${summary.facility.id}`}
          className="group card border border-transparent transition hover:-translate-y-1 hover:border-brand/20"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 transition group-hover:text-brand">
                {summary.facility.name}
              </h2>
              <div className="mt-2 flex items-center gap-2 text-sm text-slate-500">
                <MapPin className="h-4 w-4 text-brand" />
                {summary.facility.location ?? "Location not set"}
              </div>
            </div>
            <StatusBadge value={summary.complianceStatus} />
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Factory className="h-4 w-4 text-brand" />
                Type
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {summary.facility.type ?? "Not defined"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Ruler className="h-4 w-4 text-brand" />
                Size
              </div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {summary.facility.size_sqft
                  ? `${formatNumber(summary.facility.size_sqft)} sqft`
                  : "Unavailable"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Total Energy</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {formatCompactNumber(summary.totalEnergy)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Total Emissions</div>
              <div className="mt-2 text-lg font-semibold text-slate-900">
                {formatCompactNumber(summary.totalEmissions)} tCO2e
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
