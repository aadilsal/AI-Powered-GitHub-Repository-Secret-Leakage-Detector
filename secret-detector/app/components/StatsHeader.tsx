"use client";
import React from "react";

export default function StatsHeader({
  total,
  high,
  medium,
  low,
  files,
}: {
  total: number;
  high: number;
  medium: number;
  low: number;
  files: number;
}) {
  const card = (title: string, value: number, subtitle?: string) => (
    <div className="bg-white rounded-md p-4 shadow-sm w-48">
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-slate-500">{title}</div>
      {subtitle ? <div className="text-xs text-slate-400 mt-1">{subtitle}</div> : null}
    </div>
  );

  return (
    <div className="flex gap-4 flex-wrap">
      {card("Total secrets", total)}
      {card("High severity", high)}
      {card("Medium severity", medium)}
      {card("Low severity", low)}
      {card("Files scanned", files)}
    </div>
  );
}
