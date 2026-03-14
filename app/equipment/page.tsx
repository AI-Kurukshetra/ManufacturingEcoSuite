import { AlertTriangle, Settings2 } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getEquipment, getFacilities } from "@/lib/data";
import { formatDate } from "@/lib/format";

interface EquipmentPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getEfficiencyClass(value: number | null) {
  if (value === null) {
    return "text-slate-500";
  }

  if (value >= 85) {
    return "text-emerald-700";
  }

  if (value >= 70) {
    return "text-amber-700";
  }

  return "text-rose-700";
}

export default async function EquipmentPage({ searchParams }: EquipmentPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;
  const [facilities, equipment] = await Promise.all([
    getFacilities(),
    getEquipment(facilityId),
  ]);

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const maintenanceItems = equipment.filter((item) => item.status === "maintenance");

  if (equipment.length === 0) {
    return (
      <EmptyState
        icon={Settings2}
        title="No equipment found"
        description="Equipment records will appear here once added in Supabase."
      />
    );
  }

  return (
    <div className="space-y-6">
      {maintenanceItems.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-3 text-amber-900">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <div className="font-semibold">Maintenance attention required</div>
              <div className="text-sm">
                {maintenanceItems.length} equipment item
                {maintenanceItems.length === 1 ? "" : "s"} currently marked for maintenance.
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <section className="table-wrap overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Name</th>
              <th>Facility</th>
              <th>Type</th>
              <th>Efficiency</th>
              <th>Status</th>
              <th>Last maintenance</th>
              <th>Energy consumption</th>
            </tr>
          </thead>
          <tbody>
            {equipment.map((entry) => (
              <tr key={entry.id}>
                <td className="font-medium text-slate-900">{entry.name}</td>
                <td>{facilityMap.get(entry.facility_id) ?? "Unknown"}</td>
                <td>{entry.type ?? "-"}</td>
                <td className={`font-semibold ${getEfficiencyClass(entry.efficiency_rating)}`}>
                  {entry.efficiency_rating ?? "-"}%
                </td>
                <td>
                  <StatusBadge value={entry.status} label={entry.status === "active" ? "Active" : "Maintenance"} />
                </td>
                <td>{formatDate(entry.last_maintenance)}</td>
                <td>{entry.energy_consumption ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
