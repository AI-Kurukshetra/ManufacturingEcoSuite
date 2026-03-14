"use client";

import { ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginCard() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    setPending(true);
    setError(null);

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "login",
        username,
        password,
      }),
    });

    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Unable to sign in.");
      setPending(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="card">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-brand/10 p-3 text-brand">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Admin access</h2>
            <p className="mt-2 text-sm text-slate-500">
              Sign in with the configured admin credentials to add or edit live platform data.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Username
            <input
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700">
            Password
            <input
              type="password"
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void handleLogin();
                }
              }}
            />
          </label>
        </div>

        {error ? (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white"
            disabled={pending}
            onClick={() => void handleLogin()}
          >
            {pending ? "Signing in..." : "Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}
