import { Box, Building2, Gauge, Leaf, ShieldCheck, Target, Waves, Zap } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import {
  getComplianceRecords,
  getEmissions,
  getEnergyConsumption,
  getEquipment,
  getFacilityById,
  getGoals,
  getWasteStreams,
  getWaterUsage,
} from "@/lib/data";
import {
  calculateGoalProgress,
  formatCompactNumber,
  formatDate,
  getGoalStatus,
  getGoalStatusLabel,
} from "@/lib/format";

const tabs = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "energy", label: "Energy", icon: Zap },
  { id: "emissions", label: "Emissions", icon: Leaf },
  { id: "equipment", label: "Equipment", icon: Gauge },
  { id: "waste-water", label: "Waste & Water", icon: Waves },
  { id: "goals", label: "Goals", icon: Target },
  { id: "compliance", label: "Compliance", icon: ShieldCheck },
];

interface FacilityDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FacilityDetailPage({
  params,
  searchParams,
}: FacilityDetailPageProps) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const tab =
    typeof resolvedSearchParams.tab === "string" ? resolvedSearchParams.tab : "overview";

  const [facility, energy, emissions, equipment, waste, water, goals, compliance] =
    await Promise.all([
      getFacilityById(id),
      getEnergyConsumption(id),
      getEmissions(id),
      getEquipment(id),
      getWasteStreams(id),
      getWaterUsage(id),
      getGoals(id),
      getComplianceRecords(id),
    ]);

  const energyTotal = energy.reduce((sum, entry) => sum + entry.value, 0);
  const emissionsTotal = emissions.reduce((sum, entry) => sum + entry.value, 0);
  const maintenanceCount = equipment.filter((item) => item.status === "maintenance").length;

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand/70">
              Facility profile
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">{facility.name}</h2>
            <p className="mt-2 text-slate-500">
              {facility.location ?? "Location pending"} • {facility.type ?? "Type pending"}
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Energy Total</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCompactNumber(energyTotal)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Emission Total</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCompactNumber(emissionsTotal)} tCO2e
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Maintenance Items</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">{maintenanceCount}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap gap-3">
        {tabs.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={`/facilities/${id}?tab=${item.id}`}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === item.id
                  ? "bg-brand text-white"
                  : "bg-white text-slate-600 shadow-sm hover:text-brand"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </section>

      {tab === "overview" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card">
            <h3 className="text-xl font-semibold text-slate-900">Operational snapshot</h3>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Equipment count</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{equipment.length}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Waste streams</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{waste.length}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Water records</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{water.length}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-sm text-slate-500">Goals in motion</div>
                <div className="mt-2 text-2xl font-semibold text-slate-900">{goals.length}</div>
              </div>
            </div>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold text-slate-900">Compliance posture</h3>
            <div className="mt-6 space-y-3">
              {compliance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-4"
                >
                  <div>
                    <div className="font-medium text-slate-900">{record.regulation}</div>
                    <div className="text-sm text-slate-500">
                      Due {formatDate(record.due_date)}
                    </div>
                  </div>
                  <StatusBadge value={record.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "energy" ? (
        <div className="table-wrap overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Type</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Cost</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {energy.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.type}</td>
                  <td>{formatCompactNumber(entry.value)}</td>
                  <td>{entry.unit}</td>
                  <td>{entry.cost ?? "-"}</td>
                  <td>{formatDate(entry.recorded_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "emissions" ? (
        <div className="table-wrap overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Scope</th>
                <th>Value</th>
                <th>Unit</th>
                <th>Period</th>
              </tr>
            </thead>
            <tbody>
              {emissions.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.scope}</td>
                  <td>{entry.value}</td>
                  <td>{entry.unit}</td>
                  <td>{entry.period ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "equipment" ? (
        <div className="table-wrap overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Efficiency</th>
                <th>Status</th>
                <th>Last maintenance</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.name}</td>
                  <td>{entry.type ?? "-"}</td>
                  <td>{entry.efficiency_rating ?? "-"}%</td>
                  <td>
                    <StatusBadge value={entry.status} />
                  </td>
                  <td>{formatDate(entry.last_maintenance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "waste-water" ? (
        <div className="grid gap-6 xl:grid-cols-2">
          <div className="card">
            <h3 className="text-xl font-semibold text-slate-900">Waste streams</h3>
            <div className="mt-4 space-y-3">
              {waste.length === 0 ? (
                <EmptyState
                  icon={Box}
                  title="No waste data"
                  description="Waste data for this facility will appear here."
                />
              ) : (
                waste.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="font-medium text-slate-900">{entry.type}</div>
                    <div className="text-sm text-slate-500">
                      {entry.quantity ?? 0} {entry.unit ?? ""} • {entry.recycled_pct ?? 0}% recycled
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="card">
            <h3 className="text-xl font-semibold text-slate-900">Water usage</h3>
            <div className="mt-4 space-y-3">
              {water.length === 0 ? (
                <EmptyState
                  icon={Waves}
                  title="No water data"
                  description="Water records for this facility will appear here."
                />
              ) : (
                water.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="font-medium text-slate-900">
                      {entry.consumption ?? 0} {entry.unit}
                    </div>
                    <div className="text-sm text-slate-500">
                      Source: {entry.source ?? "Unknown"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}

      {tab === "goals" ? (
        <div className="space-y-4">
          {goals.map((goal) => {
            const progress = calculateGoalProgress(goal);

            return (
              <div key={goal.id} className="card">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">{goal.title}</h3>
                    <p className="text-sm text-slate-500">
                      Deadline {formatDate(goal.deadline)}
                    </p>
                  </div>
                  <StatusBadge
                    value={getGoalStatus(goal)}
                    label={getGoalStatusLabel(goal)}
                  />
                </div>
                <div className="mt-4 h-2.5 rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "compliance" ? (
        <div className="space-y-4">
          {compliance.map((record) => (
            <div key={record.id} className="card">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{record.regulation}</h3>
                  <p className="text-sm text-slate-500">Due {formatDate(record.due_date)}</p>
                </div>
                <StatusBadge value={record.status} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
