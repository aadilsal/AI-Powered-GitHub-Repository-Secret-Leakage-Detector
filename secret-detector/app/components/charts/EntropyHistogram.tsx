"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

function bucketize(values: number[], buckets = 8) {
  const min = 0;
  const max = 16; // entropy typical range
  const size = (max - min) / buckets;
  const counts = new Array(buckets).fill(0);
  for (const v of values) {
    const clamped = Math.max(min, Math.min(max, typeof v === 'number' ? v : 0));
    const idx = Math.min(buckets - 1, Math.floor((clamped - min) / size));
    counts[idx] += 1;
  }
  return counts.map((c, i) => ({ bucket: `${(min + i * size).toFixed(1)}-${(min + (i + 1) * size).toFixed(1)}`, value: c }));
}

export default function EntropyHistogram({ findings }: { findings: any[] }) {
  const data = useMemo(() => {
    const values = (findings || []).map((f) => Number(f.entropy) || 0);
    return bucketize(values, 8);
  }, [findings]);

  return (
    <div className="bg-white rounded-md p-3 shadow-sm">
      <div className="text-sm font-semibold mb-2">Entropy distribution</div>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
