"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { StatusBadge } from "@/components/status-badge";
import {
  calculateGoalProgress,
  daysUntil,
  formatDate,
  getGoalStatus,
  getGoalStatusLabel,
} from "@/lib/format";
import { supabase } from "@/lib/supabase";
import type { Facility, SustainabilityGoal } from "@/types";

interface GoalsManagerProps {
  facilities: Facility[];
  goals: SustainabilityGoal[];
}

interface GoalFormState {
  id?: string;
  facility_id: string;
  title: string;
  target_value: string;
  current_value: string;
  unit: string;
  deadline: string;
}

const emptyForm: GoalFormState = {
  facility_id: "",
  title: "",
  target_value: "",
  current_value: "0",
  unit: "%",
  deadline: "",
};

export function GoalsManager({ facilities, goals }: GoalsManagerProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState<GoalFormState>({
    ...emptyForm,
    facility_id: facilities[0]?.id ?? "",
  });

  const facilityMap = new Map(facilities.map((facility) => [facility.id, facility.name]));

  async function saveGoal() {
    setPending(true);

    const payload = {
      facility_id: form.facility_id,
      title: form.title,
      target_value: Number(form.target_value),
      current_value: Number(form.current_value),
      unit: form.unit,
      deadline: form.deadline,
      status: "in_progress",
    };

    if (form.id) {
      await supabase.from("sustainability_goals").update(payload).eq("id", form.id);
    } else {
      await supabase.from("sustainability_goals").insert(payload);
    }

    setPending(false);
    setOpen(false);
    setForm({ ...emptyForm, facility_id: facilities[0]?.id ?? "" });
    router.refresh();
  }

  async function deleteGoal(id: string) {
    setPending(true);
    await supabase.from("sustainability_goals").delete().eq("id", id);
    setPending(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Goals tracker</h2>
          <p className="text-sm text-slate-500">
            Track live progress and update milestones directly in Supabase.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark"
          onClick={() => {
            setForm({ ...emptyForm, facility_id: facilities[0]?.id ?? "" });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Add New Goal
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Goal</th>
                <th className="px-4 py-3 font-medium">Facility</th>
                <th className="px-4 py-3 font-medium">Progress</th>
                <th className="px-4 py-3 font-medium">Deadline</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal, index) => {
                const progress = calculateGoalProgress(goal);
                const remaining = daysUntil(goal.deadline);

                return (
                  <tr
                    key={goal.id}
                    className={index % 2 === 0 ? "bg-white" : "bg-slate-50/60"}
                  >
                    <td className="px-4 py-4">
                      <div className="font-medium text-slate-900">{goal.title}</div>
                      <div className="text-xs text-slate-500">
                        {goal.current_value ?? 0} / {goal.target_value ?? 0} {goal.unit ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {facilityMap.get(goal.facility_id) ?? "Unknown"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="mb-2 h-2.5 w-48 max-w-full rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand"
                          style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                      </div>
                      <div className="text-xs text-slate-500">{progress.toFixed(1)}%</div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <div>{formatDate(goal.deadline)}</div>
                      <div className="text-xs text-slate-500">
                        {remaining === null
                          ? "No due date"
                          : `${remaining} day${remaining === 1 ? "" : "s"} remaining`}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge
                        value={getGoalStatus(goal)}
                        label={getGoalStatusLabel(goal)}
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-brand hover:text-brand"
                          onClick={() => {
                            setForm({
                              id: goal.id,
                              facility_id: goal.facility_id,
                              title: goal.title,
                              target_value: String(goal.target_value ?? 0),
                              current_value: String(goal.current_value ?? 0),
                              unit: goal.unit ?? "%",
                              deadline: goal.deadline ?? "",
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-rose-300 hover:text-rose-600"
                          disabled={pending}
                          onClick={() => deleteGoal(goal.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-slate-900">
                {form.id ? "Edit goal" : "Create goal"}
              </h3>
              <button
                type="button"
                className="text-sm font-medium text-slate-500"
                onClick={() => setOpen(false)}
              >
                Close
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Title
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Facility
                <select
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.facility_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      facility_id: event.target.value,
                    }))
                  }
                >
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Target value
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.target_value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      target_value: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Current value
                <input
                  type="number"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.current_value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      current_value: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Unit
                <input
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.unit}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, unit: event.target.value }))
                  }
                />
              </label>
              <label className="space-y-2 text-sm font-medium text-slate-700">
                Deadline
                <input
                  type="date"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                  value={form.deadline}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, deadline: event.target.value }))
                  }
                />
              </label>
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
                onClick={saveGoal}
              >
                {pending ? "Saving..." : "Save goal"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
