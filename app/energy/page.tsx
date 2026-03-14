import { Lightbulb, TrendingUp, Wallet } from "lucide-react";

import { EnergyTrendChart } from "@/components/charts";
import { PageFacilityFilter } from "@/components/page-facility-filter";
import { getEnergyConsumption, getEnergyInsight, getFacilities } from "@/lib/data";
import {
  formatCompactNumber,
  formatCurrency,
  formatDateTime,
  formatPercent,
  formatRelativeTime,
  getMonthKey,
} from "@/lib/format";

interface EnergyPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EnergyPage({ searchParams }: EnergyPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;

  const [facilities, energy] = await Promise.all([
    getFacilities(),
    getEnergyConsumption(facilityId),
  ]);

  const currentMonthKey = energy.length
    ? [...new Set(energy.map((entry) => getMonthKey(entry.recorded_at)))].sort().at(-1) ??
      getMonthKey(new Date())
    : getMonthKey(new Date());
  const previousMonthKey = (() => {
    const [year, month] = currentMonthKey.split("-").map(Number);
    return getMonthKey(new Date(year, month - 2, 1));
  })();

  const currentMonthSpend = energy
    .filter((entry) => getMonthKey(entry.recorded_at) === currentMonthKey)
    .reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  const previousMonthSpend = energy
    .filter((entry) => getMonthKey(entry.recorded_at) === previousMonthKey)
    .reduce((sum, entry) => sum + (entry.cost ?? 0), 0);
  const costChange = previousMonthSpend
    ? ((currentMonthSpend - previousMonthSpend) / previousMonthSpend) * 100
    : 0;

  const costByType = energy.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.type] = (accumulator[entry.type] ?? 0) + (entry.cost ?? 0);
    return accumulator;
  }, {});
  const mostExpensiveType =
    Object.entries(costByType).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "n/a";
  const latestRecordAt = energy[0]?.recorded_at ?? null;
  const energyInsight = getEnergyInsight(energy, facilities);

  const trendMap = energy.reduce<Record<string, Record<string, number>>>(
    (accumulator, entry) => {
      const key = getMonthKey(entry.recorded_at);
      if (!accumulator[key]) {
        accumulator[key] = {
          electricity: 0,
          gas: 0,
          water: 0,
        };
      }
      accumulator[key][entry.type] = (accumulator[key][entry.type] ?? 0) + entry.value;
      return accumulator;
    },
    {},
  );

  const trendData = Object.entries(trendMap)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([month, values]) => ({
      month,
      ...values,
    }));

  return (
    <div className="space-y-6">
      <div className="card flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Energy Monitoring</h2>
          <p className="text-sm text-slate-500">
            Filter by facility and review live energy spend, usage and cost trends.
          </p>
        </div>
        <PageFacilityFilter facilities={facilities} selectedFacilityId={facilityId} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Wallet className="h-4 w-4 text-brand" />
            Total spend this month
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCurrency(currentMonthSpend)}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <TrendingUp className="h-4 w-4 text-brand" />
            MoM spend change
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatPercent(costChange)}
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Lightbulb className="h-4 w-4 text-brand" />
            Most expensive type
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900 capitalize">
            {mostExpensiveType}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Last record added</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {latestRecordAt ? formatRelativeTime(latestRecordAt) : "No data"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {latestRecordAt ? formatDateTime(latestRecordAt) : "Add energy data to start tracking"}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">Consumption Trend</h2>
          <p className="text-sm text-slate-500">
            Usage trend by energy type over time.
          </p>
        </div>
        <EnergyTrendChart data={trendData} />
      </section>

      <section className="card border border-amber-200 bg-amber-50">
        <div className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700">
          AI Insight
        </div>
        <p className="mt-3 text-base text-amber-900">
          {energyInsight}
        </p>
      </section>

      <section className="table-wrap overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Type</th>
              <th>Value</th>
              <th>Unit</th>
              <th>Cost</th>
              <th>Recorded at</th>
            </tr>
          </thead>
          <tbody>
            {energy.map((entry) => (
              <tr key={entry.id}>
                <td className="capitalize">{entry.type}</td>
                <td>{formatCompactNumber(entry.value)}</td>
                <td>{entry.unit}</td>
                <td>{entry.cost ? formatCurrency(entry.cost) : "-"}</td>
                <td>{new Date(entry.recorded_at).toLocaleDateString("en-IN")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
