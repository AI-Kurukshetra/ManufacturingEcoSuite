export interface Facility {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  size_sqft: number | null;
  created_at: string;
}

export interface EnergyConsumption {
  id: string;
  facility_id: string;
  type: string;
  value: number;
  unit: string;
  recorded_at: string;
  cost: number | null;
}

export interface Emission {
  id: string;
  facility_id: string;
  scope: string;
  value: number;
  unit: string;
  period: string | null;
  recorded_at: string;
}

export interface SustainabilityGoal {
  id: string;
  facility_id: string;
  title: string;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
}

export interface Equipment {
  id: string;
  facility_id: string;
  name: string;
  type: string | null;
  efficiency_rating: number | null;
  status: string;
  last_maintenance: string | null;
  energy_consumption: number | null;
}

export interface WasteStream {
  id: string;
  facility_id: string;
  type: string;
  quantity: number | null;
  unit: string | null;
  recycled_pct: number | null;
  recorded_at: string;
}

export interface WaterUsage {
  id: string;
  facility_id: string;
  consumption: number | null;
  unit: string;
  source: string | null;
  recorded_at: string;
}

export interface Alert {
  id: string;
  facility_id: string;
  type: string;
  message: string | null;
  severity: string;
  is_read: boolean;
  created_at: string;
}

export interface Compliance {
  id: string;
  facility_id: string;
  regulation: string | null;
  status: string;
  due_date: string | null;
  notes: string | null;
}

export interface FacilitySummary {
  facility: Facility;
  totalEnergy: number;
  totalEmissions: number;
  complianceStatus: string;
}

export interface ActivityFeedItem {
  id: string;
  category: string;
  title: string;
  detail: string;
  timestamp: string;
}

export interface DataFreshnessItem {
  key: string;
  label: string;
  count: number;
  latest_at: string | null;
}
