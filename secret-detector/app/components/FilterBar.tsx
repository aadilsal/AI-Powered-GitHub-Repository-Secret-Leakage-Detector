"use client";
import React from "react";

export default function FilterBar({
  severity,
  setSeverity,
  type,
  setType,
  query,
  setQuery,
}: {
  severity: string;
  setSeverity: (s: string) => void;
  type: string;
  setType: (t: string) => void;
  query: string;
  setQuery: (q: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3 items-center">
      <select
        value={severity}
        onChange={(e) => setSeverity(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="ALL">All Severities</option>
        <option value="HIGH">High</option>
        <option value="MEDIUM">Medium</option>
        <option value="LOW">Low</option>
      </select>

      <select
        value={type}
        onChange={(e) => setType(e.target.value)}
        className="border rounded px-2 py-1 text-sm"
      >
        <option value="ALL">All Types</option>
        <option value="AWS">AWS</option>
        <option value="GITHUB">GitHub</option>
        <option value="DB">Database</option>
        <option value="JWT">JWT</option>
        <option value="OTHER">Other</option>
      </select>

      <input
        placeholder="Search file path"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="border rounded px-2 py-1 text-sm w-64"
      />
    </div>
  );
}
