"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { chartPalette } from "@/lib/format";

export function EnergyTrendChart({
  data,
}: {
  data: Array<Record<string, string | number>>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="electricity" stroke={chartPalette[0]} strokeWidth={3} />
        <Line type="monotone" dataKey="gas" stroke={chartPalette[1]} strokeWidth={3} />
        <Line type="monotone" dataKey="water" stroke={chartPalette[2]} strokeWidth={3} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function EmissionsFacilityChart({
  data,
}: {
  data: Array<Record<string, string | number>>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="facility" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="scope1" fill={chartPalette[0]} radius={[8, 8, 0, 0]} />
        <Bar dataKey="scope2" fill={chartPalette[1]} radius={[8, 8, 0, 0]} />
        <Bar dataKey="scope3" fill={chartPalette[2]} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WasteRecyclingChart({
  data,
}: {
  data: Array<{ name: string; value: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius={80}
          outerRadius={110}
          paddingAngle={4}
        >
          {data.map((entry, index) => (
            <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function EmissionsTrendChart({
  data,
}: {
  data: Array<Record<string, string | number>>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="period" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar stackId="emissions" dataKey="scope1" fill={chartPalette[0]} />
        <Bar stackId="emissions" dataKey="scope2" fill={chartPalette[1]} />
        <Bar stackId="emissions" dataKey="scope3" fill={chartPalette[2]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function WaterUsageChart({
  data,
}: {
  data: Array<Record<string, string | number>>;
}) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="facility" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="consumption" fill={chartPalette[3]} radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
