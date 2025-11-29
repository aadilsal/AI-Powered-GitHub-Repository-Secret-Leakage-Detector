"use client";
import React, { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";

function confidenceBuckets(values: number[], buckets = 10) {
  const counts = new Array(buckets).fill(0);
  for (const v of values) {
    const cv = Math.max(0, Math.min(1, typeof v === 'number' ? v : 0));
    const idx = Math.min(buckets - 1, Math.floor(cv * buckets));
    counts[idx] += 1;
  }
  return counts.map((c, i) => ({ bucket: `${i * (100 / buckets)}-${(i + 1) * (100 / buckets)}`, value: c }));
}

export default function ConfidenceHistogram({ findings }: { findings: any[] }) {
  const data = useMemo(() => {
    const values = (findings || []).map((f) => Number(f.mlConfidence) || 0);
    return confidenceBuckets(values, 10);
  }, [findings]);

  return (
    <div className="bg-white rounded-md p-3 shadow-sm">
      <div className="text-sm font-semibold mb-2">Confidence histogram</div>
      <div style={{ width: "100%", height: 200 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip formatter={(v: any) => v} />
            <Bar dataKey="value" fill="#06b6d4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
