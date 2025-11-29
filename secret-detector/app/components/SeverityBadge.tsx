"use client";
import React from "react";

type Severity = "HIGH" | "MEDIUM" | "LOW";

export default function SeverityBadge({
  severity,
}: {
  severity: Severity | string | undefined;
}) {
  const sev = (severity || "LOW").toString().toUpperCase();
  const base = "inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold";
  if (sev === "HIGH")
    return <span className={`${base} bg-red-50 text-red-700 border border-red-100`}>HIGH</span>;
  if (sev === "MEDIUM")
    return <span className={`${base} bg-amber-50 text-amber-700 border border-amber-100`}>MEDIUM</span>;
  return <span className={`${base} bg-emerald-50 text-emerald-700 border border-emerald-100`}>LOW</span>;
}
