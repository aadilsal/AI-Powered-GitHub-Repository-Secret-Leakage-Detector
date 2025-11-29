"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from "recharts";

const COLORS = ["#2563eb", "#7c3aed", "#06b6d4", "#f97316", "#ef4444", "#10b981", "#64748b"];

export default function TypeBar({ findings }: { findings: any[] }) {
  const data = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of findings || []) {
      const t = (f.type || f.secretType || "OTHER").toString();
      map.set(t, (map.get(t) || 0) + 1);
    }
    const arr = Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    arr.sort((a, b) => b.value - a.value);
    return arr.slice(0, 8);
  }, [findings]);

  return (
    <div className="bg-white rounded-md p-3 shadow-sm">
      <div className="text-sm font-semibold mb-2">Secret type distribution</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={120} />
            <Tooltip />
            <Legend />
            <Bar dataKey="value" fill="#3182ce">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
