"use client";

import { Database, FileUp, Pencil, Plus, ShieldCheck, Trash2, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  adminEntityConfigs,
  adminEntityOrder,
  type AdminEntityConfig,
  type AdminEntityKey,
  type AdminFieldConfig,
} from "@/lib/admin-config";
import { buildCsvText } from "@/lib/csv";
import {
  formatCompactNumber,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  titleCase,
  toDateInputValue,
  toDateTimeInputValue,
} from "@/lib/format";
import type {
  ActivityFeedItem,
  Alert,
  Compliance,
  DataFreshnessItem,
  Emission,
  EnergyConsumption,
  Equipment,
  Facility,
  WasteStream,
  WaterUsage,
} from "@/types";
import { StatusBadge } from "@/components/status-badge";

type AdminRecord = Record<string, unknown>;

interface AdminConsoleProps {
  facilities: Facility[];
  datasets: {
    facilities: Facility[];
    energy: EnergyConsumption[];
    emissions: Emission[];
    equipment: Equipment[];
    waste: WasteStream[];
    water: WaterUsage[];
    alerts: Alert[];
    compliance: Compliance[];
  };
  freshness: DataFreshnessItem[];
  recentActivity: ActivityFeedItem[];
  totalRecords: number;
  latestActivityAt: string | null;
  authConfigured: boolean;
}

type FormState = Record<string, string | boolean>;

function getInitialFieldValue(field: AdminFieldConfig, facilities: Facility[]) {
  if (field.type === "checkbox") {
    return Boolean(field.defaultValue);
  }

  if (field.name === "facility_id") {
    return facilities[0]?.id ?? "";
  }

  if (field.type === "datetime-local") {
    return typeof field.defaultValue === "string"
      ? field.defaultValue
      : new Date().toISOString().slice(0, 16);
  }

  return typeof field.defaultValue === "string" ? field.defaultValue : "";
}

function createEmptyForm(config: AdminEntityConfig, facilities: Facility[]) {
  return config.fields.reduce<FormState>((state, field) => {
    state[field.name] = getInitialFieldValue(field, facilities);
    return state;
  }, {});
}

function getRecordFormValue(value: unknown, field: AdminFieldConfig) {
  if (field.type === "checkbox") {
    return Boolean(value);
  }

  if (field.type === "date") {
    return toDateInputValue(typeof value === "string" ? value : null);
  }

  if (field.type === "datetime-local") {
    return toDateTimeInputValue(typeof value === "string" ? value : null);
  }

  return value === null || value === undefined ? "" : String(value);
}

function downloadCsv(filename: string, rows: Array<Record<string, unknown>>) {
  const csv = buildCsvText(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminConsole({
  facilities,
  datasets,
  freshness,
  recentActivity,
  totalRecords,
  latestActivityAt,
  authConfigured,
}: AdminConsoleProps) {
  const router = useRouter();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [activeEntity, setActiveEntity] = useState<AdminEntityKey>("facilities");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [importPending, setImportPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() =>
    createEmptyForm(adminEntityConfigs.facilities, facilities),
  );

  const config = adminEntityConfigs[activeEntity];
  const records = datasets[activeEntity] as unknown as AdminRecord[];
  const activeFreshness = freshness.find((item) => item.key === activeEntity) ?? null;
  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));
  const facilityDependencyMissing =
    config.fields.some((field) => field.name === "facility_id") && facilities.length === 0;

  function updateField(name: string, value: string | boolean) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function changeEntity(entity: AdminEntityKey) {
    const nextConfig = adminEntityConfigs[entity];
    setActiveEntity(entity);
    setForm(createEmptyForm(nextConfig, facilities));
    setEditingId(null);
    setOpen(false);
    setError(null);
    setSuccess(null);
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(createEmptyForm(config, facilities));
    setError(null);
    setSuccess(null);
    setOpen(true);
  }

  function openEditModal(record: AdminRecord) {
    const nextState = config.fields.reduce<FormState>((state, field) => {
      state[field.name] = getRecordFormValue(record[field.name], field);
      return state;
    }, {});

    setEditingId(String(record.id));
    setForm(nextState);
    setError(null);
    setSuccess(null);
    setOpen(true);
  }

  async function saveRecord() {
    setPending(true);
    setError(null);
    setSuccess(null);

    const payload = editingId ? { ...form, id: editingId } : form;
    const response = await fetch("/api/admin/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity: activeEntity,
        action: "upsert",
        payload,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to save record.");
      setPending(false);
      return;
    }

    setPending(false);
    setOpen(false);
    setEditingId(null);
    setSuccess(
      `${config.singularLabel} ${editingId ? "updated" : "created"} successfully.`,
    );
    router.refresh();
  }

  async function deleteRecord(id: string) {
    setPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity: activeEntity,
        action: "delete",
        id,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to delete record.");
      setPending(false);
      return;
    }

    setPending(false);
    setSuccess(`${config.singularLabel} deleted successfully.`);
    router.refresh();
  }

  async function importCsv(file: File) {
    setImportPending(true);
    setError(null);
    setSuccess(null);

    const response = await fetch("/api/admin/import", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        entity: activeEntity,
        csvText: await file.text(),
      }),
    });

    const result = (await response.json()) as { error?: string; inserted?: number };
    if (!response.ok) {
      setError(result.error ?? "Unable to import CSV.");
      setImportPending(false);
      return;
    }

    setImportPending(false);
    setSuccess(`Imported ${result.inserted ?? 0} ${config.label.toLowerCase()} rows.`);
    if (importInputRef.current) {
      importInputRef.current.value = "";
    }
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "logout" }),
    });

    router.refresh();
  }

  function renderCellValue(record: AdminRecord, key: string) {
    const value = record[key];

    if (key === "facility_id") {
      return facilityMap.get(String(value)) ?? "Unknown";
    }

    if (key === "status" && typeof value === "string") {
      return <StatusBadge value={value} />;
    }

    if (key === "severity" && typeof value === "string") {
      return <StatusBadge value={value} label={titleCase(value)} />;
    }

    if (key === "is_read") {
      return value ? "Yes" : "No";
    }

    if (typeof value === "string" && key === "created_at") {
      return formatDateTime(value);
    }

    if (
      typeof value === "string" &&
      (key === "recorded_at" || key === "due_date" || key === "last_maintenance")
    ) {
      return formatDate(value);
    }

    if (typeof value === "number") {
      return formatCompactNumber(value);
    }

    if (typeof value === "string" && value.length > 72) {
      return `${value.slice(0, 72)}...`;
    }

    return value === null || value === undefined || value === "" ? "-" : String(value);
  }

  return (
    <div className="space-y-6">
      <section className="card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-brand/70">
              Live data operations
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Admin console</h2>
            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Add and edit operational records without leaving the app. Every change writes to
              Supabase and refreshes the reporting views on the next render.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600">
              {authConfigured ? "Protected access enabled" : "Open demo access"}
            </div>
            <button
              type="button"
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
              onClick={() => void logout()}
            >
              Sign out
            </button>
          </div>
        </div>
      </section>

      {!authConfigured ? (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-start gap-3 text-amber-900">
            <ShieldCheck className="mt-0.5 h-5 w-5" />
            <div>
              <div className="font-semibold">Admin credentials are not configured</div>
              <p className="mt-1 text-sm">
                Set `ADMIN_USERNAME` and `ADMIN_PASSWORD` in your environment to protect this
                route in production.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="card">
          <div className="text-sm text-slate-500">Tracked records</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {formatCompactNumber(totalRecords)}
          </div>
          <div className="mt-2 text-sm text-slate-500">Across operational datasets</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Latest write signal</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {latestActivityAt ? formatRelativeTime(latestActivityAt) : "No data"}
          </div>
          <div className="mt-2 text-sm text-slate-500">
            {latestActivityAt ? formatDateTime(latestActivityAt) : "Waiting for records"}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Active facilities</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">
            {facilities.length}
          </div>
          <div className="mt-2 text-sm text-slate-500">Sites available for data entry</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Selected dataset</div>
          <div className="mt-4 text-3xl font-semibold text-slate-900">{config.label}</div>
          <div className="mt-2 text-sm text-slate-500">
            {activeFreshness?.count ?? 0} records ready to edit
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className="card">
          <div className="mb-5 flex flex-wrap gap-3">
            {adminEntityOrder.map((entity) => {
              const item = adminEntityConfigs[entity];
              const isActive = activeEntity === entity;

              return (
                <button
                  key={entity}
                  type="button"
                  className={
                    isActive
                      ? "rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white"
                      : "rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-brand hover:text-brand"
                  }
                  onClick={() => changeEntity(entity)}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 border-t border-slate-200 pt-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">{config.label}</h3>
              <p className="mt-2 text-sm text-slate-500">{config.description}</p>
              <div className="mt-3 text-xs uppercase tracking-[0.16em] text-slate-400">
                {activeFreshness?.latest_at
                  ? `Last record signal ${formatRelativeTime(activeFreshness.latest_at)}`
                  : "No signal yet"}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {config.importable ? (
                <>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void importCsv(file);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                    disabled={importPending || facilityDependencyMissing}
                    onClick={() => importInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    {importPending ? "Importing..." : "Import CSV"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand"
                    onClick={() =>
                      downloadCsv(
                        `ecosuite-${activeEntity}-template.csv`,
                        config.csvTemplateRows ?? [],
                      )
                    }
                  >
                    <FileUp className="h-4 w-4" />
                    Download template
                  </button>
                </>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
                disabled={facilityDependencyMissing}
                onClick={openCreateModal}
              >
                <Plus className="h-4 w-4" />
                Add {config.singularLabel}
              </button>
            </div>
          </div>

          {facilityDependencyMissing ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Add at least one facility before creating {config.label.toLowerCase()} records.
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="mt-6 table-wrap overflow-x-auto">
            <table className="table-base">
              <thead>
                <tr>
                  {config.columns.map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td
                      colSpan={config.columns.length + 1}
                      className="py-8 text-center text-sm text-slate-500"
                    >
                      No {config.label.toLowerCase()} records yet.
                    </td>
                  </tr>
                ) : (
                  records.map((record) => (
                    <tr key={String(record.id)}>
                      {config.columns.map((column) => (
                        <td key={column.key}>{renderCellValue(record, column.key)}</td>
                      ))}
                      <td>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-brand hover:text-brand"
                            onClick={() => openEditModal(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                            disabled={pending}
                            onClick={() => void deleteRecord(String(record.id))}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="mb-5 flex items-center gap-3">
            <Database className="h-5 w-5 text-brand" />
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Recent activity</h3>
              <p className="text-sm text-slate-500">
                Latest records added or updated across the live platform data.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {recentActivity.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No recent activity yet.
              </div>
            ) : (
              recentActivity.map((item) => (
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

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">
                  {editingId ? `Edit ${config.singularLabel}` : `Create ${config.singularLabel}`}
                </h3>
                <p className="mt-1 text-sm text-slate-500">{config.description}</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-500"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.map((field) => {
                const commonProps = {
                  className: "w-full rounded-lg border border-slate-200 px-3 py-2",
                };
                const value = form[field.name];

                if (field.type === "textarea") {
                  return (
                    <label
                      key={field.name}
                      className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2"
                    >
                      {field.label}
                      <textarea
                        {...commonProps}
                        rows={4}
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      />
                    </label>
                  );
                }

                if (field.type === "select") {
                  const options =
                    field.name === "facility_id"
                      ? facilities.map((facility) => ({
                          label: facility.name,
                          value: facility.id,
                        }))
                      : (field.options ?? []);

                  return (
                    <label key={field.name} className="space-y-2 text-sm font-medium text-slate-700">
                      {field.label}
                      <select
                        {...commonProps}
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => updateField(field.name, event.target.value)}
                      >
                        {options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  );
                }

                if (field.type === "checkbox") {
                  return (
                    <label
                      key={field.name}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(value)}
                        onChange={(event) => updateField(field.name, event.target.checked)}
                      />
                      {field.label}
                    </label>
                  );
                }

                return (
                  <label key={field.name} className="space-y-2 text-sm font-medium text-slate-700">
                    {field.label}
                    <input
                      {...commonProps}
                      type={field.type}
                      placeholder={field.placeholder}
                      value={typeof value === "string" ? value : ""}
                      onChange={(event) => updateField(field.name, event.target.value)}
                    />
                  </label>
                );
              })}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
                disabled={pending}
                onClick={() => void saveRecord()}
              >
                {pending ? "Saving..." : `Save ${config.singularLabel}`}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
