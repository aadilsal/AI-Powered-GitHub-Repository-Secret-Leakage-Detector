"use client";
import React from "react";

export default function ConfidenceMeter({
  value,
}: {
  value: number; // 0..1
}) {
  const pct = Math.round(Math.max(0, Math.min(1, value)) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
        <div className="text-sm font-semibold text-slate-800">{pct}%</div>
      </div>
      <div className="text-sm text-slate-600">ML confidence</div>
    </div>
  );
}
