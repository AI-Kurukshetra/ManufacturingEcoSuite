import { Target } from "lucide-react";

import { EmptyState } from "@/components/empty-state";
import { GoalsManager } from "@/components/goals-manager";
import { getFacilities, getGoals } from "@/lib/data";

interface GoalsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GoalsPage({ searchParams }: GoalsPageProps) {
  const params = await searchParams;
  const facilityId =
    typeof params.facility === "string" ? params.facility : undefined;
  const [facilities, goals] = await Promise.all([
    getFacilities(),
    getGoals(facilityId),
  ]);

  if (facilities.length === 0) {
    return (
      <EmptyState
        icon={Target}
        title="No facilities available"
        description="Create a facility before adding sustainability goals."
      />
    );
  }

  return <GoalsManager facilities={facilities} goals={goals} />;
}
