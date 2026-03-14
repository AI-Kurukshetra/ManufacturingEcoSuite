"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/lib/supabase";

interface AlertReadButtonProps {
  alertId: string;
  disabled?: boolean;
}

export function AlertReadButton({ alertId, disabled }: AlertReadButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending || disabled}
      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
      onClick={async () => {
        setPending(true);
        await supabase.from("alerts").update({ is_read: true }).eq("id", alertId);
        router.refresh();
        setPending(false);
      }}
    >
      {pending ? "Saving..." : "Mark as read"}
    </button>
  );
}

interface MarkAllReadButtonProps {
  alertIds: string[];
}

export function MarkAllReadButton({ alertIds }: MarkAllReadButtonProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      disabled={pending || alertIds.length === 0}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
      onClick={async () => {
        setPending(true);
        await supabase.from("alerts").update({ is_read: true }).in("id", alertIds);
        router.refresh();
        setPending(false);
      }}
    >
      {pending ? "Updating..." : "Mark all as read"}
    </button>
  );
}
