import { AdminConsole } from "@/components/admin-console";
import { AdminLoginCard } from "@/components/admin-login-card";
import { hasAdminSession, isAdminAuthConfigured } from "@/lib/admin-auth";
import { getAdminConsoleData } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const authConfigured = isAdminAuthConfigured();
  const authenticated = await hasAdminSession();

  if (!authenticated) {
    return <AdminLoginCard />;
  }

  const { datasets, freshness, recentActivity, totalRecords, latestActivityAt } =
    await getAdminConsoleData();

  return (
    <AdminConsole
      facilities={datasets.facilities}
      datasets={datasets}
      freshness={freshness}
      recentActivity={recentActivity}
      totalRecords={totalRecords}
      latestActivityAt={latestActivityAt}
      authConfigured={authConfigured}
    />
  );
}
