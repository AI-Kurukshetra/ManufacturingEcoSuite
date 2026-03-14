"use client";

import { usePathname, useRouter } from "next/navigation";

import type { Facility } from "@/types";

interface PageFacilityFilterProps {
  facilities: Facility[];
  selectedFacilityId?: string;
}

export function PageFacilityFilter({
  facilities,
  selectedFacilityId,
}: PageFacilityFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const activeFacility = selectedFacilityId ?? "all";

  return (
    <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
      Facility
      <select
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
        value={activeFacility}
        onChange={(event) => {
          const params = new URLSearchParams(window.location.search);
          if (event.target.value === "all") {
            params.delete("facility");
          } else {
            params.set("facility", event.target.value);
          }
          router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
        }}
      >
        <option value="all">All facilities</option>
        {facilities.map((facility) => (
          <option key={facility.id} value={facility.id}>
            {facility.name}
          </option>
        ))}
      </select>
    </label>
  );
}
