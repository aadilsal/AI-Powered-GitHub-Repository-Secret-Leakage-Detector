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
    return <span className={`${base} bg-red-100 text-red-800`}>HIGH</span>;
  if (sev === "MEDIUM")
    return <span className={`${base} bg-yellow-100 text-yellow-800`}>MEDIUM</span>;
  return <span className={`${base} bg-sky-100 text-sky-800`}>LOW</span>;
}
