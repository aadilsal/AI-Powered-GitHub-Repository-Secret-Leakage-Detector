"use client";
import React from "react";

export default function EntropyBar({ value }: { value: number }) {
  const max = 8; // reasonable upper bound for visual
  const pct = Math.max(0, Math.min(1, value / max));
  const color = value >= 4.5 ? "bg-red-500" : value >= 3.5 ? "bg-yellow-500" : "bg-sky-500";
  return (
    <div className="w-36">
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div className={`${color} h-2 rounded-full`} style={{ width: `${pct * 100}%` }} />
      </div>
      <div className="text-xs text-slate-500 mt-1">Entropy: {value.toFixed(2)}</div>
    </div>
  );
}
