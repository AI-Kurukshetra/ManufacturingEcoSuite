import { Activity, Leaf, Target, Wind } from "lucide-react";

import { EmissionsTrendChart } from "@/components/charts";
import { CsvExportButton } from "@/components/csv-export-button";
import { getEmissions, getFacilities } from "@/lib/data";
import { formatCompactNumber } from "@/lib/format";

interface EmissionsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EmissionsPage({ searchParams }: EmissionsPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;
  const [facilities, emissions] = await Promise.all([
    getFacilities(),
    getEmissions(facilityId),
  ]);

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const scopeTotals = {
    scope1: emissions
      .filter((entry) => entry.scope === "scope1")
      .reduce((sum, entry) => sum + entry.value, 0),
    scope2: emissions
      .filter((entry) => entry.scope === "scope2")
      .reduce((sum, entry) => sum + entry.value, 0),
    scope3: emissions
      .filter((entry) => entry.scope === "scope3")
      .reduce((sum, entry) => sum + entry.value, 0),
  };
  const combinedTotal = scopeTotals.scope1 + scopeTotals.scope2 + scopeTotals.scope3;

  const trendMap = emissions.reduce<Record<string, Record<string, number>>>(
    (accumulator, entry) => {
      const key = entry.period ?? "Unknown";
      if (!accumulator[key]) {
        accumulator[key] = {
          scope1: 0,
          scope2: 0,
          scope3: 0,
        };
      }
      accumulator[key][entry.scope] = (accumulator[key][entry.scope] ?? 0) + entry.value;
      return accumulator;
    },
    {},
  );

  const trendData = Object.entries(trendMap).map(([period, values]) => ({
    period,
    ...values,
  }));

  const csvRows = emissions.map((entry) => ({
    facility: facilityMap.get(entry.facility_id) ?? "Unknown",
    scope: entry.scope,
    value: entry.value,
    unit: entry.unit,
    period: entry.period,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wind className="h-4 w-4 text-brand" />
            Scope 1
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(scopeTotals.scope1)}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Leaf className="h-4 w-4 text-brand" />
            Scope 2
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(scopeTotals.scope2)}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Target className="h-4 w-4 text-brand" />
            Scope 3
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(scopeTotals.scope3)}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Activity className="h-4 w-4 text-brand" />
            Combined Total
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(combinedTotal)}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Emissions Trend</h2>
            <p className="text-sm text-slate-500">
              Stacked scope trend grouped by reporting period.
            </p>
          </div>
          <CsvExportButton filename="ecosuite-emissions.csv" rows={csvRows} />
        </div>
        <EmissionsTrendChart data={trendData} />
      </section>

      <section className="table-wrap overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Scope</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Period</th>
            </tr>
          </thead>
          <tbody>
            {emissions.map((entry) => (
              <tr key={entry.id}>
                <td>{facilityMap.get(entry.facility_id) ?? "Unknown"}</td>
                <td className="capitalize">{entry.scope}</td>
                <td>{entry.value}</td>
                <td>{entry.unit}</td>
                <td>{entry.period ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
