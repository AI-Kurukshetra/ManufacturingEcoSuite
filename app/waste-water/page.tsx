import { Droplets, Recycle } from "lucide-react";

import { WasteRecyclingChart, WaterUsageChart } from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { getFacilities, getWasteStreams, getWaterUsage } from "@/lib/data";
import { formatCompactNumber } from "@/lib/format";

interface WasteWaterPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function WasteWaterPage({ searchParams }: WasteWaterPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;

  const [facilities, waste, water] = await Promise.all([
    getFacilities(),
    getWasteStreams(facilityId),
    getWaterUsage(facilityId),
  ]);

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const recycled = waste.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * ((item.recycled_pct ?? 0) / 100),
    0,
  );
  const totalWaste = waste.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  const waterChartData = water.map((entry) => ({
    facility: facilityMap.get(entry.facility_id) ?? "Unknown",
    consumption: entry.consumption ?? 0,
  }));

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-2">
        <div className="card">
          <div className="mb-5 flex items-center gap-3">
            <Recycle className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Waste Recycling</h2>
              <p className="text-sm text-slate-500">
                Recycled versus non-recycled material volume.
              </p>
            </div>
          </div>
          {waste.length === 0 ? (
            <EmptyState
              icon={Recycle}
              title="No waste data found"
              description="Waste tracking records will show here once available."
            />
          ) : (
            <WasteRecyclingChart
              data={[
                { name: "Recycled", value: recycled },
                { name: "Non-Recycled", value: Math.max(totalWaste - recycled, 0) },
              ]}
            />
          )}
        </div>

        <div className="card">
          <div className="mb-5 flex items-center gap-3">
            <Droplets className="h-5 w-5 text-brand" />
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Water Usage</h2>
              <p className="text-sm text-slate-500">Facility-level water consumption.</p>
            </div>
          </div>
          {water.length === 0 ? (
            <EmptyState
              icon={Droplets}
              title="No water data found"
              description="Water usage records will show here once available."
            />
          ) : (
            <WaterUsageChart data={waterChartData} />
          )}
        </div>
      </section>

      <section className="table-wrap overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Type</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Recycled %</th>
            </tr>
          </thead>
          <tbody>
            {waste.map((entry) => (
              <tr key={entry.id}>
                <td>{facilityMap.get(entry.facility_id) ?? "Unknown"}</td>
                <td>{entry.type}</td>
                <td>{formatCompactNumber(entry.quantity ?? 0)}</td>
                <td>{entry.unit ?? "-"}</td>
                <td>{entry.recycled_pct ?? 0}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="table-wrap overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Consumption</th>
              <th>Unit</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {water.map((entry) => (
              <tr key={entry.id}>
                <td>{facilityMap.get(entry.facility_id) ?? "Unknown"}</td>
                <td>{formatCompactNumber(entry.consumption ?? 0)}</td>
                <td>{entry.unit}</td>
                <td>{entry.source ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
