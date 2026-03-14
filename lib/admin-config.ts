export type AdminEntityKey =
  | "facilities"
  | "energy"
  | "emissions"
  | "equipment"
  | "waste"
  | "water"
  | "alerts"
  | "compliance";

export interface AdminFieldOption {
  label: string;
  value: string;
}

export interface AdminFieldConfig {
  name: string;
  label: string;
  type:
    | "text"
    | "number"
    | "date"
    | "datetime-local"
    | "textarea"
    | "select"
    | "checkbox";
  required?: boolean;
  options?: AdminFieldOption[];
  placeholder?: string;
  defaultValue?: string | boolean;
}

export interface AdminColumnConfig {
  key: string;
  label: string;
}

export interface AdminEntityConfig {
  key: AdminEntityKey;
  label: string;
  singularLabel: string;
  description: string;
  table: string;
  timestampField?: string;
  fields: AdminFieldConfig[];
  columns: AdminColumnConfig[];
  importable?: boolean;
  csvTemplateRows?: Array<Record<string, unknown>>;
}

export const adminEntityOrder: AdminEntityKey[] = [
  "facilities",
  "energy",
  "emissions",
  "equipment",
  "waste",
  "water",
  "alerts",
  "compliance",
];

export const adminEntityConfigs: Record<AdminEntityKey, AdminEntityConfig> = {
  facilities: {
    key: "facilities",
    label: "Facilities",
    singularLabel: "Facility",
    description: "Manage the sites that power the portfolio and drive the rest of the reporting.",
    table: "facilities",
    timestampField: "created_at",
    fields: [
      { name: "name", label: "Facility name", type: "text", required: true },
      { name: "location", label: "Location", type: "text", placeholder: "Ahmedabad, India" },
      { name: "type", label: "Type", type: "text", placeholder: "Manufacturing plant" },
      { name: "size_sqft", label: "Size (sqft)", type: "number", placeholder: "120000" },
    ],
    columns: [
      { key: "name", label: "Name" },
      { key: "location", label: "Location" },
      { key: "type", label: "Type" },
      { key: "size_sqft", label: "Size (sqft)" },
      { key: "created_at", label: "Created" },
    ],
  },
  energy: {
    key: "energy",
    label: "Energy",
    singularLabel: "Energy record",
    description: "Capture energy usage rows that drive the monitoring charts and cost analysis.",
    table: "energy_consumption",
    timestampField: "recorded_at",
    importable: true,
    csvTemplateRows: [
      {
        facility_id: "facility-id",
        type: "electricity",
        value: 14800,
        unit: "kWh",
        recorded_at: "2026-03-01",
        cost: 125000,
      },
    ],
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [
          { label: "Electricity", value: "electricity" },
          { label: "Gas", value: "gas" },
          { label: "Water", value: "water" },
        ],
      },
      { name: "value", label: "Value", type: "number", required: true },
      { name: "unit", label: "Unit", type: "text", required: true, defaultValue: "kWh" },
      { name: "recorded_at", label: "Recorded date", type: "date", required: true },
      { name: "cost", label: "Cost", type: "number", placeholder: "75000" },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "type", label: "Type" },
      { key: "value", label: "Value" },
      { key: "unit", label: "Unit" },
      { key: "cost", label: "Cost" },
      { key: "recorded_at", label: "Recorded" },
    ],
  },
  emissions: {
    key: "emissions",
    label: "Emissions",
    singularLabel: "Emission record",
    description: "Maintain scope-level carbon data for reporting periods and facility comparisons.",
    table: "emissions",
    timestampField: "recorded_at",
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      {
        name: "scope",
        label: "Scope",
        type: "select",
        required: true,
        options: [
          { label: "Scope 1", value: "scope1" },
          { label: "Scope 2", value: "scope2" },
          { label: "Scope 3", value: "scope3" },
        ],
      },
      { name: "value", label: "Value", type: "number", required: true },
      {
        name: "unit",
        label: "Unit",
        type: "text",
        required: true,
        defaultValue: "tCO2e",
      },
      { name: "period", label: "Reporting period", type: "text", placeholder: "Q1 2026" },
      { name: "recorded_at", label: "Recorded date", type: "date", required: true },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "scope", label: "Scope" },
      { key: "value", label: "Value" },
      { key: "unit", label: "Unit" },
      { key: "period", label: "Period" },
      { key: "recorded_at", label: "Recorded" },
    ],
  },
  equipment: {
    key: "equipment",
    label: "Equipment",
    singularLabel: "Equipment item",
    description: "Track equipment health, efficiency, and energy usage with editable operating records.",
    table: "equipment",
    timestampField: "last_maintenance",
    importable: true,
    csvTemplateRows: [
      {
        facility_id: "facility-id",
        name: "Boiler 2",
        type: "Boiler",
        efficiency_rating: 84,
        status: "active",
        last_maintenance: "2026-02-14",
        energy_consumption: 980,
      },
    ],
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      { name: "name", label: "Equipment name", type: "text", required: true },
      { name: "type", label: "Type", type: "text", placeholder: "Chiller" },
      { name: "efficiency_rating", label: "Efficiency %", type: "number" },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        defaultValue: "active",
        options: [
          { label: "Active", value: "active" },
          { label: "Maintenance", value: "maintenance" },
        ],
      },
      { name: "last_maintenance", label: "Last maintenance", type: "date" },
      { name: "energy_consumption", label: "Energy consumption", type: "number" },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "name", label: "Name" },
      { key: "type", label: "Type" },
      { key: "efficiency_rating", label: "Efficiency" },
      { key: "status", label: "Status" },
      { key: "last_maintenance", label: "Last maintenance" },
    ],
  },
  waste: {
    key: "waste",
    label: "Waste Streams",
    singularLabel: "Waste record",
    description: "Update waste volumes and recycling rates so the disposal mix reflects live inputs.",
    table: "waste_streams",
    timestampField: "recorded_at",
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      { name: "type", label: "Waste type", type: "text", required: true },
      { name: "quantity", label: "Quantity", type: "number" },
      { name: "unit", label: "Unit", type: "text", defaultValue: "kg" },
      { name: "recycled_pct", label: "Recycled %", type: "number" },
      { name: "recorded_at", label: "Recorded date", type: "date", required: true },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "type", label: "Type" },
      { key: "quantity", label: "Quantity" },
      { key: "unit", label: "Unit" },
      { key: "recycled_pct", label: "Recycled %" },
      { key: "recorded_at", label: "Recorded" },
    ],
  },
  water: {
    key: "water",
    label: "Water Usage",
    singularLabel: "Water record",
    description: "Maintain water consumption inputs for sourcing analysis and facility benchmarks.",
    table: "water_usage",
    timestampField: "recorded_at",
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      { name: "consumption", label: "Consumption", type: "number", required: true },
      { name: "unit", label: "Unit", type: "text", required: true, defaultValue: "kL" },
      { name: "source", label: "Source", type: "text", placeholder: "Municipal" },
      { name: "recorded_at", label: "Recorded date", type: "date", required: true },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "consumption", label: "Consumption" },
      { key: "unit", label: "Unit" },
      { key: "source", label: "Source" },
      { key: "recorded_at", label: "Recorded" },
    ],
  },
  alerts: {
    key: "alerts",
    label: "Alerts",
    singularLabel: "Alert",
    description: "Create, update, and clear operational alerts that appear immediately on the dashboard.",
    table: "alerts",
    timestampField: "created_at",
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      { name: "type", label: "Alert type", type: "text", required: true, placeholder: "Energy spike" },
      { name: "message", label: "Message", type: "textarea", required: true },
      {
        name: "severity",
        label: "Severity",
        type: "select",
        required: true,
        defaultValue: "medium",
        options: [
          { label: "High", value: "high" },
          { label: "Medium", value: "medium" },
          { label: "Low", value: "low" },
        ],
      },
      { name: "is_read", label: "Already read", type: "checkbox", defaultValue: false },
      {
        name: "created_at",
        label: "Created at",
        type: "datetime-local",
        required: true,
      },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "type", label: "Type" },
      { key: "severity", label: "Severity" },
      { key: "is_read", label: "Read" },
      { key: "created_at", label: "Created" },
      { key: "message", label: "Message" },
    ],
  },
  compliance: {
    key: "compliance",
    label: "Compliance",
    singularLabel: "Compliance record",
    description: "Maintain due dates and review status so compliance posture updates alongside new data.",
    table: "compliance",
    timestampField: "due_date",
    fields: [
      { name: "facility_id", label: "Facility", type: "select", required: true },
      { name: "regulation", label: "Regulation", type: "text", required: true },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        defaultValue: "review_needed",
        options: [
          { label: "Compliant", value: "compliant" },
          { label: "Review needed", value: "review_needed" },
          { label: "Non-compliant", value: "non_compliant" },
        ],
      },
      { name: "due_date", label: "Due date", type: "date", required: true },
      { name: "notes", label: "Notes", type: "textarea" },
    ],
    columns: [
      { key: "facility_id", label: "Facility" },
      { key: "regulation", label: "Regulation" },
      { key: "status", label: "Status" },
      { key: "due_date", label: "Due date" },
      { key: "notes", label: "Notes" },
    ],
  },
};
