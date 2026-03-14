"use client";

import {
  Bell,
  Building2,
  Droplets,
  LayoutDashboard,
  Leaf,
  Menu,
  Settings2,
  ShieldCheck,
  Target,
  Wind,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { cn } from "@/lib/format";
import type { Facility } from "@/types";

const navigation = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/facilities", label: "Facilities", icon: Building2 },
  { href: "/energy", label: "Energy", icon: Zap },
  { href: "/emissions", label: "Emissions", icon: Wind },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/equipment", label: "Equipment", icon: Settings2 },
  { href: "/waste-water", label: "Waste & Water", icon: Droplets },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
];

function getTitle(pathname: string) {
  if (pathname === "/") {
    return "Executive Dashboard";
  }

  if (pathname.startsWith("/facilities/")) {
    return "Facility Detail";
  }

  return pathname
    .slice(1)
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

interface AppShellProps {
  children: React.ReactNode;
  facilities: Facility[];
  unreadAlerts: number;
}

export function AppShell({ children, facilities, unreadAlerts }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mobileOpen, setMobileOpen] = useState(false);
  const activeFacility = searchParams.get("facility") ?? "all";

  const search = (() => {
    const params = new URLSearchParams(searchParams.toString());
    return params.toString() ? `?${params.toString()}` : "";
  })();

  return (
    <div className="min-h-screen bg-app">
      <div className="flex min-h-screen">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 transform bg-brand text-white transition duration-300 lg:static lg:translate-x-0",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/10 p-2">
                  <Leaf className="h-6 w-6 text-accent" />
                </div>
                <div>
                  <div className="text-lg font-semibold">EcoSuite</div>
                  <div className="text-xs text-white/70">
                    Real-time energy intelligence
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="lg:hidden"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 px-4 py-6">
              {navigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={`${item.href}${search}`}
                    className={cn(
                      "flex items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition",
                      isActive ? "bg-white/12 text-white" : "text-white/75 hover:bg-white/8",
                    )}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </span>
                    {item.href === "/alerts" && unreadAlerts > 0 ? (
                      <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-semibold text-brand">
                        {unreadAlerts}
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {mobileOpen ? (
          <button
            type="button"
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <div className="flex min-h-screen flex-1 flex-col lg:pl-0">
          <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="rounded-lg border border-slate-200 p-2 text-slate-700 lg:hidden"
                  onClick={() => setMobileOpen(true)}
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-brand/70">
                    EcoSuite
                  </div>
                  <h1 className="text-2xl font-semibold text-slate-900">
                    {getTitle(pathname)}
                  </h1>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <select
                  className="min-w-56 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  value={activeFacility}
                  onChange={(event) => {
                    const params = new URLSearchParams(searchParams.toString());
                    if (event.target.value === "all") {
                      params.delete("facility");
                    } else {
                      params.set("facility", event.target.value);
                    }
                    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ""}`);
                  }}
                >
                  <option value="all">All facilities</option>
                  {facilities.map((facility) => (
                    <option key={facility.id} value={facility.id}>
                      {facility.name}
                    </option>
                  ))}
                </select>
                <div className="relative rounded-full border border-slate-200 p-2 text-slate-700">
                  <Bell className="h-5 w-5" />
                  {unreadAlerts > 0 ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-accent px-1.5 text-[10px] font-semibold text-brand">
                      {unreadAlerts}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
