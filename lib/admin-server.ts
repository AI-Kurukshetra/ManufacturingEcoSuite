import "server-only";

import { adminEntityConfigs, type AdminEntityKey } from "@/lib/admin-config";

function toTrimmedString(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function requireString(value: unknown, label: string) {
  const normalized = toTrimmedString(value);
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function optionalString(value: unknown) {
  const normalized = toTrimmedString(value);
  return normalized || null;
}

function optionalNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numeric = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(numeric)) {
    throw new Error("Numeric fields must contain valid numbers.");
  }

  return numeric;
}

function requireNumber(value: unknown, label: string) {
  const numeric = optionalNumber(value);
  if (numeric === null) {
    throw new Error(`${label} is required.`);
  }

  return numeric;
}

function optionalDate(value: unknown) {
  const normalized = toTrimmedString(value);
  if (!normalized) {
    return null;
  }

  return normalized.slice(0, 10);
}

function requireDate(value: unknown, label: string) {
  const normalized = optionalDate(value);
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function optionalDateTime(value: unknown) {
  const normalized = toTrimmedString(value);
  if (!normalized) {
    return null;
  }

  return new Date(normalized).toISOString();
}

function requireDateTime(value: unknown, label: string) {
  const normalized = optionalDateTime(value);
  if (!normalized) {
    throw new Error(`${label} is required.`);
  }

  return normalized;
}

function optionalBoolean(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return value === "true" || value === "1";
  }

  return false;
}

export function getAdminTableName(entity: AdminEntityKey) {
  return adminEntityConfigs[entity].table;
}

export function assertAdminEntity(value: unknown): AdminEntityKey {
  if (typeof value !== "string" || !(value in adminEntityConfigs)) {
    throw new Error("Unsupported admin entity.");
  }

  return value as AdminEntityKey;
}

export function normalizeAdminPayload(entity: AdminEntityKey, input: Record<string, unknown>) {
  switch (entity) {
    case "facilities":
      return {
        name: requireString(input.name, "Facility name"),
        location: optionalString(input.location),
        type: optionalString(input.type),
        size_sqft: optionalNumber(input.size_sqft),
      };
    case "energy":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        type: requireString(input.type, "Type"),
        value: requireNumber(input.value, "Value"),
        unit: requireString(input.unit, "Unit"),
        recorded_at: requireDate(input.recorded_at, "Recorded date"),
        cost: optionalNumber(input.cost),
      };
    case "emissions":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        scope: requireString(input.scope, "Scope"),
        value: requireNumber(input.value, "Value"),
        unit: requireString(input.unit, "Unit"),
        period: optionalString(input.period),
        recorded_at: requireDate(input.recorded_at, "Recorded date"),
      };
    case "equipment":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        name: requireString(input.name, "Equipment name"),
        type: optionalString(input.type),
        efficiency_rating: optionalNumber(input.efficiency_rating),
        status: requireString(input.status, "Status"),
        last_maintenance: optionalDate(input.last_maintenance),
        energy_consumption: optionalNumber(input.energy_consumption),
      };
    case "waste":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        type: requireString(input.type, "Waste type"),
        quantity: optionalNumber(input.quantity),
        unit: optionalString(input.unit),
        recycled_pct: optionalNumber(input.recycled_pct),
        recorded_at: requireDate(input.recorded_at, "Recorded date"),
      };
    case "water":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        consumption: requireNumber(input.consumption, "Consumption"),
        unit: requireString(input.unit, "Unit"),
        source: optionalString(input.source),
        recorded_at: requireDate(input.recorded_at, "Recorded date"),
      };
    case "alerts":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        type: requireString(input.type, "Alert type"),
        message: requireString(input.message, "Message"),
        severity: requireString(input.severity, "Severity"),
        is_read: optionalBoolean(input.is_read),
        created_at: requireDateTime(input.created_at, "Created at"),
      };
    case "compliance":
      return {
        facility_id: requireString(input.facility_id, "Facility"),
        regulation: requireString(input.regulation, "Regulation"),
        status: requireString(input.status, "Status"),
        due_date: requireDate(input.due_date, "Due date"),
        notes: optionalString(input.notes),
      };
  }
}
