import {
  addMonths,
  formatCompactNumber,
  getGoalStatus,
  getMonthKey,
  getMonthLabel,
  getQuarterLabel,
  startOfMonth,
  titleCase,
} from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type {
  ActivityFeedItem,
  Alert,
  Compliance,
  DataFreshnessItem,
  Emission,
  EnergyConsumption,
  Equipment,
  Facility,
  FacilitySummary,
  SustainabilityGoal,
  WasteStream,
  WaterUsage,
} from "@/types";

function ensureData<T>(data: T, error: { message: string } | null) {
  if (error) {
    throw new Error(error.message);
  }

  return data;
}

function toNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  return typeof value === "number" ? value : Number(value);
}

function toNullableNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return typeof value === "number" ? value : Number(value);
}

function applyFacilityFilter<T extends { eq: (column: string, value: string) => T }>(
  query: T,
  facilityId?: string,
) {
  if (!facilityId) {
    return query;
  }

  return query.eq("facility_id", facilityId);
}

function normalizeFacility(row: Record<string, unknown>): Facility {
  return {
    id: String(row.id),
    name: String(row.name),
    location: (row.location as string | null) ?? null,
    type: (row.type as string | null) ?? null,
    size_sqft: toNullableNumber(row.size_sqft as number | string | null),
    created_at: String(row.created_at),
  };
}

function normalizeEnergy(row: Record<string, unknown>): EnergyConsumption {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    type: String(row.type),
    value: toNumber(row.value as number | string | null),
    unit: String(row.unit),
    recorded_at: String(row.recorded_at),
    cost: toNullableNumber(row.cost as number | string | null),
  };
}

function normalizeEmission(row: Record<string, unknown>): Emission {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    scope: String(row.scope),
    value: toNumber(row.value as number | string | null),
    unit: String(row.unit),
    period: (row.period as string | null) ?? null,
    recorded_at: String(row.recorded_at),
  };
}

function normalizeGoal(row: Record<string, unknown>): SustainabilityGoal {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    title: String(row.title),
    target_value: toNullableNumber(row.target_value as number | string | null),
    current_value: toNullableNumber(row.current_value as number | string | null),
    unit: (row.unit as string | null) ?? null,
    deadline: (row.deadline as string | null) ?? null,
    status: String(row.status),
    created_at: String(row.created_at),
  };
}

function normalizeEquipment(row: Record<string, unknown>): Equipment {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    name: String(row.name),
    type: (row.type as string | null) ?? null,
    efficiency_rating: toNullableNumber(
      row.efficiency_rating as number | string | null,
    ),
    status: String(row.status),
    last_maintenance: (row.last_maintenance as string | null) ?? null,
    energy_consumption: toNullableNumber(
      row.energy_consumption as number | string | null,
    ),
  };
}

function normalizeWaste(row: Record<string, unknown>): WasteStream {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    type: String(row.type),
    quantity: toNullableNumber(row.quantity as number | string | null),
    unit: (row.unit as string | null) ?? null,
    recycled_pct: toNullableNumber(row.recycled_pct as number | string | null),
    recorded_at: String(row.recorded_at),
  };
}

function normalizeWater(row: Record<string, unknown>): WaterUsage {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    consumption: toNullableNumber(row.consumption as number | string | null),
    unit: String(row.unit),
    source: (row.source as string | null) ?? null,
    recorded_at: String(row.recorded_at),
  };
}

function normalizeAlert(row: Record<string, unknown>): Alert {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    type: String(row.type),
    message: (row.message as string | null) ?? null,
    severity: String(row.severity),
    is_read: Boolean(row.is_read),
    created_at: String(row.created_at),
  };
}

function normalizeCompliance(row: Record<string, unknown>): Compliance {
  return {
    id: String(row.id),
    facility_id: String(row.facility_id),
    regulation: (row.regulation as string | null) ?? null,
    status: String(row.status),
    due_date: (row.due_date as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
  };
}

function getCurrentMonthKey(rows: EnergyConsumption[]) {
  const currentMonth = getMonthKey(new Date());
  if (rows.some((row) => getMonthKey(row.recorded_at) === currentMonth)) {
    return currentMonth;
  }

  const sortedKeys = [...new Set(rows.map((row) => getMonthKey(row.recorded_at)))].sort();
  return sortedKeys.at(-1) ?? currentMonth;
}

function getPreviousMonthKey(currentKey: string) {
  const [year, month] = currentKey.split("-").map(Number);
  return getMonthKey(new Date(year, month - 2, 1));
}

function getCurrentQuarter(emissions: Emission[]) {
  const currentQuarter = getQuarterLabel(new Date());
  if (emissions.some((emission) => emission.period === currentQuarter)) {
    return currentQuarter;
  }

  return emissions
    .map((emission) => emission.period)
    .filter((period): period is string => Boolean(period))
    .sort()
    .at(-1);
}

function getLatestTimestamp(values: Array<string | null | undefined>) {
  const timestamps = values
    .map((value) => (value ? new Date(value).getTime() : Number.NaN))
    .filter((value) => Number.isFinite(value));

  if (timestamps.length === 0) {
    return null;
  }

  return new Date(Math.max(...timestamps)).toISOString();
}

function getComplianceStatus(records: Compliance[]) {
  if (records.some((record) => record.status === "non_compliant")) {
    return "non_compliant";
  }

  if (records.some((record) => record.status === "review_needed")) {
    return "review_needed";
  }

  return "compliant";
}

function buildFreshnessItems({
  facilities,
  energy,
  emissions,
  goals,
  equipment,
  waste,
  water,
  alerts,
  compliance,
}: {
  facilities: Facility[];
  energy: EnergyConsumption[];
  emissions: Emission[];
  goals?: SustainabilityGoal[];
  equipment: Equipment[];
  waste: WasteStream[];
  water: WaterUsage[];
  alerts: Alert[];
  compliance: Compliance[];
}): DataFreshnessItem[] {
  return [
    {
      key: "facilities",
      label: "Facilities",
      count: facilities.length,
      latest_at: getLatestTimestamp(facilities.map((entry) => entry.created_at)),
    },
    {
      key: "energy",
      label: "Energy",
      count: energy.length,
      latest_at: getLatestTimestamp(energy.map((entry) => entry.recorded_at)),
    },
    {
      key: "emissions",
      label: "Emissions",
      count: emissions.length,
      latest_at: getLatestTimestamp(emissions.map((entry) => entry.recorded_at)),
    },
    {
      key: "goals",
      label: "Goals",
      count: goals?.length ?? 0,
      latest_at: getLatestTimestamp(goals?.map((entry) => entry.created_at) ?? []),
    },
    {
      key: "equipment",
      label: "Equipment",
      count: equipment.length,
      latest_at: getLatestTimestamp(equipment.map((entry) => entry.last_maintenance)),
    },
    {
      key: "waste",
      label: "Waste",
      count: waste.length,
      latest_at: getLatestTimestamp(waste.map((entry) => entry.recorded_at)),
    },
    {
      key: "water",
      label: "Water",
      count: water.length,
      latest_at: getLatestTimestamp(water.map((entry) => entry.recorded_at)),
    },
    {
      key: "alerts",
      label: "Alerts",
      count: alerts.length,
      latest_at: getLatestTimestamp(alerts.map((entry) => entry.created_at)),
    },
    {
      key: "compliance",
      label: "Compliance",
      count: compliance.length,
      latest_at: getLatestTimestamp(compliance.map((entry) => entry.due_date)),
    },
  ];
}

function buildActivityFeed({
  facilities,
  energy,
  emissions,
  goals,
  waste,
  water,
  alerts,
}: {
  facilities: Facility[];
  energy: EnergyConsumption[];
  emissions: Emission[];
  goals?: SustainabilityGoal[];
  waste: WasteStream[];
  water: WaterUsage[];
  alerts: Alert[];
}): ActivityFeedItem[] {
  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));

  const items: ActivityFeedItem[] = [
    ...facilities.map((entry) => ({
      id: `facility-${entry.id}`,
      category: "Facility",
      title: entry.name,
      detail: [entry.location, entry.type].filter(Boolean).join(" / ") || "New facility added",
      timestamp: entry.created_at,
    })),
    ...energy.map((entry) => ({
      id: `energy-${entry.id}`,
      category: "Energy",
      title: `${titleCase(entry.type)} reading logged`,
      detail: `${formatCompactNumber(entry.value)} ${entry.unit} at ${
        facilityMap.get(entry.facility_id) ?? "Unknown facility"
      }`,
      timestamp: entry.recorded_at,
    })),
    ...emissions.map((entry) => ({
      id: `emission-${entry.id}`,
      category: "Emissions",
      title: `${titleCase(entry.scope)} entry updated`,
      detail: `${entry.value} ${entry.unit} for ${
        facilityMap.get(entry.facility_id) ?? "Unknown facility"
      }`,
      timestamp: entry.recorded_at,
    })),
    ...(goals ?? []).map((entry) => ({
      id: `goal-${entry.id}`,
      category: "Goals",
      title: entry.title,
      detail: `Progress updated for ${facilityMap.get(entry.facility_id) ?? "Unknown facility"}`,
      timestamp: entry.created_at,
    })),
    ...waste.map((entry) => ({
      id: `waste-${entry.id}`,
      category: "Waste",
      title: `${entry.type} stream recorded`,
      detail: `${entry.quantity ?? 0} ${entry.unit ?? ""} at ${
        facilityMap.get(entry.facility_id) ?? "Unknown facility"
      }`.trim(),
      timestamp: entry.recorded_at,
    })),
    ...water.map((entry) => ({
      id: `water-${entry.id}`,
      category: "Water",
      title: `Water usage logged`,
      detail: `${entry.consumption ?? 0} ${entry.unit} at ${
        facilityMap.get(entry.facility_id) ?? "Unknown facility"
      }`,
      timestamp: entry.recorded_at,
    })),
    ...alerts.map((entry) => ({
      id: `alert-${entry.id}`,
      category: "Alerts",
      title: titleCase(entry.type),
      detail: entry.message ?? `Severity ${entry.severity} alert created`,
      timestamp: entry.created_at,
    })),
  ];

  return items
    .filter((item) => item.timestamp)
    .sort(
      (left, right) =>
        new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
    .slice(0, 8);
}

export const getFacilities = async (): Promise<Facility[]> => {
  const response = await supabase.from("facilities").select("*").order("name");
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeFacility(row as Record<string, unknown>));
};

export const getEnergyConsumption = async (
  facilityId?: string,
): Promise<EnergyConsumption[]> => {
  let query = supabase
    .from("energy_consumption")
    .select("*")
    .order("recorded_at", { ascending: false });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeEnergy(row as Record<string, unknown>));
};

export const getEmissions = async (facilityId?: string): Promise<Emission[]> => {
  let query = supabase.from("emissions").select("*").order("recorded_at", {
    ascending: false,
  });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeEmission(row as Record<string, unknown>));
};

export const getGoals = async (facilityId?: string): Promise<SustainabilityGoal[]> => {
  let query = supabase
    .from("sustainability_goals")
    .select("*")
    .order("deadline", { ascending: true });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeGoal(row as Record<string, unknown>));
};

export const getEquipment = async (facilityId?: string): Promise<Equipment[]> => {
  let query = supabase
    .from("equipment")
    .select("*")
    .order("efficiency_rating", { ascending: true });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeEquipment(row as Record<string, unknown>));
};

export const getWasteStreams = async (facilityId?: string): Promise<WasteStream[]> => {
  let query = supabase
    .from("waste_streams")
    .select("*")
    .order("recorded_at", { ascending: false });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeWaste(row as Record<string, unknown>));
};

export const getWaterUsage = async (facilityId?: string): Promise<WaterUsage[]> => {
  let query = supabase
    .from("water_usage")
    .select("*")
    .order("recorded_at", { ascending: false });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeWater(row as Record<string, unknown>));
};

export const getAlerts = async (facilityId?: string): Promise<Alert[]> => {
  let query = supabase.from("alerts").select("*").order("created_at", {
    ascending: false,
  });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeAlert(row as Record<string, unknown>));
};

export const getComplianceRecords = async (facilityId?: string): Promise<Compliance[]> => {
  let query = supabase.from("compliance").select("*").order("due_date", {
    ascending: true,
  });

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  const data = ensureData(response.data, response.error) ?? [];
  return data.map((row) => normalizeCompliance(row as Record<string, unknown>));
};

export async function getUnreadAlertsCount(facilityId?: string) {
  let query = supabase
    .from("alerts")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  query = applyFacilityFilter(query, facilityId);

  const response = await query;
  ensureData(response.data, response.error);
  return response.count ?? 0;
}

export async function getFacilityById(id: string) {
  const response = await supabase.from("facilities").select("*").eq("id", id).single();
  const data = ensureData(response.data, response.error);
  return normalizeFacility(data as Record<string, unknown>);
}

export async function getFacilitySummaries(): Promise<FacilitySummary[]> {
  const [facilities, energy, emissions, compliance] = await Promise.all([
    getFacilities(),
    getEnergyConsumption(),
    getEmissions(),
    getComplianceRecords(),
  ]);

  return facilities.map((facility) => {
    const facilityEnergy = energy
      .filter((entry) => entry.facility_id === facility.id)
      .reduce((sum, entry) => sum + entry.value, 0);
    const facilityEmissions = emissions
      .filter((entry) => entry.facility_id === facility.id)
      .reduce((sum, entry) => sum + entry.value, 0);
    const facilityCompliance = compliance.filter(
      (entry) => entry.facility_id === facility.id,
    );

    return {
      facility,
      totalEnergy: facilityEnergy,
      totalEmissions: facilityEmissions,
      complianceStatus: getComplianceStatus(facilityCompliance),
    };
  });
}

export function getEnergyInsight(energy: EnergyConsumption[], facilities: Facility[]) {
  if (energy.length === 0) {
    return "Add energy records to generate a live operating insight.";
  }

  const latestMonthKey = getCurrentMonthKey(energy);
  const previousMonthKey = getPreviousMonthKey(latestMonthKey);
  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const totalUsage = energy.reduce((sum, entry) => sum + entry.value, 0);
  const usageByType = energy.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.type] = (accumulator[entry.type] ?? 0) + entry.value;
    return accumulator;
  }, {});
  const dominantTypeEntry = Object.entries(usageByType).sort((left, right) => right[1] - left[1])[0];
  const dominantType = dominantTypeEntry?.[0] ?? "energy";
  const dominantShare = dominantTypeEntry ? (dominantTypeEntry[1] / totalUsage) * 100 : 0;
  const peakReading = [...energy].sort((left, right) => right.value - left.value)[0];
  const currentMonthTotal = energy
    .filter((entry) => getMonthKey(entry.recorded_at) === latestMonthKey)
    .reduce((sum, entry) => sum + entry.value, 0);
  const previousMonthTotal = energy
    .filter((entry) => getMonthKey(entry.recorded_at) === previousMonthKey)
    .reduce((sum, entry) => sum + entry.value, 0);

  let trendSentence = "This month is the first tracked period in the live dataset.";
  if (previousMonthTotal > 0) {
    const change = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
    if (change > 5) {
      trendSentence = `Usage is up ${change.toFixed(1)}% versus last month.`;
    } else if (change < -5) {
      trendSentence = `Usage is down ${Math.abs(change).toFixed(1)}% versus last month.`;
    } else {
      trendSentence = "Usage is broadly steady versus last month.";
    }
  }

  return `${titleCase(dominantType)} drives ${dominantShare.toFixed(
    0,
  )}% of tracked usage. The highest single reading came from ${
    facilityMap.get(peakReading.facility_id) ?? "an active facility"
  } at ${formatCompactNumber(peakReading.value)} ${peakReading.unit}. ${trendSentence}`;
}

export async function getDashboardData(facilityId?: string) {
  const [facilities, energy, emissions, goals, equipment, waste, water, alerts, compliance] =
    await Promise.all([
      getFacilities(),
      getEnergyConsumption(facilityId),
      getEmissions(facilityId),
      getGoals(facilityId),
      getEquipment(facilityId),
      getWasteStreams(facilityId),
      getWaterUsage(facilityId),
      getAlerts(facilityId),
      getComplianceRecords(facilityId),
    ]);
  const visibleFacilities = facilityId
    ? facilities.filter((facility) => facility.id === facilityId)
    : facilities;

  const currentMonthKey = getCurrentMonthKey(energy);
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  const currentMonthEnergy = energy
    .filter((entry) => getMonthKey(entry.recorded_at) === currentMonthKey)
    .reduce((sum, entry) => sum + entry.value, 0);
  const previousMonthEnergy = energy
    .filter((entry) => getMonthKey(entry.recorded_at) === previousMonthKey)
    .reduce((sum, entry) => sum + entry.value, 0);
  const energyChange = previousMonthEnergy
    ? ((currentMonthEnergy - previousMonthEnergy) / previousMonthEnergy) * 100
    : 0;

  const currentQuarter = getCurrentQuarter(emissions);
  const currentQuarterEmissions = emissions
    .filter((entry) => entry.period === currentQuarter)
    .reduce((sum, entry) => sum + entry.value, 0);

  const goalsOnTrack = goals.filter((goal) => getGoalStatus(goal) === "on_track").length;
  const unreadAlerts = alerts.filter((alert) => !alert.is_read).length;

  const latestDate = energy.length ? new Date(energy[0].recorded_at) : new Date();
  const months = Array.from({ length: 6 }, (_, index) =>
    startOfMonth(addMonths(latestDate, index - 5)),
  );
  const monthlyEnergy = months.map((month) => {
    const key = getMonthKey(month);

    return {
      month: getMonthLabel(month),
      electricity: energy
        .filter(
          (entry) => getMonthKey(entry.recorded_at) === key && entry.type === "electricity",
        )
        .reduce((sum, entry) => sum + entry.value, 0),
      gas: energy
        .filter((entry) => getMonthKey(entry.recorded_at) === key && entry.type === "gas")
        .reduce((sum, entry) => sum + entry.value, 0),
      water: energy
        .filter((entry) => getMonthKey(entry.recorded_at) === key && entry.type === "water")
        .reduce((sum, entry) => sum + entry.value, 0),
    };
  });

  const emissionsByFacility = visibleFacilities.map((facility) => ({
    facility: facility.name,
    scope1: emissions
      .filter((entry) => entry.facility_id === facility.id && entry.scope === "scope1")
      .reduce((sum, entry) => sum + entry.value, 0),
    scope2: emissions
      .filter((entry) => entry.facility_id === facility.id && entry.scope === "scope2")
      .reduce((sum, entry) => sum + entry.value, 0),
    scope3: emissions
      .filter((entry) => entry.facility_id === facility.id && entry.scope === "scope3")
      .reduce((sum, entry) => sum + entry.value, 0),
  }));

  const recycled = waste.reduce(
    (sum, item) => sum + (item.quantity ?? 0) * ((item.recycled_pct ?? 0) / 100),
    0,
  );
  const totalWaste = waste.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

  const facilityComparison = visibleFacilities.map((facility) => {
    const facilityCompliance = compliance.filter(
      (entry) => entry.facility_id === facility.id,
    );

    return {
      id: facility.id,
      name: facility.name,
      energyTotal: energy
        .filter((entry) => entry.facility_id === facility.id)
        .reduce((sum, entry) => sum + entry.value, 0),
      emissionsTotal: emissions
        .filter((entry) => entry.facility_id === facility.id)
        .reduce((sum, entry) => sum + entry.value, 0),
      complianceStatus: getComplianceStatus(facilityCompliance),
    };
  });

  const freshnessItems = buildFreshnessItems({
    facilities: visibleFacilities,
    energy,
    emissions,
    goals,
    equipment,
    waste,
    water,
    alerts,
    compliance,
  });
  const recentActivity = buildActivityFeed({
    facilities: visibleFacilities,
    energy,
    emissions,
    goals,
    waste,
    water,
    alerts,
  });
  const activeFacilities = new Set(
    [
      ...energy.map((entry) => entry.facility_id),
      ...emissions.map((entry) => entry.facility_id),
      ...goals.map((entry) => entry.facility_id),
      ...equipment.map((entry) => entry.facility_id),
      ...waste.map((entry) => entry.facility_id),
      ...water.map((entry) => entry.facility_id),
      ...alerts.map((entry) => entry.facility_id),
      ...compliance.map((entry) => entry.facility_id),
    ].filter(Boolean),
  ).size;

  return {
    kpis: {
      totalEnergyThisMonth: currentMonthEnergy,
      energyChange,
      totalCarbonThisQuarter: currentQuarterEmissions,
      unreadAlerts,
      goalsOnTrack,
    },
    energyTrend: monthlyEnergy,
    emissionsByFacility,
    wasteRecycling: [
      { name: "Recycled", value: recycled },
      { name: "Non-Recycled", value: Math.max(totalWaste - recycled, 0) },
    ],
    goals,
    recentAlerts: alerts.slice(0, 4),
    facilityComparison,
    freshness: {
      totalRecords: freshnessItems.reduce((sum, item) => sum + item.count, 0),
      latestActivityAt: recentActivity[0]?.timestamp ?? null,
      activeFacilities,
      datasets: freshnessItems,
      recentActivity,
    },
  };
}

export async function getAdminConsoleData() {
  const [facilities, energy, emissions, equipment, waste, water, alerts, compliance] =
    await Promise.all([
      getFacilities(),
      getEnergyConsumption(),
      getEmissions(),
      getEquipment(),
      getWasteStreams(),
      getWaterUsage(),
      getAlerts(),
      getComplianceRecords(),
    ]);

  const freshness = buildFreshnessItems({
    facilities,
    energy,
    emissions,
    equipment,
    waste,
    water,
    alerts,
    compliance,
  });
  const recentActivity = buildActivityFeed({
    facilities,
    energy,
    emissions,
    waste,
    water,
    alerts,
  });

  return {
    datasets: {
      facilities,
      energy,
      emissions,
      equipment,
      waste,
      water,
      alerts,
      compliance,
    },
    freshness,
    recentActivity,
    totalRecords: freshness.reduce((sum, item) => sum + item.count, 0),
    latestActivityAt: recentActivity[0]?.timestamp ?? null,
  };
}
