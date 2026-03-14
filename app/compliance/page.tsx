import { ShieldCheck } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { getComplianceRecords, getFacilities } from "@/lib/data";
import { daysUntil, formatDate } from "@/lib/format";

export const dynamic = 'force-dynamic'

interface CompliancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function CompliancePage({ searchParams }: CompliancePageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;
  const [facilities, compliance] = await Promise.all([
    getFacilities(),
    getComplianceRecords(facilityId),
  ]);

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const compliantCount = compliance.filter((record) => record.status === "compliant").length;
  const reviewNeededCount = compliance.filter(
    (record) => record.status === "review_needed",
  ).length;
  const nonCompliantCount = compliance.filter(
    (record) => record.status === "non_compliant",
  ).length;

  if (compliance.length === 0) {
    return (
      <EmptyState
        icon={ShieldCheck}
        title="No compliance records"
        description="Compliance records will appear here once they are added through the Admin Console."
      />
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-3">
        <div className="card">
          <div className="text-sm text-slate-500">Compliant</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">{compliantCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Review Needed</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {reviewNeededCount}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Non-Compliant</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {nonCompliantCount}
          </div>
        </div>
      </section>

      <section className="table-wrap overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Facility</th>
              <th>Regulation</th>
              <th>Status</th>
              <th>Due date</th>
              <th>Days until due</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {compliance.map((record) => {
              const remaining = daysUntil(record.due_date);
              const isDueSoon = remaining !== null && remaining <= 30;

              return (
                <tr key={record.id} className={isDueSoon ? "bg-amber-50" : undefined}>
                  <td>{facilityMap.get(record.facility_id) ?? "Unknown"}</td>
                  <td className="font-medium text-slate-900">{record.regulation}</td>
                  <td>
                    <StatusBadge value={record.status} />
                  </td>
                  <td>{formatDate(record.due_date)}</td>
                  <td>{remaining === null ? "-" : remaining}</td>
                  <td>{record.notes ?? "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
