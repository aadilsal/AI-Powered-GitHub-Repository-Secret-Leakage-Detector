"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";

const COLORS: Record<string, string> = {
  HIGH: "#ef4444",
  MEDIUM: "#f59e0b",
  LOW: "#10b981",
  OTHER: "#64748b",
};

export default function SeverityPie({ findings }: { findings: any[] }) {
  const data = useMemo(() => {
    const counts: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0, OTHER: 0 };
    for (const f of findings || []) {
      const s = (f.severity || "").toString().toUpperCase();
      if (s === "HIGH") counts.HIGH += 1;
      else if (s === "MEDIUM") counts.MEDIUM += 1;
      else if (s === "LOW") counts.LOW += 1;
      else counts.OTHER += 1;
    }
    return Object.keys(counts).map((k) => ({ name: k, value: counts[k as keyof typeof counts] }));
  }, [findings]);

  return (
    <div className="bg-white rounded-md p-3 shadow-sm">
      <div className="text-sm font-semibold mb-2">Severity breakdown</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie dataKey="value" data={data} innerRadius={50} outerRadius={80} paddingAngle={4}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name] || COLORS.OTHER} />
              ))}
            </Pie>
            <Tooltip />
            <Legend verticalAlign="bottom" height={36} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
