import { Activity, AlertTriangle, Building2, Database, Leaf, Target } from "lucide-react";

import { AlertReadButton } from "@/components/alerts-actions";
import {
  EmissionsFacilityChart,
  EnergyTrendChart,
  WasteRecyclingChart,
} from "@/components/charts";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getDashboardData } from "@/lib/data";
import {
  calculateGoalProgress,
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatPercent,
  formatRelativeTime,
  getGoalStatus,
  getGoalStatusLabel,
} from "@/lib/format";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;
  const dashboard = await getDashboardData(facilityId);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="text-sm font-medium text-slate-500">Total Energy This Month</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(dashboard.kpis.totalEnergyThisMonth)}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {formatPercent(dashboard.kpis.energyChange)} vs last month
          </div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-slate-500">
            Total Carbon Emissions This Quarter
          </div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(dashboard.kpis.totalCarbonThisQuarter)} tCO2e
          </div>
          <div className="mt-2 text-sm text-slate-500">Scope 1, 2 and 3 combined</div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-slate-500">Active Unread Alerts</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {dashboard.kpis.unreadAlerts}
          </div>
          <div className="mt-2 text-sm text-slate-500">Operational issues requiring review</div>
        </div>
        <div className="card">
          <div className="text-sm font-medium text-slate-500">Goals On Track</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {dashboard.kpis.goalsOnTrack}
          </div>
          <div className="mt-2 text-sm text-slate-500">Live target tracking from current records</div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="card xl:col-span-2">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Energy Trend</h2>
            <p className="text-sm text-slate-500">
              Six-month view across electricity, gas and water inputs.
            </p>
          </div>
          <EnergyTrendChart data={dashboard.energyTrend} />
        </div>
        <div className="card">
          <div className="mb-5">
            <h2 className="text-xl font-semibold text-slate-900">Waste Recycling Mix</h2>
            <p className="text-sm text-slate-500">
              Recycled versus non-recycled waste volume.
            </p>
          </div>
          <WasteRecyclingChart data={dashboard.wasteRecycling} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Live Data Pulse</h2>
              <p className="text-sm text-slate-500">
                Freshness signals from the underlying operational records.
              </p>
            </div>
            <Database className="h-5 w-5 text-brand" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Total records</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCompactNumber(dashboard.freshness.totalRecords)}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Last update</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard.freshness.latestActivityAt
                  ? formatRelativeTime(dashboard.freshness.latestActivityAt)
                  : "No data"}
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {dashboard.freshness.latestActivityAt
                  ? formatDateTime(dashboard.freshness.latestActivityAt)
                  : "Waiting for live records"}
              </div>
            </div>
            <div className="rounded-xl bg-slate-50 p-4">
              <div className="text-sm text-slate-500">Active facilities</div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {dashboard.freshness.activeFacilities}
              </div>
              <div className="mt-1 text-xs text-slate-400">With live reporting data</div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {dashboard.freshness.datasets
              .filter((item) => item.count > 0)
              .map((item) => (
                <div
                  key={item.key}
                  className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600"
                >
                  {item.label}: {item.count}
                </div>
              ))}
          </div>
        </div>

        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Activity</h2>
              <p className="text-sm text-slate-500">
                New records appearing across the monitored datasets.
              </p>
            </div>
            <Building2 className="h-5 w-5 text-brand" />
          </div>

          <div className="space-y-4">
            {dashboard.freshness.recentActivity.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No live activity"
                description="Recent writes and updates will appear here as soon as records are added."
              />
            ) : (
              dashboard.freshness.recentActivity.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                      {item.category}
                    </span>
                    <span className="text-xs text-slate-400">
                      {formatRelativeTime(item.timestamp)}
                    </span>
                  </div>
                  <div className="mt-3 font-medium text-slate-900">{item.title}</div>
                  <p className="mt-1 text-sm text-slate-500">{item.detail}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="mb-5">
          <h2 className="text-xl font-semibold text-slate-900">Emissions by Facility</h2>
          <p className="text-sm text-slate-500">Scope 1, 2 and 3 totals grouped by plant.</p>
        </div>
        <EmissionsFacilityChart data={dashboard.emissionsByFacility} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Goals Progress</h2>
              <p className="text-sm text-slate-500">
                Live goal progress bars with deadlines and status.
              </p>
            </div>
            <Target className="h-5 w-5 text-brand" />
          </div>
          <div className="space-y-4">
            {dashboard.goals.length === 0 ? (
              <EmptyState
                icon={Leaf}
                title="No goals yet"
                description="Add a sustainability goal to start tracking progress."
              />
            ) : (
              dashboard.goals.map((goal) => {
                const progress = calculateGoalProgress(goal);

                return (
                  <div
                    key={goal.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="font-medium text-slate-900">{goal.title}</div>
                        <div className="text-sm text-slate-500">
                          Deadline {formatDate(goal.deadline)}
                        </div>
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
                    <div className="mt-2 text-sm text-slate-500">
                      {progress.toFixed(1)}% complete
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Alerts</h2>
              <p className="text-sm text-slate-500">
                Latest issues surfaced from live alert records.
              </p>
            </div>
            <AlertTriangle className="h-5 w-5 text-accent" />
          </div>
          <div className="space-y-4">
            {dashboard.recentAlerts.length === 0 ? (
              <EmptyState
                icon={Activity}
                title="No recent alerts"
                description="Alert activity will appear here when records are created."
              />
            ) : (
              dashboard.recentAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <StatusBadge value={alert.severity} />
                    <span className="text-xs text-slate-400">
                      {new Date(alert.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">{alert.message}</p>
                  <div className="mt-4">
                    <AlertReadButton alertId={alert.id} disabled={alert.is_read} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Facility Comparison</h2>
            <p className="text-sm text-slate-500">
              Compare energy, emissions and compliance across sites.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="table-base">
            <thead>
              <tr>
                <th>Facility</th>
                <th>Total Energy</th>
                <th>Total Emissions</th>
                <th>Compliance</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.facilityComparison.map((facility) => (
                <tr key={facility.id}>
                  <td className="font-medium text-slate-900">{facility.name}</td>
                  <td>{formatCompactNumber(facility.energyTotal)}</td>
                  <td>{formatCompactNumber(facility.emissionsTotal)} tCO2e</td>
                  <td>
                    <StatusBadge value={facility.complianceStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
