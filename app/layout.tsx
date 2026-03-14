import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { AppShell } from "@/components/app-shell";
import { getFacilities, getUnreadAlertsCount } from "@/lib/data";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "EcoSuite",
  description: "Real-time energy intelligence for modern manufacturers",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [facilities, unreadAlerts] = await Promise.all([
    getFacilities(),
    getUnreadAlertsCount(),
  ]);

  return (
    <html lang="en">
      <body className={`${inter.variable} bg-app font-sans text-slate-900 antialiased`}>
        <AppShell facilities={facilities} unreadAlerts={unreadAlerts}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
